/**
 * Bulk Savings Calculation Module
 * Calculates savings for multi-pack products compared to single unit purchases
 */

import { Product } from './types';

/**
 * Multi-pack product configuration
 * Maps product IDs to their pack size and single unit price
 */
export const MULTI_PACK_CONFIG = [
  { id: 1, packSize: 1, singleUnitPrice: 54.99 },  // Already single
  { id: 2, packSize: 1, singleUnitPrice: 44.99 },
  { id: 32, packSize: 250, singleUnitPrice: 0.076 }, // Vitamin D3 - 250 count vs single
  { id: 34, packSize: 150, singleUnitPrice: 0.16 },  // Multivitamin - 150 count vs single
  { id: 35, packSize: 12, singleUnitPrice: 4.49 },   // Gillette razors - 12 pack vs single
  { id: 37, packSize: 6, singleUnitPrice: 2.99 },    // Oral-B floss - 6 pack vs single
  { id: 38, packSize: 50, singleUnitPrice: 0.26 },   // Neutrogena wipes - 50 count vs single
  { id: 39, packSize: 44, singleUnitPrice: 1.49 },   // Crest strips - 44 strips vs single
  { id: 41, packSize: 98, singleUnitPrice: 0.31 },   // Granola bars - 98 count vs single
  { id: 42, packSize: 40, singleUnitPrice: 0.99 },   // KIND bars - 40 count vs single
  { id: 44, packSize: 50, singleUnitPrice: 0.89 },   // Starbucks coffee - 50 count vs single
  { id: 45, packSize: 35, singleUnitPrice: 0.79 },   // Coca-Cola - 35 pack vs single
  { id: 24, packSize: 10, singleUnitPrice: 29.99 },  // Cookware set - 10 pieces vs single
  { id: 28, packSize: 2, singleUnitPrice: 13.99 },   // Curtains - 2 pack vs single
];

/**
 * Applies bulk savings data to products
 *
 * For multi-pack products:
 * - Calculates price per unit in the pack
 * - Compares to single unit price
 * - Calculates total savings and savings percentage
 *
 * @param products - Array of products to process
 * @returns Updated products array with bulk savings data
 */
export function applyBulkSavings(products: Product[]): Product[] {
  return products.map(product => {
    const multiPackInfo = MULTI_PACK_CONFIG.find(mp => mp.id === product.id);

    if (multiPackInfo && multiPackInfo.packSize > 1) {
      // Calculate per-unit price in the pack
      const pricePerUnit = product.currentPrice / multiPackInfo.packSize;

      // Calculate total cost if buying singles
      const singlePackTotal = multiPackInfo.singleUnitPrice * multiPackInfo.packSize;

      // Calculate savings
      const bulkSavings = singlePackTotal - product.currentPrice;
      const bulkSavingsPercent = ((bulkSavings / singlePackTotal) * 100).toFixed(0);

      return {
        ...product,
        isMultiPack: true,
        packSize: multiPackInfo.packSize,
        singleUnitPrice: multiPackInfo.singleUnitPrice,
        pricePerUnit,
        bulkSavings,
        bulkSavingsPercent
      };
    }

    return {
      ...product,
      isMultiPack: false
    };
  });
}
