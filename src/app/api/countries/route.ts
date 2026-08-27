import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';

export async function GET() {
  try {
    await initPostgres();
    const res = await pool.query(`SELECT * FROM countries ORDER BY total_blocks DESC`);
    
    const countriesMap: Record<string, any> = {};
    res.rows.forEach((row) => {
      countriesMap[row.code] = {
        code: row.code,
        name: row.name,
        flag: row.flag,
        bounding_box: row.bounding_box,
        total_blocks: row.total_blocks,
        sold_blocks: row.sold_blocks,
      };
    });

    return NextResponse.json({ success: true, countries: countriesMap });
  } catch (err: any) {
    console.error('Error fetching countries:', err);
    return NextResponse.json({ error: 'Failed to fetch countries', message: err.message }, { status: 500 });
  }
}
