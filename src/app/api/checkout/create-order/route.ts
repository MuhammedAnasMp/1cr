import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';
import { generateRazorpayOrder } from '@/lib/razorpay';
import { calculateBlockPrice } from '@/lib/pricing';
import { getPricingConfiguration } from '@/lib/pricingServer';

export async function POST(request: Request) {
  try {
    const { block_keys, currency = 'INR', session_id, user_id } = (await request.json()) as {
      block_keys: string[]; // ["x,y", ...]
      currency?: string;
      session_id: string;
      user_id?: string;
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
      // 1. Transaction with pg_advisory_xact_lock to prevent double-selling
      await client.query('BEGIN');

      // Advisory lock based on hashed block IDs sum
      const lockKey = Math.abs(
        blockIds.reduce((acc, id) => acc + id.split('').reduce((a, c) => a + c.charCodeAt(0), 0), 0) % 2147483647
      );
      await client.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

      // Check if already sold
      const soldCheck = await client.query(
        `SELECT id, grid_x, grid_y FROM blocks WHERE id = ANY($1) AND status = 'sold'`,
        [blockIds]
      );
      if (soldCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        const taken = soldCheck.rows.map((r: any) => `${r.grid_x},${r.grid_y}`);
        return NextResponse.json({ conflict: true, reason: 'sold', taken }, { status: 409 });
      }

      // Check if active reservation by another session
      const reservedCheck = await client.query(
        `SELECT block_id, grid_x, grid_y FROM block_reservations
         WHERE block_id = ANY($1) AND expires_at > NOW() AND session_id != $2`,
        [blockIds, session_id]
      );
      if (reservedCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        const taken = reservedCheck.rows.map((r: any) => `${r.grid_x},${r.grid_y}`);
        return NextResponse.json({ conflict: true, reason: 'reserved', taken }, { status: 409 });
      }

      // 2. Fetch active pricing configuration from Postgres
      const { basePriceINR, tiers } = await getPricingConfiguration();
      const pricing = calculateBlockPrice(blockIds.length, currency, basePriceINR, tiers);

      // 3. Generate official Razorpay Order
      const orderId = `ord_vb_${Date.now()}`;
      const razorpayOrder = await generateRazorpayOrder(pricing.netAmountINR, orderId);

      // 4. Save order intent in orders table
      await client.query(
        `INSERT INTO orders (id, user_id, amount, currency, discount_amount, razorpay_order_id, status, block_ids, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'created', $7, NOW())`,
        [
          orderId,
          user_id || `guest_${session_id.slice(0, 12)}`,
          pricing.netAmountINR,
          currency,
          pricing.discountAmountINR,
          razorpayOrder.id,
          blockIds,
        ]
      );

      // 5. Upsert 120s reservation locks
      for (const row of blockRows) {
        await client.query(
          `INSERT INTO block_reservations (block_id, grid_x, grid_y, session_id, razorpay_order_id, expires_at)
           VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '120 seconds')
           ON CONFLICT (block_id) DO UPDATE
             SET session_id = EXCLUDED.session_id,
                 razorpay_order_id = EXCLUDED.razorpay_order_id,
                 expires_at = EXCLUDED.expires_at`,
          [row.id, row.x, row.y, session_id, razorpayOrder.id]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        orderId,
        razorpayOrder,
        pricing,
        blockIds,
      });
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: 'Failed to create checkout order', message: err.message }, { status: 500 });
  }
}
