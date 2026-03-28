/**
 * Table Pagination Utilities
 * Pagination logic and calculations for the data table
 */

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
}

export interface PageInfo {
  /** Current page (0-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Start index of current page (0-indexed) */
  startIndex: number;
  /** End index of current page (exclusive) */
  endIndex: number;
  /** Number of items on current page */
  itemsOnPage: number;
  /** Can go to previous page */
  canPrevious: boolean;
  /** Can go to next page */
  canNext: boolean;
  /** Is first page */
  isFirstPage: boolean;
  /** Is last page */
  isLastPage: boolean;
}

/**
 * Create initial pagination state
 */
export function createPaginationState(
  pageSize = 10,
  totalItems = 0
): PaginationState {
  return {
    page: 0,
    pageSize,
    totalItems,
  };
}

/**
 * Calculate total number of pages
 */
export function getTotalPages(state: PaginationState): number {
  if (state.totalItems === 0) return 1;
  return Math.ceil(state.totalItems / state.pageSize);
}

/**
 * Get start index for current page (0-indexed)
 */
export function getStartIndex(state: PaginationState): number {
  return state.page * state.pageSize;
}

/**
 * Get end index for current page (exclusive)
 */
export function getEndIndex(state: PaginationState): number {
  return Math.min((state.page + 1) * state.pageSize, state.totalItems);
}

/**
 * Get comprehensive page info
 */
export function getPageInfo(state: PaginationState): PageInfo {
  const totalPages = getTotalPages(state);
  const startIndex = getStartIndex(state);
  const endIndex = getEndIndex(state);

  return {
    page: state.page,
    pageSize: state.pageSize,
    totalItems: state.totalItems,
    totalPages,
    startIndex,
    endIndex,
    itemsOnPage: endIndex - startIndex,
    canPrevious: state.page > 0,
    canNext: state.page < totalPages - 1,
    isFirstPage: state.page === 0,
    isLastPage: state.page >= totalPages - 1,
  };
}

/**
 * Go to a specific page
 */
export function goToPage(state: PaginationState, page: number): PaginationState {
  const totalPages = getTotalPages(state);
  const validPage = Math.max(0, Math.min(page, totalPages - 1));

  return {
    ...state,
    page: validPage,
  };
}

/**
 * Go to next page
 */
export function nextPage(state: PaginationState): PaginationState {
  return goToPage(state, state.page + 1);
}

/**
 * Go to previous page
 */
export function prevPage(state: PaginationState): PaginationState {
  return goToPage(state, state.page - 1);
}

/**
 * Go to first page
 */
export function firstPage(state: PaginationState): PaginationState {
  return goToPage(state, 0);
}

/**
 * Go to last page
 */
export function lastPage(state: PaginationState): PaginationState {
  const totalPages = getTotalPages(state);
  return goToPage(state, totalPages - 1);
}

/**
 * Set page size (resets to first page)
 */
export function setPageSize(state: PaginationState, pageSize: number): PaginationState {
  const newPageSize = Math.max(1, pageSize);
  // Calculate which page the current first item would be on with new page size
  const currentFirstItem = state.page * state.pageSize;
  const newPage = Math.floor(currentFirstItem / newPageSize);

  return {
    ...state,
    pageSize: newPageSize,
    page: Math.max(0, Math.min(newPage, Math.ceil(state.totalItems / newPageSize) - 1)),
  };
}

/**
 * Update total items count
 */
export function setTotalItems(state: PaginationState, totalItems: number): PaginationState {
  const newTotalItems = Math.max(0, totalItems);
  const totalPages = Math.ceil(newTotalItems / state.pageSize) || 1;

  return {
    ...state,
    totalItems: newTotalItems,
    page: Math.min(state.page, totalPages - 1),
  };
}

/**
 * Paginate an array of data
 */
export function paginateData<T>(data: T[], state: PaginationState): T[] {
  const startIndex = getStartIndex(state);
  const endIndex = getEndIndex(state);
  return data.slice(startIndex, endIndex);
}

/**
 * Generate page numbers for pagination UI
 */
export function getPageNumbers(
  state: PaginationState,
  options: {
    maxVisible?: number;
    showFirstLast?: boolean;
  } = {}
): Array<number | 'ellipsis'> {
  const { maxVisible = 7, showFirstLast = true } = options;
  const totalPages = getTotalPages(state);
  const currentPage = state.page;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages: Array<number | 'ellipsis'> = [];
  const sidePages = Math.floor((maxVisible - 3) / 2); // -3 for first, last, and current

  // Always show first page
  if (showFirstLast) {
    pages.push(0);
  }

  // Calculate range around current page
  let rangeStart = Math.max(1, currentPage - sidePages);
  let rangeEnd = Math.min(totalPages - 2, currentPage + sidePages);

  // Adjust range if near boundaries
  if (currentPage <= sidePages + 1) {
    rangeEnd = Math.min(totalPages - 2, maxVisible - 2);
  } else if (currentPage >= totalPages - sidePages - 2) {
    rangeStart = Math.max(1, totalPages - maxVisible + 1);
  }

  // Add ellipsis after first page if needed
  if (rangeStart > 1) {
    pages.push('ellipsis');
  }

  // Add range pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if needed
  if (rangeEnd < totalPages - 2) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (showFirstLast && totalPages > 1) {
    pages.push(totalPages - 1);
  }

  return pages;
}

/**
 * Get display text for current page range
 */
export function getPageRangeText(state: PaginationState): string {
  if (state.totalItems === 0) {
    return 'No items';
  }

  const startIndex = getStartIndex(state);
  const endIndex = getEndIndex(state);

  return `${startIndex + 1}-${endIndex} of ${state.totalItems}`;
}

/**
 * Parse pagination from URL params
 */
export function parsePaginationParams(
  params: URLSearchParams,
  defaults: { pageSize?: number } = {}
): PaginationState {
  const page = parseInt(params.get('page') ?? '0', 10);
  const pageSize = parseInt(params.get('pageSize') ?? String(defaults.pageSize ?? 10), 10);

  return {
    page: Math.max(0, page),
    pageSize: Math.max(1, pageSize),
    totalItems: 0,
  };
}

/**
 * Serialize pagination to URL params
 */
export function serializePaginationParams(state: PaginationState): URLSearchParams {
  const params = new URLSearchParams();
  params.set('page', String(state.page));
  params.set('pageSize', String(state.pageSize));
  return params;
}

/**
 * Default page size options
 */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Calculate optimal page size based on viewport height
 */
export function calculateOptimalPageSize(
  viewportHeight: number,
  rowHeight: number,
  headerHeight = 56,
  paginationHeight = 56,
  toolbarHeight = 56,
  options = DEFAULT_PAGE_SIZE_OPTIONS
): number {
  const availableHeight = viewportHeight - headerHeight - paginationHeight - toolbarHeight;
  const fittingRows = Math.floor(availableHeight / rowHeight);

  // Find the closest page size option
  const validOptions = options.filter((size) => size <= Math.max(10, fittingRows));
  return validOptions.length > 0 ? validOptions[validOptions.length - 1] : options[0];
}
