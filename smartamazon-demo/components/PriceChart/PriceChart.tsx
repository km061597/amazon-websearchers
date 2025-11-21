'use client';

import React, { useEffect, useRef } from 'react';
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
}

export function PriceChart({ product, height = 250 }: PriceChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  const labels = product.priceHistory.map(h => h.month);
  const prices = product.priceHistory.map(h => h.price);

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
          gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
          gradient.addColorStop(1, 'rgba(118, 75, 162, 0.2)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: '6-Month Price Trend',
        font: {
          size: 14,
          weight: 'bold'
        },
        color: '#667eea'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return value !== null ? 'Price: $' + value.toFixed(2) : '';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '$' + Number(value).toFixed(2);
          }
        }
      }
    }
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
