'use client';

/**
 * useTable Hook
 * Table state management with sorting, selection, pagination, and filtering
 */

import * as React from 'react';
import type {
  RowData,
  ColumnDef,
  SortConfig,
  FilterConfig,
  TableState,
  TableActions,
  TableInstance,
  PaginationConfig,
  SelectionConfig,
  TableConfig,
  SortDirection,
} from '@/lib/table/types';
import {
  sortData,
  toggleColumnSort,
  setColumnSort,
} from '@/lib/table/sorting';
import {
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
  getSelectedRows,
} from '@/lib/table/selection';
import {
  createPaginationState,
  paginateData,
  goToPage,
  nextPage,
  prevPage,
  setPageSize,
  setTotalItems,
} from '@/lib/table/pagination';
import { getCellValue } from '@/lib/table/sorting';

export interface UseTableOptions<T extends RowData = RowData>
  extends Omit<TableConfig<T>, 'data' | 'columns'> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Table data */
  data: T[];
}

/**
 * Filter data based on filter configurations
 */
function filterData<T extends RowData>(
  data: T[],
  filters: FilterConfig[],
  columns: ColumnDef<T>[]
): T[] {
  if (filters.length === 0) return data;

  const columnMap = new Map(columns.map((c) => [c.id, c]));

  return data.filter((row) => {
    return filters.every((filter) => {
      const column = columnMap.get(filter.column);
      if (!column || filter.value === null || filter.value === '') return true;

      const cellValue = getCellValue(row, column);
      const filterValue = filter.value;
      const operator = filter.operator ?? 'contains';

      if (cellValue === null || cellValue === undefined) return false;

      const stringValue = String(cellValue).toLowerCase();
      const stringFilter = String(filterValue).toLowerCase();

      switch (operator) {
        case 'equals':
          return stringValue === stringFilter;
        case 'contains':
          return stringValue.includes(stringFilter);
        case 'startsWith':
          return stringValue.startsWith(stringFilter);
        case 'endsWith':
          return stringValue.endsWith(stringFilter);
        case 'gt':
          return Number(cellValue) > Number(filterValue);
        case 'lt':
          return Number(cellValue) < Number(filterValue);
        case 'gte':
          return Number(cellValue) >= Number(filterValue);
        case 'lte':
          return Number(cellValue) <= Number(filterValue);
        default:
          return stringValue.includes(stringFilter);
      }
    });
  });
}

/**
 * Search data across multiple columns
 */
function searchData<T extends RowData>(
  data: T[],
  searchTerm: string,
  columns: ColumnDef<T>[],
  searchableColumns?: string[]
): T[] {
  if (!searchTerm.trim()) return data;

  const term = searchTerm.toLowerCase().trim();
  const columnsToSearch = searchableColumns
    ? columns.filter((c) => searchableColumns.includes(c.id))
    : columns.filter((c) => c.filterable !== false);

  return data.filter((row) => {
    return columnsToSearch.some((column) => {
      const value = getCellValue(row, column);
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(term);
    });
  });
}

export function useTable<T extends RowData = RowData>(
  options: UseTableOptions<T>
): TableInstance<T> {
  const {
    columns,
    data,
    sortable = true,
    sortConfig: initialSortConfig = [],
    paginated = true,
    paginationConfig,
    selectable = false,
    selectionConfig,
    filterable = true,
    filters: initialFilters = [],
    searchTerm: initialSearchTerm = '',
    searchable = true,
    searchableColumns,
    rowIdKey = 'id' as keyof T,
    serverSide = false,
    onFetch,
  } = options;

  // State
  const [sortConfig, setSortConfig] = React.useState<SortConfig[]>(initialSortConfig);
  const [filters, setFilters] = React.useState<FilterConfig[]>(initialFilters);
  const [searchTerm, setSearchTermState] = React.useState(initialSearchTerm);
  const [loading, setLoading] = React.useState(false);
  const [serverData, setServerData] = React.useState<T[]>([]);

  // Selection state
  const [selectionState, setSelectionState] = React.useState(() =>
    createSelectionState(
      selectionConfig?.mode ?? 'multiple',
      selectionConfig?.selectedIds
        ? Array.from(selectionConfig.selectedIds)
        : []
    )
  );

  // Pagination state
  const [paginationState, setPaginationState] = React.useState(() =>
    createPaginationState(
      paginationConfig?.pageSize ?? 10,
      paginationConfig?.totalItems ?? data.length
    )
  );

  // Process data (client-side)
  const processedData = React.useMemo(() => {
    if (serverSide) return serverData;

    let result = [...data];

    // Apply search
    if (searchable && searchTerm) {
      result = searchData(result, searchTerm, columns, searchableColumns);
    }

    // Apply filters
    if (filterable && filters.length > 0) {
      result = filterData(result, filters, columns);
    }

    // Apply sorting
    if (sortable && sortConfig.length > 0) {
      result = sortData(result, sortConfig, columns);
    }

    return result;
  }, [
    data,
    serverData,
    serverSide,
    searchTerm,
    searchable,
    filters,
    filterable,
    sortConfig,
    sortable,
    columns,
    searchableColumns,
  ]);

  // Update total items when processed data changes
  React.useEffect(() => {
    if (!serverSide) {
      setPaginationState((prev) => setTotalItems(prev, processedData.length));
    }
  }, [processedData.length, serverSide]);

  // Paginated data
  const displayData = React.useMemo(() => {
    if (!paginated) return processedData;
    return paginateData(processedData, paginationState);
  }, [processedData, paginated, paginationState]);

  // Server-side data fetching
  const fetchData = React.useCallback(async () => {
    if (!serverSide || !onFetch) return;

    setLoading(true);
    try {
      const result = await onFetch({
        page: paginationState.page,
        pageSize: paginationState.pageSize,
        sortConfig,
        filters,
        searchTerm,
      });
      setServerData(result.data);
      setPaginationState((prev) => setTotalItems(prev, result.totalItems));
    } catch (error) {
      console.error('Table fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [serverSide, onFetch, paginationState.page, paginationState.pageSize, sortConfig, filters, searchTerm]);

  // Fetch data on params change (server-side)
  React.useEffect(() => {
    if (serverSide) {
      fetchData();
    }
  }, [fetchData, serverSide]);

  // Actions
  const actions: TableActions<T> = React.useMemo(
    () => ({
      // Sorting
      setSort: (column: string, direction: SortDirection) => {
        setSortConfig((prev) => setColumnSort(prev, column, direction));
      },
      toggleSort: (column: string) => {
        setSortConfig((prev) => toggleColumnSort(prev, column));
      },
      clearSort: () => setSortConfig([]),

      // Pagination
      goToPage: (page: number) => {
        setPaginationState((prev) => goToPage(prev, page));
      },
      nextPage: () => {
        setPaginationState((prev) => nextPage(prev));
      },
      prevPage: () => {
        setPaginationState((prev) => prevPage(prev));
      },
      setPageSize: (size: number) => {
        setPaginationState((prev) => setPageSize(prev, size));
      },

      // Selection
      selectRow: (id: string | number) => {
        setSelectionState((prev) => selectRow(prev, id));
        selectionConfig?.onSelectionChange?.(
          new Set([...selectionState.selectedIds, id])
        );
      },
      deselectRow: (id: string | number) => {
        setSelectionState((prev) => deselectRow(prev, id));
        const newSelected = new Set(selectionState.selectedIds);
        newSelected.delete(id);
        selectionConfig?.onSelectionChange?.(newSelected);
      },
      toggleRowSelection: (id: string | number) => {
        setSelectionState((prev) => toggleRowSelection(prev, id));
      },
      selectAll: () => {
        setSelectionState((prev) => selectAllRows(prev, displayData, rowIdKey));
      },
      deselectAll: () => {
        setSelectionState((prev) => deselectAllRows(prev));
        selectionConfig?.onSelectionChange?.(new Set());
      },
      toggleSelectAll: () => {
        setSelectionState((prev) => toggleSelectAll(prev, displayData, rowIdKey));
      },
      isSelected: (id: string | number) => isRowSelected(selectionState, id),
      isAllSelected: () => isAllSelected(selectionState, displayData, rowIdKey),
      isSomeSelected: () => isSomeSelected(selectionState, displayData, rowIdKey),

      // Filtering
      setFilter: (filter: FilterConfig) => {
        setFilters((prev) => {
          const existingIndex = prev.findIndex((f) => f.column === filter.column);
          if (existingIndex >= 0) {
            const newFilters = [...prev];
            newFilters[existingIndex] = filter;
            return newFilters;
          }
          return [...prev, filter];
        });
        // Reset to first page when filtering
        setPaginationState((prev) => goToPage(prev, 0));
      },
      removeFilter: (column: string) => {
        setFilters((prev) => prev.filter((f) => f.column !== column));
      },
      clearFilters: () => setFilters([]),

      // Search
      setSearchTerm: (term: string) => {
        setSearchTermState(term);
        // Reset to first page when searching
        setPaginationState((prev) => goToPage(prev, 0));
      },
      clearSearch: () => setSearchTermState(''),

      // Reset
      reset: () => {
        setSortConfig(initialSortConfig);
        setFilters(initialFilters);
        setSearchTermState(initialSearchTerm);
        setPaginationState(
          createPaginationState(
            paginationConfig?.pageSize ?? 10,
            data.length
          )
        );
        setSelectionState(
          createSelectionState(
            selectionConfig?.mode ?? 'multiple',
            selectionConfig?.selectedIds
              ? Array.from(selectionConfig.selectedIds)
              : []
          )
        );
      },

      // Refresh (server-side)
      refresh: fetchData,

      // Get selected rows
      getSelectedRows: () =>
        getSelectedRows(selectionState, displayData, rowIdKey),
    }),
    [
      displayData,
      rowIdKey,
      selectionState,
      selectionConfig,
      initialSortConfig,
      initialFilters,
      initialSearchTerm,
      paginationConfig,
      data.length,
      fetchData,
    ]
  );

  // Return table instance
  return {
    // State
    displayData,
    sortConfig,
    page: paginationState.page,
    pageSize: paginationState.pageSize,
    totalItems: paginationState.totalItems,
    selectedIds: selectionState.selectedIds,
    filters,
    searchTerm,
    loading,

    // Actions
    ...actions,
  };
}

