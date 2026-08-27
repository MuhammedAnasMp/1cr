import { pool, initPostgres } from '@/lib/db';
import { PricingTier } from '@/types';

/**
 * Fetch dynamic pricing tiers and base block price from Neon Postgres (Server-only)
 */
export async function getPricingConfiguration(): Promise<{
  basePriceINR: number;
  tiers: PricingTier[];
}> {
  try {
    await initPostgres();
    const [settingsRes, tiersRes] = await Promise.all([
      pool.query(`SELECT value FROM app_settings WHERE key = 'base_block_price_inr'`),
      pool.query(`SELECT * FROM pricing_tiers WHERE is_active = true ORDER BY min_blocks ASC`),
    ]);

    const basePriceINR = settingsRes.rows[0]?.value?.price || 25;
    const tiers: PricingTier[] = tiersRes.rows.map((row) => ({
      id: row.id,
      min_blocks: row.min_blocks,
      max_blocks: row.max_blocks,
      discount_percent: row.discount_percent,
      price_per_block: row.price_per_block,
      is_active: row.is_active,
    }));

    return { basePriceINR, tiers };
  } catch (err) {
    console.warn('Fallback to default pricing tiers:', err);
    return {
      basePriceINR: 25,
      tiers: [
        { id: 'tier_1', min_blocks: 1, max_blocks: 4, discount_percent: 0, price_per_block: 25, is_active: true },
        { id: 'tier_2', min_blocks: 5, max_blocks: 9, discount_percent: 5, price_per_block: 23, is_active: true },
        { id: 'tier_3', min_blocks: 10, max_blocks: 24, discount_percent: 10, price_per_block: 22, is_active: true },
        { id: 'tier_4', min_blocks: 25, max_blocks: 49, discount_percent: 15, price_per_block: 21, is_active: true },
        { id: 'tier_5', min_blocks: 50, max_blocks: 99, discount_percent: 20, price_per_block: 20, is_active: true },
        { id: 'tier_6', min_blocks: 100, max_blocks: null, discount_percent: 30, price_per_block: 17, is_active: true },
      ],
    };
  }
}
