import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minX = parseInt(searchParams.get('minX') || '0', 10);
    const maxX = parseInt(searchParams.get('maxX') || '1000', 10);
    const minY = parseInt(searchParams.get('minY') || '0', 10);
    const maxY = parseInt(searchParams.get('maxY') || '1000', 10);
    const country = searchParams.get('country');
    const ownerId = searchParams.get('ownerId');

    await initPostgres();

    let query = `
      SELECT b.*, 
        COALESCE(json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL), '[]') as links,
        COALESCE(json_agg(DISTINCT i.*) FILTER (WHERE i.id IS NOT NULL), '[]') as images
      FROM blocks b
      LEFT JOIN block_links l ON l.block_id = b.id
      LEFT JOIN block_images i ON i.block_id = b.id
      WHERE b.grid_x >= $1 AND b.grid_x <= $2 AND b.grid_y >= $3 AND b.grid_y <= $4
    `;
    const params: any[] = [minX, maxX, minY, maxY];

    if (country && country !== 'GLOBAL') {
      params.push(country);
      query += ` AND b.country_code = $${params.length}`;
    }
    if (ownerId) {
      params.push(ownerId);
      query += ` AND b.owner_id = $${params.length}`;
    }

    query += ` GROUP BY b.id`;

    const res = await pool.query(query, params);

    const blocksMap: Record<string, any> = {};
    res.rows.forEach((row) => {
      const key = `${row.grid_x},${row.grid_y}`;
      blocksMap[key] = {
        id: row.id,
        grid_x: row.grid_x,
        grid_y: row.grid_y,
        country_code: row.country_code,
        owner_id: row.owner_id,
        owner_name: row.owner_name,
        owner_avatar: row.owner_avatar,
        owner_username: row.owner_username,
        price: row.price,
        status: row.status,
        image_url: row.image_url,
        config: row.config_json || {},
        links: row.links || [],
        images: row.images || [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    // Check active non-expired reservations and overlay
    try {
      const resvRes = await pool.query(
        `SELECT block_id, grid_x, grid_y, session_id, expires_at 
         FROM block_reservations 
         WHERE expires_at > NOW() AND grid_x >= $1 AND grid_x <= $2 AND grid_y >= $3 AND grid_y <= $4`,
        [minX, maxX, minY, maxY]
      );
      resvRes.rows.forEach((r) => {
        const key = `${r.grid_x},${r.grid_y}`;
        if (!blocksMap[key] || blocksMap[key].status !== 'sold') {
          blocksMap[key] = {
            id: r.block_id,
            grid_x: r.grid_x,
            grid_y: r.grid_y,
            country_code: 'GLOBAL',
            price: 25,
            status: 'reserved',
            expires_at: r.expires_at,
          };
        }
      });
    } catch (e) {
      // non-fatal
    }

    return NextResponse.json({
      success: true,
      total: Object.keys(blocksMap).length,
      bounds: { minX, maxX, minY, maxY },
      blocks: blocksMap,
    });
  } catch (err: any) {
    console.error('Error fetching blocks:', err);
    return NextResponse.json({ error: 'Failed to fetch blocks', message: err.message }, { status: 500 });
  }
}
