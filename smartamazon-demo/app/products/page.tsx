'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, FilterState } from '@/lib/types';
import { fetchProducts } from '@/lib/api';
import { applyDealRankings } from '@/lib/dealRanking';
import { applyBulkSavings } from '@/lib/bulkSavings';
import { parseNaturalLanguageQuery, getParsedQuerySummary, ParsedQuery } from '@/lib/nluSearch';
import { getRecommendationsFromMultiple, RecommendedProduct } from '@/lib/recommendations';
import {
  getPriceAlerts,
  isProductTracked,
  toggleTracking,
  simulatePriceDropEvents,
  PriceAlert
} from '@/lib/priceAlerts';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { Recommendations } from '@/components/Recommendations';
import { PriceAlerts, AlertBadge } from '@/components/PriceAlerts';

export default function ProductsPage() {
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const [searchInput, setSearchInput] = useState('');
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [nluSummary, setNluSummary] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 1000,
    selectedCategories: [],
    showSponsored: true,
    primeOnly: false,
    bestValueOnly: false,
    minRating: 0
  });
  const [comparisonIds, setComparisonIds] = useState<number[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [trackedProductIds, setTrackedProductIds] = useState<Set<number>>(new Set());

  // Fetch products from API on mount
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch from backend API
        const products = await fetchProducts();

        // Apply deal ranking and bulk savings processing
        let processedProducts = applyBulkSavings(products);
        processedProducts = applyDealRankings(processedProducts);

        setAllProducts(processedProducts);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);

  // Initialize alerts after products load
  useEffect(() => {
    if (allProducts.length === 0) return;

    setAlerts(getPriceAlerts());

    // Build set of tracked product IDs
    const tracked = new Set<number>();
    allProducts.forEach(p => {
      if (isProductTracked(p.id)) tracked.add(p.id);
    });
    setTrackedProductIds(tracked);

    // Simulate price drops every 30 seconds (for demo purposes)
    const interval = setInterval(() => {
      const newAlerts = simulatePriceDropEvents(allProducts);
      if (newAlerts.length > 0) {
        setAlerts(getPriceAlerts());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [allProducts]);

  // Handle tracking toggle
  const handleToggleTracking = useCallback((productId: number) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const nowTracking = toggleTracking(productId, product.currentPrice);
    setTrackedProductIds(prev => {
      const next = new Set(prev);
      if (nowTracking) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  }, [allProducts]);

  // Refresh alerts
  const refreshAlerts = useCallback(() => {
    setAlerts(getPriceAlerts());
  }, []);

  // Handle search submission with NLU parsing
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setParsedQuery(null);
      setNluSummary('');
      return;
    }

    const parsed = parseNaturalLanguageQuery(query);
    setParsedQuery(parsed);
    setNluSummary(getParsedQuerySummary(parsed));

    // Auto-apply filters from NLU
    setFilters(prev => ({
      ...prev,
      minPrice: parsed.minPrice ?? prev.minPrice,
      maxPrice: parsed.maxPrice ?? prev.maxPrice,
      selectedCategories: parsed.categories ?? prev.selectedCategories,
      showSponsored: parsed.excludeSponsored ? false : prev.showSponsored,
      primeOnly: parsed.requirePrime ?? prev.primeOnly,
      minRating: parsed.minRating ?? prev.minRating,
    }));
  }, []);

  // Clear NLU filters
  const clearNluFilters = useCallback(() => {
    setParsedQuery(null);
    setNluSummary('');
    setSearchInput('');
    setFilters({
      minPrice: 0,
      maxPrice: 1000,
      selectedCategories: [],
      showSponsored: true,
      primeOnly: false,
      bestValueOnly: false,
      minRating: 0
    });
  }, []);

  // Filter and sort products based on search, filters, and NLU parsed query
  const filteredProducts = useMemo(() => {
    let results = allProducts.filter(product => {
      // Text search filter
      const searchTerm = parsedQuery?.searchTerm || searchInput;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        product.title.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Price filter
      if (product.currentPrice < filters.minPrice || product.currentPrice > filters.maxPrice) {
        return false;
      }

      // Category filter
      if (
        filters.selectedCategories.length > 0 &&
        !filters.selectedCategories.includes(product.category)
      ) {
        return false;
      }

      // Sponsored filter
      if (!filters.showSponsored && product.isSponsored) {
        return false;
      }

      // Prime filter
      if (filters.primeOnly && !product.isPrime) {
        return false;
      }

      // Best Value filter
      if (filters.bestValueOnly && !product.isBestValue) {
        return false;
      }

      // Rating filter
      if (product.rating < filters.minRating) {
        return false;
      }

      // NLU-specific filters
      if (parsedQuery) {
        // Brand filter
        if (parsedQuery.brand && !product.brand.toLowerCase().includes(parsedQuery.brand.toLowerCase())) {
          return false;
        }

        // Top Deal filter
        if (parsedQuery.requireTopDeal && product.dealLabel?.text !== 'TOP DEAL') {
          return false;
        }

        // Hidden Gem filter
        if (parsedQuery.requireHiddenGem && product.dealLabel?.text !== 'HIDDEN GEM') {
          return false;
        }

        // Good Value filter
        if (parsedQuery.requireGoodValue && product.dealLabel?.text !== 'GOOD VALUE') {
          return false;
        }
      }

      return true;
    });

    // Apply NLU-based sorting
    if (parsedQuery) {
      if (parsedQuery.sortCheapest) {
        results = results.sort((a, b) => a.currentPrice - b.currentPrice);
      } else if (parsedQuery.sortHighestRated) {
        results = results.sort((a, b) => b.rating - a.rating);
      } else if (parsedQuery.preferDealScore || parsedQuery.requireTopDeal) {
        results = results.sort((a, b) => b.dealScore - a.dealScore);
      } else if (parsedQuery.preferBulkSavings) {
        results = results.sort((a, b) => {
          if (a.isMultiPack && !b.isMultiPack) return -1;
          if (!a.isMultiPack && b.isMultiPack) return 1;
          const aPercent = parseFloat(a.bulkSavingsPercent || '0');
          const bPercent = parseFloat(b.bulkSavingsPercent || '0');
          return bPercent - aPercent;
        });
      }
    }

    return results;
  }, [allProducts, searchInput, filters, parsedQuery]);

  // Get products for comparison
  const comparisonProducts = useMemo(() => {
    return allProducts.filter(p => comparisonIds.includes(p.id));
  }, [allProducts, comparisonIds]);

  // Get recommendations based on comparison products
  const recommendations = useMemo(() => {
    if (comparisonProducts.length === 0) {
      return [];
    }
    return getRecommendationsFromMultiple(comparisonProducts, allProducts, 6);
  }, [comparisonProducts, allProducts]);

  // Toggle product in comparison
  const handleToggleComparison = (productId: number) => {
    if (comparisonIds.includes(productId)) {
      setComparisonIds(comparisonIds.filter(id => id !== productId));
    } else {
      if (comparisonIds.length < 4) {
        setComparisonIds([...comparisonIds, productId]);
      } else {
        alert('You can compare up to 4 products at a time');
      }
    }
  };

  // Remove product from comparison
  const handleRemoveFromComparison = (productId: number) => {
    setComparisonIds(comparisonIds.filter(id => id !== productId));
  };

  // Clear comparison
  const handleClearComparison = () => {
    setComparisonIds([]);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading products...</h2>
          <p className="text-gray-600">Fetching the best deals for you</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800 mb-4">
            SmartAmazon Search & Deal Intelligence
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Find true deals with intelligent price analysis | {allProducts.length} products loaded
          </p>

          {/* Smart Search Bar */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchInput)}
                  placeholder='Try: "best protein powder under $40" or "hidden gem electronics"'
                  className="w-full px-4 py-3 pr-24 text-lg border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={() => handleSearch(searchInput)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Smart Search
                </button>
              </div>
              {parsedQuery && (
                <button
                  onClick={clearNluFilters}
                  className="px-4 py-2 text-purple-600 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* NLU Summary Banner */}
            {nluSummary && (
              <div className="mt-4 bg-gradient-to-r from-purple-100 to-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 font-bold">Smart Search Applied:</span>
                  <span className="text-gray-700">{nluSummary}</span>
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          {filteredProducts.length !== allProducts.length && (
            <div className="text-gray-600">
              Showing <span className="font-bold text-purple-600">{filteredProducts.length}</span> of{' '}
              <span className="font-bold">{allProducts.length}</span> products
            </div>
          )}
        </header>

        {/* Price Alerts Panel */}
        {alerts.length > 0 && (
          <PriceAlerts alerts={alerts} onRefresh={refreshAlerts} />
        )}

        {/* Main Content */}
        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <div className="w-72 flex-shrink-0">
            <FilterSidebar filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search term
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={comparisonIds.includes(product.id)}
                    onToggleComparison={handleToggleComparison}
                    isTracking={trackedProductIds.has(product.id)}
                    onToggleTracking={handleToggleTracking}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Panel (shows when products are in comparison) */}
        {recommendations.length > 0 && comparisonProducts.length > 0 && (
          <div className="mt-8">
            <Recommendations
              sourceProduct={comparisonProducts[0]}
              recommendations={recommendations}
              onAddToComparison={handleToggleComparison}
            />
          </div>
        )}

        {/* Comparison Panel (fixed at bottom when products selected) */}
        {comparisonProducts.length > 0 && (
          <ComparisonPanel
            products={comparisonProducts}
            onRemove={handleRemoveFromComparison}
            onClose={handleClearComparison}
          />
        )}
      </div>
    </div>
  );
}
