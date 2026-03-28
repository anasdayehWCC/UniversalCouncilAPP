/**
 * Fuzzy Search Utilities
 * Implements fuzzy matching with scoring algorithms
 */

import type { SearchMatch, SearchQuery, SearchResult } from './types';

// ============================================================================
// Fuzzy Matching Configuration
// ============================================================================

export interface FuzzyConfig {
  /** Maximum edit distance allowed */
  maxDistance?: number;
  /** Threshold score (0-1) */
  threshold?: number;
  /** Case-sensitive matching */
  caseSensitive?: boolean;
  /** Tokenize input for word-by-word matching */
  tokenize?: boolean;
  /** Match at start of string bonus */
  matchStartBonus?: number;
  /** Consecutive match bonus */
  consecutiveBonus?: number;
}

const DEFAULT_CONFIG: Required<FuzzyConfig> = {
  maxDistance: 2,
  threshold: 0.4,
  caseSensitive: false,
  tokenize: true,
  matchStartBonus: 0.15,
  consecutiveBonus: 0.1,
};

// ============================================================================
// Levenshtein Distance
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate normalized similarity score from Levenshtein distance
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - distance / maxLength;
}

// ============================================================================
// Jaro-Winkler Similarity
// ============================================================================

/**
 * Calculate Jaro similarity between two strings
 */
export function jaroSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matchDistance = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);

    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  return (
    (matches / a.length +
      matches / b.length +
      (matches - transpositions / 2) / matches) / 3
  );
}

/**
 * Calculate Jaro-Winkler similarity (favors strings with common prefix)
 */
export function jaroWinklerSimilarity(a: string, b: string, scalingFactor = 0.1): number {
  const jaroSim = jaroSimilarity(a, b);

  // Find common prefix length (max 4)
  let prefixLength = 0;
  const minLength = Math.min(a.length, b.length, 4);
  for (let i = 0; i < minLength; i++) {
    if (a[i] === b[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  return jaroSim + prefixLength * scalingFactor * (1 - jaroSim);
}

// ============================================================================
// Fuzzy Match
// ============================================================================

export interface FuzzyMatchResult {
  /** Does it match? */
  isMatch: boolean;
  /** Match score (0-1) */
  score: number;
  /** Matched character indices */
  matchedIndices: number[];
}

/**
 * Perform fuzzy matching between pattern and text
 */
export function fuzzyMatch(
  pattern: string,
  text: string,
  config: FuzzyConfig = {}
): FuzzyMatchResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const normalizedPattern = cfg.caseSensitive ? pattern : pattern.toLowerCase();
  const normalizedText = cfg.caseSensitive ? text : text.toLowerCase();

  if (normalizedPattern.length === 0) {
    return { isMatch: true, score: 1, matchedIndices: [] };
  }

  if (normalizedText.length === 0) {
    return { isMatch: false, score: 0, matchedIndices: [] };
  }

  // Exact match
  if (normalizedText === normalizedPattern) {
    return { 
      isMatch: true, 
      score: 1, 
      matchedIndices: Array.from({ length: text.length }, (_, i) => i) 
    };
  }

  // Contains match
  const containsIndex = normalizedText.indexOf(normalizedPattern);
  if (containsIndex !== -1) {
    const matchedIndices = Array.from(
      { length: normalizedPattern.length },
      (_, i) => containsIndex + i
    );
    const score = 0.9 + (containsIndex === 0 ? cfg.matchStartBonus : 0);
    return { isMatch: true, score: Math.min(1, score), matchedIndices };
  }

  // Fuzzy character matching
  const matchedIndices: number[] = [];
  let patternIdx = 0;
  let consecutiveMatches = 0;
  let score = 0;

  for (let textIdx = 0; textIdx < normalizedText.length && patternIdx < normalizedPattern.length; textIdx++) {
    if (normalizedText[textIdx] === normalizedPattern[patternIdx]) {
      matchedIndices.push(textIdx);
      consecutiveMatches++;
      
      // Bonus for consecutive matches
      if (consecutiveMatches > 1) {
        score += cfg.consecutiveBonus;
      }
      
      // Bonus for matching at start
      if (textIdx === 0) {
        score += cfg.matchStartBonus;
      }
      
      // Bonus for matching after separator
      if (textIdx > 0 && /[\s\-_.]/.test(normalizedText[textIdx - 1])) {
        score += cfg.matchStartBonus * 0.5;
      }
      
      patternIdx++;
    } else {
      consecutiveMatches = 0;
    }
  }

  const isMatch = patternIdx === normalizedPattern.length;
  
  if (isMatch) {
    // Calculate base score
    const baseScore = normalizedPattern.length / normalizedText.length;
    // Add position penalty (matches spread out = lower score)
    const spread = matchedIndices.length > 1 
      ? (matchedIndices[matchedIndices.length - 1] - matchedIndices[0]) / normalizedText.length 
      : 0;
    const spreadPenalty = spread * 0.2;
    
    score = Math.max(0, Math.min(1, baseScore + score - spreadPenalty));
  } else {
    score = 0;
  }

  return {
    isMatch: isMatch && score >= cfg.threshold,
    score,
    matchedIndices: isMatch ? matchedIndices : [],
  };
}

// ============================================================================
// Search Functions
// ============================================================================

/**
 * Search an array of items using fuzzy matching
 */
export function fuzzySearch<T>(
  items: T[],
  query: SearchQuery,
  getSearchableText: (item: T) => Record<string, string>,
  config: FuzzyConfig = {}
): SearchResult<T>[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const results: SearchResult<T>[] = [];

  const normalizedQuery = cfg.caseSensitive ? query.text : query.text.toLowerCase();
  const queryTokens = cfg.tokenize 
    ? normalizedQuery.split(/\s+/).filter(Boolean) 
    : [normalizedQuery];

  for (const item of items) {
    const searchableFields = getSearchableText(item);
    const matches: SearchMatch[] = [];
    let totalScore = 0;
    let matchCount = 0;

    for (const [field, value] of Object.entries(searchableFields)) {
      // Skip if specific fields requested and this isn't one
      if (query.fields && !query.fields.includes(field)) continue;

      const normalizedValue = cfg.caseSensitive ? value : value.toLowerCase();

      for (const token of queryTokens) {
        const result = fuzzyMatch(token, normalizedValue, cfg);
        
        if (result.isMatch) {
          // Find match boundaries
          const matchedIndices = result.matchedIndices;
          if (matchedIndices.length > 0) {
            matches.push({
              field,
              start: matchedIndices[0],
              end: matchedIndices[matchedIndices.length - 1] + 1,
              matchedText: value.substring(
                matchedIndices[0],
                matchedIndices[matchedIndices.length - 1] + 1
              ),
              context: value,
            });
          }
          
          totalScore += result.score;
          matchCount++;
        }
      }
    }

    // Calculate average score
    const avgScore = matchCount > 0 ? totalScore / (queryTokens.length * Object.keys(searchableFields).length) : 0;
    const minScore = query.minScore ?? cfg.threshold;

    if (avgScore >= minScore && matches.length > 0) {
      results.push({
        item,
        score: avgScore,
        matches,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Apply limit
  if (query.limit && query.limit > 0) {
    return results.slice(0, query.limit);
  }

  return results;
}

/**
 * Quick fuzzy filter for autocomplete
 */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getLabel: (item: T) => string,
  config: FuzzyConfig = {}
): T[] {
  if (!query.trim()) return items;

  const results = items
    .map(item => ({
      item,
      result: fuzzyMatch(query, getLabel(item), config),
    }))
    .filter(({ result }) => result.isMatch)
    .sort((a, b) => b.result.score - a.result.score);

  return results.map(({ item }) => item);
}

/**
 * Get best match from a list of options
 */
export function bestMatch(
  query: string,
  options: string[],
  config: FuzzyConfig = {}
): { match: string | null; score: number } {
  let bestOption: string | null = null;
  let bestScore = 0;

  for (const option of options) {
    const result = fuzzyMatch(query, option, config);
    if (result.isMatch && result.score > bestScore) {
      bestScore = result.score;
      bestOption = option;
    }
  }

  return { match: bestOption, score: bestScore };
}
