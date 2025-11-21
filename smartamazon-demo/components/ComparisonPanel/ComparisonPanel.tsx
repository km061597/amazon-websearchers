'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { PriceChart } from '../PriceChart';

interface ComparisonPanelProps {
  products: Product[];
  onRemove: (productId: number) => void;
  onClose: () => void;
}

export function ComparisonPanel({ products, onRemove, onClose }: ComparisonPanelProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t-4 border-purple-600 z-50 max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 flex justify-between items-center">
        <h3 className="text-white text-xl font-bold">
          📊 Product Comparison ({products.length} selected)
        </h3>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          Close Comparison
        </button>
      </div>

      {/* Comparison Content */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(80vh-4rem)] p-4">
        <div className="flex gap-4 min-w-min">
          {products.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg border-2 border-gray-200 p-4 min-w-[350px] max-w-[350px]"
            >
              {/* Product Title */}
              <h4 className="font-bold text-gray-800 mb-3 text-base">
                {product.brand} - {product.title.substring(0, 50)}...
              </h4>

              {/* Deal Label */}
              {product.dealLabel && (
                <div
                  className="py-3 px-4 rounded-lg mb-4 text-center font-bold shadow-md"
                  style={{ backgroundColor: product.dealLabel.color }}
                >
                  <div className="text-white text-lg">
                    <span className="text-2xl mr-2">{product.dealLabel.emoji}</span>
                    {product.dealLabel.text}
                  </div>
                  <div className="text-white text-xs font-medium mt-1">
                    Deal Score: {product.dealScore}/100 - {product.dealLabel.description}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Category</div>
                  <div className="text-sm text-gray-800">{product.category}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Current Price</div>
                  <div className="text-xl font-bold text-purple-600">
                    ${product.currentPrice.toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">List Price</div>
                  <div className="text-sm text-gray-800">
                    ${product.listPrice.toFixed(2)}{' '}
                    <span className="text-green-600">(Save {product.discount}%)</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Unit Price</div>
                  <div className="text-base font-bold text-purple-700">
                    ${product.unitPrice.toFixed(2)}/{product.unitType}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Rating</div>
                  <div className="text-sm">
                    {'⭐'.repeat(Math.floor(product.rating))} {product.rating.toFixed(1)}{' '}
                    ({product.reviews.toLocaleString()} reviews)
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Features</div>
                  <div className="flex flex-wrap gap-1 text-xs">
                    {product.isPrime && <span>✓ Prime </span>}
                    {product.isBestValue && <span>👑 Best Value </span>}
                    {product.subscribeSave > 0 && <span>📦 Save {product.subscribeSave}% </span>}
                  </div>
                </div>

                {/* Bulk Savings */}
                {product.isMultiPack && (
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                    <div className="text-xs font-bold text-orange-600 mb-2">
                      💰 Bulk Savings
                    </div>
                    <div className="text-xs text-gray-700 space-y-1">
                      <div>Pack: {product.packSize} units</div>
                      <div>Per unit: ${product.pricePerUnit?.toFixed(2)}</div>
                      <div>Single: ${product.singleUnitPrice?.toFixed(2)}</div>
                      <div className="text-orange-600 font-bold mt-1">
                        Save ${product.bulkSavings?.toFixed(2)} ({product.bulkSavingsPercent}%)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price History Summary */}
              <div className="bg-purple-50 p-3 rounded-lg mb-4">
                <h5 className="text-sm font-bold text-purple-700 mb-2">
                  📈 Price History (6 Months)
                </h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lowest:</span>
                    <strong className="text-green-600">
                      ${product.lowestHistoricalPrice.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Highest:</span>
                    <strong className="text-red-600">
                      ${product.highestHistoricalPrice.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average:</span>
                    <strong className="text-purple-600">
                      ${product.averageHistoricalPrice.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-purple-200 mt-2">
                    <span className="text-gray-600">Current vs Avg:</span>
                    <strong
                      className={
                        product.currentPrice < product.averageHistoricalPrice
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {product.currentPrice < product.averageHistoricalPrice ? '↓' : '↑'} $
                      {Math.abs(product.currentPrice - product.averageHistoricalPrice).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <div className="mb-4">
                <PriceChart product={product} height={200} />
              </div>

              {/* Remove Button */}
              <button
                onClick={() => onRemove(product.id)}
                className="w-full px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
              >
                Remove from Comparison
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
