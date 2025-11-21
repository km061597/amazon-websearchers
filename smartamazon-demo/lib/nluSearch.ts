/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NLU SEARCH MODULE
 * Natural Language Understanding for SmartAmazon Search
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This module provides a lightweight rule-based parser that translates
 * natural language queries into structured filter and sorting parameters.
 *
 * Example queries supported:
 * - "best protein powder under $40"
 * - "cheap multivitamin good value"
 * - "hidden gem electronics"
 * - "razors with high ratings and good bulk savings"
 * - "Sony headphones top deal"
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Structured output from the NLU parser
 */
export interface ParsedQuery {
  /** Cleaned search term after extracting structured parameters */
  searchTerm: string;

  /** Minimum price constraint (e.g., "over $20" -> 20) */
  minPrice?: number;

  /** Maximum price constraint (e.g., "under $40" -> 40) */
  maxPrice?: number;

  /** Detected categories to filter by */
  categories?: string[];

  /** Sort by deal score (best deals first) */
  preferDealScore?: boolean;

  /** Only show products with "Top Deal" label */
  requireTopDeal?: boolean;

  /** Only show products with "Hidden Gem" label */
  requireHiddenGem?: boolean;

  /** Only show products with "Good Value" label */
  requireGoodValue?: boolean;

  /** Detected brand name */
  brand?: string;

  /** Exclude sponsored products */
  excludeSponsored?: boolean;

  /** Require Prime eligible */
  requirePrime?: boolean;

  /** Minimum rating threshold */
  minRating?: number;

  /** Prefer bulk savings / multi-pack products */
  preferBulkSavings?: boolean;

  /** Sort by price ascending (cheapest first) */
  sortCheapest?: boolean;

  /** Sort by rating descending (highest rated first) */
  sortHighestRated?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps keyword patterns to category names
 * Each keyword can match to one or more categories
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Grocery keywords
  'protein': ['Grocery'],
  'whey': ['Grocery'],
  'powder': ['Grocery'],
  'supplement': ['Grocery'],
  'food': ['Grocery'],
  'snack': ['Grocery'],
  'grocery': ['Grocery'],
  'nutrition': ['Grocery'],
  'drink': ['Grocery'],
  'beverage': ['Grocery'],

  // Electronics keywords
  'electronics': ['Electronics'],
  'laptop': ['Electronics'],
  'computer': ['Electronics'],
  'tablet': ['Electronics'],
  'headphone': ['Electronics'],
  'headphones': ['Electronics'],
  'earbuds': ['Electronics'],
  'phone': ['Electronics'],
  'tech': ['Electronics'],
  'gadget': ['Electronics'],
  'macbook': ['Electronics'],

  // Home & Kitchen keywords
  'home': ['Home & Kitchen'],
  'kitchen': ['Home & Kitchen'],
  'appliance': ['Home & Kitchen'],
  'cookware': ['Home & Kitchen'],
  'air fryer': ['Home & Kitchen'],
  'coffee maker': ['Home & Kitchen'],
  'blender': ['Home & Kitchen'],
  'instant pot': ['Home & Kitchen'],
  'curtain': ['Home & Kitchen'],
  'furniture': ['Home & Kitchen'],

  // Health & Personal Care keywords
  'health': ['Health & Personal Care'],
  'vitamin': ['Health & Personal Care'],
  'multivitamin': ['Health & Personal Care'],
  'skincare': ['Health & Personal Care'],
  'razor': ['Health & Personal Care'],
  'razors': ['Health & Personal Care'],
  'shaving': ['Health & Personal Care'],
  'personal care': ['Health & Personal Care'],
  'hygiene': ['Health & Personal Care'],
  'toothpaste': ['Health & Personal Care'],
  'floss': ['Health & Personal Care'],

  // Sports & Outdoors keywords
  'sports': ['Sports & Outdoors'],
  'outdoors': ['Sports & Outdoors'],
  'fitness': ['Sports & Outdoors'],
  'gym': ['Sports & Outdoors'],
  'dumbbell': ['Sports & Outdoors'],
  'dumbbells': ['Sports & Outdoors'],
  'workout': ['Sports & Outdoors'],
  'exercise': ['Sports & Outdoors'],
  'yoga': ['Sports & Outdoors'],
  'camping': ['Sports & Outdoors'],
  'water bottle': ['Sports & Outdoors'],
  'yeti': ['Sports & Outdoors'],
};

// ═══════════════════════════════════════════════════════════════════════════
// BRAND MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Known brand names to detect in queries
 */
const KNOWN_BRANDS = [
  'Optimum Nutrition',
  'Dymatize',
  'MyProtein',
  'BSN',
  'MuscleTech',
  'Apple',
  'Samsung',
  'Sony',
  'Ninja',
  'Keurig',
  'Rachael Ray',
  'Nature Made',
  'Centrum',
  'Gillette',
  'Amazon Basics',
  'YETI',
];

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extracts price constraints from query
 *
 * Patterns supported:
 * - "under $40", "below $40", "less than $40", "max $40"
 * - "over $20", "above $20", "more than $20", "min $20"
 * - "between $20 and $40", "$20 to $40", "$20-$40"
 * - "around $30", "about $30" (±20% range)
 *
 * @returns Object with minPrice, maxPrice, and cleaned query
 */
function extractPriceConstraints(query: string): {
  minPrice?: number;
  maxPrice?: number;
  cleanedQuery: string;
} {
  let cleanedQuery = query;
  let minPrice: number | undefined;
  let maxPrice: number | undefined;

  // Pattern: "under/below/less than/max $XX" or "under/below XX dollars"
  const maxPatterns = [
    /(?:under|below|less than|max|maximum|up to)\s*\$?\s*(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?)?/gi,
    /\$?\s*(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?)?\s*(?:or less|max|maximum)/gi,
  ];

  for (const pattern of maxPatterns) {
    const match = pattern.exec(query);
    if (match) {
      maxPrice = parseFloat(match[1]);
      cleanedQuery = cleanedQuery.replace(match[0], '').trim();
    }
  }

  // Pattern: "over/above/more than/min $XX" or "over XX dollars"
  const minPatterns = [
    /(?:over|above|more than|min|minimum|at least)\s*\$?\s*(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?)?/gi,
    /\$?\s*(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?)?\s*(?:or more|min|minimum|\+)/gi,
  ];

  for (const pattern of minPatterns) {
    const match = pattern.exec(query);
    if (match) {
      minPrice = parseFloat(match[1]);
      cleanedQuery = cleanedQuery.replace(match[0], '').trim();
    }
  }

  // Pattern: "between $XX and $YY" or "$XX to $YY" or "$XX-$YY"
  const rangePatterns = [
    /(?:between\s*)?\$?\s*(\d+(?:\.\d{2})?)\s*(?:and|to|-)\s*\$?\s*(\d+(?:\.\d{2})?)/gi,
    /\$(\d+(?:\.\d{2})?)\s*-\s*\$?(\d+(?:\.\d{2})?)/gi,
  ];

  for (const pattern of rangePatterns) {
    const match = pattern.exec(query);
    if (match) {
      const price1 = parseFloat(match[1]);
      const price2 = parseFloat(match[2]);
      minPrice = Math.min(price1, price2);
      maxPrice = Math.max(price1, price2);
      cleanedQuery = cleanedQuery.replace(match[0], '').trim();
    }
  }

  // Pattern: "around/about $XX" (±20% range)
  const aroundPattern = /(?:around|about|approximately|~)\s*\$?\s*(\d+(?:\.\d{2})?)/gi;
  const aroundMatch = aroundPattern.exec(query);
  if (aroundMatch) {
    const targetPrice = parseFloat(aroundMatch[1]);
    minPrice = targetPrice * 0.8;
    maxPrice = targetPrice * 1.2;
    cleanedQuery = cleanedQuery.replace(aroundMatch[0], '').trim();
  }

  return { minPrice, maxPrice, cleanedQuery };
}

/**
 * Extracts category keywords from query
 *
 * @returns Object with detected categories and cleaned query
 */
function extractCategories(query: string): {
  categories: string[];
  cleanedQuery: string;
} {
  const categories = new Set<string>();
  let cleanedQuery = query.toLowerCase();

  // Check each keyword
  for (const [keyword, cats] of Object.entries(CATEGORY_KEYWORDS)) {
    const pattern = new RegExp(`\\b${keyword}s?\\b`, 'gi');
    if (pattern.test(query)) {
      cats.forEach(cat => categories.add(cat));
      // Don't remove category keywords from search term as they help with text search
    }
  }

  return {
    categories: Array.from(categories),
    cleanedQuery: query, // Keep original for text search
  };
}

/**
 * Extracts deal intent keywords from query
 *
 * Patterns:
 * - "best", "top deal", "best deal" -> preferDealScore + requireTopDeal
 * - "good value", "value" -> requireGoodValue
 * - "hidden gem", "underrated" -> requireHiddenGem
 * - "cheap", "cheapest", "budget" -> sortCheapest
 * - "highly rated", "best rated", "top rated" -> sortHighestRated
 *
 * @returns Object with intent flags and cleaned query
 */
function extractDealIntent(query: string): {
  preferDealScore: boolean;
  requireTopDeal: boolean;
  requireHiddenGem: boolean;
  requireGoodValue: boolean;
  sortCheapest: boolean;
  sortHighestRated: boolean;
  cleanedQuery: string;
} {
  let cleanedQuery = query;
  const queryLower = query.toLowerCase();

  const preferDealScore =
    /\b(best|top)\s*(deal|deals|value)?\b/i.test(queryLower) ||
    /\b(great|amazing)\s*deal/i.test(queryLower);

  const requireTopDeal =
    /\btop\s*deal\b/i.test(queryLower) ||
    /\bbest\s*deal\b/i.test(queryLower) ||
    /\b🔥\b/.test(query);

  const requireHiddenGem =
    /\bhidden\s*gem\b/i.test(queryLower) ||
    /\bunderrated\b/i.test(queryLower) ||
    /\b💎\b/.test(query);

  const requireGoodValue =
    /\bgood\s*value\b/i.test(queryLower) ||
    /\bsolid\s*(deal|value)\b/i.test(queryLower);

  const sortCheapest =
    /\b(cheap|cheapest|budget|affordable|low\s*price|lowest\s*price)\b/i.test(queryLower);

  const sortHighestRated =
    /\b(highly\s*rated|best\s*rated|top\s*rated|highest\s*rated|best\s*reviews?)\b/i.test(queryLower) ||
    /\bhigh\s*rating/i.test(queryLower);

  // Clean up intent keywords from query
  const intentPatterns = [
    /\b(best|top)\s*(deal|deals|value)?\b/gi,
    /\bhidden\s*gem\b/gi,
    /\bgood\s*value\b/gi,
    /\b(cheap|cheapest|budget|affordable)\b/gi,
    /\bhighly\s*rated\b/gi,
    /\bbest\s*rated\b/gi,
    /\btop\s*rated\b/gi,
  ];

  for (const pattern of intentPatterns) {
    cleanedQuery = cleanedQuery.replace(pattern, '').trim();
  }

  return {
    preferDealScore,
    requireTopDeal,
    requireHiddenGem,
    requireGoodValue,
    sortCheapest,
    sortHighestRated,
    cleanedQuery,
  };
}

/**
 * Extracts brand name from query
 *
 * @returns Object with detected brand and cleaned query
 */
function extractBrand(query: string): {
  brand?: string;
  cleanedQuery: string;
} {
  let cleanedQuery = query;
  let brand: string | undefined;

  // Check each known brand (case-insensitive)
  for (const knownBrand of KNOWN_BRANDS) {
    const pattern = new RegExp(`\\b${knownBrand}\\b`, 'gi');
    if (pattern.test(query)) {
      brand = knownBrand;
      // Keep brand in search term for text matching
      break;
    }
  }

  return { brand, cleanedQuery };
}

/**
 * Extracts filter flags from query
 *
 * Patterns:
 * - "not sponsored", "no sponsored", "exclude sponsored" -> excludeSponsored
 * - "prime", "prime only", "prime eligible" -> requirePrime
 * - "bulk", "multi-pack", "bulk savings" -> preferBulkSavings
 * - "4+ stars", "4 stars", "high rating" -> minRating
 *
 * @returns Object with filter flags and cleaned query
 */
function extractFilterFlags(query: string): {
  excludeSponsored: boolean;
  requirePrime: boolean;
  preferBulkSavings: boolean;
  minRating?: number;
  cleanedQuery: string;
} {
  let cleanedQuery = query;
  const queryLower = query.toLowerCase();

  const excludeSponsored =
    /\b(not?|no|exclude|without|hide)\s*sponsored\b/i.test(queryLower) ||
    /\bnon-?\s*sponsored\b/i.test(queryLower);

  const requirePrime =
    /\bprime\s*(only|eligible)?\b/i.test(queryLower) ||
    /\b(with|has)\s*prime\b/i.test(queryLower);

  const preferBulkSavings =
    /\bbulk\s*(savings?|deal|buy)?\b/i.test(queryLower) ||
    /\bmulti-?\s*pack\b/i.test(queryLower) ||
    /\bvalue\s*pack\b/i.test(queryLower);

  // Extract rating threshold
  let minRating: number | undefined;
  const ratingPatterns = [
    /(\d+(?:\.\d)?)\+?\s*stars?/gi,
    /(\d+(?:\.\d)?)\s*star\s*rating/gi,
    /rating\s*(?:of|above|over)?\s*(\d+(?:\.\d)?)/gi,
  ];

  for (const pattern of ratingPatterns) {
    const match = pattern.exec(query);
    if (match) {
      minRating = parseFloat(match[1]);
      cleanedQuery = cleanedQuery.replace(match[0], '').trim();
    }
  }

  // High rating intent without specific number
  if (!minRating && /\bhigh\s*rating/i.test(queryLower)) {
    minRating = 4.0;
  }

  // Clean up filter keywords
  const filterPatterns = [
    /\b(not?|no|exclude|without|hide)\s*sponsored\b/gi,
    /\bprime\s*(only|eligible)?\b/gi,
    /\bbulk\s*(savings?|deal|buy)?\b/gi,
    /\bmulti-?\s*pack\b/gi,
  ];

  for (const pattern of filterPatterns) {
    cleanedQuery = cleanedQuery.replace(pattern, '').trim();
  }

  return {
    excludeSponsored,
    requirePrime,
    preferBulkSavings,
    minRating,
    cleanedQuery,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PARSER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parses a natural language search query into structured parameters
 *
 * @param query - Raw user query (e.g., "best protein powder under $40")
 * @returns ParsedQuery object with extracted parameters
 *
 * @example
 * parseNaturalLanguageQuery("best protein powder under $40")
 * // Returns:
 * // {
 * //   searchTerm: "protein powder",
 * //   maxPrice: 40,
 * //   categories: ["Grocery"],
 * //   preferDealScore: true,
 * //   requireTopDeal: false,
 * // }
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  if (!query || query.trim() === '') {
    return { searchTerm: '' };
  }

  let workingQuery = query.trim();

  // Extract price constraints
  const priceResult = extractPriceConstraints(workingQuery);
  workingQuery = priceResult.cleanedQuery;

  // Extract categories
  const categoryResult = extractCategories(workingQuery);
  // Don't update workingQuery - keep category keywords for text search

  // Extract deal intent
  const intentResult = extractDealIntent(workingQuery);
  workingQuery = intentResult.cleanedQuery;

  // Extract brand
  const brandResult = extractBrand(workingQuery);
  // Don't update workingQuery - keep brand for text search

  // Extract filter flags
  const filterResult = extractFilterFlags(workingQuery);
  workingQuery = filterResult.cleanedQuery;

  // Clean up the final search term
  const searchTerm = workingQuery
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .replace(/\s*(and|with|for|the|a|an)\s*/gi, ' ')  // Remove common words
    .trim();

  // Build the result object, only including non-default values
  const result: ParsedQuery = {
    searchTerm: searchTerm || query.trim(), // Fall back to original if over-cleaned
  };

  // Price constraints
  if (priceResult.minPrice !== undefined) {
    result.minPrice = priceResult.minPrice;
  }
  if (priceResult.maxPrice !== undefined) {
    result.maxPrice = priceResult.maxPrice;
  }

  // Categories
  if (categoryResult.categories.length > 0) {
    result.categories = categoryResult.categories;
  }

  // Deal intent
  if (intentResult.preferDealScore) {
    result.preferDealScore = true;
  }
  if (intentResult.requireTopDeal) {
    result.requireTopDeal = true;
  }
  if (intentResult.requireHiddenGem) {
    result.requireHiddenGem = true;
  }
  if (intentResult.requireGoodValue) {
    result.requireGoodValue = true;
  }
  if (intentResult.sortCheapest) {
    result.sortCheapest = true;
  }
  if (intentResult.sortHighestRated) {
    result.sortHighestRated = true;
  }

  // Brand
  if (brandResult.brand) {
    result.brand = brandResult.brand;
  }

  // Filter flags
  if (filterResult.excludeSponsored) {
    result.excludeSponsored = true;
  }
  if (filterResult.requirePrime) {
    result.requirePrime = true;
  }
  if (filterResult.preferBulkSavings) {
    result.preferBulkSavings = true;
  }
  if (filterResult.minRating !== undefined) {
    result.minRating = filterResult.minRating;
  }

  return result;
}

/**
 * Generates a human-readable summary of the parsed query
 * Useful for displaying what filters were automatically applied
 *
 * @param parsed - ParsedQuery object from parser
 * @returns Human-readable summary string
 */
export function getParsedQuerySummary(parsed: ParsedQuery): string {
  const parts: string[] = [];

  if (parsed.searchTerm) {
    parts.push(`Searching: "${parsed.searchTerm}"`);
  }

  if (parsed.categories && parsed.categories.length > 0) {
    parts.push(`Categories: ${parsed.categories.join(', ')}`);
  }

  if (parsed.minPrice !== undefined || parsed.maxPrice !== undefined) {
    if (parsed.minPrice !== undefined && parsed.maxPrice !== undefined) {
      parts.push(`Price: $${parsed.minPrice} - $${parsed.maxPrice}`);
    } else if (parsed.maxPrice !== undefined) {
      parts.push(`Max price: $${parsed.maxPrice}`);
    } else {
      parts.push(`Min price: $${parsed.minPrice}`);
    }
  }

  if (parsed.brand) {
    parts.push(`Brand: ${parsed.brand}`);
  }

  if (parsed.requireTopDeal) {
    parts.push('🔥 Top Deals only');
  } else if (parsed.requireHiddenGem) {
    parts.push('💎 Hidden Gems only');
  } else if (parsed.requireGoodValue) {
    parts.push('✅ Good Value only');
  } else if (parsed.preferDealScore) {
    parts.push('Sorted by deal score');
  }

  if (parsed.sortCheapest) {
    parts.push('Sorted by lowest price');
  }

  if (parsed.sortHighestRated) {
    parts.push('Sorted by highest rating');
  }

  if (parsed.excludeSponsored) {
    parts.push('Excluding sponsored');
  }

  if (parsed.requirePrime) {
    parts.push('Prime only');
  }

  if (parsed.preferBulkSavings) {
    parts.push('Bulk savings preferred');
  }

  if (parsed.minRating !== undefined) {
    parts.push(`${parsed.minRating}+ stars`);
  }

  return parts.join(' | ');
}
