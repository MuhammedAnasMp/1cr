import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';
import { getPricingConfiguration } from '@/lib/pricingServer';

export async function GET() {
  try {
    const config = await getPricingConfiguration();
    return NextResponse.json({ success: true, ...config });
  } catch (err: any) {
    console.error('Error fetching admin pricing:', err);
    return NextResponse.json({ error: 'Failed to fetch pricing config', message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { basePriceINR, tiers } = body as {
      basePriceINR?: number;
      tiers?: Array<{
        id: string;
        min_blocks: number;
        max_blocks: number | null;
        discount_percent: number;
        price_per_block: number;
        is_active: boolean;
      }>;
    };

    await initPostgres();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update Base Price if provided
      if (typeof basePriceINR === 'number' && basePriceINR > 0) {
        await client.query(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES ('base_block_price_inr', $1::jsonb, NOW())
           ON CONFLICT (key) DO UPDATE
             SET value = EXCLUDED.value, updated_at = NOW()`,
          [JSON.stringify({ price: basePriceINR })]
        );
      }

      // Update or Replace Tiers if provided
      if (Array.isArray(tiers) && tiers.length > 0) {
        for (const t of tiers) {
          await client.query(
            `INSERT INTO pricing_tiers (id, min_blocks, max_blocks, discount_percent, price_per_block, is_active, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (id) DO UPDATE
               SET min_blocks = EXCLUDED.min_blocks,
                   max_blocks = EXCLUDED.max_blocks,
                   discount_percent = EXCLUDED.discount_percent,
                   price_per_block = EXCLUDED.price_per_block,
                   is_active = EXCLUDED.is_active,
                   updated_at = NOW()`,
            [t.id, t.min_blocks, t.max_blocks, t.discount_percent, t.price_per_block, t.is_active ?? true]
          );
        }
      }

      await client.query('COMMIT');

      const updatedConfig = await getPricingConfiguration();
      return NextResponse.json({ success: true, message: 'Pricing updated successfully', ...updatedConfig });
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Error updating admin pricing:', err);
    return NextResponse.json({ error: 'Failed to update pricing', message: err.message }, { status: 500 });
  }
}
