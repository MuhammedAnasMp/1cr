import { NextResponse } from 'next/server';
import { generateRazorpayOrder } from '@/lib/razorpay';
import { initPostgres, pool } from '@/lib/db';

const RESERVATION_MINUTES = 10;

export async function POST(request: Request) {
  try {
    const { amount, count, coords, session_id } = await request.json() as {
      amount: number;
      count: number;
      coords?: string[];      // ["x,y", ...] — pixel coords to reserve
      session_id?: string;    // browser-tab session identifier
    };

    const orderId = `ord_${Date.now()}`;
    const order = generateRazorpayOrder(amount, orderId);

    // ── Reserve pixels in DB if coords provided ─────────────────────────────
    let reservationResult: { conflict?: boolean; taken?: string[]; success?: boolean } = {};

    if (coords && coords.length > 0 && session_id) {
      await initPostgres();
      const client = await pool.connect();

      const pixelRows = coords.map((c) => {
        const [x, y] = c.split(',').map(Number);
        return { x, y, pixelId: y * 4000 + x + 1 };
      });
      const pixelIds = pixelRows.map((r) => r.pixelId);

      try {
        // Check sold
        const soldCheck = await client.query(
          `SELECT id, x, y FROM pixels WHERE id = ANY($1) AND status = 'sold'`,
          [pixelIds]
        );
        if (soldCheck.rows.length > 0) {
          client.release();
          const taken = soldCheck.rows.map((r: any) => `${r.x},${r.y}`);
          return NextResponse.json({ conflict: true, reason: 'sold', taken }, { status: 409 });
        }

        // Check reserved by other sessions
        const reservedCheck = await client.query(
          `SELECT pixel_id, x, y FROM pixel_reservations
           WHERE pixel_id = ANY($1) AND expires_at > NOW() AND session_id != $2`,
          [pixelIds, session_id]
        );
        if (reservedCheck.rows.length > 0) {
          client.release();
          const taken = reservedCheck.rows.map((r: any) => `${r.x},${r.y}`);
          return NextResponse.json({ conflict: true, reason: 'reserved', taken }, { status: 409 });
        }

        // Upsert reservations
        await client.query('BEGIN');
        for (const row of pixelRows) {
          await client.query(
            `INSERT INTO pixel_reservations (pixel_id, x, y, session_id, razorpay_order_id, expires_at)
             VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${RESERVATION_MINUTES} minutes')
             ON CONFLICT (pixel_id) DO UPDATE
               SET session_id = EXCLUDED.session_id,
                   razorpay_order_id = EXCLUDED.razorpay_order_id,
                   expires_at = EXCLUDED.expires_at`,
            [row.pixelId, row.x, row.y, session_id, order.id]
          );
        }
        await client.query('COMMIT');
        client.release();

        reservationResult = { success: true };
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      order,
      pixels_count: count,
      reservation: reservationResult,
      // Pass the Razorpay order id back for frontend use
      id: order.id,
      amount: order.amount,
    });
  } catch (err) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
}

