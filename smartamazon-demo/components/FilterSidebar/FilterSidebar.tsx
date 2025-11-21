'use client';

import React, { useState } from 'react';
import { FilterState } from '@/lib/types';

const CATEGORIES = [
  'Grocery',
  'Electronics',
  'Home & Kitchen',
  'Health & Personal Care',
  'Sports & Outdoors'
];

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice);

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter(c => c !== category)
      : [...filters.selectedCategories, category];

    onFiltersChange({
      ...filters,
      selectedCategories: newCategories
    });
  };

  const handleApplyPriceRange = () => {
    onFiltersChange({
      ...filters,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice
    });
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      minPrice: 0,
      maxPrice: 1000,
      selectedCategories: [],
      showSponsored: true,
      primeOnly: false,
      bestValueOnly: false,
      minRating: 0
    };
    setLocalMinPrice(0);
    setLocalMaxPrice(1000);
    onFiltersChange(resetFilters);
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-md sticky top-5">
      <h3 className="text-purple-600 text-xl font-bold mb-5 pb-3 border-b-2 border-purple-100">
        Filters
      </h3>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-gray-800 text-sm font-semibold mb-3">
          Price Range
        </h4>
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">
              Min
            </label>
            <input
              type="number"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">
              Max
            </label>
            <input
              type="number"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="mb-2">
          <input
            type="range"
            min="0"
            max="1000"
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max="1000"
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="text-gray-800 text-sm font-semibold mb-3">
          Categories
        </h4>
        {CATEGORIES.map(category => (
          <div key={category} className="mb-2">
            <label className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
              <input
                type="checkbox"
                checked={filters.selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className="w-5 h-5 cursor-pointer accent-purple-600"
              />
              <span className="text-sm text-gray-700">{category}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Quick Filters */}
      <div className="mb-6">
        <h4 className="text-gray-800 text-sm font-semibold mb-3">
          Quick Filters
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
            <input
              type="checkbox"
              checked={!filters.showSponsored}
              onChange={(e) => onFiltersChange({ ...filters, showSponsored: !e.target.checked })}
              className="w-5 h-5 cursor-pointer accent-purple-600"
            />
            <span className="text-sm text-gray-700">Hide Sponsored</span>
          </label>
          <label className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
            <input
              type="checkbox"
              checked={filters.primeOnly}
              onChange={(e) => onFiltersChange({ ...filters, primeOnly: e.target.checked })}
              className="w-5 h-5 cursor-pointer accent-purple-600"
            />
            <span className="text-sm text-gray-700">Prime Only</span>
          </label>
          <label className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
            <input
              type="checkbox"
              checked={filters.bestValueOnly}
              onChange={(e) => onFiltersChange({ ...filters, bestValueOnly: e.target.checked })}
              className="w-5 h-5 cursor-pointer accent-purple-600"
            />
            <span className="text-sm text-gray-700">Best Value Only</span>
          </label>
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="mb-6">
        <h4 className="text-gray-800 text-sm font-semibold mb-3">
          Minimum Rating
        </h4>
        <select
          value={filters.minRating}
          onChange={(e) => onFiltersChange({ ...filters, minRating: Number(e.target.value) })}
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
        >
          <option value="0">Any Rating</option>
          <option value="3">3+ Stars</option>
          <option value="4">4+ Stars</option>
          <option value="4.5">4.5+ Stars</option>
        </select>
      </div>

      {/* Buttons */}
      <button
        onClick={handleApplyPriceRange}
        className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors mb-2"
      >
        Apply Price Range
      </button>
      <button
        onClick={handleReset}
        className="w-full px-4 py-2.5 bg-white text-purple-600 font-semibold rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-colors"
      >
        Reset All Filters
      </button>
    </div>
  );
}
