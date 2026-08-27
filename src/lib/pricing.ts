import { PricingTier, CurrencyConfig } from '@/types';
import { pool, initPostgres } from '@/lib/db';

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateFromINR: 1 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateFromINR: 0.012 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateFromINR: 0.011 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateFromINR: 0.0095 },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', rateFromINR: 0.044 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateFromINR: 0.016 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateFromINR: 0.0165 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateFromINR: 0.0185 },
};

export interface PriceCalculationResult {
  blockCount: number;
  pixelCount: number;
  basePricePerBlockINR: number;
  grossAmountINR: number;
  discountPercent: number;
  discountAmountINR: number;
  netAmountINR: number;
  selectedCurrency: CurrencyConfig;
  netAmountSelectedCurrency: number;
  discountAmountSelectedCurrency: number;
  pricePerBlockSelectedCurrency: number;
  appliedTierId?: string;
}

/**
 * Fetch dynamic pricing tiers and base block price from Neon Postgres
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

/**
 * Calculate total price, discounts, and currency conversions
 */
export function calculateBlockPrice(
  blockCount: number,
  currencyCode: string = 'INR',
  basePriceINR: number = 25,
  tiers: PricingTier[] = []
): PriceCalculationResult {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
  const count = Math.max(0, blockCount);
  const pixelCount = count * 100;

  // Find matching pricing tier
  let appliedTier: PricingTier | undefined = tiers.find((t) => {
    if (!t.is_active) return false;
    if (t.max_blocks === null) {
      return count >= t.min_blocks;
    }
    return count >= t.min_blocks && count <= t.max_blocks;
  });

  // Fallback discount calculation if no explicit tier matched
  let discountPercent = 0;
  if (appliedTier) {
    discountPercent = appliedTier.discount_percent;
  } else if (count >= 100) {
    discountPercent = 30;
  } else if (count >= 50) {
    discountPercent = 20;
  } else if (count >= 25) {
    discountPercent = 15;
  } else if (count >= 10) {
    discountPercent = 10;
  } else if (count >= 5) {
    discountPercent = 5;
  }

  const grossAmountINR = count * basePriceINR;
  const discountAmountINR = Math.round(grossAmountINR * (discountPercent / 100));
  const netAmountINR = Math.max(0, grossAmountINR - discountAmountINR);

  const rate = currency.rateFromINR;
  const netAmountSelectedCurrency = Number((netAmountINR * rate).toFixed(2));
  const discountAmountSelectedCurrency = Number((discountAmountINR * rate).toFixed(2));
  const effectivePricePerBlockINR = count > 0 ? netAmountINR / count : basePriceINR;
  const pricePerBlockSelectedCurrency = Number((effectivePricePerBlockINR * rate).toFixed(2));

  return {
    blockCount: count,
    pixelCount,
    basePricePerBlockINR: basePriceINR,
    grossAmountINR,
    discountPercent,
    discountAmountINR,
    netAmountINR,
    selectedCurrency: currency,
    netAmountSelectedCurrency,
    discountAmountSelectedCurrency,
    pricePerBlockSelectedCurrency,
    appliedTierId: appliedTier?.id,
  };
}
