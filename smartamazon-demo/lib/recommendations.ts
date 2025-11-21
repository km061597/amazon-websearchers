/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RECOMMENDATION ENGINE
 * Similarity-Based Product Recommendations for SmartAmazon
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This module provides a lightweight client-side similarity engine that
 * recommends products based on multiple weighted factors.
 *
 * SIMILARITY FACTORS & WEIGHTS:
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Category Match (30 points)     - Same category = full points
 * 2. Price Proximity (20 points)    - Closer price = more points
 * 3. Rating Proximity (15 points)   - Similar rating = more points
 * 4. Deal Score Proximity (15 points) - Similar deal score = more points
 * 5. Brand Match (10 points)        - Same brand = full points
 * 6. Unit Price Proximity (5 points) - Similar unit price = more points
 * 7. Bulk Savings Match (5 points)  - Both multi-pack or both single = points
 *
 * TOTAL SIMILARITY SCORE: 0-100 points
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Product } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// WEIGHT CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Similarity weights for each factor
 * Total should sum to 100 for percentage-based scoring
 */
const WEIGHTS = {
  CATEGORY_MATCH: 30,      // Highest - same category is most important
  PRICE_PROXIMITY: 20,     // Price range similarity
  RATING_PROXIMITY: 15,    // Similar quality rating
  DEAL_SCORE_PROXIMITY: 15, // Similar deal value
  BRAND_MATCH: 10,         // Same brand preference
  UNIT_PRICE_PROXIMITY: 5, // Similar unit pricing
  BULK_SAVINGS_MATCH: 5,   // Similar pack type
};

/**
 * Maximum price difference considered for similarity
 * Products with price difference > this are considered dissimilar
 */
const MAX_PRICE_DIFF = 500;

/**
 * Maximum unit price difference for comparison
 */
const MAX_UNIT_PRICE_DIFF = 50;

// ═══════════════════════════════════════════════════════════════════════════
// SIMILARITY COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Computes similarity score between two products
 *
 * @param productA - Source product
 * @param productB - Product to compare against
 * @returns Similarity score from 0-100
 *
 * @example
 * const similarity = computeSimilarity(proteinPowder1, proteinPowder2);
 * // Returns ~85 if same category, similar price, similar rating
 */
export function computeSimilarity(productA: Product, productB: Product): number {
  // Don't compare product to itself
  if (productA.id === productB.id) {
    return 0;
  }

  let score = 0;

  // 1. Category Match (30 points)
  // Same category = full points, different = 0
  if (productA.category === productB.category) {
    score += WEIGHTS.CATEGORY_MATCH;
  }

  // 2. Price Proximity (20 points)
  // Closer prices = higher score, using exponential decay
  const priceDiff = Math.abs(productA.currentPrice - productB.currentPrice);
  const priceScore = Math.max(0, 1 - (priceDiff / MAX_PRICE_DIFF));
  score += WEIGHTS.PRICE_PROXIMITY * priceScore;

  // 3. Rating Proximity (15 points)
  // Rating is on 1-5 scale, so max diff is 4
  const ratingDiff = Math.abs(productA.rating - productB.rating);
  const ratingScore = Math.max(0, 1 - (ratingDiff / 4));
  score += WEIGHTS.RATING_PROXIMITY * ratingScore;

  // 4. Deal Score Proximity (15 points)
  // Deal score is 0-100, normalize the difference
  const dealScoreDiff = Math.abs(productA.dealScore - productB.dealScore);
  const dealScoreScore = Math.max(0, 1 - (dealScoreDiff / 100));
  score += WEIGHTS.DEAL_SCORE_PROXIMITY * dealScoreScore;

  // 5. Brand Match (10 points)
  // Same brand = full points
  if (productA.brand.toLowerCase() === productB.brand.toLowerCase()) {
    score += WEIGHTS.BRAND_MATCH;
  }

  // 6. Unit Price Proximity (5 points)
  // Only compare if same unit type, otherwise partial points
  if (productA.unitType === productB.unitType) {
    const unitPriceDiff = Math.abs(productA.unitPrice - productB.unitPrice);
    const unitPriceScore = Math.max(0, 1 - (unitPriceDiff / MAX_UNIT_PRICE_DIFF));
    score += WEIGHTS.UNIT_PRICE_PROXIMITY * unitPriceScore;
  } else {
    // Different unit types get partial credit (50%)
    score += WEIGHTS.UNIT_PRICE_PROXIMITY * 0.5;
  }

  // 7. Bulk Savings Match (5 points)
  // Both multi-pack or both single = full points
  if (productA.isMultiPack === productB.isMultiPack) {
    score += WEIGHTS.BULK_SAVINGS_MATCH;
  }

  return Math.round(score);
}

/**
 * Detailed similarity breakdown for debugging/display
 */
export interface SimilarityBreakdown {
  categoryMatch: number;
  priceProximity: number;
  ratingProximity: number;
  dealScoreProximity: number;
  brandMatch: number;
  unitPriceProximity: number;
  bulkSavingsMatch: number;
  totalScore: number;
}

/**
 * Computes detailed similarity breakdown between two products
 * Useful for debugging or showing users why a product was recommended
 *
 * @param productA - Source product
 * @param productB - Product to compare against
 * @returns Detailed breakdown of similarity factors
 */
export function computeSimilarityBreakdown(
  productA: Product,
  productB: Product
): SimilarityBreakdown {
  if (productA.id === productB.id) {
    return {
      categoryMatch: 0,
      priceProximity: 0,
      ratingProximity: 0,
      dealScoreProximity: 0,
      brandMatch: 0,
      unitPriceProximity: 0,
      bulkSavingsMatch: 0,
      totalScore: 0,
    };
  }

  const categoryMatch = productA.category === productB.category ? WEIGHTS.CATEGORY_MATCH : 0;

  const priceDiff = Math.abs(productA.currentPrice - productB.currentPrice);
  const priceProximity = Math.round(WEIGHTS.PRICE_PROXIMITY * Math.max(0, 1 - (priceDiff / MAX_PRICE_DIFF)));

  const ratingDiff = Math.abs(productA.rating - productB.rating);
  const ratingProximity = Math.round(WEIGHTS.RATING_PROXIMITY * Math.max(0, 1 - (ratingDiff / 4)));

  const dealScoreDiff = Math.abs(productA.dealScore - productB.dealScore);
  const dealScoreProximity = Math.round(WEIGHTS.DEAL_SCORE_PROXIMITY * Math.max(0, 1 - (dealScoreDiff / 100)));

  const brandMatch = productA.brand.toLowerCase() === productB.brand.toLowerCase() ? WEIGHTS.BRAND_MATCH : 0;

  let unitPriceProximity: number;
  if (productA.unitType === productB.unitType) {
    const unitPriceDiff = Math.abs(productA.unitPrice - productB.unitPrice);
    unitPriceProximity = Math.round(WEIGHTS.UNIT_PRICE_PROXIMITY * Math.max(0, 1 - (unitPriceDiff / MAX_UNIT_PRICE_DIFF)));
  } else {
    unitPriceProximity = Math.round(WEIGHTS.UNIT_PRICE_PROXIMITY * 0.5);
  }

  const bulkSavingsMatch = productA.isMultiPack === productB.isMultiPack ? WEIGHTS.BULK_SAVINGS_MATCH : 0;

  const totalScore = categoryMatch + priceProximity + ratingProximity +
    dealScoreProximity + brandMatch + unitPriceProximity + bulkSavingsMatch;

  return {
    categoryMatch,
    priceProximity,
    ratingProximity,
    dealScoreProximity,
    brandMatch,
    unitPriceProximity,
    bulkSavingsMatch,
    totalScore,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDATION GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Product with similarity score attached
 */
export interface RecommendedProduct extends Product {
  similarityScore: number;
}

/**
 * Gets recommended products similar to the source product
 *
 * @param sourceProduct - Product to base recommendations on
 * @param allProducts - Pool of products to recommend from
 * @param limit - Maximum number of recommendations (default: 6)
 * @returns Array of recommended products sorted by similarity (highest first)
 *
 * @example
 * const recommendations = getRecommendations(selectedProduct, allProducts, 6);
 * // Returns 6 most similar products
 */
export function getRecommendations(
  sourceProduct: Product,
  allProducts: Product[],
  limit: number = 6
): RecommendedProduct[] {
  // Score all other products
  const scoredProducts = allProducts
    .filter(p => p.id !== sourceProduct.id) // Exclude source
    .map(product => ({
      ...product,
      similarityScore: computeSimilarity(sourceProduct, product),
    }));

  // Sort by similarity descending
  scoredProducts.sort((a, b) => b.similarityScore - a.similarityScore);

  // Return top N
  return scoredProducts.slice(0, limit);
}

/**
 * Gets recommendations based on multiple source products (e.g., comparison list)
 * Aggregates similarity scores across all source products
 *
 * @param sourceProducts - Array of products to base recommendations on
 * @param allProducts - Pool of products to recommend from
 * @param limit - Maximum number of recommendations (default: 6)
 * @returns Array of recommended products sorted by aggregate similarity
 */
export function getRecommendationsFromMultiple(
  sourceProducts: Product[],
  allProducts: Product[],
  limit: number = 6
): RecommendedProduct[] {
  if (sourceProducts.length === 0) {
    return [];
  }

  // Get source product IDs to exclude
  const sourceIds = new Set(sourceProducts.map(p => p.id));

  // Score all other products against all source products
  const aggregatedScores = new Map<number, { product: Product; totalScore: number }>();

  for (const candidate of allProducts) {
    if (sourceIds.has(candidate.id)) continue;

    let totalScore = 0;
    for (const source of sourceProducts) {
      totalScore += computeSimilarity(source, candidate);
    }

    // Average the score across source products
    const avgScore = Math.round(totalScore / sourceProducts.length);

    aggregatedScores.set(candidate.id, {
      product: candidate,
      totalScore: avgScore,
    });
  }

  // Convert to array and sort
  const recommendations = Array.from(aggregatedScores.values())
    .map(({ product, totalScore }) => ({
      ...product,
      similarityScore: totalScore,
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore);

  return recommendations.slice(0, limit);
}

/**
 * Gets a human-readable explanation for why a product was recommended
 *
 * @param sourceProduct - Original product
 * @param recommendedProduct - Product being recommended
 * @returns Human-readable reason string
 */
export function getRecommendationReason(
  sourceProduct: Product,
  recommendedProduct: Product
): string {
  const breakdown = computeSimilarityBreakdown(sourceProduct, recommendedProduct);
  const reasons: string[] = [];

  if (breakdown.categoryMatch > 0) {
    reasons.push(`Same category (${sourceProduct.category})`);
  }

  if (breakdown.brandMatch > 0) {
    reasons.push(`Same brand (${sourceProduct.brand})`);
  }

  if (breakdown.priceProximity >= WEIGHTS.PRICE_PROXIMITY * 0.7) {
    reasons.push('Similar price range');
  }

  if (breakdown.ratingProximity >= WEIGHTS.RATING_PROXIMITY * 0.8) {
    reasons.push('Similar rating');
  }

  if (breakdown.dealScoreProximity >= WEIGHTS.DEAL_SCORE_PROXIMITY * 0.8) {
    reasons.push('Similar deal value');
  }

  if (reasons.length === 0) {
    return 'You might also like';
  }

  return reasons.slice(0, 2).join(' • ');
}
