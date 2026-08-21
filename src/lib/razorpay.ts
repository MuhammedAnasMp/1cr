import crypto from 'crypto';

export interface RazorpayOrderPayload {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export function generateRazorpayOrder(amountInINR: number, orderId: string) {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_SV6F6KkRKtMuKm';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'qW8VOy0McICzbPOxtvhWWvUk';

  return {
    id: `order_${orderId}_${Math.floor(Math.random() * 89999 + 10000)}`,
    entity: 'order',
    amount: amountInINR * 100, // Razorpay amount in paise
    amount_paid: 0,
    amount_due: amountInINR * 100,
    currency: 'INR',
    receipt: `rcpt_${orderId}`,
    status: 'created',
    key_id: keyId,
    created_at: Math.floor(Date.now() / 1000),
  };
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_pixelverse_secret_key'
): boolean {
  if (!signature) return false;
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return expectedSignature === signature;
  } catch (err) {
    console.error('Razorpay signature verification error:', err);
    return false;
  }
}
