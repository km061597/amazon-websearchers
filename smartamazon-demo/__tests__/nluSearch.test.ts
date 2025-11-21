/**
 * NLU Search Module Tests
 */
import {
  parseNaturalLanguageQuery,
  getParsedQuerySummary,
  ParsedQuery,
} from '@/lib/nluSearch';

describe('parseNaturalLanguageQuery', () => {
  describe('empty/null queries', () => {
    it('handles empty string', () => {
      const result = parseNaturalLanguageQuery('');
      expect(result.searchTerm).toBe('');
    });

    it('handles whitespace only', () => {
      const result = parseNaturalLanguageQuery('   ');
      expect(result.searchTerm).toBe('');
    });
  });

  describe('price extraction', () => {
    it('extracts "under $40"', () => {
      const result = parseNaturalLanguageQuery('protein powder under $40');
      expect(result.maxPrice).toBe(40);
    });

    it('extracts "below $50"', () => {
      const result = parseNaturalLanguageQuery('headphones below $50');
      expect(result.maxPrice).toBe(50);
    });

    it('extracts "less than $30"', () => {
      const result = parseNaturalLanguageQuery('vitamins less than $30');
      expect(result.maxPrice).toBe(30);
    });

    it('extracts "over $20"', () => {
      const result = parseNaturalLanguageQuery('electronics over $20');
      expect(result.minPrice).toBe(20);
    });

    it('extracts "above $100"', () => {
      const result = parseNaturalLanguageQuery('laptop above $100');
      expect(result.minPrice).toBe(100);
    });

    it('extracts price range "$20 to $40"', () => {
      const result = parseNaturalLanguageQuery('products $20 to $40');
      expect(result.minPrice).toBe(20);
      expect(result.maxPrice).toBe(40);
    });

    it('extracts "around $30" as ±20% range', () => {
      const result = parseNaturalLanguageQuery('product around $30');
      expect(result.minPrice).toBe(24); // 30 * 0.8
      expect(result.maxPrice).toBe(36); // 30 * 1.2
    });
  });

  describe('category extraction', () => {
    it('detects "protein" -> Grocery', () => {
      const result = parseNaturalLanguageQuery('best protein powder');
      expect(result.categories).toContain('Grocery');
    });

    it('detects "headphones" -> Electronics', () => {
      const result = parseNaturalLanguageQuery('wireless headphones');
      expect(result.categories).toContain('Electronics');
    });

    it('detects "vitamin" -> Health & Personal Care', () => {
      const result = parseNaturalLanguageQuery('multivitamin daily');
      expect(result.categories).toContain('Health & Personal Care');
    });

    it('detects "kitchen" -> Home & Kitchen', () => {
      const result = parseNaturalLanguageQuery('kitchen appliance');
      expect(result.categories).toContain('Home & Kitchen');
    });

    it('detects "fitness" -> Sports & Outdoors', () => {
      const result = parseNaturalLanguageQuery('fitness equipment');
      expect(result.categories).toContain('Sports & Outdoors');
    });
  });

  describe('deal intent extraction', () => {
    it('detects "best deal"', () => {
      const result = parseNaturalLanguageQuery('best deal protein');
      expect(result.preferDealScore).toBe(true);
      expect(result.requireTopDeal).toBe(true);
    });

    it('detects "top deal"', () => {
      const result = parseNaturalLanguageQuery('top deal headphones');
      expect(result.requireTopDeal).toBe(true);
    });

    it('detects "hidden gem"', () => {
      const result = parseNaturalLanguageQuery('hidden gem electronics');
      expect(result.requireHiddenGem).toBe(true);
    });

    it('detects "good value"', () => {
      const result = parseNaturalLanguageQuery('good value vitamins');
      expect(result.requireGoodValue).toBe(true);
    });

    it('detects "cheapest"', () => {
      const result = parseNaturalLanguageQuery('cheapest protein powder');
      expect(result.sortCheapest).toBe(true);
    });

    it('detects "highly rated"', () => {
      const result = parseNaturalLanguageQuery('highly rated headphones');
      expect(result.sortHighestRated).toBe(true);
    });
  });

  describe('brand extraction', () => {
    it('detects known brand "Sony"', () => {
      const result = parseNaturalLanguageQuery('Sony headphones');
      expect(result.brand).toBe('Sony');
    });

    it('detects known brand "Apple"', () => {
      const result = parseNaturalLanguageQuery('Apple tablet');
      expect(result.brand).toBe('Apple');
    });

    it('detects known brand "Optimum Nutrition"', () => {
      const result = parseNaturalLanguageQuery('Optimum Nutrition protein');
      expect(result.brand).toBe('Optimum Nutrition');
    });
  });

  describe('filter flag extraction', () => {
    it('detects "no sponsored"', () => {
      const result = parseNaturalLanguageQuery('protein no sponsored');
      expect(result.excludeSponsored).toBe(true);
    });

    it('detects "prime only"', () => {
      const result = parseNaturalLanguageQuery('headphones prime only');
      expect(result.requirePrime).toBe(true);
    });

    it('detects "bulk savings"', () => {
      const result = parseNaturalLanguageQuery('vitamins bulk savings');
      expect(result.preferBulkSavings).toBe(true);
    });

    it('extracts rating "4 star rating"', () => {
      const result = parseNaturalLanguageQuery('products 4 star rating');
      expect(result.minRating).toBe(4);
    });

    it('extracts "high rating" as minRating 4.0', () => {
      const result = parseNaturalLanguageQuery('products with high rating');
      expect(result.minRating).toBe(4.0);
    });
  });

  describe('complex queries', () => {
    it('parses "best protein powder under $40"', () => {
      const result = parseNaturalLanguageQuery('best protein powder under $40');

      expect(result.maxPrice).toBe(40);
      expect(result.categories).toContain('Grocery');
      expect(result.preferDealScore).toBe(true);
    });

    it('parses "cheap Sony headphones prime only"', () => {
      const result = parseNaturalLanguageQuery('cheap Sony headphones prime only');

      expect(result.sortCheapest).toBe(true);
      expect(result.brand).toBe('Sony');
      expect(result.categories).toContain('Electronics');
      expect(result.requirePrime).toBe(true);
    });

    it('parses "hidden gem vitamins under $30 no sponsored"', () => {
      const result = parseNaturalLanguageQuery('hidden gem vitamins under $30 no sponsored');

      expect(result.requireHiddenGem).toBe(true);
      expect(result.categories).toContain('Health & Personal Care');
      expect(result.maxPrice).toBe(30);
      expect(result.excludeSponsored).toBe(true);
    });
  });
});

describe('getParsedQuerySummary', () => {
  it('generates summary for search term', () => {
    const parsed: ParsedQuery = { searchTerm: 'protein powder' };
    const summary = getParsedQuerySummary(parsed);
    expect(summary).toContain('Searching: "protein powder"');
  });

  it('includes price range in summary', () => {
    const parsed: ParsedQuery = {
      searchTerm: 'test',
      minPrice: 20,
      maxPrice: 50,
    };
    const summary = getParsedQuerySummary(parsed);
    expect(summary).toContain('Price: $20 - $50');
  });

  it('includes max price only', () => {
    const parsed: ParsedQuery = { searchTerm: 'test', maxPrice: 40 };
    const summary = getParsedQuerySummary(parsed);
    expect(summary).toContain('Max price: $40');
  });

  it('includes categories', () => {
    const parsed: ParsedQuery = {
      searchTerm: 'test',
      categories: ['Grocery', 'Electronics'],
    };
    const summary = getParsedQuerySummary(parsed);
    expect(summary).toContain('Categories: Grocery, Electronics');
  });

  it('includes brand', () => {
    const parsed: ParsedQuery = { searchTerm: 'test', brand: 'Sony' };
    const summary = getParsedQuerySummary(parsed);
    expect(summary).toContain('Brand: Sony');
  });

  it('includes deal filters', () => {
    const parsed: ParsedQuery = { searchTerm: 'test', requireTopDeal: true };
    const summary = getParsedQuerySummary(parsed);
    expect(summary).toContain('🔥 Top Deals only');
  });
});
