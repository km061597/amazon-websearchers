/**
 * Recommendation Engine Tests
 */
import {
  computeSimilarity,
  computeSimilarityBreakdown,
  getRecommendations,
  getRecommendationsFromMultiple,
  getRecommendationReason,
} from '@/lib/recommendations';
import { Product } from '@/lib/types';

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
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

describe('computeSimilarity', () => {
  it('returns 0 for same product', () => {
    const product = createMockProduct({ id: 1 });
    const score = computeSimilarity(product, product);
    expect(score).toBe(0);
  });

  it('awards 30 points for same category', () => {
    const productA = createMockProduct({ id: 1, category: 'Grocery' });
    const productB = createMockProduct({
      id: 2,
      category: 'Grocery',
      brand: 'Other',
      currentPrice: 1000, // Different price
      rating: 1, // Different rating
      dealScore: 0,
      isMultiPack: true,
      unitType: 'lb',
    });

    const score = computeSimilarity(productA, productB);
    // Should have ~30 from category, some from other factors
    expect(score).toBeGreaterThanOrEqual(30);
  });

  it('awards 10 points for same brand', () => {
    const productA = createMockProduct({ id: 1, brand: 'TestBrand' });
    const productB = createMockProduct({
      id: 2,
      brand: 'TestBrand',
      category: 'Electronics', // Different category
    });

    const score = computeSimilarity(productA, productB);
    // Should include 10 from brand match
    expect(score).toBeGreaterThanOrEqual(10);
  });

  it('gives higher score for similar prices', () => {
    const productA = createMockProduct({ id: 1, currentPrice: 50 });
    const productSimilarPrice = createMockProduct({ id: 2, currentPrice: 55 });
    const productDifferentPrice = createMockProduct({ id: 3, currentPrice: 500 });

    const scoreSimilar = computeSimilarity(productA, productSimilarPrice);
    const scoreDifferent = computeSimilarity(productA, productDifferentPrice);

    expect(scoreSimilar).toBeGreaterThan(scoreDifferent);
  });

  it('gives higher score for similar ratings', () => {
    const productA = createMockProduct({ id: 1, rating: 4.5 });
    const productSimilarRating = createMockProduct({ id: 2, rating: 4.3 });
    const productDifferentRating = createMockProduct({ id: 3, rating: 1.0 });

    const scoreSimilar = computeSimilarity(productA, productSimilarRating);
    const scoreDifferent = computeSimilarity(productA, productDifferentRating);

    expect(scoreSimilar).toBeGreaterThan(scoreDifferent);
  });

  it('awards 5 points for matching multi-pack status', () => {
    const productA = createMockProduct({ id: 1, isMultiPack: true });
    const productB = createMockProduct({ id: 2, isMultiPack: true });
    const productC = createMockProduct({ id: 3, isMultiPack: false });

    const scoreMatch = computeSimilarity(productA, productB);
    const scoreMismatch = computeSimilarity(productA, productC);

    // Difference should be ~5 points
    expect(scoreMatch - scoreMismatch).toBeCloseTo(5, 0);
  });
});

describe('computeSimilarityBreakdown', () => {
  it('returns zeroes for same product', () => {
    const product = createMockProduct({ id: 1 });
    const breakdown = computeSimilarityBreakdown(product, product);

    expect(breakdown.totalScore).toBe(0);
    expect(breakdown.categoryMatch).toBe(0);
    expect(breakdown.brandMatch).toBe(0);
  });

  it('breaks down all factors', () => {
    const productA = createMockProduct({ id: 1 });
    const productB = createMockProduct({ id: 2 });
    const breakdown = computeSimilarityBreakdown(productA, productB);

    expect(breakdown.categoryMatch).toBeDefined();
    expect(breakdown.priceProximity).toBeDefined();
    expect(breakdown.ratingProximity).toBeDefined();
    expect(breakdown.dealScoreProximity).toBeDefined();
    expect(breakdown.brandMatch).toBeDefined();
    expect(breakdown.unitPriceProximity).toBeDefined();
    expect(breakdown.bulkSavingsMatch).toBeDefined();
    expect(breakdown.totalScore).toBeDefined();
  });

  it('totalScore equals sum of all factors', () => {
    const productA = createMockProduct({ id: 1 });
    const productB = createMockProduct({ id: 2, category: 'Electronics' });
    const breakdown = computeSimilarityBreakdown(productA, productB);

    const sum =
      breakdown.categoryMatch +
      breakdown.priceProximity +
      breakdown.ratingProximity +
      breakdown.dealScoreProximity +
      breakdown.brandMatch +
      breakdown.unitPriceProximity +
      breakdown.bulkSavingsMatch;

    expect(breakdown.totalScore).toBe(sum);
  });
});

describe('getRecommendations', () => {
  it('excludes source product from recommendations', () => {
    const source = createMockProduct({ id: 1 });
    const products = [
      source,
      createMockProduct({ id: 2 }),
      createMockProduct({ id: 3 }),
    ];

    const recommendations = getRecommendations(source, products);
    const ids = recommendations.map(r => r.id);

    expect(ids).not.toContain(1);
  });

  it('returns products sorted by similarity descending', () => {
    const source = createMockProduct({ id: 1, category: 'Grocery', currentPrice: 50 });
    const products = [
      source,
      createMockProduct({ id: 2, category: 'Grocery', currentPrice: 55 }), // Similar
      createMockProduct({ id: 3, category: 'Electronics', currentPrice: 500 }), // Different
    ];

    const recommendations = getRecommendations(source, products);

    expect(recommendations[0].id).toBe(2);
    expect(recommendations[0].similarityScore).toBeGreaterThan(recommendations[1]?.similarityScore || 0);
  });

  it('respects limit parameter', () => {
    const source = createMockProduct({ id: 1 });
    const products = [
      source,
      createMockProduct({ id: 2 }),
      createMockProduct({ id: 3 }),
      createMockProduct({ id: 4 }),
      createMockProduct({ id: 5 }),
    ];

    const recommendations = getRecommendations(source, products, 2);
    expect(recommendations.length).toBe(2);
  });

  it('defaults to limit of 6', () => {
    const source = createMockProduct({ id: 1 });
    const products = [source];
    for (let i = 2; i <= 10; i++) {
      products.push(createMockProduct({ id: i }));
    }

    const recommendations = getRecommendations(source, products);
    expect(recommendations.length).toBe(6);
  });
});

describe('getRecommendationsFromMultiple', () => {
  it('returns empty array for empty source', () => {
    const products = [createMockProduct({ id: 1 })];
    const recommendations = getRecommendationsFromMultiple([], products);
    expect(recommendations).toEqual([]);
  });

  it('excludes all source products', () => {
    const source1 = createMockProduct({ id: 1 });
    const source2 = createMockProduct({ id: 2 });
    const products = [
      source1,
      source2,
      createMockProduct({ id: 3 }),
      createMockProduct({ id: 4 }),
    ];

    const recommendations = getRecommendationsFromMultiple([source1, source2], products);
    const ids = recommendations.map(r => r.id);

    expect(ids).not.toContain(1);
    expect(ids).not.toContain(2);
  });

  it('aggregates similarity across multiple sources', () => {
    const source1 = createMockProduct({ id: 1, category: 'Grocery' });
    const source2 = createMockProduct({ id: 2, category: 'Grocery' });
    const products = [
      source1,
      source2,
      createMockProduct({ id: 3, category: 'Grocery' }), // Matches both
      createMockProduct({ id: 4, category: 'Electronics' }), // Matches neither
    ];

    const recommendations = getRecommendationsFromMultiple([source1, source2], products);

    expect(recommendations[0].id).toBe(3);
  });
});

describe('getRecommendationReason', () => {
  it('mentions same category', () => {
    const source = createMockProduct({ id: 1, category: 'Grocery' });
    const recommended = createMockProduct({ id: 2, category: 'Grocery' });

    const reason = getRecommendationReason(source, recommended);
    expect(reason).toContain('Same category');
    expect(reason).toContain('Grocery');
  });

  it('mentions same brand', () => {
    const source = createMockProduct({ id: 1, brand: 'TestBrand' });
    const recommended = createMockProduct({ id: 2, brand: 'TestBrand' });

    const reason = getRecommendationReason(source, recommended);
    expect(reason).toContain('Same brand');
    expect(reason).toContain('TestBrand');
  });

  it('returns default message when no strong matches', () => {
    const source = createMockProduct({
      id: 1,
      category: 'Grocery',
      brand: 'BrandA',
      currentPrice: 10,
      rating: 5,
      dealScore: 100,
    });
    const recommended = createMockProduct({
      id: 2,
      category: 'Electronics',
      brand: 'BrandB',
      currentPrice: 1000,
      rating: 1,
      dealScore: 0,
    });

    const reason = getRecommendationReason(source, recommended);
    expect(reason).toBe('You might also like');
  });
});
