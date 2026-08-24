import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';
import { generateInitialPixels } from '@/lib/demoData';
import { broadcastPixelEvent, releasePixelEvents, updateCanvasStats } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minX = parseInt(searchParams.get('minX') || '0', 10);
  const maxX = parseInt(searchParams.get('maxX') || '4000', 10);
  const minY = parseInt(searchParams.get('minY') || '0', 10);
  const maxY = parseInt(searchParams.get('maxY') || '2500', 10);
  const userId = searchParams.get('userId');

  let pixels: Record<string, any> = {};
  let profilesMap: Record<string, any> = {};
  let userOrders: any[] = [];
  let total = 0;

  try {
    await initPostgres();
    const res = await pool.query(
      `SELECT * FROM pixels WHERE x >= $1 AND x <= $2 AND y >= $3 AND y <= $4`,
      [minX, maxX, minY, maxY]
    );

    res.rows.forEach((px) => {
      pixels[`${px.x},${px.y}`] = {
        id: Number(px.id),
        x: px.x,
        y: px.y,
        owner_id: px.owner_id,
        owner_name: px.owner_name,
        owner_avatar: px.owner_avatar,
        price: px.price,
        status: px.status,
        color: px.color,
        profile_id: px.profile_id,
        created_at: px.created_at,
      };
    });
    total = res.rows.length;

    // Fetch all profiles & links to load into frontend store
    const profilesRes = await pool.query(`SELECT * FROM profiles`);
    for (const prof of profilesRes.rows) {
      const linksRes = await pool.query(
        `SELECT * FROM links WHERE profile_id = $1 ORDER BY sort_order ASC`,
        [prof.id]
      );
      profilesMap[prof.user_id] = {
        ...prof,
        links: linksRes.rows,
      };
      profilesMap[prof.id] = profilesMap[prof.user_id];
    }

    // Fetch user orders if userId is provided
    if (userId) {
      const ordersRes = await pool.query(
        `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      userOrders = ordersRes.rows;
    }
    // Fetch all non-expired reservations and overlay onto pixel map
    try {
      const resRes = await pool.query(
        `SELECT pixel_id, x, y, session_id, expires_at FROM pixel_reservations
         WHERE expires_at > NOW() AND x >= $1 AND x <= $2 AND y >= $3 AND y <= $4`,
        [minX, maxX, minY, maxY]
      );
      resRes.rows.forEach((r) => {
        const key = `${r.x},${r.y}`;
        // Only mark as reserved if not already sold
        if (!pixels[key] || pixels[key].status !== 'sold') {
          pixels[key] = {
            id: Number(r.pixel_id),
            x: r.x,
            y: r.y,
            price: 10,
            status: 'reserved' as const,
            color: '#F59E0B',
            created_at: r.expires_at,
          };
        }
      });
    } catch (err) {
      // reservations table may not exist yet on first run — non-fatal
      console.warn('Could not fetch reservations (non-fatal):', err);
    }
  } catch (err) {
    console.warn('Neon Postgres query fallback to demo dataset:', err);
    pixels = generateInitialPixels();
    total = Object.keys(pixels).length;
  }

  return NextResponse.json({
    total,
    bounds: { minX, maxX, minY, maxY },
    pixels,
    profiles: profilesMap,
    orders: userOrders,
  });
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, profile, links, pixels, order } = body;

    await initPostgres();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert User
      await client.query(`
        INSERT INTO users (id, firebase_uid, email, name, avatar, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name, avatar = EXCLUDED.avatar
      `, [user.id, user.firebase_uid, user.email, user.name, user.avatar]);

      // 2. Insert Profile
      await client.query(`
        INSERT INTO profiles (id, user_id, username, name, bio, avatar, theme_color, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE
        SET username = EXCLUDED.username, name = EXCLUDED.name, bio = EXCLUDED.bio, avatar = EXCLUDED.avatar, theme_color = EXCLUDED.theme_color
      `, [profile.id, profile.user_id, profile.username, profile.name, profile.bio, profile.avatar, profile.theme_color || '#00e5ff']);

      // 3. Delete existing links for this profile and insert new ones
      await client.query(`DELETE FROM links WHERE profile_id = $1`, [profile.id]);
      for (const link of links) {
        await client.query(`
          INSERT INTO links (id, profile_id, title, url, sort_order, clicks)
          VALUES ($1, $2, $3, $4, $5, 0)
        `, [link.id, link.profile_id, link.title, link.url, link.sort_order]);
      }

      // 4. Bulk Insert/Claim Pixels (High-Performance Single Batch Query)
      if (pixels && pixels.length > 0) {
        // Process in chunks of 500 pixels to respect PostgreSQL parameter limits
        const CHUNK_SIZE = 500;
        for (let i = 0; i < pixels.length; i += CHUNK_SIZE) {
          const chunk = pixels.slice(i, i + CHUNK_SIZE);
          const values: any[] = [];
          const valueStrings: string[] = [];

          chunk.forEach((px: any, idx: number) => {
            const base = idx * 10;
            valueStrings.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, NOW())`);
            values.push(
              px.id,
              px.x,
              px.y,
              px.owner_id,
              px.owner_name,
              px.owner_avatar,
              px.price || 10,
              px.status || 'sold',
              px.color || '#00e5ff',
              px.profile_id
            );
          });

          const batchQuery = `
            INSERT INTO pixels (id, x, y, owner_id, owner_name, owner_avatar, price, status, color, profile_id, created_at)
            VALUES ${valueStrings.join(', ')}
            ON CONFLICT (id) DO UPDATE
            SET owner_id = EXCLUDED.owner_id, owner_name = EXCLUDED.owner_name, owner_avatar = EXCLUDED.owner_avatar, status = EXCLUDED.status, color = EXCLUDED.color, profile_id = EXCLUDED.profile_id
          `;

          await client.query(batchQuery, values);
        }
      }

      // 5. Insert Order
      await client.query(`
        INSERT INTO orders (id, user_id, amount, razorpay_order_id, status, pixels_count, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO NOTHING
      `, [order.id, order.user_id, order.amount, order.razorpay_order_id, order.status, order.pixels_count]);

      await client.query('COMMIT');

      // ── After successful DB commit: broadcast sold events to Firebase RTDB ──
      // This updates all connected clients' canvases in real time (<200ms)
      const soldPixelIds = pixels.map((px: any) => Number(px.id));

      // Fire-and-forget RTDB broadcasts (non-blocking, non-critical)
      Promise.all(
        pixels.map((px: any) =>
          broadcastPixelEvent(Number(px.id), {
            status: 'sold',
            x: px.x,
            y: px.y,
            owner_id: px.owner_id,
            owner_name: px.owner_name,
            owner_avatar: px.owner_avatar,
            color: px.color || '#00e5ff',
            profile_id: px.profile_id,
          })
        )
      ).catch((e) => console.warn('RTDB broadcast partial failure:', e));

      // Clean up reservations for these pixels in DB (if any)
      pool
        .query(`DELETE FROM pixel_reservations WHERE pixel_id = ANY($1)`, [soldPixelIds])
        .catch((e) => console.warn('Reservation cleanup error (non-critical):', e));

      // Release RTDB reservation nodes
      releasePixelEvents(soldPixelIds).catch(() => {});

      // Update canvas stats
      updateCanvasStats({ sold: pixels.length, reserved: -pixels.length }).catch(() => {});
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({ status: 'success', message: 'Purchase saved successfully' });
  } catch (err: any) {
    console.error('Error saving purchase to Neon Postgres:', err);
    return NextResponse.json({ error: 'Failed to save purchase to database', details: err.message }, { status: 500 });
  }
}
