/**
 * Data Table Types
 * Core type definitions for the table component system
 */

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface ColumnDef<T = Record<string, unknown>> {
  /** Unique column identifier */
  id: string;
  /** Display header text */
  header: string;
  /** Accessor key or function to get cell value */
  accessor: keyof T | ((row: T) => unknown);
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Column width (CSS value) */
  width?: string;
  /** Minimum width (CSS value) */
  minWidth?: string;
  /** Maximum width (CSS value) */
  maxWidth?: string;
  /** Custom cell renderer */
  cell?: (value: unknown, row: T, rowIndex: number) => React.ReactNode;
  /** Custom header renderer */
  headerCell?: () => React.ReactNode;
  /** Hide column on mobile */
  hideOnMobile?: boolean;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Enable filtering for this column */
  filterable?: boolean;
  /** Filter type */
  filterType?: 'text' | 'select' | 'date' | 'number' | 'boolean';
  /** Filter options for select type */
  filterOptions?: Array<{ label: string; value: string }>;
  /** Sticky column position */
  sticky?: 'left' | 'right';
  /** Column group */
  group?: string;
}

export interface RowData {
  id: string | number;
  [key: string]: unknown;
}

export interface PaginationConfig {
  /** Current page (0-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Available page size options */
  pageSizeOptions?: number[];
}

export interface FilterConfig {
  column: string;
  value: string | number | boolean | null;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
}

export interface SelectionConfig {
  /** Enable row selection */
  enabled: boolean;
  /** Selection mode */
  mode: 'single' | 'multiple';
  /** Currently selected row IDs */
  selectedIds: Set<string | number>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
}

export interface TableConfig<T extends RowData = RowData> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Table data */
  data: T[];
  /** Unique row identifier key */
  rowIdKey?: keyof T;
  /** Enable sorting */
  sortable?: boolean;
  /** Current sort configuration */
  sortConfig?: SortConfig[];
  /** Enable pagination */
  paginated?: boolean;
  /** Pagination configuration */
  paginationConfig?: PaginationConfig;
  /** Enable row selection */
  selectable?: boolean;
  /** Selection configuration */
  selectionConfig?: SelectionConfig;
  /** Enable filtering */
  filterable?: boolean;
  /** Current filters */
  filters?: FilterConfig[];
  /** Global search term */
  searchTerm?: string;
  /** Enable global search */
  searchable?: boolean;
  /** Searchable columns (defaults to all filterable columns) */
  searchableColumns?: string[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Dense mode (reduced padding) */
  dense?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Row hover effect */
  hoverable?: boolean;
  /** Bordered cells */
  bordered?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Max height for scrollable table */
  maxHeight?: string;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Row double click handler */
  onRowDoubleClick?: (row: T, index: number) => void;
  /** Custom row class */
  rowClassName?: string | ((row: T, index: number) => string);
  /** Server-side mode */
  serverSide?: boolean;
  /** Server-side data fetch callback */
  onFetch?: (params: TableFetchParams) => Promise<TableFetchResult<T>>;
}

export interface TableFetchParams {
  page: number;
  pageSize: number;
  sortConfig: SortConfig[];
  filters: FilterConfig[];
  searchTerm: string;
}

export interface TableFetchResult<T> {
  data: T[];
  totalItems: number;
}

export interface TableState<T extends RowData = RowData> {
  /** Processed/displayed data */
  displayData: T[];
  /** Current sort configuration */
  sortConfig: SortConfig[];
  /** Current page */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total items */
  totalItems: number;
  /** Selected row IDs */
  selectedIds: Set<string | number>;
  /** Current filters */
  filters: FilterConfig[];
  /** Search term */
  searchTerm: string;
  /** Loading state */
  loading: boolean;
}

export interface TableActions<T extends RowData = RowData> {
  /** Set sort configuration */
  setSort: (column: string, direction: SortDirection) => void;
  /** Toggle sort for a column */
  toggleSort: (column: string) => void;
  /** Clear all sorting */
  clearSort: () => void;
  /** Go to page */
  goToPage: (page: number) => void;
  /** Next page */
  nextPage: () => void;
  /** Previous page */
  prevPage: () => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Select row */
  selectRow: (id: string | number) => void;
  /** Deselect row */
  deselectRow: (id: string | number) => void;
  /** Toggle row selection */
  toggleRowSelection: (id: string | number) => void;
  /** Select all rows */
  selectAll: () => void;
  /** Deselect all rows */
  deselectAll: () => void;
  /** Toggle select all */
  toggleSelectAll: () => void;
  /** Check if row is selected */
  isSelected: (id: string | number) => boolean;
  /** Check if all rows are selected */
  isAllSelected: () => boolean;
  /** Check if some rows are selected */
  isSomeSelected: () => boolean;
  /** Set filter */
  setFilter: (filter: FilterConfig) => void;
  /** Remove filter */
  removeFilter: (column: string) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Set search term */
  setSearchTerm: (term: string) => void;
  /** Clear search */
  clearSearch: () => void;
  /** Reset table state */
  reset: () => void;
  /** Refresh data (for server-side mode) */
  refresh: () => Promise<void>;
  /** Get selected rows data */
  getSelectedRows: () => T[];
}

export type TableInstance<T extends RowData = RowData> = TableState<T> & TableActions<T>;

export interface BulkAction<T extends RowData = RowData> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline';
  onClick: (selectedRows: T[]) => void | Promise<void>;
  disabled?: boolean | ((selectedRows: T[]) => boolean);
}

export interface TableToolbarConfig<T extends RowData = RowData> {
  /** Show search input */
  showSearch?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Show filter button */
  showFilters?: boolean;
  /** Show column visibility toggle */
  showColumnToggle?: boolean;
  /** Show density toggle */
  showDensityToggle?: boolean;
  /** Show export button */
  showExport?: boolean;
  /** Export formats */
  exportFormats?: Array<'csv' | 'xlsx' | 'pdf' | 'json'>;
  /** Bulk actions */
  bulkActions?: BulkAction<T>[];
  /** Custom toolbar actions */
  customActions?: React.ReactNode;
  /** Left side content */
  leftContent?: React.ReactNode;
  /** Right side content */
  rightContent?: React.ReactNode;
}
