'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onToggleComparison: (productId: number) => void;
}

export function ProductCard({ product, isSelected, onToggleComparison }: ProductCardProps) {
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
        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-lg">
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
    </div>
  );
}
