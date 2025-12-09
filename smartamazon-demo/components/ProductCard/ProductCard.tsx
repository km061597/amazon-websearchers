'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { TrackPriceButton } from '@/components/PriceAlerts';
import { PriceChart } from '@/components/PriceChart';

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onToggleComparison: (productId: number) => void;
  isTracking?: boolean;
  onToggleTracking?: (productId: number) => void;
}

export function ProductCard({ product, isSelected, onToggleComparison, isTracking = false, onToggleTracking }: ProductCardProps) {
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  return (
    <div
      className={`
        bg-white rounded-xl p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative
        ${isSelected ? 'ring-4 ring-purple-500 shadow-purple-200' : ''}
      `}
    >
      {/* Comparison Checkbox */}
      <div className="absolute top-4 right-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleComparison(product.id)}
          className="w-6 h-6 cursor-pointer accent-purple-600"
          id={`compare-${product.id}`}
        />
        <label
          htmlFor={`compare-${product.id}`}
          className="absolute top-8 right-0 text-xs font-semibold text-purple-600 bg-white px-2 py-1 rounded shadow-sm cursor-pointer"
        >
          Compare
        </label>
      </div>

      {/* Product Image */}
      <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Brand */}
      <div className="text-purple-600 font-semibold text-sm mb-2">
        {product.brand}
      </div>

      {/* Title */}
      <h3 className="text-gray-800 font-semibold text-base mb-3 h-14 overflow-hidden line-clamp-3">
        {product.title}
      </h3>

      {/* Deal Label */}
      {product.dealLabel && (
        <div
          className="py-3 px-4 rounded-lg mb-3 text-center font-bold shadow-md"
          style={{ backgroundColor: product.dealLabel.color }}
        >
          <div className="text-white text-base">
            <span className="text-xl mr-2">{product.dealLabel.emoji}</span>
            {product.dealLabel.text}
          </div>
          <div className="text-white text-xs font-medium mt-1 opacity-95">
            {product.dealLabel.description}
          </div>
        </div>
      )}

      {/* Price Section */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-gray-900">
            ${product.currentPrice.toFixed(2)}
          </span>
          <span className="text-sm text-gray-400 line-through">
            ${product.listPrice.toFixed(2)}
          </span>
        </div>
        <div className="text-sm text-green-600 font-semibold">
          You save: ${(product.listPrice - product.currentPrice).toFixed(2)} ({product.discount}%)
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Weight: {product.weight}
        </div>
      </div>

      {/* Unit Price */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-2 px-3 rounded-lg font-bold text-lg mb-3">
        ${product.unitPrice.toFixed(2)}/{product.unitType}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {product.isBestValue && (
          <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-semibold rounded">
            👑 BEST VALUE
          </span>
        )}
        {product.isPrime && (
          <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
            ✓ Prime
          </span>
        )}
        {product.discount > 20 && (
          <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded">
            {product.discount}% OFF
          </span>
        )}
        {product.hiddenGemScore >= 85 && (
          <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded">
            💎 Hidden Gem
          </span>
        )}
        {product.isSponsored && (
          <span className="px-3 py-1 bg-orange-400 text-white text-xs font-semibold rounded">
            Sponsored
          </span>
        )}
        {product.isMultiPack && product.bulkSavingsPercent && (
          <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded">
            📦 BULK: Save {product.bulkSavingsPercent}%
          </span>
        )}
      </div>

      {/* Rating */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">
            {'⭐'.repeat(Math.floor(product.rating))}
            {product.rating % 1 >= 0.5 ? '½' : ''}
          </span>
          <span className="text-lg font-bold text-gray-800">
            {product.rating.toFixed(1)}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          ({product.reviews.toLocaleString()} customer reviews)
        </div>
        {product.rating >= 4.5 && (
          <div className="text-xs text-green-600 mt-1">
            ⭐ Highly Rated
          </div>
        )}
      </div>

      {/* Deal Score */}
      <div className="mb-3">
        <span className="inline-block bg-gradient-to-r from-purple-600 to-purple-800 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
          ⭐ Deal Score: {product.dealScore}/100
        </span>
      </div>

      {/* Subscribe & Save */}
      {product.subscribeSave > 0 && (
        <div className="text-sm text-purple-600 mb-3">
          📦 Subscribe & Save {product.subscribeSave}%
        </div>
      )}

      {/* Bulk Savings Details */}
      {product.isMultiPack && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-lg mb-4">
          <div className="text-sm font-bold text-orange-600 mb-2">
            💰 Bulk Savings
          </div>
          <div className="text-xs text-gray-700 mb-1">
            Pack Size: <strong>{product.packSize} units</strong>
          </div>
          <div className="text-xs text-gray-700 mb-1">
            Price per unit: <strong>${product.pricePerUnit?.toFixed(2)}</strong>
          </div>
          <div className="text-xs text-gray-700 mb-1">
            Single unit price: <strong>${product.singleUnitPrice?.toFixed(2)}</strong>
          </div>
          <div className="text-sm text-orange-600 font-bold mt-2">
            You save ${product.bulkSavings?.toFixed(2)} ({product.bulkSavingsPercent}%) by buying in bulk!
          </div>
        </div>
      )}

      {/* Price History Section - Expandable */}
      <div className="mb-4">
        {/* Price History Toggle Button */}
        <button
          onClick={() => setShowPriceHistory(!showPriceHistory)}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-between ${
            showPriceHistory
              ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white'
              : 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 hover:from-purple-200 hover:to-purple-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">{showPriceHistory ? '📊' : '📈'}</span>
            <span>
              {showPriceHistory ? 'Hide' : 'Show'} Price History
            </span>
          </span>
          <span className="text-lg transition-transform duration-300" style={{ transform: showPriceHistory ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </button>

        {/* Expandable Price History Content */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            showPriceHistory ? 'max-h-[600px] opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-lg p-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center bg-white p-2 rounded-lg shadow-sm border border-purple-100">
                <div className="text-xs text-gray-600 mb-1">30-Day Low</div>
                <div className="text-sm font-bold text-green-600">
                  ${product.lowestHistoricalPrice.toFixed(2)}
                </div>
              </div>
              <div className="text-center bg-white p-2 rounded-lg shadow-sm border border-purple-100">
                <div className="text-xs text-gray-600 mb-1">30-Day Avg</div>
                <div className="text-sm font-bold text-purple-600">
                  ${product.averageHistoricalPrice.toFixed(2)}
                </div>
              </div>
              <div className="text-center bg-white p-2 rounded-lg shadow-sm border border-purple-100">
                <div className="text-xs text-gray-600 mb-1">30-Day High</div>
                <div className="text-sm font-bold text-red-600">
                  ${product.highestHistoricalPrice.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <PriceChart product={product} height={220} showTitle={true} showLegend={true} />
            </div>

            {/* Price Insights */}
            <div className="mt-3 space-y-2">
              {product.currentPrice === product.lowestHistoricalPrice && (
                <div className="bg-green-100 border-l-4 border-green-500 p-2 rounded text-xs">
                  <span className="font-bold text-green-700">🎉 Lowest price in 30 days!</span>
                  <span className="text-green-600"> Great time to buy.</span>
                </div>
              )}
              {product.currentPrice < product.averageHistoricalPrice && product.currentPrice !== product.lowestHistoricalPrice && (
                <div className="bg-blue-100 border-l-4 border-blue-500 p-2 rounded text-xs">
                  <span className="font-bold text-blue-700">💰 Below average price!</span>
                  <span className="text-blue-600">
                    {' '}Saving ${(product.averageHistoricalPrice - product.currentPrice).toFixed(2)} vs 30-day avg.
                  </span>
                </div>
              )}
              {product.currentPrice > product.averageHistoricalPrice && (
                <div className="bg-orange-100 border-l-4 border-orange-500 p-2 rounded text-xs">
                  <span className="font-bold text-orange-700">📊 Above average price</span>
                  <span className="text-orange-600">
                    {' '}Consider tracking for price drops.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Track Price Button */}
      {onToggleTracking && (
        <div className="mt-4">
          <TrackPriceButton
            isTracking={isTracking}
            onToggle={() => onToggleTracking(product.id)}
          />
        </div>
      )}
    </div>
  );
}
