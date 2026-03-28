/**
 * Search Module
 * Re-exports all search utilities
 */

// Types
export * from './types';

// Fuzzy search
export {
  type FuzzyConfig,
  type FuzzyMatchResult,
  levenshteinDistance,
  levenshteinSimilarity,
  jaroSimilarity,
  jaroWinklerSimilarity,
  fuzzyMatch,
  fuzzySearch,
  fuzzyFilter,
  bestMatch,
} from './fuzzy';

// Filters
export {
  // Builders
  eq,
  neq,
  gt,
  gte,
  lt,
  lte,
  inArray,
  notInArray,
  contains,
  startsWith,
  endsWith,
  between,
  exists,
  regex,
  // Combinators
  and,
  or,
  not,
  // Evaluation
  evaluateCondition,
  evaluateGroup,
  // Sorting
  sortBy,
  applySorting,
  // Pagination
  applyPagination,
  // Combined
  applyFilters,
  buildFiltersFromParams,
  // Utilities
  countByField,
  uniqueValues,
  getRange,
} from './filters';

// Highlighting
export {
  type HighlightConfig,
  type HighlightRange,
  type HighlightedSegment,
  mergeRanges,
  segmentText,
  highlightText,
  highlightQuery,
  highlightRegex,
  highlightSearchResult,
  extractContext,
  getHighlightedSnippets,
  getHighlightSegments,
  getFuzzyHighlightSegments,
  escapeHtml,
  stripHighlightTags,
} from './highlight';

// Search Registry
export {
  SearchRegistry,
  getSearchRegistry,
  resetSearchRegistry,
  type SearchCategory,
  type SearchAction,
  type SearchableItem,
  type SearchRegistryConfig,
  type SearchSuggestion,
} from './registry';
