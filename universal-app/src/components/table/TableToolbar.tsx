'use client';

/**
 * TableToolbar Component
 * Search, filters, and actions for the data table
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import type {
  ColumnDef,
  RowData,
  TableInstance,
  TableToolbarConfig,
  FilterConfig,
} from '@/lib/table/types';

export interface TableToolbarProps<T extends RowData = RowData> {
  /** Table instance */
  table: TableInstance<T>;
  /** Toolbar configuration */
  config: TableToolbarConfig<T>;
  /** Enable search */
  searchable?: boolean;
  /** Enable filtering */
  filterable?: boolean;
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Additional class name */
  className?: string;
}

export function TableToolbar<T extends RowData = RowData>({
  table,
  config,
  searchable = true,
  filterable = true,
  columns,
  className,
}: TableToolbarProps<T>) {
  const {
    showSearch = true,
    searchPlaceholder = 'Search...',
    showFilters = true,
    showColumnToggle = false,
    showDensityToggle = false,
    showExport = false,
    exportFormats = ['csv'],
    bulkActions = [],
    customActions,
    leftContent,
    rightContent,
  } = config;

  const [showFilterPanel, setShowFilterPanel] = React.useState(false);
  const selectedCount = table.selectedIds.size;
  const hasSelection = selectedCount > 0;

  // Filterable columns
  const filterableColumns = React.useMemo(
    () => columns.filter((col) => col.filterable !== false),
    [columns]
  );

  return (
    <div className={cn('border-b border-border/50 bg-muted/30', className)}>
      {/* Main toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {/* Left content */}
        {leftContent && <div className="flex items-center">{leftContent}</div>}

        {/* Search input */}
        {showSearch && searchable && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={table.searchTerm}
              onChange={(e) => table.setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Search table"
            />
            {table.searchTerm && (
              <button
                type="button"
                onClick={table.clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Filter toggle */}
        {showFilters && filterable && filterableColumns.length > 0 && (
          <ToolbarButton
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            active={showFilterPanel || table.filters.length > 0}
            aria-expanded={showFilterPanel}
          >
            <FilterIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {table.filters.length > 0 && (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {table.filters.length}
              </span>
            )}
          </ToolbarButton>
        )}

        {/* Column visibility toggle */}
        {showColumnToggle && (
          <ToolbarButton>
            <ColumnsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Columns</span>
          </ToolbarButton>
        )}

        {/* Density toggle */}
        {showDensityToggle && (
          <ToolbarButton>
            <DensityIcon className="h-4 w-4" />
          </ToolbarButton>
        )}

        {/* Export button */}
        {showExport && (
          <ToolbarButton>
            <ExportIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </ToolbarButton>
        )}

        {/* Custom actions */}
        {customActions}

        {/* Right content */}
        {rightContent && <div className="flex items-center">{rightContent}</div>}
      </div>

      {/* Selection toolbar */}
      {hasSelection && bulkActions.length > 0 && (
        <div className="flex items-center gap-3 border-t border-border/50 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium text-primary">
            {selectedCount} selected
          </span>

          <div className="flex items-center gap-2">
            {bulkActions.map((action) => {
              const isDisabled =
                typeof action.disabled === 'function'
                  ? action.disabled(table.getSelectedRows())
                  : action.disabled;

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => action.onClick(table.getSelectedRows())}
                  disabled={isDisabled}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
                    action.variant === 'destructive'
                      ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                      : action.variant === 'outline'
                      ? 'border border-border hover:bg-muted'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90',
                    isDisabled && 'pointer-events-none opacity-50'
                  )}
                >
                  {action.icon}
                  {action.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={table.deselectAll}
            className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Filter panel */}
      {showFilterPanel && filterableColumns.length > 0 && (
        <FilterPanel<T>
          columns={filterableColumns}
          filters={table.filters}
          onFilterChange={table.setFilter}
          onFilterRemove={table.removeFilter}
          onClearAll={table.clearFilters}
        />
      )}
    </div>
  );
}

interface FilterPanelProps<T extends RowData> {
  columns: ColumnDef<T>[];
  filters: FilterConfig[];
  onFilterChange: (filter: FilterConfig) => void;
  onFilterRemove: (column: string) => void;
  onClearAll: () => void;
}

function FilterPanel<T extends RowData>({
  columns,
  filters,
  onFilterChange,
  onFilterRemove,
  onClearAll,
}: FilterPanelProps<T>) {
  return (
    <div className="border-t border-border/50 bg-background px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Active filters */}
        {filters.map((filter) => {
          const column = columns.find((c) => c.id === filter.column);
          if (!column) return null;

          return (
            <div
              key={filter.column}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm"
            >
              <span className="font-medium text-primary">{column.header}:</span>
              <span className="text-foreground">{String(filter.value)}</span>
              <button
                type="button"
                onClick={() => onFilterRemove(filter.column)}
                className="ml-1 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${column.header} filter`}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {/* Add filter dropdown */}
        <select
          onChange={(e) => {
            const columnId = e.target.value;
            if (columnId) {
              onFilterChange({ column: columnId, value: '' });
              e.target.value = '';
            }
          }}
          className="rounded-md border border-dashed border-border bg-transparent px-3 py-1 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          defaultValue=""
        >
          <option value="">+ Add filter</option>
          {columns
            .filter((col) => !filters.some((f) => f.column === col.id))
            .map((col) => (
              <option key={col.id} value={col.id}>
                {col.header}
              </option>
            ))}
        </select>

        {/* Clear all */}
        {filters.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function ToolbarButton({
  children,
  active,
  className,
  ...props
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Icon components
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}

function ColumnsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
      />
    </svg>
  );
}

function DensityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}


