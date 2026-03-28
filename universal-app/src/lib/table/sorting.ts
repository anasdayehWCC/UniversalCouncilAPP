/**
 * Table Sorting Utilities
 * Multi-column sorting logic for the data table
 */

import type { RowData, SortConfig, SortDirection, ColumnDef } from './types';

/**
 * Get the next sort direction in the cycle: null -> asc -> desc -> null
 */
export function getNextSortDirection(current: SortDirection): SortDirection {
  switch (current) {
    case null:
      return 'asc';
    case 'asc':
      return 'desc';
    case 'desc':
      return null;
    default:
      return 'asc';
  }
}

/**
 * Get the sort direction for a specific column
 */
export function getColumnSortDirection(
  sortConfig: SortConfig[],
  columnId: string
): SortDirection {
  const config = sortConfig.find((s) => s.column === columnId);
  return config?.direction ?? null;
}

/**
 * Get the sort index for a column (for multi-column sort display)
 */
export function getColumnSortIndex(
  sortConfig: SortConfig[],
  columnId: string
): number | null {
  const index = sortConfig.findIndex((s) => s.column === columnId);
  return index >= 0 ? index + 1 : null;
}

/**
 * Toggle sort for a column, supporting multi-column sorting
 */
export function toggleColumnSort(
  sortConfig: SortConfig[],
  columnId: string,
  multiSort = false
): SortConfig[] {
  const existingIndex = sortConfig.findIndex((s) => s.column === columnId);
  const existing = existingIndex >= 0 ? sortConfig[existingIndex] : null;
  const nextDirection = getNextSortDirection(existing?.direction ?? null);

  if (!multiSort) {
    // Single column sort - replace entire config
    if (nextDirection === null) {
      return [];
    }
    return [{ column: columnId, direction: nextDirection }];
  }

  // Multi-column sort
  if (nextDirection === null) {
    // Remove this column from sort
    return sortConfig.filter((s) => s.column !== columnId);
  }

  if (existingIndex >= 0) {
    // Update existing sort
    const newConfig = [...sortConfig];
    newConfig[existingIndex] = { column: columnId, direction: nextDirection };
    return newConfig;
  }

  // Add new sort column
  return [...sortConfig, { column: columnId, direction: nextDirection }];
}

/**
 * Set sort for a specific column
 */
export function setColumnSort(
  sortConfig: SortConfig[],
  columnId: string,
  direction: SortDirection,
  multiSort = false
): SortConfig[] {
  if (!multiSort) {
    if (direction === null) {
      return [];
    }
    return [{ column: columnId, direction }];
  }

  const existingIndex = sortConfig.findIndex((s) => s.column === columnId);

  if (direction === null) {
    return sortConfig.filter((s) => s.column !== columnId);
  }

  if (existingIndex >= 0) {
    const newConfig = [...sortConfig];
    newConfig[existingIndex] = { column: columnId, direction };
    return newConfig;
  }

  return [...sortConfig, { column: columnId, direction }];
}

/**
 * Get value from row using column accessor
 */
export function getCellValue<T extends RowData>(
  row: T,
  column: ColumnDef<T>
): unknown {
  if (typeof column.accessor === 'function') {
    return column.accessor(row);
  }
  return row[column.accessor as keyof T];
}

/**
 * Compare two values for sorting
 */
export function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
  const multiplier = direction === 'asc' ? 1 : -1;

  // Handle null/undefined
  if (a == null && b == null) return 0;
  if (a == null) return multiplier;
  if (b == null) return -multiplier;

  // Handle numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * multiplier;
  }

  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return (a.getTime() - b.getTime()) * multiplier;
  }

  // Handle booleans
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return (Number(a) - Number(b)) * multiplier;
  }

  // Handle strings (case-insensitive)
  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();
  return strA.localeCompare(strB) * multiplier;
}

/**
 * Sort data by multiple columns
 */
export function sortData<T extends RowData>(
  data: T[],
  sortConfig: SortConfig[],
  columns: ColumnDef<T>[]
): T[] {
  if (sortConfig.length === 0) {
    return data;
  }

  const columnMap = new Map(columns.map((c) => [c.id, c]));

  return [...data].sort((a, b) => {
    for (const { column, direction } of sortConfig) {
      if (!direction) continue;

      const columnDef = columnMap.get(column);
      if (!columnDef) continue;

      const valueA = getCellValue(a, columnDef);
      const valueB = getCellValue(b, columnDef);
      const comparison = compareValues(valueA, valueB, direction);

      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  });
}

/**
 * Create a sort comparator function for a column
 */
export function createSortComparator<T extends RowData>(
  column: ColumnDef<T>,
  direction: 'asc' | 'desc'
): (a: T, b: T) => number {
  return (a: T, b: T) => {
    const valueA = getCellValue(a, column);
    const valueB = getCellValue(b, column);
    return compareValues(valueA, valueB, direction);
  };
}

/**
 * Parse sort string (e.g., "name:asc,createdAt:desc")
 */
export function parseSortString(sortString: string): SortConfig[] {
  if (!sortString) return [];

  return sortString.split(',').map((part) => {
    const [column, direction] = part.trim().split(':');
    return {
      column,
      direction: (direction as SortDirection) ?? 'asc',
    };
  });
}

/**
 * Serialize sort config to string
 */
export function serializeSortConfig(sortConfig: SortConfig[]): string {
  return sortConfig
    .filter((s) => s.direction)
    .map((s) => `${s.column}:${s.direction}`)
    .join(',');
}
