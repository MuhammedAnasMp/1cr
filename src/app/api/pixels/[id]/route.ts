import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const pixelId = parseInt(resolvedParams.id, 10);

  try {
    await initPostgres();
    const pixelRes = await pool.query(`SELECT * FROM pixels WHERE id = $1`, [pixelId]);

    if (pixelRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pixel not found in Neon Postgres' }, { status: 404 });
    }

    const pixel = pixelRes.rows[0];
    let profile = null;

    if (pixel.owner_id) {
      const profRes = await pool.query(`SELECT * FROM profiles WHERE user_id = $1`, [pixel.owner_id]);
      if (profRes.rows.length > 0) {
        profile = profRes.rows[0];
        const linksRes = await pool.query(
          `SELECT * FROM links WHERE profile_id = $1 ORDER BY sort_order ASC`,
          [profile.id]
        );
        profile.links = linksRes.rows;
      }
    }

    return NextResponse.json({
      pixel,
      profile,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Database query error' }, { status: 500 });
  }
}
