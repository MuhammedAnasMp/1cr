import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { linkId } = await request.json();
    if (!linkId) {
      return NextResponse.json({ error: 'Missing linkId' }, { status: 400 });
    }

    await initPostgres();
    const res = await pool.query(
      `UPDATE block_links SET clicks = clicks + 1 WHERE id = $1 RETURNING redirect_url, delay_seconds, clicks`,
      [linkId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      redirect_url: res.rows[0].redirect_url,
      delay_seconds: res.rows[0].delay_seconds || 0,
      clicks: res.rows[0].clicks,
    });
  } catch (err: any) {
    console.error('Link click error:', err);
    return NextResponse.json({ error: 'Failed to record link click', message: err.message }, { status: 500 });
  }
}
