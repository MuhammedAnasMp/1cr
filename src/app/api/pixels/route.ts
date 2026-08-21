import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';
import { generateInitialPixels } from '@/lib/demoData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minX = parseInt(searchParams.get('minX') || '0', 10);
  const maxX = parseInt(searchParams.get('maxX') || '10000', 10);
  const minY = parseInt(searchParams.get('minY') || '0', 10);
  const maxY = parseInt(searchParams.get('maxY') || '1000', 10);

  let pixels: Record<string, any> = {};
  let profilesMap: Record<string, any> = {};
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

      // 4. Insert/Claim Pixels
      for (const px of pixels) {
        await client.query(`
          INSERT INTO pixels (id, x, y, owner_id, owner_name, owner_avatar, price, status, color, profile_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (id) DO UPDATE
          SET owner_id = EXCLUDED.owner_id, owner_name = EXCLUDED.owner_name, owner_avatar = EXCLUDED.owner_avatar, status = EXCLUDED.status, color = EXCLUDED.color, profile_id = EXCLUDED.profile_id
        `, [px.id, px.x, px.y, px.owner_id, px.owner_name, px.owner_avatar, px.price, px.status, px.color, px.profile_id]);
      }

      // 5. Insert Order
      await client.query(`
        INSERT INTO orders (id, user_id, amount, razorpay_order_id, status, pixels_count, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO NOTHING
      `, [order.id, order.user_id, order.amount, order.razorpay_order_id, order.status, order.pixels_count]);

      await client.query('COMMIT');
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
