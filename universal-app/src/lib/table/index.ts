/**
 * Table Library Exports
 */

// Types
export type {
  SortDirection,
  SortConfig,
  ColumnDef,
  RowData,
  PaginationConfig,
  FilterConfig,
  SelectionConfig,
  TableConfig,
  TableFetchParams,
  TableFetchResult,
  TableState,
  TableActions,
  TableInstance,
  BulkAction,
  TableToolbarConfig,
} from './types';

// Sorting utilities
export {
  getNextSortDirection,
  getColumnSortDirection,
  getColumnSortIndex,
  toggleColumnSort,
  setColumnSort,
  getCellValue,
  compareValues,
  sortData,
  createSortComparator,
  parseSortString,
  serializeSortConfig,
} from './sorting';

// Selection utilities
export type { SelectionMode, SelectionState } from './selection';
export {
  createSelectionState,
  selectRow,
  deselectRow,
  toggleRowSelection,
  selectAllRows,
  deselectAllRows,
  toggleSelectAll,
  isRowSelected,
  isAllSelected,
  isSomeSelected,
  getSelectionCount,
  getSelectedRows,
  selectRange,
  serializeSelection,
  deserializeSelection,
  filterValidSelection,
} from './selection';

// Pagination utilities
export type { PaginationState, PageInfo } from './pagination';
export {
  createPaginationState,
  getTotalPages,
  getStartIndex,
  getEndIndex,
  getPageInfo,
  goToPage,
  nextPage,
  prevPage,
  firstPage,
  lastPage,
  setPageSize,
  setTotalItems,
  paginateData,
  getPageNumbers,
  getPageRangeText,
  parsePaginationParams,
  serializePaginationParams,
  DEFAULT_PAGE_SIZE_OPTIONS,
  calculateOptimalPageSize,
} from './pagination';
