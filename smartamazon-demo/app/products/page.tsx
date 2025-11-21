'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { getProducts } from '@/lib/initializeProducts';
import { Product, FilterState } from '@/lib/types';
import { parseNaturalLanguageQuery, getParsedQuerySummary, ParsedQuery } from '@/lib/nluSearch';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ComparisonPanel } from '@/components/ComparisonPanel';

export default function ProductsPage() {
  const allProducts = getProducts();

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

        // Bulk savings preference (boost, not filter)
        // This will be handled in sorting
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
        // Sort bulk savings products first
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

  // Close comparison panel
  const handleCloseComparison = () => {
    setComparisonIds([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <h1 className="text-purple-600 text-4xl font-bold mb-2">
            SmartAmazon Search
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Intelligent Deal Discovery & Price Comparison
          </p>

          {/* Stats */}
          <div className="flex gap-4 flex-wrap mb-6">
            <div className="bg-purple-50 px-6 py-3 rounded-lg font-semibold text-purple-600">
              Total Products: {filteredProducts.length}
            </div>
            <div className="bg-purple-50 px-6 py-3 rounded-lg font-semibold text-purple-600">
              Categories: 5
            </div>
            <div className="bg-purple-50 px-6 py-3 rounded-lg font-semibold text-purple-600">
              Comparing: {comparisonIds.length}
            </div>
          </div>

          {/* Search Bar with NLU */}
          <div className="relative">
            <input
              type="text"
              placeholder='Try: "best protein under $40" or "hidden gem electronics"'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchInput)}
              className="w-full px-6 py-4 pr-24 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none shadow-sm"
            />
            <button
              onClick={() => handleSearch(searchInput)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              🔍 Search
            </button>
          </div>

          {/* NLU Summary Banner */}
          {nluSummary && (
            <div className="mt-4 p-4 bg-purple-100 border-2 border-purple-300 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-purple-800 mb-1">
                  🧠 Smart Search Applied:
                </div>
                <div className="text-sm text-purple-700">
                  {nluSummary}
                </div>
              </div>
              <button
                onClick={clearNluFilters}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
              >
                Clear
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <div className="w-72 flex-shrink-0">
            <FilterSidebar filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-lg">
                <p className="text-2xl text-gray-500 mb-2">No products found</p>
                <p className="text-gray-400">
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
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comparison Panel */}
        <ComparisonPanel
          products={comparisonProducts}
          onRemove={handleRemoveFromComparison}
          onClose={handleCloseComparison}
        />
      </div>
    </div>
  );
}
