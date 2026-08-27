import { calculateBlockPrice, SUPPORTED_CURRENCIES } from '../src/lib/pricing';

describe('vist.bio Dynamic Volume Pricing & Multi-Currency Tests', () => {
  const defaultTiers = [
    { id: 'tier_1', min_blocks: 1, max_blocks: 4, discount_percent: 0, price_per_block: 25, is_active: true },
    { id: 'tier_2', min_blocks: 5, max_blocks: 9, discount_percent: 5, price_per_block: 23, is_active: true },
    { id: 'tier_3', min_blocks: 10, max_blocks: 24, discount_percent: 10, price_per_block: 22, is_active: true },
    { id: 'tier_4', min_blocks: 25, max_blocks: 49, discount_percent: 15, price_per_block: 21, is_active: true },
    { id: 'tier_5', min_blocks: 50, max_blocks: 99, discount_percent: 20, price_per_block: 20, is_active: true },
    { id: 'tier_6', min_blocks: 100, max_blocks: null, discount_percent: 30, price_per_block: 17, is_active: true },
  ];

  test('should calculate correct price for 1 block (0% discount)', () => {
    const result = calculateBlockPrice(1, 'INR', 25, defaultTiers);
    expect(result.blockCount).toBe(1);
    expect(result.pixelCount).toBe(100);
    expect(result.grossAmountINR).toBe(25);
    expect(result.discountPercent).toBe(0);
    expect(result.discountAmountINR).toBe(0);
    expect(result.netAmountINR).toBe(25);
    expect(result.netAmountSelectedCurrency).toBe(25);
  });

  test('should apply 10% volume discount for 10 blocks (1,000 pixels)', () => {
    const result = calculateBlockPrice(10, 'INR', 25, defaultTiers);
    expect(result.blockCount).toBe(10);
    expect(result.pixelCount).toBe(1000);
    expect(result.grossAmountINR).toBe(250);
    expect(result.discountPercent).toBe(10);
    expect(result.discountAmountINR).toBe(25);
    expect(result.netAmountINR).toBe(225);
    expect(result.appliedTierId).toBe('tier_3');
  });

  test('should apply 30% volume discount for 100 blocks (10,000 pixels)', () => {
    const result = calculateBlockPrice(100, 'INR', 25, defaultTiers);
    expect(result.blockCount).toBe(100);
    expect(result.pixelCount).toBe(10000);
    expect(result.grossAmountINR).toBe(2500);
    expect(result.discountPercent).toBe(30);
    expect(result.discountAmountINR).toBe(750);
    expect(result.netAmountINR).toBe(1750);
    expect(result.appliedTierId).toBe('tier_6');
  });

  test('should convert correctly to USD ($)', () => {
    const result = calculateBlockPrice(10, 'USD', 25, defaultTiers);
    expect(result.selectedCurrency.code).toBe('USD');
    expect(result.selectedCurrency.symbol).toBe('$');
    // 225 INR * 0.012 = $2.70
    expect(result.netAmountSelectedCurrency).toBe(2.7);
  });

  test('should convert correctly to EUR (€)', () => {
    const result = calculateBlockPrice(10, 'EUR', 25, defaultTiers);
    expect(result.selectedCurrency.code).toBe('EUR');
    expect(result.selectedCurrency.symbol).toBe('€');
    expect(result.netAmountSelectedCurrency).toBeCloseTo(2.48, 1);
  });
});
