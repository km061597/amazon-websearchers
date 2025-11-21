/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRICE TRACKING & ALERTS MODULE
 * Simulated Price Drop Alerts for SmartAmazon
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This module provides client-side price tracking with simulated price drop
 * alerts. All data is stored in localStorage for persistence.
 *
 * FEATURES:
 * - Track/untrack products for price monitoring
 * - Simulate price drop events based on price history
 * - Generate alert messages when price drops exceed threshold
 * - Persistent storage using localStorage
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Product } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Price alert when a tracked product's price drops
 */
export interface PriceAlert {
  id: string;
  productId: number;
  productTitle: string;
  productBrand: string;
  productImage: string;
  oldPrice: number;
  newPrice: number;
  percentDrop: number;
  timestamp: number;
  isRead: boolean;
}

/**
 * Tracked product entry
 */
export interface TrackedProduct {
  productId: number;
  trackedAt: number;
  lastKnownPrice: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCALSTORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  TRACKED_PRODUCTS: 'smartamazon_tracked_products',
  PRICE_ALERTS: 'smartamazon_price_alerts',
};

// ═══════════════════════════════════════════════════════════════════════════
// LOCALSTORAGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Safely get data from localStorage
 */
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely set data to localStorage
 */
function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get list of tracked products from localStorage
 */
export function getTrackedProducts(): TrackedProduct[] {
  return getFromStorage<TrackedProduct[]>(STORAGE_KEYS.TRACKED_PRODUCTS, []);
}

/**
 * Check if a product is being tracked
 */
export function isProductTracked(productId: number): boolean {
  const tracked = getTrackedProducts();
  return tracked.some(t => t.productId === productId);
}

/**
 * Start tracking a product's price
 *
 * @param productId - Product ID to track
 * @param currentPrice - Current price to use as baseline
 */
export function trackProduct(productId: number, currentPrice: number): void {
  const tracked = getTrackedProducts();

  // Don't add duplicates
  if (tracked.some(t => t.productId === productId)) {
    return;
  }

  tracked.push({
    productId,
    trackedAt: Date.now(),
    lastKnownPrice: currentPrice,
  });

  setToStorage(STORAGE_KEYS.TRACKED_PRODUCTS, tracked);
}

/**
 * Stop tracking a product's price
 *
 * @param productId - Product ID to untrack
 */
export function untrackProduct(productId: number): void {
  const tracked = getTrackedProducts();
  const filtered = tracked.filter(t => t.productId !== productId);
  setToStorage(STORAGE_KEYS.TRACKED_PRODUCTS, filtered);
}

/**
 * Toggle tracking status for a product
 *
 * @param productId - Product ID to toggle
 * @param currentPrice - Current price (used if starting to track)
 * @returns New tracking status (true = now tracking)
 */
export function toggleTracking(productId: number, currentPrice: number): boolean {
  if (isProductTracked(productId)) {
    untrackProduct(productId);
    return false;
  } else {
    trackProduct(productId, currentPrice);
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all price alerts from localStorage
 */
export function getPriceAlerts(): PriceAlert[] {
  return getFromStorage<PriceAlert[]>(STORAGE_KEYS.PRICE_ALERTS, []);
}

/**
 * Get unread price alerts count
 */
export function getUnreadAlertCount(): number {
  const alerts = getPriceAlerts();
  return alerts.filter(a => !a.isRead).length;
}

/**
 * Mark an alert as read
 */
export function markAlertAsRead(alertId: string): void {
  const alerts = getPriceAlerts();
  const updated = alerts.map(a =>
    a.id === alertId ? { ...a, isRead: true } : a
  );
  setToStorage(STORAGE_KEYS.PRICE_ALERTS, updated);
}

/**
 * Mark all alerts as read
 */
export function markAllAlertsAsRead(): void {
  const alerts = getPriceAlerts();
  const updated = alerts.map(a => ({ ...a, isRead: true }));
  setToStorage(STORAGE_KEYS.PRICE_ALERTS, updated);
}

/**
 * Clear a specific alert
 */
export function clearAlert(alertId: string): void {
  const alerts = getPriceAlerts();
  const filtered = alerts.filter(a => a.id !== alertId);
  setToStorage(STORAGE_KEYS.PRICE_ALERTS, filtered);
}

/**
 * Clear all alerts
 */
export function clearAllAlerts(): void {
  setToStorage(STORAGE_KEYS.PRICE_ALERTS, []);
}

/**
 * Add a new price alert
 */
function addAlert(alert: PriceAlert): void {
  const alerts = getPriceAlerts();

  // Avoid duplicate alerts for same product within 1 hour
  const recentAlert = alerts.find(
    a => a.productId === alert.productId &&
         Date.now() - a.timestamp < 3600000
  );

  if (recentAlert) {
    return;
  }

  alerts.unshift(alert); // Add to beginning

  // Keep only last 50 alerts
  const trimmed = alerts.slice(0, 50);
  setToStorage(STORAGE_KEYS.PRICE_ALERTS, trimmed);
}

// ═══════════════════════════════════════════════════════════════════════════
// PRICE DROP SIMULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Minimum percentage drop to trigger an alert
 */
const ALERT_THRESHOLD_PERCENT = 5;

/**
 * Probability of a price drop occurring (0-1)
 */
const DROP_PROBABILITY = 0.3;

/**
 * Simulates price drop events for tracked products
 * This creates realistic price fluctuations based on price history
 *
 * @param allProducts - Array of all products to check
 * @returns Array of new alerts generated
 */
export function simulatePriceDropEvents(allProducts: Product[]): PriceAlert[] {
  const tracked = getTrackedProducts();
  const newAlerts: PriceAlert[] = [];

  if (tracked.length === 0) {
    return newAlerts;
  }

  for (const trackedItem of tracked) {
    const product = allProducts.find(p => p.id === trackedItem.productId);
    if (!product) continue;

    // Random chance of price drop
    if (Math.random() > DROP_PROBABILITY) {
      continue;
    }

    // Calculate a simulated drop based on price history
    const priceRange = product.listPrice - product.lowestHistoricalPrice;
    const randomDropPercent = 5 + Math.random() * 15; // 5-20% drop
    const dropAmount = (trackedItem.lastKnownPrice * randomDropPercent) / 100;
    const newPrice = Math.max(
      product.lowestHistoricalPrice,
      trackedItem.lastKnownPrice - dropAmount
    );

    const actualDropPercent = ((trackedItem.lastKnownPrice - newPrice) / trackedItem.lastKnownPrice) * 100;

    // Only alert if drop exceeds threshold
    if (actualDropPercent >= ALERT_THRESHOLD_PERCENT) {
      const alert: PriceAlert = {
        id: `alert-${product.id}-${Date.now()}`,
        productId: product.id,
        productTitle: product.title,
        productBrand: product.brand,
        productImage: product.image,
        oldPrice: trackedItem.lastKnownPrice,
        newPrice: parseFloat(newPrice.toFixed(2)),
        percentDrop: parseFloat(actualDropPercent.toFixed(1)),
        timestamp: Date.now(),
        isRead: false,
      };

      addAlert(alert);
      newAlerts.push(alert);

      // Update last known price
      const allTracked = getTrackedProducts();
      const updatedTracked = allTracked.map(t =>
        t.productId === product.id
          ? { ...t, lastKnownPrice: alert.newPrice }
          : t
      );
      setToStorage(STORAGE_KEYS.TRACKED_PRODUCTS, updatedTracked);
    }
  }

  return newAlerts;
}

/**
 * Get formatted alert messages for display
 */
export function getPriceAlertMessages(): string[] {
  const alerts = getPriceAlerts();
  return alerts.map(alert => {
    const timeAgo = getTimeAgo(alert.timestamp);
    return `${alert.productBrand} ${alert.productTitle.substring(0, 30)}... dropped from $${alert.oldPrice.toFixed(2)} to $${alert.newPrice.toFixed(2)} (-${alert.percentDrop}%) ${timeAgo}`;
  });
}

/**
 * Helper to format relative time
 */
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Format a price alert for notification display
 */
export function formatAlertNotification(alert: PriceAlert): {
  title: string;
  message: string;
  savings: string;
} {
  return {
    title: `🔔 Price Drop Alert!`,
    message: `${alert.productBrand} - ${alert.productTitle.substring(0, 40)}...`,
    savings: `$${alert.oldPrice.toFixed(2)} → $${alert.newPrice.toFixed(2)} (-${alert.percentDrop}%)`,
  };
}
