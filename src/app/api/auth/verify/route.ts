import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name, avatar } = await request.json();
    const { user, token } = await authenticateUser(email, password);

    const response = NextResponse.json({
      status: 'authenticated',
      user,
      token,
    });

    response.cookies.set('vist_bio_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Authentication verification failed' }, { status: 401 });
  }
}
