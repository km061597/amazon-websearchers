/**
 * Product Initialization Module
 * Processes raw product data to add price history, bulk savings, and deal rankings
 */

import { Product } from './types';
import { RAW_PRODUCTS } from './mockProducts';
import { generatePriceHistory, calculatePriceStatistics } from './priceHistory';
import { applyBulkSavings } from './bulkSavings';
import { applyDealRankings } from './dealRanking';

/**
 * Initializes all products with calculated data
 *
 * Process:
 * 1. Generate price history for each product
 * 2. Calculate price statistics (lowest, highest, average)
 * 3. Apply bulk savings data for multi-pack products
 * 4. Calculate deal scores and assign deal labels
 *
 * @returns Fully initialized array of products
 */
export function initializeProducts(): Product[] {
  // Step 1: Add price history to all products
  const productsWithHistory = RAW_PRODUCTS.map(product => {
    const priceHistory = generatePriceHistory(product.currentPrice, product.listPrice);
    const stats = calculatePriceStatistics(priceHistory);

    return {
      ...product,
      priceHistory,
      ...stats
    } as Product;
  });

  // Step 2: Apply bulk savings data
  const productsWithBulkSavings = applyBulkSavings(productsWithHistory);

  // Step 3: Apply deal rankings and labels
  const fullyInitializedProducts = applyDealRankings(productsWithBulkSavings);

  return fullyInitializedProducts;
}

/**
 * Get initialized products (singleton pattern for performance)
 */
let cachedProducts: Product[] | null = null;

export function getProducts(): Product[] {
  if (!cachedProducts) {
    cachedProducts = initializeProducts();
  }
  return cachedProducts;
}

/**
 * Reset the product cache (useful for testing or re-initialization)
 */
export function resetProductCache(): void {
  cachedProducts = null;
}
