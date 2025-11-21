'use client';

import React from 'react';
import {
  PriceAlert,
  clearAlert,
  clearAllAlerts,
  markAlertAsRead,
  markAllAlertsAsRead
} from '@/lib/priceAlerts';

interface PriceAlertsProps {
  alerts: PriceAlert[];
  onRefresh: () => void;
}

export function PriceAlerts({ alerts, onRefresh }: PriceAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  const handleClearAlert = (alertId: string) => {
    clearAlert(alertId);
    onRefresh();
  };

  const handleClearAll = () => {
    clearAllAlerts();
    onRefresh();
  };

  const handleMarkAllRead = () => {
    markAllAlertsAsRead();
    onRefresh();
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-6 border-l-4 border-green-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <h3 className="text-xl font-bold text-gray-800">
            Price Drop Alerts
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {alerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onClear={() => handleClearAlert(alert.id)}
            onMarkRead={() => {
              markAlertAsRead(alert.id);
              onRefresh();
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface AlertCardProps {
  alert: PriceAlert;
  onClear: () => void;
  onMarkRead: () => void;
}

function AlertCard({ alert, onClear, onMarkRead }: AlertCardProps) {
  const timeAgo = getTimeAgo(alert.timestamp);
  const savings = alert.oldPrice - alert.newPrice;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
        alert.isRead
          ? 'bg-gray-50 border-gray-200'
          : 'bg-green-50 border-green-300 shadow-sm'
      }`}
      onClick={!alert.isRead ? onMarkRead : undefined}
    >
      {/* Product Image */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <img
          src={alert.productImage}
          alt={alert.productTitle}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Alert Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {!alert.isRead && (
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          )}
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
        <div className="text-sm font-semibold text-gray-800 truncate">
          {alert.productBrand} - {alert.productTitle.substring(0, 40)}...
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-400 line-through">
            ${alert.oldPrice.toFixed(2)}
          </span>
          <span className="text-lg font-bold text-green-600">
            ${alert.newPrice.toFixed(2)}
          </span>
          <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
            -{alert.percentDrop}%
          </span>
        </div>
        <div className="text-xs text-green-600 font-medium mt-1">
          💰 You save ${savings.toFixed(2)}!
        </div>
      </div>

      {/* Clear Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Dismiss alert"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Compact badge showing alert count
 */
interface AlertBadgeProps {
  count: number;
  onClick?: () => void;
}

export function AlertBadge({ count, onClick }: AlertBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
    >
      <span className="text-lg">🔔</span>
      <span>{count} Price Alert{count !== 1 ? 's' : ''}</span>
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
        {count}
      </span>
    </button>
  );
}

/**
 * Track Price Button for ProductCard
 */
interface TrackPriceButtonProps {
  isTracking: boolean;
  onToggle: () => void;
}

export function TrackPriceButton({ isTracking, onToggle }: TrackPriceButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
        isTracking
          ? 'bg-green-100 text-green-700 border-2 border-green-500 hover:bg-green-200'
          : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-purple-100 hover:border-purple-400 hover:text-purple-700'
      }`}
    >
      {isTracking ? (
        <>
          <span className="mr-1">✓</span> Tracking Price
        </>
      ) : (
        <>
          <span className="mr-1">🔔</span> Track Price
        </>
      )}
    </button>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
