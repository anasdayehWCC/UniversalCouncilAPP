'use client';

/**
 * TablePagination Component
 * Pagination controls for the data table
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  getPageInfo,
  getPageNumbers,
  getPageRangeText,
  DEFAULT_PAGE_SIZE_OPTIONS,
} from '@/lib/table/pagination';

export interface TablePaginationProps {
  /** Current page (0-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange: (pageSize: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Dense mode */
  dense?: boolean;
  /** Additional class name */
  className?: string;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Show page numbers */
  showPageNumbers?: boolean;
  /** Show range text */
  showRangeText?: boolean;
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  dense = false,
  className,
  showPageSizeSelector = true,
  showPageNumbers = true,
  showRangeText = true,
}: TablePaginationProps) {
  const paginationState = { page, pageSize, totalItems };
  const pageInfo = getPageInfo(paginationState);
  const pageNumbers = getPageNumbers(paginationState);
  const rangeText = getPageRangeText(paginationState);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-t border-border/50 bg-muted/30',
        dense ? 'px-3 py-2' : 'px-4 py-3',
        className
      )}
    >
      {/* Left side: Page size selector and range text */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="hidden sm:inline">
              Rows per page:
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={cn(
                'rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20',
                dense ? 'h-7' : 'h-8'
              )}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {showRangeText && (
          <span className="hidden sm:inline">{rangeText}</span>
        )}
      </div>

      {/* Right side: Navigation buttons */}
      <nav
        role="navigation"
        aria-label="Pagination"
        className="flex items-center gap-1"
      >
        {/* First page button */}
        <PaginationButton
          onClick={() => onPageChange(0)}
          disabled={pageInfo.isFirstPage}
          aria-label="Go to first page"
          dense={dense}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </PaginationButton>

        {/* Previous page button */}
        <PaginationButton
          onClick={() => onPageChange(page - 1)}
          disabled={!pageInfo.canPrevious}
          aria-label="Go to previous page"
          dense={dense}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </PaginationButton>

        {/* Page numbers */}
        {showPageNumbers && (
          <div className="hidden items-center gap-1 sm:flex">
            {pageNumbers.map((pageNum, index) =>
              pageNum === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <PaginationButton
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  active={pageNum === page}
                  aria-label={`Go to page ${pageNum + 1}`}
                  aria-current={pageNum === page ? 'page' : undefined}
                  dense={dense}
                >
                  {pageNum + 1}
                </PaginationButton>
              )
            )}
          </div>
        )}

        {/* Mobile page indicator */}
        <span className="px-3 text-sm text-muted-foreground sm:hidden">
          {page + 1} / {pageInfo.totalPages}
        </span>

        {/* Next page button */}
        <PaginationButton
          onClick={() => onPageChange(page + 1)}
          disabled={!pageInfo.canNext}
          aria-label="Go to next page"
          dense={dense}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </PaginationButton>

        {/* Last page button */}
        <PaginationButton
          onClick={() => onPageChange(pageInfo.totalPages - 1)}
          disabled={pageInfo.isLastPage}
          aria-label="Go to last page"
          dense={dense}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </PaginationButton>
      </nav>
    </div>
  );
}

interface PaginationButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  dense?: boolean;
}

function PaginationButton({
  children,
  active = false,
  dense = false,
  disabled,
  className,
  ...props
}: PaginationButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
        dense ? 'h-7 min-w-7 px-2' : 'h-8 min-w-8 px-2',
        active
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted hover:text-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
