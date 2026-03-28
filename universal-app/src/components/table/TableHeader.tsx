'use client';

/**
 * TableHeader Component
 * Sortable header cell for the data table
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getColumnSortDirection, getColumnSortIndex } from '@/lib/table/sorting';
import type { ColumnDef, RowData, SortConfig, SortDirection } from '@/lib/table/types';

export interface TableHeaderProps<T extends RowData = RowData> {
  /** Column definition */
  column: ColumnDef<T>;
  /** Current sort configuration */
  sortConfig: SortConfig[];
  /** Sort click handler */
  onSort?: (columnId: string) => void;
  /** Dense mode */
  dense?: boolean;
  /** Bordered style */
  bordered?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Sort indicator icon
 */
function SortIcon({
  direction,
  isActive,
}: {
  direction: SortDirection;
  isActive: boolean;
}) {
  return (
    <span
      className={cn(
        'ml-1 inline-flex flex-col transition-opacity',
        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
      )}
    >
      {direction === 'asc' ? (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      ) : direction === 'desc' ? (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )}
    </span>
  );
}

export function TableHeader<T extends RowData = RowData>({
  column,
  sortConfig,
  onSort,
  dense = false,
  bordered = false,
  className,
}: TableHeaderProps<T>) {
  const sortDirection = getColumnSortDirection(sortConfig, column.id);
  const sortIndex = getColumnSortIndex(sortConfig, column.id);
  const isSortable = column.sortable !== false && onSort;
  const isActive = sortDirection !== null;

  const handleClick = () => {
    if (isSortable) {
      onSort(column.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isSortable) {
      e.preventDefault();
      onSort(column.id);
    }
  };

  // Get alignment class
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[column.align ?? 'left'];

  // Get sticky class
  const stickyClass = column.sticky
    ? column.sticky === 'left'
      ? 'sticky left-0 z-20 bg-muted/50'
      : 'sticky right-0 z-20 bg-muted/50'
    : '';

  return (
    <th
      scope="col"
      role="columnheader"
      aria-sort={
        sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
          ? 'descending'
          : 'none'
      }
      tabIndex={isSortable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group font-medium text-muted-foreground transition-colors',
        dense ? 'px-3 py-2' : 'px-4 py-3',
        alignClass,
        stickyClass,
        isSortable && 'cursor-pointer select-none hover:text-foreground hover:bg-muted/80',
        isActive && 'text-foreground',
        bordered && 'border-b border-r border-border last:border-r-0',
        className
      )}
      style={{
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
      }}
    >
      <div
        className={cn(
          'flex items-center gap-1',
          column.align === 'center' && 'justify-center',
          column.align === 'right' && 'justify-end'
        )}
      >
        {/* Custom header renderer or default */}
        {column.headerCell ? column.headerCell() : column.header}

        {/* Sort indicator */}
        {isSortable && <SortIcon direction={sortDirection} isActive={isActive} />}

        {/* Multi-sort index badge */}
        {sortIndex !== null && sortConfig.length > 1 && (
          <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
            {sortIndex}
          </span>
        )}
      </div>
    </th>
  );
}
