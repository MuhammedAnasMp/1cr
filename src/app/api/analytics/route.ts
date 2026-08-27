import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id') || searchParams.get('profile_id') || '';

  try {
    await initPostgres();
    const res = await pool.query(
      `SELECT 
         COALESCE(SUM(bl.clicks), 0) as block_clicks,
         COUNT(DISTINCT b.id) as owned_blocks
       FROM blocks b
       LEFT JOIN block_links bl ON bl.block_id = b.id
       WHERE b.owner_id = $1`,
      [userId]
    );

    const row = res.rows[0];
    const totalClicks = parseInt(row?.block_clicks || '0', 10);
    const ownedBlocks = parseInt(row?.owned_blocks || '0', 10);
    const views = totalClicks > 0 ? totalClicks * 4 + ownedBlocks * 12 : ownedBlocks * 5;
    const ctr = views > 0 ? Number(((totalClicks / views) * 100).toFixed(1)) : 0.0;

    return NextResponse.json({
      success: true,
      user_id: userId,
      views,
      clicks: totalClicks,
      ctr,
      owned_blocks: ownedBlocks,
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      user_id: userId,
      views: 0,
      clicks: 0,
      ctr: 0.0,
      owned_blocks: 0,
    });
  }
}
