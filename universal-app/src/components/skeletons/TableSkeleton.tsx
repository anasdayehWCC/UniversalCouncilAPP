'use client';

import { cn } from '@/lib/utils';
import { Skeleton, type SkeletonProps } from '@/components/ui/skeleton';

export interface TableSkeletonProps extends SkeletonProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  cols?: number;
  /** Include checkbox column */
  withCheckbox?: boolean;
  /** Include action column */
  withActions?: boolean;
  /** Include pagination */
  withPagination?: boolean;
  /** Include search/filter bar */
  withToolbar?: boolean;
}

/**
 * Data table skeleton with full features
 */
export function TableSkeleton({ 
  className, 
  rows = 10,
  cols = 5,
  withCheckbox = true,
  withActions = true,
  withPagination = true,
  withToolbar = true,
  shimmer 
}: TableSkeletonProps) {
  const totalCols = cols + (withCheckbox ? 1 : 0) + (withActions ? 1 : 0);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      {withToolbar && (
        <TableToolbarSkeleton shimmer={shimmer} />
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead>
              <tr className="border-b bg-muted/30">
                {withCheckbox && (
                  <th className="p-4 w-12">
                    <Skeleton shimmer={shimmer} className="h-5 w-5 rounded" />
                  </th>
                )}
                {Array.from({ length: cols }).map((_, i) => (
                  <th key={i} className="p-4 text-left">
                    <Skeleton 
                      shimmer={shimmer} 
                      className={cn('h-4', {
                        'w-24': i === 0,
                        'w-32': i === 1,
                        'w-20': i > 1,
                      })} 
                    />
                  </th>
                ))}
                {withActions && (
                  <th className="p-4 w-20">
                    <Skeleton shimmer={shimmer} className="h-4 w-16" />
                  </th>
                )}
              </tr>
            </thead>
            
            {/* Body */}
            <tbody>
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b last:border-b-0">
                  {withCheckbox && (
                    <td className="p-4 w-12">
                      <Skeleton shimmer={shimmer} className="h-5 w-5 rounded" />
                    </td>
                  )}
                  {Array.from({ length: cols }).map((_, colIdx) => (
                    <td key={colIdx} className="p-4">
                      <Skeleton 
                        shimmer={shimmer}
                        className={cn('h-4', {
                          'w-36': colIdx === 0,
                          'w-28': colIdx === 1,
                          'w-20': colIdx > 1,
                        })}
                      />
                    </td>
                  ))}
                  {withActions && (
                    <td className="p-4 w-20">
                      <div className="flex items-center gap-1">
                        <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-lg" />
                        <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {withPagination && (
        <TablePaginationSkeleton shimmer={shimmer} />
      )}
    </div>
  );
}

/**
 * Table toolbar skeleton
 */
export function TableToolbarSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton shimmer={shimmer} className="h-10 w-64 rounded-lg" />
        <Skeleton shimmer={shimmer} className="h-10 w-32 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
        <Skeleton shimmer={shimmer} className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Table pagination skeleton
 */
export function TablePaginationSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
      <Skeleton shimmer={shimmer} className="h-4 w-48" />
      <div className="flex items-center gap-2">
        <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
        <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} shimmer={shimmer} className="h-10 w-10 rounded-lg" />
          ))}
        </div>
        <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
        <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Simple list table skeleton (no features)
 */
export function SimpleTableSkeleton({ 
  rows = 5, 
  cols = 3, 
  shimmer,
  className 
}: SkeletonProps & { rows?: number; cols?: number }) {
  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/30">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton shimmer={shimmer} className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b last:border-b-0">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="p-4">
                  <Skeleton shimmer={shimmer} className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
