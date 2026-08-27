import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = await checkRateLimit(`auth_login_${ip}`, 15, 60);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Please wait a moment.' }, { status: 429 });
    }

    const { email, password } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }

    const { user, token } = await authenticateUser(email, password);

    const response = NextResponse.json({
      success: true,
      user,
      token,
    });

    response.cookies.set('vist_bio_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 401 });
  }
}
