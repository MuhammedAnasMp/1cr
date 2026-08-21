import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';
import { generateInitialPixels } from '@/lib/demoData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minX = parseInt(searchParams.get('minX') || '0', 10);
  const maxX = parseInt(searchParams.get('maxX') || '10000', 10);
  const minY = parseInt(searchParams.get('minY') || '0', 10);
  const maxY = parseInt(searchParams.get('maxY') || '1000', 10);

  let pixels: Record<string, any> = {};
  let total = 0;

  try {
    await initPostgres();
    const res = await pool.query(
      `SELECT * FROM pixels WHERE x >= $1 AND x <= $2 AND y >= $3 AND y <= $4`,
      [minX, maxX, minY, maxY]
    );

    res.rows.forEach((px) => {
      pixels[`${px.x},${px.y}`] = {
        id: Number(px.id),
        x: px.x,
        y: px.y,
        owner_id: px.owner_id,
        owner_name: px.owner_name,
        owner_avatar: px.owner_avatar,
        price: px.price,
        status: px.status,
        color: px.color,
        profile_id: px.profile_id,
        created_at: px.created_at,
      };
    });
    total = res.rows.length;
  } catch (err) {
    console.warn('Neon Postgres query fallback to demo dataset:', err);
    pixels = generateInitialPixels();
    total = Object.keys(pixels).length;
  }

  return NextResponse.json({
    total,
    bounds: { minX, maxX, minY, maxY },
    pixels,
  });
}
