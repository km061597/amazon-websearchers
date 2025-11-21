/**
 * Deal Ranking Engine Tests
 */
import {
  calculateCategoryMedians,
  calculateDealScore,
  assignDealLabel,
  applyDealRankings,
} from '@/lib/dealRanking';
import { Product, CategoryMedians } from '@/lib/types';

// Mock product factory
function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: 'Test Product',
    brand: 'TestBrand',
    category: 'Grocery',
    currentPrice: 30,
    listPrice: 40,
    discount: 25,
    unitPrice: 2.5,
    unitType: 'oz',
    weight: '12oz',
    rating: 4.5,
    reviews: 1000,
    isPrime: true,
    isSponsored: false,
    subscribeSave: 10,
    dealScore: 0,
    hiddenGemScore: 50,
    image: 'test.jpg',
    isBestValue: false,
    isMultiPack: false,
    priceHistory: [],
    lowestHistoricalPrice: 25,
    highestHistoricalPrice: 45,
    averageHistoricalPrice: 35,
    ...overrides,
  };
}

describe('calculateCategoryMedians', () => {
  it('calculates median for odd number of products', () => {
    const products = [
      createMockProduct({ category: 'Grocery', unitPrice: 10 }),
      createMockProduct({ id: 2, category: 'Grocery', unitPrice: 20 }),
      createMockProduct({ id: 3, category: 'Grocery', unitPrice: 30 }),
    ];

    const medians = calculateCategoryMedians(products);
    expect(medians['Grocery']).toBe(20);
  });

  it('calculates median for even number of products', () => {
    const products = [
      createMockProduct({ category: 'Grocery', unitPrice: 10 }),
      createMockProduct({ id: 2, category: 'Grocery', unitPrice: 20 }),
      createMockProduct({ id: 3, category: 'Grocery', unitPrice: 30 }),
      createMockProduct({ id: 4, category: 'Grocery', unitPrice: 40 }),
    ];

    const medians = calculateCategoryMedians(products);
    expect(medians['Grocery']).toBe(25); // (20 + 30) / 2
  });

  it('handles multiple categories', () => {
    const products = [
      createMockProduct({ category: 'Grocery', unitPrice: 10 }),
      createMockProduct({ id: 2, category: 'Electronics', unitPrice: 100 }),
      createMockProduct({ id: 3, category: 'Electronics', unitPrice: 200 }),
    ];

    const medians = calculateCategoryMedians(products);
    expect(medians['Grocery']).toBe(10);
    expect(medians['Electronics']).toBe(150);
  });
});

describe('calculateDealScore', () => {
  const medians: CategoryMedians = { Grocery: 5.0 };

  it('calculates discount score correctly', () => {
    // 50% discount should give 15 points (50/100 * 30)
    const product = createMockProduct({
      discount: 50,
      unitPrice: 5,
      rating: 0,
      currentPrice: 100,
      averageHistoricalPrice: 50, // Above avg, no bonus
    });

    const score = calculateDealScore(product, medians);
    // 15 (discount) + 0 (unit price at median) + 0 (rating) + 0 (below avg)
    expect(score).toBe(15);
  });

  it('awards bonus for price below historical average', () => {
    const product = createMockProduct({
      discount: 0,
      unitPrice: 5,
      rating: 0,
      currentPrice: 20,
      averageHistoricalPrice: 30, // Below avg = +10 points
    });

    const score = calculateDealScore(product, medians);
    expect(score).toBe(10); // Only bonus points
  });

  it('calculates rating score correctly', () => {
    const product = createMockProduct({
      discount: 0,
      unitPrice: 5,
      rating: 5, // Perfect rating = 15 points (5/5 * 15)
      currentPrice: 100,
      averageHistoricalPrice: 50,
    });

    const score = calculateDealScore(product, medians);
    expect(score).toBe(15);
  });

  it('awards bulk savings points', () => {
    const product = createMockProduct({
      discount: 0,
      unitPrice: 5,
      rating: 0,
      currentPrice: 100,
      averageHistoricalPrice: 50,
      isMultiPack: true,
      bulkSavingsPercent: '50', // 50% = 10 points (50/100 * 20)
    });

    const score = calculateDealScore(product, medians);
    expect(score).toBe(10);
  });

  it('caps score at 100', () => {
    const product = createMockProduct({
      discount: 100,
      unitPrice: 0.1, // Way below median
      rating: 5,
      currentPrice: 10,
      averageHistoricalPrice: 100,
      isMultiPack: true,
      bulkSavingsPercent: '100',
    });

    const score = calculateDealScore(product, medians);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('assignDealLabel', () => {
  it('assigns TOP DEAL for score >= 80', () => {
    const product = createMockProduct();
    const label = assignDealLabel(product, 85);

    expect(label.text).toBe('TOP DEAL');
    expect(label.emoji).toBe('🔥');
  });

  it('assigns HIDDEN GEM for qualified products', () => {
    const product = createMockProduct({
      rating: 4.6,
      reviews: 2000, // Low reviews
    });
    const label = assignDealLabel(product, 65);

    expect(label.text).toBe('HIDDEN GEM');
    expect(label.emoji).toBe('💎');
  });

  it('assigns GOOD VALUE for score 60-79', () => {
    const product = createMockProduct({
      rating: 4.0,
      reviews: 10000, // High reviews (not hidden gem)
    });
    const label = assignDealLabel(product, 70);

    expect(label.text).toBe('GOOD VALUE');
    expect(label.emoji).toBe('✅');
  });

  it('assigns OVERPRICED for score < 50', () => {
    const product = createMockProduct();
    const label = assignDealLabel(product, 40);

    expect(label.text).toBe('OVERPRICED');
    expect(label.emoji).toBe('⚠️');
  });

  it('assigns DECENT VALUE for score 50-59', () => {
    const product = createMockProduct({
      rating: 4.0,
      reviews: 10000,
    });
    const label = assignDealLabel(product, 55);

    expect(label.text).toBe('DECENT VALUE');
    expect(label.emoji).toBe('📊');
  });
});

describe('applyDealRankings', () => {
  it('adds dealScore and dealLabel to products', () => {
    const products = [
      createMockProduct({ id: 1, discount: 50, rating: 4.8 }),
      createMockProduct({ id: 2, discount: 10, rating: 3.0 }),
    ];

    const ranked = applyDealRankings(products);

    expect(ranked[0].dealScore).toBeDefined();
    expect(ranked[0].dealLabel).toBeDefined();
    expect(ranked[1].dealScore).toBeDefined();
    expect(ranked[1].dealLabel).toBeDefined();
  });

  it('preserves original product data', () => {
    const products = [createMockProduct({ id: 1, title: 'Original Title' })];
    const ranked = applyDealRankings(products);

    expect(ranked[0].title).toBe('Original Title');
    expect(ranked[0].id).toBe(1);
  });
});
