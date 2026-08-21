import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { initPostgres, pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    await initPostgres();
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // Verify HMAC SHA256 Webhook Signature
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);

    if (!isValid && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Invalid Razorpay Webhook Signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody || '{}');
    const event = payload.event || 'payment.captured';
    const paymentEntity = payload.payload?.payment?.entity;

    if (paymentEntity) {
      const orderId = paymentEntity.order_id || `ord_${Date.now()}`;
      const amount = paymentEntity.amount ? paymentEntity.amount / 100 : 100;
      const userId = paymentEntity.notes?.user_id || 'u_alex';

      // Record Order in Neon PostgreSQL
      await pool.query(`
        INSERT INTO orders (id, user_id, amount, razorpay_order_id, status, pixels_count, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO NOTHING
      `, [orderId, userId, amount, paymentEntity.id || `pay_${Date.now()}`, 'paid', amount / 10]);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Razorpay webhook processed and recorded in Neon PostgreSQL',
      event,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Razorpay webhook processing error' }, { status: 500 });
  }
}
