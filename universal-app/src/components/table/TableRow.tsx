'use client';

/**
 * TableRow Component
 * Selectable row for the data table
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getCellValue } from '@/lib/table/sorting';
import type { ColumnDef, RowData } from '@/lib/table/types';

export interface TableRowProps<T extends RowData = RowData> {
  /** Row data */
  row: T;
  /** Row index */
  rowIndex: number;
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Enable selection */
  selectable?: boolean;
  /** Is row selected */
  selected?: boolean;
  /** Selection change handler */
  onSelect?: () => void;
  /** Row click handler */
  onClick?: () => void;
  /** Row double click handler */
  onDoubleClick?: () => void;
  /** Dense mode */
  dense?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Hoverable */
  hoverable?: boolean;
  /** Bordered */
  bordered?: boolean;
  /** Additional class name */
  className?: string;
}

export function TableRow<T extends RowData = RowData>({
  row,
  rowIndex,
  columns,
  selectable = false,
  selected = false,
  onSelect,
  onClick,
  onDoubleClick,
  dense = false,
  striped = false,
  hoverable = true,
  bordered = false,
  className,
}: TableRowProps<T>) {
  const isClickable = onClick || onDoubleClick;

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger row click when clicking checkbox
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    onClick?.();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    onDoubleClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (isClickable) {
        e.preventDefault();
        onClick?.();
      }
    }
  };

  return (
    <tr
      role="row"
      aria-selected={selectable ? selected : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onDoubleClick={onDoubleClick ? handleDoubleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      className={cn(
        'transition-colors',
        striped && rowIndex % 2 === 1 && 'bg-muted/30',
        hoverable && 'hover:bg-muted/50',
        selected && 'bg-primary/5 hover:bg-primary/10',
        isClickable && 'cursor-pointer',
        bordered && 'border-b border-border',
        className
      )}
    >
      {/* Selection checkbox */}
      {selectable && (
        <td
          className={cn(
            'w-12',
            dense ? 'px-3 py-2' : 'px-3 py-3',
            bordered && 'border-r border-border'
          )}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            aria-label={`Select row ${rowIndex + 1}`}
          />
        </td>
      )}

      {/* Data cells */}
      {columns.map((column) => {
        const value = getCellValue(row, column);

        // Get alignment class
        const alignClass = {
          left: 'text-left',
          center: 'text-center',
          right: 'text-right',
        }[column.align ?? 'left'];

        // Get sticky class
        const stickyClass = column.sticky
          ? column.sticky === 'left'
            ? 'sticky left-0 z-10 bg-card'
            : 'sticky right-0 z-10 bg-card'
          : '';

        return (
          <td
            key={column.id}
            role="gridcell"
            className={cn(
              'text-foreground',
              dense ? 'px-3 py-2' : 'px-4 py-3',
              alignClass,
              stickyClass,
              bordered && 'border-r border-border last:border-r-0',
              selected && column.sticky && 'bg-primary/5'
            )}
            style={{
              width: column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
            }}
          >
            {column.cell
              ? column.cell(value, row, rowIndex)
              : renderCellValue(value)}
          </td>
        );
      })}
    </tr>
  );
}

/**
 * Default cell value renderer
 */
function renderCellValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success dark:bg-success/20 dark:text-success">
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground dark:bg-muted dark:text-muted-foreground">
        No
      </span>
    );
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}


