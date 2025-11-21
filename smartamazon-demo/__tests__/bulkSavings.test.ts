/**
 * Bulk Savings Module Tests
 */
import { applyBulkSavings, MULTI_PACK_CONFIG } from '@/lib/bulkSavings';
import { Product } from '@/lib/types';

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 99,
    title: 'Test Product',
    brand: 'TestBrand',
    category: 'Grocery',
    currentPrice: 50,
    listPrice: 60,
    discount: 17,
    unitPrice: 2.5,
    unitType: 'oz',
    weight: '20oz',
    rating: 4.5,
    reviews: 1000,
    isPrime: true,
    isSponsored: false,
    subscribeSave: 10,
    dealScore: 70,
    hiddenGemScore: 50,
    image: 'test.jpg',
    isBestValue: false,
    isMultiPack: false,
    priceHistory: [],
    lowestHistoricalPrice: 40,
    highestHistoricalPrice: 70,
    averageHistoricalPrice: 55,
    ...overrides,
  };
}

describe('MULTI_PACK_CONFIG', () => {
  it('contains expected product configurations', () => {
    expect(MULTI_PACK_CONFIG.length).toBeGreaterThan(0);
  });

  it('has valid pack sizes', () => {
    for (const config of MULTI_PACK_CONFIG) {
      expect(config.packSize).toBeGreaterThanOrEqual(1);
      expect(config.singleUnitPrice).toBeGreaterThan(0);
    }
  });
});

describe('applyBulkSavings', () => {
  it('marks non-multi-pack products as isMultiPack: false', () => {
    const products = [createMockProduct({ id: 999 })]; // ID not in config
    const result = applyBulkSavings(products);

    expect(result[0].isMultiPack).toBe(false);
  });

  it('marks known multi-pack products as isMultiPack: true', () => {
    // ID 35 is Gillette razors - 12 pack
    const products = [createMockProduct({ id: 35, currentPrice: 30 })];
    const result = applyBulkSavings(products);

    expect(result[0].isMultiPack).toBe(true);
  });

  it('calculates pack size correctly', () => {
    // ID 35: packSize: 12
    const products = [createMockProduct({ id: 35, currentPrice: 30 })];
    const result = applyBulkSavings(products);

    expect(result[0].packSize).toBe(12);
  });

  it('calculates price per unit correctly', () => {
    // ID 35: packSize: 12, currentPrice: 30
    // pricePerUnit = 30 / 12 = 2.5
    const products = [createMockProduct({ id: 35, currentPrice: 30 })];
    const result = applyBulkSavings(products);

    expect(result[0].pricePerUnit).toBeCloseTo(2.5, 2);
  });

  it('calculates bulk savings correctly', () => {
    // ID 35: packSize: 12, singleUnitPrice: 4.49
    // singlePackTotal = 4.49 * 12 = 53.88
    // bulkSavings = 53.88 - 30 = 23.88
    const products = [createMockProduct({ id: 35, currentPrice: 30 })];
    const result = applyBulkSavings(products);

    const expectedSingleTotal = 4.49 * 12; // 53.88
    const expectedSavings = expectedSingleTotal - 30; // 23.88

    expect(result[0].bulkSavings).toBeCloseTo(expectedSavings, 2);
  });

  it('calculates bulk savings percent correctly', () => {
    // bulkSavingsPercent = (bulkSavings / singlePackTotal) * 100
    // = (23.88 / 53.88) * 100 = ~44%
    const products = [createMockProduct({ id: 35, currentPrice: 30 })];
    const result = applyBulkSavings(products);

    const singlePackTotal = 4.49 * 12;
    const bulkSavings = singlePackTotal - 30;
    const expectedPercent = ((bulkSavings / singlePackTotal) * 100).toFixed(0);

    expect(result[0].bulkSavingsPercent).toBe(expectedPercent);
  });

  it('preserves single unit price from config', () => {
    // ID 35: singleUnitPrice: 4.49
    const products = [createMockProduct({ id: 35, currentPrice: 30 })];
    const result = applyBulkSavings(products);

    expect(result[0].singleUnitPrice).toBe(4.49);
  });

  it('handles products with packSize of 1', () => {
    // ID 1 has packSize: 1 (already single)
    const products = [createMockProduct({ id: 1, currentPrice: 50 })];
    const result = applyBulkSavings(products);

    // Should not be marked as multi-pack
    expect(result[0].isMultiPack).toBe(false);
  });

  it('preserves other product properties', () => {
    const products = [createMockProduct({
      id: 35,
      currentPrice: 30,
      title: 'Gillette Razors',
      brand: 'Gillette',
      rating: 4.8,
    })];
    const result = applyBulkSavings(products);

    expect(result[0].title).toBe('Gillette Razors');
    expect(result[0].brand).toBe('Gillette');
    expect(result[0].rating).toBe(4.8);
  });

  it('processes multiple products correctly', () => {
    const products = [
      createMockProduct({ id: 35, currentPrice: 30 }), // Multi-pack
      createMockProduct({ id: 999, currentPrice: 50 }), // Not multi-pack
    ];
    const result = applyBulkSavings(products);

    expect(result[0].isMultiPack).toBe(true);
    expect(result[1].isMultiPack).toBe(false);
  });
});
