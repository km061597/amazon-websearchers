'use client';

/**
 * Enhanced Price Chart Component with Interactive Features
 *
 * Features:
 * - 30-day price history line chart
 * - Min/max price point highlighting (green/red)
 * - Current price point emphasis (purple)
 * - Interactive tooltips with date formatting and price changes
 * - Price change percentage in title
 * - Visual legend showing key price points
 * - Smooth gradient fill
 * - Responsive design
 */

import React, { useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Product } from '@/lib/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  product: Product;
  height?: number;
  showTitle?: boolean;
  showLegend?: boolean;
}

export function PriceChart({
  product,
  height = 250,
  showTitle = true,
  showLegend = true
}: PriceChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Calculate price statistics and find special points
  const priceStats = useMemo(() => {
    const prices = product.priceHistory.map(h => h.price);
    const currentPrice = product.currentPrice;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    // Find indices for min/max prices
    const minIndex = prices.indexOf(minPrice);
    const maxIndex = prices.indexOf(maxPrice);

    // Calculate price change percentage from first to last
    const firstPrice = prices[0];
    const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100;

    return {
      currentPrice,
      minPrice,
      maxPrice,
      avgPrice,
      minIndex,
      maxIndex,
      priceChange
    };
  }, [product.priceHistory, product.currentPrice]);

  // Format date labels (show MM/DD)
  const labels = product.priceHistory.map(h => {
    const date = new Date(h.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const prices = product.priceHistory.map(h => h.price);

  // Highlight current price point and min/max with different colors
  const pointBackgroundColors = prices.map((price, index) => {
    if (index === prices.length - 1) return '#8b5cf6'; // Current price (purple)
    if (index === priceStats.minIndex) return '#10b981'; // Min price (green)
    if (index === priceStats.maxIndex) return '#ef4444'; // Max price (red)
    return '#667eea'; // Default (blue)
  });

  // Make special points larger
  const pointRadius = prices.map((_, index) => {
    if (index === prices.length - 1) return 8; // Current price - largest
    if (index === priceStats.minIndex || index === priceStats.maxIndex) return 7; // Min/max - large
    return 3; // Default - small
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Price',
        data: prices,
        borderColor: '#667eea',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, 'rgba(102, 126, 234, 0.5)');
          gradient.addColorStop(1, 'rgba(118, 75, 162, 0.05)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: pointRadius,
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 10,
        pointHoverBorderWidth: 3
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: showTitle,
        text: `30-Day Price Trend (${priceStats.priceChange >= 0 ? '↑' : '↓'} ${Math.abs(priceStats.priceChange).toFixed(1)}%)`,
        font: {
          size: 14,
          weight: 'bold'
        },
        color: priceStats.priceChange >= 0 ? '#ef4444' : '#10b981',
        padding: {
          top: 5,
          bottom: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        bodySpacing: 6,
        callbacks: {
          title: function(context) {
            const index = context[0].dataIndex;
            const date = new Date(product.priceHistory[index].date);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          },
          label: function(context) {
            const value = context.parsed.y;
            if (value === null) return '';

            const index = context.dataIndex;
            let label = `Price: $${value.toFixed(2)}`;

            // Add special labels for min/max/current
            if (index === prices.length - 1) {
              label += ' 🟣 (Current)';
            } else if (index === priceStats.minIndex) {
              label += ' 🟢 (Lowest)';
            } else if (index === priceStats.maxIndex) {
              label += ' 🔴 (Highest)';
            }

            return label;
          },
          afterLabel: function(context) {
            const index = context.dataIndex;
            if (index > 0) {
              const change = prices[index] - prices[index - 1];
              const changePercent = ((change / prices[index - 1]) * 100).toFixed(1);
              const arrow = change >= 0 ? '↑' : '↓';
              return `Change: ${arrow} $${Math.abs(change).toFixed(2)} (${Math.abs(Number(changePercent))}%)`;
            }
            return undefined;
          },
          footer: function(context) {
            const index = context[0].dataIndex;
            const currentValue = prices[index];
            const diff = currentValue - priceStats.avgPrice;
            const diffPercent = ((diff / priceStats.avgPrice) * 100).toFixed(1);
            return `Avg: $${priceStats.avgPrice.toFixed(2)} (${diff >= 0 ? '+' : ''}${diffPercent}%)`;
          }
        },
        footerFont: {
          size: 10,
          style: 'italic'
        },
        footerColor: '#94a3b8'
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10
          },
          color: '#64748b',
          callback: function(value, index) {
            // Show only every 5th label to avoid crowding
            return index % 5 === 0 ? this.getLabelForValue(value as number) : '';
          }
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return '$' + Number(value).toFixed(0);
          },
          font: {
            size: 11
          },
          color: '#64748b'
        }
      }
    }
  };

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Line ref={chartRef} data={data} options={options} />

      {/* Price Stats Legend */}
      {showLegend && (
        <div className="flex justify-between items-center text-xs mt-2 px-2 py-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-700 font-medium">Low: ${priceStats.minPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
            <span className="text-gray-900 font-bold">Now: ${priceStats.currentPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-700 font-medium">High: ${priceStats.maxPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Price vs Average Indicator */}
      {showLegend && (
        <div className="mt-2 px-2">
          <div className={`text-xs text-center py-1.5 px-3 rounded-lg font-semibold ${
            priceStats.currentPrice < priceStats.avgPrice
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {priceStats.currentPrice < priceStats.avgPrice ? '✓ Below' : '⚠ Above'}
            {' '}average price (${priceStats.avgPrice.toFixed(2)})
            {' '}
            by ${Math.abs(priceStats.currentPrice - priceStats.avgPrice).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
