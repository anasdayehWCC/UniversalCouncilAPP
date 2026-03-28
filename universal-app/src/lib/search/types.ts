/**
 * Search and Filter Types
 * Core type definitions for the search system
 */

// ============================================================================
// Search Query Types
// ============================================================================

export interface SearchQuery {
  /** The search text */
  text: string;
  /** Fields to search within */
  fields?: string[];
  /** Minimum score threshold (0-1) */
  minScore?: number;
  /** Maximum results to return */
  limit?: number;
  /** Enable fuzzy matching */
  fuzzy?: boolean;
  /** Fuzzy matching threshold (0-1, higher = stricter) */
  fuzzyThreshold?: number;
}

export interface SearchOptions {
  /** Case-sensitive matching */
  caseSensitive?: boolean;
  /** Match whole words only */
  wholeWord?: boolean;
  /** Use regex pattern */
  useRegex?: boolean;
  /** Highlight matches */
  highlight?: boolean;
  /** Custom highlight tags */
  highlightTags?: { start: string; end: string };
}

// ============================================================================
// Search Result Types
// ============================================================================

export interface SearchMatch {
  /** Field where match was found */
  field: string;
  /** Start index of match */
  start: number;
  /** End index of match */
  end: number;
  /** Matched text */
  matchedText: string;
  /** Context around the match */
  context?: string;
}

export interface SearchResult<T = unknown> {
  /** The matched item */
  item: T;
  /** Relevance score (0-1) */
  score: number;
  /** Individual matches found */
  matches: SearchMatch[];
  /** Highlighted fields */
  highlighted?: Record<string, string>;
}

export interface SearchResults<T = unknown> {
  /** List of results */
  items: SearchResult<T>[];
  /** Total matches before limit */
  total: number;
  /** Search query used */
  query: SearchQuery;
  /** Time taken in ms */
  duration: number;
}

// ============================================================================
// Filter Types
// ============================================================================

export type FilterOperator =
  | 'eq'      // equals
  | 'neq'     // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'nin'     // not in array
  | 'contains'// string contains
  | 'startsWith'
  | 'endsWith'
  | 'between' // between two values
  | 'exists'  // field exists
  | 'regex';  // regex match

export interface FilterCondition<T = unknown> {
  /** Field to filter on */
  field: keyof T | string;
  /** Filter operator */
  operator: FilterOperator;
  /** Value to compare against */
  value: unknown;
  /** Case-insensitive comparison */
  caseInsensitive?: boolean;
}

export interface FilterGroup<T = unknown> {
  /** Logical operator */
  type: 'and' | 'or';
  /** Conditions in this group */
  conditions: Array<FilterCondition<T> | FilterGroup<T>>;
}

export interface FilterConfig<T = unknown> {
  /** Root filter group */
  filters: FilterGroup<T>;
  /** Sort configuration */
  sort?: SortConfig<T>[];
  /** Pagination */
  pagination?: PaginationConfig;
}

// ============================================================================
// Sort Types
// ============================================================================

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T = unknown> {
  /** Field to sort by */
  field: keyof T | string;
  /** Sort direction */
  direction: SortDirection;
  /** Handle null values */
  nullsFirst?: boolean;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationConfig {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
}

export interface PaginatedResults<T = unknown> {
  /** Items on current page */
  items: T[];
  /** Current page */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total items */
  total: number;
  /** Total pages */
  totalPages: number;
  /** Has next page */
  hasNext: boolean;
  /** Has previous page */
  hasPrev: boolean;
}

// ============================================================================
// Filter UI Types
// ============================================================================

export type FilterType = 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean';

export interface FilterOption {
  /** Display label */
  label: string;
  /** Option value */
  value: string | number | boolean;
  /** Option count (for faceted search) */
  count?: number;
  /** Disabled state */
  disabled?: boolean;
}

export interface FilterDefinition<T = unknown> {
  /** Unique filter ID */
  id: string;
  /** Display label */
  label: string;
  /** Field to filter */
  field: keyof T | string;
  /** Filter type */
  type: FilterType;
  /** Available options (for select types) */
  options?: FilterOption[];
  /** Default value */
  defaultValue?: unknown;
  /** Placeholder text */
  placeholder?: string;
  /** Allow clearing */
  clearable?: boolean;
  /** Multiple selection */
  multiple?: boolean;
}

export interface ActiveFilter {
  /** Filter ID */
  id: string;
  /** Filter label */
  label: string;
  /** Display value */
  displayValue: string;
  /** Actual value */
  value: unknown;
}

// ============================================================================
// Search State Types
// ============================================================================

export interface SearchState<T = unknown> {
  /** Current query */
  query: string;
  /** Is searching */
  isSearching: boolean;
  /** Search results */
  results: SearchResults<T> | null;
  /** Search error */
  error: Error | null;
  /** Recent searches */
  recentSearches: string[];
}

export interface FilterState<T = unknown> {
  /** Active filters */
  activeFilters: Map<string, unknown>;
  /** Available filter definitions */
  definitions: FilterDefinition<T>[];
  /** Current sort */
  sort: SortConfig<T> | null;
  /** Current pagination */
  pagination: PaginationConfig;
}
