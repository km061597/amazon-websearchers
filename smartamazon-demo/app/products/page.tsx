'use client';

import React, { useState, useMemo } from 'react';
import { getProducts } from '@/lib/initializeProducts';
import { Product, FilterState } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ComparisonPanel } from '@/components/ComparisonPanel';

export default function ProductsPage() {
  const allProducts = getProducts();

  const [searchTerm, setSearchTerm] = useState('');
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

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      // Search filter
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

      return true;
    });
  }, [allProducts, searchTerm, filters]);

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

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by product name, brand, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none shadow-sm"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl">
              🔍
            </span>
          </div>
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
