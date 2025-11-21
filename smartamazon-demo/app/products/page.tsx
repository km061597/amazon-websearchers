'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, FilterState } from '@/lib/types';
import { fetchProducts, SORT_OPTIONS, PaginatedProducts } from '@/lib/api';
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
import { useToast } from '@/components/Toast';
import { LoadingSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ProductsPage() {
  const { showToast } = useToast();

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortBy, setSortBy] = useState('hidden_gem_desc');
  const ITEMS_PER_PAGE = 20;

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

  // Fetch products from API
  const loadProducts = useCallback(async (page: number, sort: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchProducts({
        page,
        limit: ITEMS_PER_PAGE,
        sort,
      });

      // Apply deal ranking and bulk savings processing
      let processedProducts = applyBulkSavings(result.products);
      processedProducts = applyDealRankings(processedProducts);

      setAllProducts(processedProducts);
      setTotalPages(result.pages);
      setTotalProducts(result.total);
      setCurrentPage(result.page);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again later.');
      showToast('Failed to load products. Check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProducts(1, sortBy);
  }, []);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadProducts(newPage, sortBy);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    loadProducts(1, newSort);
  };

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading products...</h2>
            <p className="text-gray-600">Fetching the best deals for you</p>
          </div>
          <LoadingSkeleton count={6} />
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800 mb-2 md:mb-4">
            SmartAmazon Search & Deal Intelligence
          </h1>
          <p className="text-sm md:text-lg text-gray-600 mb-4 md:mb-6">
            Find true deals with intelligent price analysis | {allProducts.length} products loaded
          </p>

          {/* Smart Search Bar */}
          <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchInput)}
                  placeholder='Try: "protein under $40" or "hidden gem"'
                  className="w-full px-4 py-3 text-base md:text-lg border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSearch(searchInput)}
                  className="flex-1 md:flex-none bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 md:px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
                {parsedQuery && (
                  <button
                    onClick={clearNluFilters}
                    className="px-4 py-2 text-purple-600 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
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

          {/* Results Count + Sort + Mobile Filters Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden px-3 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium"
              >
                Filters
              </button>
              <div className="text-sm md:text-base text-gray-600">
                <span className="font-bold text-purple-600">{filteredProducts.length}</span> of{' '}
                <span className="font-bold">{totalProducts}</span> products
                {totalPages > 1 && (
                  <span className="hidden sm:inline ml-2">(Page {currentPage}/{totalPages})</span>
                )}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-gray-600 font-medium text-sm hidden sm:inline">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 text-sm border-2 border-purple-200 rounded-lg bg-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {Object.entries(SORT_OPTIONS).map(([key, { label, value }]) => (
                  <option key={key} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Price Alerts Panel */}
        {alerts.length > 0 && (
          <PriceAlerts alerts={alerts} onRefresh={refreshAlerts} />
        )}

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
          {/* Sidebar - Hidden on mobile unless toggled */}
          <div className={`w-full lg:w-72 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <FilterSidebar filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Products Grid */}
          <div className="flex-1 w-full">
            {filteredProducts.length === 0 ? (
              <EmptyState
                title="No products found"
                description="Try adjusting your filters or search term"
                icon="search"
                action={{ label: 'Clear Filters', onClick: clearNluFilters }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-2 md:gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Prev
                </button>

                <div className="flex items-center gap-1 md:gap-2">
                  {/* Page numbers - show fewer on mobile */}
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-lg font-semibold text-sm md:text-base transition-colors ${
                          currentPage === pageNum
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-purple-600 border-2 border-purple-200 hover:bg-purple-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Next
                </button>
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
