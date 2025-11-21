/**
 * API Client for SmartAmazon Backend
 * Connects frontend to FastAPI backend
 */

import { Product } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Backend product response structure
 */
interface BackendProduct {
  asin: string;
  title: string;
  brand: string;
  category: string;
  current_price: string;
  list_price: string;
  unit_price: string;
  unit_type: string;
  quantity?: string;
  discount_pct: string;
  rating: string;
  review_count: number;
  image_url: string;
  amazon_url: string;
  is_prime: boolean;
  is_sponsored: boolean;
  subscribe_save_pct?: string;
  in_stock: boolean;
  hidden_gem_score: number;
  deal_quality_score: number;
  is_best_value?: boolean;
  savings_vs_category?: string;
}

interface SearchResponse {
  results: BackendProduct[];
  total: number;
  page: number;
  pages: number;
  sponsored_hidden: number;
  query: string;
}

interface PriceHistoryPoint {
  date: string;
  price: number;
}

interface PriceHistoryResponse {
  product_id: number;
  asin: string;
  title: string;
  current_price: number | null;
  history: PriceHistoryPoint[];
  statistics: {
    min_price: number;
    max_price: number;
    avg_price: number;
  };
}

/**
 * Maps backend product to frontend Product type
 */
function mapBackendProduct(backend: BackendProduct, index: number): Product {
  const currentPrice = parseFloat(backend.current_price) || 0;
  const listPrice = parseFloat(backend.list_price) || currentPrice;
  const unitPrice = parseFloat(backend.unit_price) || 0;
  const rating = parseFloat(backend.rating) || 0;
  const discount = parseFloat(backend.discount_pct) || 0;

  // Generate simulated price history for demo
  const priceHistory = generatePriceHistory(currentPrice, listPrice);

  return {
    id: index + 1,
    title: backend.title,
    brand: backend.brand,
    category: backend.category,
    currentPrice,
    listPrice,
    discount: Math.round(discount),
    unitPrice,
    unitType: backend.unit_type || 'unit',
    weight: backend.quantity ? `${backend.quantity}${backend.unit_type}` : 'N/A',
    rating,
    reviews: backend.review_count,
    isPrime: backend.is_prime,
    isSponsored: backend.is_sponsored,
    subscribeSave: backend.subscribe_save_pct ? parseFloat(backend.subscribe_save_pct) : 0,
    dealScore: backend.deal_quality_score || 0,
    hiddenGemScore: backend.hidden_gem_score || 0,
    image: backend.image_url || 'https://via.placeholder.com/300',
    isBestValue: backend.is_best_value || false,
    isMultiPack: false,
    priceHistory,
    lowestHistoricalPrice: Math.min(...priceHistory.map(p => p.price)),
    highestHistoricalPrice: Math.max(...priceHistory.map(p => p.price)),
    averageHistoricalPrice: priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length,
    // Add backend-specific fields
    asin: backend.asin,
    amazonUrl: backend.amazon_url,
  };
}

/**
 * Generate simulated price history for demo purposes
 */
function generatePriceHistory(currentPrice: number, listPrice: number): { date: string; price: number }[] {
  const history = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Simulate price fluctuation
    const variance = (Math.random() - 0.5) * 0.2;
    const basePrice = currentPrice + (listPrice - currentPrice) * 0.3;
    const price = Math.max(currentPrice * 0.9, basePrice * (1 + variance));

    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
    });
  }

  // Ensure current price is the last entry
  history[history.length - 1].price = currentPrice;

  return history;
}

/**
 * Fetch all products (searches with broad query)
 */
export async function fetchProducts(query: string = ''): Promise<Product[]> {
  try {
    // Use a broad search if no query provided
    const searchQuery = query || 'product';
    const url = `${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&hide_sponsored=false&limit=100`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: SearchResponse = await response.json();
    return data.results.map((product, index) => mapBackendProduct(product, index));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}

/**
 * Fetch a single product by ASIN
 */
export async function fetchProductById(asin: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/product/${asin}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API error: ${response.status}`);
    }

    const data: BackendProduct = await response.json();
    return mapBackendProduct(data, 0);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    throw error;
  }
}

/**
 * Search products with filters
 */
export async function searchProducts(params: {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  primeOnly?: boolean;
  hideSponsored?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; total: number; pages: number }> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('q', params.query || 'product');

    if (params.minPrice !== undefined) searchParams.set('min_price', params.minPrice.toString());
    if (params.maxPrice !== undefined) searchParams.set('max_price', params.maxPrice.toString());
    if (params.minRating !== undefined) searchParams.set('min_rating', params.minRating.toString());
    if (params.primeOnly) searchParams.set('prime_only', 'true');
    if (params.hideSponsored !== false) searchParams.set('hide_sponsored', 'true');
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/search?${searchParams}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: SearchResponse = await response.json();

    return {
      products: data.results.map((product, index) => mapBackendProduct(product, index)),
      total: data.total,
      pages: data.pages,
    };
  } catch (error) {
    console.error('Failed to search products:', error);
    throw error;
  }
}

/**
 * Fetch recommendations based on product ASINs
 */
export async function fetchRecommendations(asins: string[]): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asins),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.products || []).map((product: BackendProduct, index: number) =>
      mapBackendProduct(product, index)
    );
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return [];
  }
}

/**
 * Fetch price history for a product
 */
export async function fetchPriceHistory(productId: number, days: number = 30): Promise<PriceHistoryPoint[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/product/${productId}/price-history?days=${days}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: PriceHistoryResponse = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('Failed to fetch price history:', error);
    return [];
  }
}

/**
 * Get available categories
 */
export async function fetchCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

/**
 * Get available brands
 */
export async function fetchBrands(category?: string): Promise<string[]> {
  try {
    const url = category
      ? `${API_BASE_URL}/brands?category=${encodeURIComponent(category)}`
      : `${API_BASE_URL}/brands`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch brands:', error);
    return [];
  }
}

/**
 * Get recent price drops
 */
export async function fetchPriceDrops(minDropPercent: number = 10): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/price-drops?min_drop_percentage=${minDropPercent}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.products || []).map((product: BackendProduct, index: number) =>
      mapBackendProduct(product, index)
    );
  } catch (error) {
    console.error('Failed to fetch price drops:', error);
    return [];
  }
}
