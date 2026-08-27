import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';

const RESERVATION_MINUTES = 10;

// ─── POST /api/pixels/reserve ─────────────────────────────────────────────────
// Called when user clicks "Proceed to Pay" — before Razorpay modal opens.
// Reserves pixels in DB with a 10-minute TTL.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { coords, session_id, razorpay_order_id } = body as {
      coords: string[];       // ["x,y", "x,y", ...]
      session_id: string;     // unique browser-tab session
      razorpay_order_id?: string;
    };

    if (!coords || coords.length === 0 || !session_id) {
      return NextResponse.json({ error: 'Missing coords or session_id' }, { status: 400 });
    }

    await initPostgres();
    const client = await pool.connect();

    // Parse coords → pixel IDs
    const pixelRows = coords.map((c) => {
      const [x, y] = c.split(',').map(Number);
      return { x, y, pixelId: y * 4000 + x + 1 };
    });
    const pixelIds = pixelRows.map((r) => r.pixelId);

    try {
      // ── 1. Check none are already SOLD in pixels table ──────────────────────
      const soldCheck = await client.query(
        `SELECT id, x, y FROM pixels WHERE id = ANY($1) AND status = 'sold'`,
        [pixelIds]
      );
      if (soldCheck.rows.length > 0) {
        const taken = soldCheck.rows.map((r) => `${r.x},${r.y}`);
        return NextResponse.json({ conflict: true, reason: 'sold', taken }, { status: 409 });
      }

      // ── 2. Check none are actively reserved by another session ───────────────
      const reservedCheck = await client.query(
        `SELECT pixel_id, x, y, session_id FROM pixel_reservations
         WHERE pixel_id = ANY($1)
           AND expires_at > NOW()
           AND session_id != $2`,
        [pixelIds, session_id]
      );
      if (reservedCheck.rows.length > 0) {
        const taken = reservedCheck.rows.map((r) => `${r.x},${r.y}`);
        return NextResponse.json({ conflict: true, reason: 'reserved', taken }, { status: 409 });
      }

      // ── 3. Upsert reservations (own session renews expiry) ───────────────────
      await client.query('BEGIN');
      for (const row of pixelRows) {
        await client.query(
          `INSERT INTO pixel_reservations (pixel_id, x, y, session_id, razorpay_order_id, expires_at)
           VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${RESERVATION_MINUTES} minutes')
           ON CONFLICT (pixel_id) DO UPDATE
             SET session_id = EXCLUDED.session_id,
                 razorpay_order_id = EXCLUDED.razorpay_order_id,
                 expires_at = EXCLUDED.expires_at`,
          [row.pixelId, row.x, row.y, session_id, razorpay_order_id || null]
        );
      }
      await client.query('COMMIT');

      const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();
      return NextResponse.json({ success: true, reserved: pixelIds.length, expires_at: expiresAt });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Reserve pixels error:', err);
    return NextResponse.json({ error: 'Failed to reserve pixels', details: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/pixels/reserve ───────────────────────────────────────────────
// Called when user dismisses Razorpay without paying — releases the hold.
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { session_id } = body as { session_id: string };

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    await initPostgres();

    const existing = await pool.query(
      `SELECT pixel_id, x, y FROM pixel_reservations WHERE session_id = $1`,
      [session_id]
    );
    const rows = existing.rows;

    if (rows.length === 0) {
      return NextResponse.json({ success: true, released: 0 });
    }

    // Delete from DB
    await pool.query(
      `DELETE FROM pixel_reservations WHERE session_id = $1`,
      [session_id]
    );

    return NextResponse.json({ success: true, released: rows.length });
  } catch (err: any) {
    console.error('Release reservation error:', err);
    return NextResponse.json({ error: 'Failed to release reservations', details: err.message }, { status: 500 });
  }
}
