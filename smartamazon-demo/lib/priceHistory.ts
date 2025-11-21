/**
 * Price History Generation Module
 * Generates realistic 6-month price history data for products
 */

import { PriceHistoryEntry } from './types';

/**
 * Generates realistic 6-month price history for a product
 *
 * Algorithm:
 * - Creates historical prices that trend from higher (near list price) to lower (current price)
 * - Adds random variation (15% of price range) for realism
 * - Ensures last month matches current price
 * - Keeps prices within reasonable bounds (95%-105% of range)
 *
 * @param currentPrice - The current price of the product
 * @param listPrice - The original list price of the product
 * @returns Array of 6 monthly price history entries
 */
export function generatePriceHistory(
  currentPrice: number,
  listPrice: number
): PriceHistoryEntry[] {
  const monthNames = [
    'Jun 2024',
    'Jul 2024',
    'Aug 2024',
    'Sep 2024',
    'Oct 2024',
    'Nov 2024'
  ];

  const history: PriceHistoryEntry[] = [];
  const priceRange = listPrice - currentPrice;
  const baseVariation = priceRange * 0.15; // 15% variation

  for (let i = 0; i < 6; i++) {
    let price: number;

    if (i === 5) {
      // Last month is current price
      price = currentPrice;
    } else {
      // Trending down from list price to current price
      const trendFactor = (5 - i) / 5; // 1.0 at month 0, 0.2 at month 4
      const randomVariation = (Math.random() - 0.5) * baseVariation;
      price = currentPrice + (priceRange * trendFactor * 0.7) + randomVariation;

      // Keep prices within reasonable bounds
      price = Math.max(
        currentPrice * 0.95,
        Math.min(listPrice * 1.05, price)
      );
    }

    history.push({
      month: monthNames[i],
      price: parseFloat(price.toFixed(2))
    });
  }

  return history;
}

/**
 * Calculates price statistics from price history
 *
 * @param priceHistory - Array of price history entries
 * @returns Object containing lowest, highest, and average prices
 */
export function calculatePriceStatistics(priceHistory: PriceHistoryEntry[]) {
  const prices = priceHistory.map(h => h.price);

  return {
    lowestHistoricalPrice: Math.min(...prices),
    highestHistoricalPrice: Math.max(...prices),
    averageHistoricalPrice: parseFloat(
      (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
    )
  };
}
