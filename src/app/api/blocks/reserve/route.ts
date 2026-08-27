import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';

const RESERVATION_SECONDS = 120; // 2-minute short-TTL checkout reservation lock

export async function POST(request: Request) {
  try {
    const { block_keys, session_id, razorpay_order_id } = (await request.json()) as {
      block_keys: string[]; // ["x,y", ...]
      session_id: string;
      razorpay_order_id?: string;
    };

    if (!block_keys || block_keys.length === 0 || !session_id) {
      return NextResponse.json({ error: 'Missing block_keys or session_id' }, { status: 400 });
    }

    await initPostgres();
    const client = await pool.connect();

    const blockRows = block_keys.map((k) => {
      const [x, y] = k.split(',').map(Number);
      return { id: `b_${x}_${y}`, x, y };
    });
    const blockIds = blockRows.map((r) => r.id);

    try {
      // 1. Check if any are already SOLD in blocks table
      const soldCheck = await client.query(
        `SELECT id, grid_x, grid_y FROM blocks WHERE id = ANY($1) AND status = 'sold'`,
        [blockIds]
      );
      if (soldCheck.rows.length > 0) {
        const taken = soldCheck.rows.map((r: any) => `${r.grid_x},${r.grid_y}`);
        return NextResponse.json({ conflict: true, reason: 'sold', taken }, { status: 409 });
      }

      // 2. Check if actively reserved by another session
      const reservedCheck = await client.query(
        `SELECT block_id, grid_x, grid_y, session_id FROM block_reservations
         WHERE block_id = ANY($1) AND expires_at > NOW() AND session_id != $2`,
        [blockIds, session_id]
      );
      if (reservedCheck.rows.length > 0) {
        const taken = reservedCheck.rows.map((r: any) => `${r.grid_x},${r.grid_y}`);
        return NextResponse.json({ conflict: true, reason: 'reserved', taken }, { status: 409 });
      }

      // 3. Upsert reservations
      await client.query('BEGIN');
      for (const row of blockRows) {
        await client.query(
          `INSERT INTO block_reservations (block_id, grid_x, grid_y, session_id, razorpay_order_id, expires_at)
           VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${RESERVATION_SECONDS} seconds')
           ON CONFLICT (block_id) DO UPDATE
             SET session_id = EXCLUDED.session_id,
                 razorpay_order_id = EXCLUDED.razorpay_order_id,
                 expires_at = EXCLUDED.expires_at`,
          [row.id, row.x, row.y, session_id, razorpay_order_id || null]
        );
      }
      await client.query('COMMIT');

      const expiresAt = new Date(Date.now() + RESERVATION_SECONDS * 1000).toISOString();
      return NextResponse.json({ success: true, reserved: blockIds.length, expires_at: expiresAt });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Reserve blocks error:', err);
    return NextResponse.json({ error: 'Failed to reserve blocks', message: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { session_id } = (await request.json()) as { session_id: string };
    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    await initPostgres();
    const res = await pool.query(
      `DELETE FROM block_reservations WHERE session_id = $1 RETURNING block_id`,
      [session_id]
    );

    return NextResponse.json({ success: true, released: res.rowCount });
  } catch (err: any) {
    console.error('Release blocks error:', err);
    return NextResponse.json({ error: 'Failed to release reservation', message: err.message }, { status: 500 });
  }
}
