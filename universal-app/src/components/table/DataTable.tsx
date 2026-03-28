'use client';

/**
 * DataTable Component
 * Main table component with sorting, selection, pagination, and filtering
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { TablePagination } from './TablePagination';
import { TableToolbar } from './TableToolbar';
import { useTable } from '@/hooks/useTable';
import type {
  RowData,
  ColumnDef,
  TableConfig,
  TableToolbarConfig,
  TableInstance,
} from '@/lib/table/types';

export interface DataTableProps<T extends RowData = RowData>
  extends Omit<TableConfig<T>, 'data' | 'columns'> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Table data */
  data: T[];
  /** Toolbar configuration */
  toolbar?: TableToolbarConfig<T>;
  /** Table caption for accessibility */
  caption?: string;
  /** External table instance (controlled mode) */
  tableInstance?: TableInstance<T>;
  /** Additional class name */
  className?: string;
  /** Table ID for accessibility */
  id?: string;
  /** Enable virtual scrolling for large datasets */
  virtualScroll?: boolean;
  /** Render loading skeleton */
  loadingSkeleton?: React.ReactNode;
  /** Render empty state */
  emptyState?: React.ReactNode;
}

export function DataTable<T extends RowData = RowData>({
  columns,
  data,
  toolbar,
  caption,
  tableInstance: externalInstance,
  className,
  id,
  virtualScroll = false,
  loadingSkeleton,
  emptyState,
  sortable = true,
  paginated = true,
  selectable = false,
  filterable = true,
  searchable = true,
  loading = false,
  emptyMessage = 'No data available',
  dense = false,
  striped = false,
  hoverable = true,
  bordered = false,
  stickyHeader = true,
  maxHeight,
  onRowClick,
  onRowDoubleClick,
  rowClassName,
  rowIdKey = 'id' as keyof T,
  paginationConfig,
  selectionConfig,
  ...restConfig
}: DataTableProps<T>) {
  // Use internal or external table instance
  const internalInstance = useTable<T>({
    columns,
    data,
    sortable,
    paginated,
    selectable,
    filterable,
    searchable,
    rowIdKey,
    paginationConfig,
    selectionConfig,
    ...restConfig,
  });

  const table = externalInstance ?? internalInstance;

  // Determine visible columns (hide on mobile)
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visibleColumns = React.useMemo(
    () => columns.filter((col) => !(isMobile && col.hideOnMobile)),
    [columns, isMobile]
  );

  // Loading state
  const isLoading = loading || table.loading;

  // Empty state
  const isEmpty = !isLoading && table.displayData.length === 0;

  const tableId = id ?? React.useId();

  return (
    <div
      className={cn(
        'flex flex-col w-full rounded-lg border border-border/50 bg-card overflow-hidden',
        className
      )}
    >
      {/* Toolbar */}
      {toolbar && (
        <TableToolbar<T>
          table={table}
          config={toolbar}
          searchable={searchable}
          filterable={filterable}
          columns={columns}
        />
      )}

      {/* Table Container */}
      <div
        className={cn(
          'relative w-full overflow-auto',
          maxHeight && `max-h-[${maxHeight}]`
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table
          id={tableId}
          role="grid"
          aria-busy={isLoading}
          aria-describedby={caption ? `${tableId}-caption` : undefined}
          className={cn(
            'w-full border-collapse text-sm',
            bordered && 'border border-border'
          )}
        >
          {caption && (
            <caption id={`${tableId}-caption`} className="sr-only">
              {caption}
            </caption>
          )}

          {/* Header */}
          <thead
            className={cn(
              'bg-muted/50',
              stickyHeader && 'sticky top-0 z-10 shadow-sm'
            )}
          >
            <tr>
              {/* Selection checkbox column */}
              {selectable && (
                <th
                  scope="col"
                  className={cn(
                    'w-12 px-3 py-3 text-left font-medium text-muted-foreground',
                    bordered && 'border-b border-r border-border'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={table.isAllSelected()}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = table.isSomeSelected();
                      }
                    }}
                    onChange={table.toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {/* Data columns */}
              {visibleColumns.map((column) => (
                <TableHeader<T>
                  key={column.id}
                  column={column}
                  sortConfig={table.sortConfig}
                  onSort={sortable ? table.toggleSort : undefined}
                  dense={dense}
                  bordered={bordered}
                />
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-border/50">
            {isLoading && loadingSkeleton ? (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0)}>
                  {loadingSkeleton}
                </td>
              </tr>
            ) : isLoading ? (
              // Default loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && (
                    <td className="px-3 py-3">
                      <div className="h-4 w-4 rounded bg-muted" />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={col.id} className="px-4 py-3">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isEmpty ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {emptyState ?? (
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="h-12 w-12 text-muted-foreground/50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>{emptyMessage}</span>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              table.displayData.map((row, rowIndex) => (
                <TableRow<T>
                  key={row[rowIdKey] as string | number}
                  row={row}
                  rowIndex={rowIndex}
                  columns={visibleColumns}
                  selectable={selectable}
                  selected={table.isSelected(row[rowIdKey] as string | number)}
                  onSelect={() =>
                    table.toggleRowSelection(row[rowIdKey] as string | number)
                  }
                  onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                  onDoubleClick={
                    onRowDoubleClick
                      ? () => onRowDoubleClick(row, rowIndex)
                      : undefined
                  }
                  dense={dense}
                  striped={striped}
                  hoverable={hoverable}
                  bordered={bordered}
                  className={
                    typeof rowClassName === 'function'
                      ? rowClassName(row, rowIndex)
                      : rowClassName
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && !isEmpty && (
        <TablePagination
          page={table.page}
          pageSize={table.pageSize}
          totalItems={table.totalItems}
          onPageChange={table.goToPage}
          onPageSizeChange={table.setPageSize}
          pageSizeOptions={paginationConfig?.pageSizeOptions}
          dense={dense}
        />
      )}
    </div>
  );
}
