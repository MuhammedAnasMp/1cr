import { NextResponse } from 'next/server';
import { generateRazorpayOrder } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const { amount, count } = await request.json();
    const orderId = `ord_${Date.now()}`;
    const order = generateRazorpayOrder(amount, orderId);

    return NextResponse.json({
      success: true,
      order,
      pixels_count: count,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
}
