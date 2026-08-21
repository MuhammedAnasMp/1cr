import { generateRazorpayOrder, verifyRazorpayWebhookSignature } from '../src/lib/razorpay';

describe('Razorpay Payment Integration Unit Tests', () => {
  it('should generate valid Razorpay order with paise conversion', () => {
    const amountInINR = 250; // 25 pixels @ ₹10
    const order = generateRazorpayOrder(amountInINR, '1002');

    expect(order).toBeDefined();
    expect(order.amount).toBe(25000); // 25000 paise = ₹250
    expect(order.currency).toBe('INR');
    expect(order.status).toBe('created');
  });

  it('should verify valid HMAC SHA256 webhook signature', () => {
    const rawBody = JSON.stringify({ event: 'payment.captured', amount: 1000 });
    const secret = 'whsec_pixelverse_secret_key';

    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature, secret);
    expect(isValid).toBe(true);
  });

  it('should reject invalid webhook signature', () => {
    const rawBody = JSON.stringify({ event: 'payment.captured' });
    const fakeSignature = 'bad_signature_12345';

    const isValid = verifyRazorpayWebhookSignature(rawBody, fakeSignature);
    expect(isValid).toBe(false);
  });
});
