/**
 * Price Alerts Module Tests
 *
 * Note: These tests mock localStorage since it's not available in Node.js
 */
import { Product } from '@/lib/types';

// Mock localStorage before importing the module
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock } });

import {
  getTrackedProducts,
  isProductTracked,
  trackProduct,
  untrackProduct,
  toggleTracking,
  getPriceAlerts,
  getUnreadAlertCount,
  markAlertAsRead,
  markAllAlertsAsRead,
  clearAlert,
  clearAllAlerts,
  simulatePriceDropEvents,
  formatAlertNotification,
  PriceAlert,
} from '@/lib/priceAlerts';

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: 'Test Product',
    brand: 'TestBrand',
    category: 'Grocery',
    currentPrice: 50,
    listPrice: 60,
    discount: 17,
    unitPrice: 2.5,
    unitType: 'oz',
    weight: '20oz',
    rating: 4.5,
    reviews: 1000,
    isPrime: true,
    isSponsored: false,
    subscribeSave: 10,
    dealScore: 70,
    hiddenGemScore: 50,
    image: 'test.jpg',
    isBestValue: false,
    isMultiPack: false,
    priceHistory: [],
    lowestHistoricalPrice: 20,
    highestHistoricalPrice: 70,
    averageHistoricalPrice: 55,
    ...overrides,
  };
}

describe('Price Alerts Module', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('trackProduct', () => {
    it('adds product to tracked list', () => {
      trackProduct(1, 50);
      const tracked = getTrackedProducts();

      expect(tracked.length).toBe(1);
      expect(tracked[0].productId).toBe(1);
      expect(tracked[0].lastKnownPrice).toBe(50);
    });

    it('does not add duplicate products', () => {
      trackProduct(1, 50);
      trackProduct(1, 55); // Attempt duplicate
      const tracked = getTrackedProducts();

      expect(tracked.length).toBe(1);
    });

    it('allows tracking multiple different products', () => {
      trackProduct(1, 50);
      trackProduct(2, 60);
      trackProduct(3, 70);
      const tracked = getTrackedProducts();

      expect(tracked.length).toBe(3);
    });
  });

  describe('untrackProduct', () => {
    it('removes product from tracked list', () => {
      trackProduct(1, 50);
      trackProduct(2, 60);
      untrackProduct(1);
      const tracked = getTrackedProducts();

      expect(tracked.length).toBe(1);
      expect(tracked[0].productId).toBe(2);
    });

    it('handles untracking non-existent product', () => {
      trackProduct(1, 50);
      untrackProduct(999);
      const tracked = getTrackedProducts();

      expect(tracked.length).toBe(1);
    });
  });

  describe('isProductTracked', () => {
    it('returns true for tracked product', () => {
      trackProduct(1, 50);
      expect(isProductTracked(1)).toBe(true);
    });

    it('returns false for untracked product', () => {
      expect(isProductTracked(999)).toBe(false);
    });
  });

  describe('toggleTracking', () => {
    it('starts tracking if not tracked', () => {
      const result = toggleTracking(1, 50);

      expect(result).toBe(true);
      expect(isProductTracked(1)).toBe(true);
    });

    it('stops tracking if already tracked', () => {
      trackProduct(1, 50);
      const result = toggleTracking(1, 50);

      expect(result).toBe(false);
      expect(isProductTracked(1)).toBe(false);
    });
  });

  describe('getPriceAlerts', () => {
    it('returns empty array when no alerts', () => {
      const alerts = getPriceAlerts();
      expect(alerts).toEqual([]);
    });
  });

  describe('clearAllAlerts', () => {
    it('removes all alerts', () => {
      // Manually set some alerts
      localStorageMock.setItem('smartamazon_price_alerts', JSON.stringify([
        { id: 'alert-1', isRead: false },
        { id: 'alert-2', isRead: true },
      ]));

      clearAllAlerts();
      const alerts = getPriceAlerts();

      expect(alerts).toEqual([]);
    });
  });

  describe('formatAlertNotification', () => {
    it('formats alert for display', () => {
      const alert: PriceAlert = {
        id: 'alert-1',
        productId: 1,
        productTitle: 'Test Product with Long Title Here',
        productBrand: 'TestBrand',
        productImage: 'test.jpg',
        oldPrice: 60,
        newPrice: 50,
        percentDrop: 16.7,
        timestamp: Date.now(),
        isRead: false,
      };

      const formatted = formatAlertNotification(alert);

      expect(formatted.title).toBe('🔔 Price Drop Alert!');
      expect(formatted.message).toContain('TestBrand');
      expect(formatted.savings).toContain('$60.00');
      expect(formatted.savings).toContain('$50.00');
      expect(formatted.savings).toContain('-16.7%');
    });
  });

  describe('simulatePriceDropEvents', () => {
    it('returns empty array when no products are tracked', () => {
      const products = [createMockProduct({ id: 1 })];
      const alerts = simulatePriceDropEvents(products);

      expect(alerts).toEqual([]);
    });

    it('skips products not in allProducts list', () => {
      trackProduct(999, 50); // Product not in list
      const products = [createMockProduct({ id: 1 })];
      const alerts = simulatePriceDropEvents(products);

      // Should not crash, may return empty
      expect(Array.isArray(alerts)).toBe(true);
    });

    // Note: Due to random probability, full simulation tests are non-deterministic
    // In a real scenario, we'd mock Math.random() for deterministic tests
  });

  describe('getUnreadAlertCount', () => {
    it('returns 0 when no alerts', () => {
      expect(getUnreadAlertCount()).toBe(0);
    });

    it('counts only unread alerts', () => {
      localStorageMock.setItem('smartamazon_price_alerts', JSON.stringify([
        { id: 'alert-1', isRead: false },
        { id: 'alert-2', isRead: true },
        { id: 'alert-3', isRead: false },
      ]));

      expect(getUnreadAlertCount()).toBe(2);
    });
  });

  describe('markAlertAsRead', () => {
    it('marks specific alert as read', () => {
      localStorageMock.setItem('smartamazon_price_alerts', JSON.stringify([
        { id: 'alert-1', isRead: false },
        { id: 'alert-2', isRead: false },
      ]));

      markAlertAsRead('alert-1');
      const alerts = getPriceAlerts();

      expect(alerts.find(a => a.id === 'alert-1')?.isRead).toBe(true);
      expect(alerts.find(a => a.id === 'alert-2')?.isRead).toBe(false);
    });
  });

  describe('markAllAlertsAsRead', () => {
    it('marks all alerts as read', () => {
      localStorageMock.setItem('smartamazon_price_alerts', JSON.stringify([
        { id: 'alert-1', isRead: false },
        { id: 'alert-2', isRead: false },
      ]));

      markAllAlertsAsRead();
      const alerts = getPriceAlerts();

      expect(alerts.every(a => a.isRead)).toBe(true);
    });
  });

  describe('clearAlert', () => {
    it('removes specific alert', () => {
      localStorageMock.setItem('smartamazon_price_alerts', JSON.stringify([
        { id: 'alert-1', isRead: false },
        { id: 'alert-2', isRead: false },
      ]));

      clearAlert('alert-1');
      const alerts = getPriceAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].id).toBe('alert-2');
    });
  });
});
