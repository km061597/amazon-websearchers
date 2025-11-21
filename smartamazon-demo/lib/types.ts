/**
 * SmartAmazon Product Types
 * TypeScript interfaces for the SmartAmazon demo application
 */

export interface PriceHistoryEntry {
  date: string;
  price: number;
}

export interface DealLabel {
  emoji: string;
  text: string;
  color: string;
  description: string;
}

export interface Product {
  id: number;
  asin?: string;
  amazonUrl?: string;
  title: string;
  brand: string;
  category: string;
  currentPrice: number;
  listPrice: number;
  unitPrice: number;
  unitType: string;
  weight: string;
  discount: number;
  rating: number;
  reviews: number;
  isPrime: boolean;
  isSponsored: boolean;
  subscribeSave: number;
  hiddenGemScore: number;
  dealScore: number;
  isBestValue: boolean;
  image: string;

  // Price history
  priceHistory: PriceHistoryEntry[];
  lowestHistoricalPrice: number;
  highestHistoricalPrice: number;
  averageHistoricalPrice: number;

  // Bulk savings (optional)
  isMultiPack: boolean;
  packSize?: number;
  singleUnitPrice?: number;
  pricePerUnit?: number;
  bulkSavings?: number;
  bulkSavingsPercent?: string;

  // Deal label (added by ranking engine)
  dealLabel?: DealLabel;
}

export interface CategoryMedians {
  [category: string]: number;
}

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  selectedCategories: string[];
  showSponsored: boolean;
  primeOnly: boolean;
  bestValueOnly: boolean;
  minRating: number;
}

export interface ComparisonState {
  selectedProductIds: number[];
  maxSelections: number;
}

export type SortOption = 'default' | 'price-low' | 'price-high' | 'rating' | 'discount' | 'deal-score';
