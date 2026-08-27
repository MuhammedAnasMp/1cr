import { PricingTier, CurrencyConfig } from '@/types';

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
 * Calculate total price, discounts, and currency conversions (Client-safe pure function)
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
