'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { RecommendedProduct, getRecommendationReason } from '@/lib/recommendations';

interface RecommendationsProps {
  sourceProduct: Product;
  recommendations: RecommendedProduct[];
  onProductClick?: (product: Product) => void;
  onAddToComparison?: (productId: number) => void;
}

export function Recommendations({
  sourceProduct,
  recommendations,
  onProductClick,
  onAddToComparison
}: RecommendationsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-purple-600">
          🎯 Recommended for You
        </h3>
        <span className="text-sm text-gray-500">
          Based on {sourceProduct.title.substring(0, 30)}...
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {recommendations.map(product => (
          <RecommendationCard
            key={product.id}
            product={product}
            sourceProduct={sourceProduct}
            onProductClick={onProductClick}
            onAddToComparison={onAddToComparison}
          />
        ))}
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  product: RecommendedProduct;
  sourceProduct: Product;
  onProductClick?: (product: Product) => void;
  onAddToComparison?: (productId: number) => void;
}

function RecommendationCard({
  product,
  sourceProduct,
  onProductClick,
  onAddToComparison
}: RecommendationCardProps) {
  const reason = getRecommendationReason(sourceProduct, product);

  return (
    <div
      className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onProductClick?.(product)}
    >
      {/* Similarity Badge */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
          {product.similarityScore}% Match
        </span>
        {product.dealLabel && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: product.dealLabel.color }}
          >
            {product.dealLabel.emoji} {product.dealLabel.text}
          </span>
        )}
      </div>

      {/* Product Image */}
      <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 mb-3">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Brand */}
      <div className="text-purple-600 font-semibold text-xs mb-1">
        {product.brand}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 h-10">
        {product.title.substring(0, 60)}...
      </h4>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-lg font-bold text-gray-900">
          ${product.currentPrice.toFixed(2)}
        </span>
        <span className="text-xs text-gray-400 line-through">
          ${product.listPrice.toFixed(2)}
        </span>
        <span className="text-xs text-green-600 font-semibold">
          -{product.discount}%
        </span>
      </div>

      {/* Rating */}
      <div className="text-xs text-gray-600 mb-2">
        {'⭐'.repeat(Math.floor(product.rating))} {product.rating.toFixed(1)}
        <span className="text-gray-400 ml-1">({product.reviews.toLocaleString()})</span>
      </div>

      {/* Recommendation Reason */}
      <div className="text-xs text-purple-600 mb-3 font-medium">
        {reason}
      </div>

      {/* Actions */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToComparison?.(product.id);
        }}
        className="w-full py-2 px-3 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
      >
        + Add to Compare
      </button>
    </div>
  );
}

/**
 * Compact version for showing in comparison panel
 */
interface CompactRecommendationsProps {
  recommendations: RecommendedProduct[];
  onAddToComparison?: (productId: number) => void;
}

export function CompactRecommendations({
  recommendations,
  onAddToComparison
}: CompactRecommendationsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-bold text-purple-600 mb-3">
        🎯 You might also like
      </h4>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recommendations.slice(0, 4).map(product => (
          <div
            key={product.id}
            className="flex-shrink-0 w-32 p-2 bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-400 transition-colors"
          >
            <div className="w-full h-16 rounded overflow-hidden bg-gray-100 mb-2">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs font-medium text-gray-800 truncate">
              {product.brand}
            </div>
            <div className="text-xs text-purple-600 font-bold">
              ${product.currentPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {product.similarityScore}% match
            </div>
            <button
              onClick={() => onAddToComparison?.(product.id)}
              className="w-full mt-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
            >
              + Compare
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
