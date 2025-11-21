/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEAL RANKING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This engine calculates a comprehensive deal score for each product based on:
 *
 * 1. Discount Percentage (0-30 points)
 *    - Higher discount = better deal
 *    - Formula: (discount% / 100) * 30
 *    - Example: 25% off = 7.5 points
 *
 * 2. Unit Price vs Category Median (0-25 points)
 *    - Lower unit price compared to category = better deal
 *    - Formula: 25 * (1 - (unitPrice / categoryMedian))
 *    - Capped at 25 points (can't be negative)
 *    - Example: If product is 20% below median = 5 points
 *
 * 3. Bulk Savings Percentage (0-20 points, if applicable)
 *    - Higher bulk savings = better deal
 *    - Formula: (bulkSavings% / 100) * 20
 *    - Example: 30% bulk savings = 6 points
 *
 * 4. Customer Rating (0-15 points)
 *    - Higher rating = better quality deal
 *    - Formula: (rating / 5) * 15
 *    - Example: 4.5 stars = 13.5 points
 *
 * 5. Price Below Historical Average (0-10 points)
 *    - Current price below 6-month average = bonus points
 *    - Formula: 10 points if below average, 0 if above
 *
 * TOTAL SCORE: 0-100 points
 *
 * Deal Labels:
 * - 🔥 Top Deal:     Score ≥ 80 (exceptional value)
 * - ✅ Good Value:   Score 60-79 (solid deal)
 * - 💎 Hidden Gem:   Score 50-79 AND rating ≥ 4.5 AND low reviews (<5000)
 * - ⚠️ Overpriced:  Score < 50 (below average value)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Product, CategoryMedians, DealLabel } from './types';

const CATEGORIES = [
  'Grocery',
  'Electronics',
  'Home & Kitchen',
  'Health & Personal Care',
  'Sports & Outdoors'
];

/**
 * Calculates median unit prices for each category
 *
 * @param products - Array of all products
 * @returns Object mapping category names to median unit prices
 */
export function calculateCategoryMedians(products: Product[]): CategoryMedians {
  const medians: CategoryMedians = {};

  CATEGORIES.forEach(category => {
    const categoryProducts = products.filter(p => p.category === category);
    const unitPrices = categoryProducts
      .map(p => p.unitPrice)
      .sort((a, b) => a - b);

    const midIndex = Math.floor(unitPrices.length / 2);

    if (unitPrices.length % 2 === 0) {
      medians[category] = (unitPrices[midIndex - 1] + unitPrices[midIndex]) / 2;
    } else {
      medians[category] = unitPrices[midIndex];
    }
  });

  return medians;
}

/**
 * Calculates comprehensive deal score for a product
 *
 * @param product - Product to score
 * @param categoryMedians - Median unit prices by category
 * @returns Deal score from 0-100
 */
export function calculateDealScore(
  product: Product,
  categoryMedians: CategoryMedians
): number {
  let score = 0;

  // 1. Discount Percentage (0-30 points)
  const discountScore = (product.discount / 100) * 30;
  score += discountScore;

  // 2. Unit Price vs Category Median (0-25 points)
  const categoryMedian = categoryMedians[product.category];
  if (categoryMedian) {
    const priceRatio = product.unitPrice / categoryMedian;
    const priceScore = Math.max(0, 25 * (1 - priceRatio));
    score += priceScore;
  }

  // 3. Bulk Savings (0-20 points, if applicable)
  if (product.isMultiPack && product.bulkSavingsPercent) {
    const bulkScore = (parseFloat(product.bulkSavingsPercent) / 100) * 20;
    score += bulkScore;
  }

  // 4. Customer Rating (0-15 points)
  const ratingScore = (product.rating / 5) * 15;
  score += ratingScore;

  // 5. Price Below Historical Average (0-10 points)
  if (product.currentPrice < product.averageHistoricalPrice) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Assigns a deal label based on product score and attributes
 *
 * @param product - Product to label
 * @param dealScore - Calculated deal score
 * @returns DealLabel object with emoji, text, color, and description
 */
export function assignDealLabel(product: Product, dealScore: number): DealLabel {
  // 🔥 Top Deal: Score ≥ 80 (exceptional value)
  if (dealScore >= 80) {
    return {
      emoji: '🔥',
      text: 'TOP DEAL',
      color: '#ff4757',
      description: 'Exceptional value - best price and quality!'
    };
  }

  // 💎 Hidden Gem: Score 50-79 AND rating ≥ 4.5 AND low reviews (<5000)
  if (dealScore >= 50 && dealScore < 80 && product.rating >= 4.5 && product.reviews < 5000) {
    return {
      emoji: '💎',
      text: 'HIDDEN GEM',
      color: '#5f27cd',
      description: 'Great quality, under the radar!'
    };
  }

  // ✅ Good Value: Score 60-79 (solid deal)
  if (dealScore >= 60 && dealScore < 80) {
    return {
      emoji: '✅',
      text: 'GOOD VALUE',
      color: '#26de81',
      description: 'Solid deal with good pricing'
    };
  }

  // ⚠️ Overpriced: Score < 50 (below average value)
  if (dealScore < 50) {
    return {
      emoji: '⚠️',
      text: 'OVERPRICED',
      color: '#fed330',
      description: 'Price may be higher than average'
    };
  }

  // Default: Decent Value (Score 50-59)
  return {
    emoji: '📊',
    text: 'DECENT VALUE',
    color: '#778ca3',
    description: 'Fair pricing'
  };
}

/**
 * Applies deal rankings to all products
 *
 * @param products - Array of products to rank
 * @returns Updated products array with dealScore and dealLabel
 */
export function applyDealRankings(products: Product[]): Product[] {
  const categoryMedians = calculateCategoryMedians(products);

  return products.map(product => {
    const dealScore = calculateDealScore(product, categoryMedians);
    const dealLabel = assignDealLabel(product, dealScore);

    return {
      ...product,
      dealScore,
      dealLabel
    };
  });
}
