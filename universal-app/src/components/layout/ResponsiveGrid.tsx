'use client';

/**
 * ResponsiveGrid Component
 * 
 * Auto-responsive grid that adjusts columns based on viewport and container size.
 * Supports both viewport-based and container-query-based responsiveness.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { ResponsiveGridConfig, GridColumns, Breakpoint } from '@/lib/responsive/types';

interface ResponsiveGridProps {
  children: React.ReactNode;
  /** Responsive column configuration */
  columns?: ResponsiveGridConfig | GridColumns;
  /** Gap between grid items */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to use container queries instead of viewport queries */
  useContainerQueries?: boolean;
  /** Minimum item width for auto-fit columns */
  minItemWidth?: string;
  /** Additional class names */
  className?: string;
}

const gapMap: Record<string, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const columnClasses: Record<GridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
  auto: 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
};

const responsiveColumnClasses: Record<Breakpoint, Record<GridColumns, string>> = {
  xs: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
    auto: 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
  },
  sm: {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    5: 'sm:grid-cols-5',
    6: 'sm:grid-cols-6',
    12: 'sm:grid-cols-12',
    auto: 'sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
  },
  md: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
    12: 'md:grid-cols-12',
    auto: 'md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
  },
  lg: {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    12: 'lg:grid-cols-12',
    auto: 'lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
  },
  xl: {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5',
    6: 'xl:grid-cols-6',
    12: 'xl:grid-cols-12',
    auto: 'xl:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
  },
  '2xl': {
    1: '2xl:grid-cols-1',
    2: '2xl:grid-cols-2',
    3: '2xl:grid-cols-3',
    4: '2xl:grid-cols-4',
    5: '2xl:grid-cols-5',
    6: '2xl:grid-cols-6',
    12: '2xl:grid-cols-12',
    auto: '2xl:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
  },
};

function getColumnClasses(columns: ResponsiveGridConfig | GridColumns): string {
  if (typeof columns === 'number' || columns === 'auto') {
    return columnClasses[columns];
  }

  const classes: string[] = [];
  const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  for (const bp of breakpoints) {
    const cols = columns[bp];
    if (cols !== undefined) {
      if (bp === 'xs') {
        classes.push(columnClasses[cols]);
      } else {
        classes.push(responsiveColumnClasses[bp][cols]);
      }
    }
  }

  return classes.join(' ');
}

export function ResponsiveGrid({
  children,
  columns = { xs: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'md',
  useContainerQueries = false,
  minItemWidth,
  className,
}: ResponsiveGridProps) {
  // If minItemWidth is provided, use auto-fit grid
  const gridStyle = minItemWidth
    ? { gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))` }
    : undefined;

  return (
    <div
      className={cn(
        'grid',
        gapMap[gap],
        !minItemWidth && getColumnClasses(columns),
        useContainerQueries && '@container',
        className
      )}
      style={gridStyle}
    >
      {children}
    </div>
  );
}

/**
 * GridItem Component
 * 
 * Child component for ResponsiveGrid with span control
 */

interface GridItemProps {
  children: React.ReactNode;
  /** Column span */
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full';
  /** Row span */
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Responsive column span */
  responsiveColSpan?: Partial<Record<Breakpoint, 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full'>>;
  /** Additional class names */
  className?: string;
}

const colSpanMap: Record<number | string, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  12: 'col-span-12',
  full: 'col-span-full',
};

const rowSpanMap: Record<number, string> = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
  4: 'row-span-4',
  5: 'row-span-5',
  6: 'row-span-6',
};

const responsiveColSpanMap: Record<Breakpoint, Record<number | string, string>> = {
  xs: colSpanMap,
  sm: {
    1: 'sm:col-span-1',
    2: 'sm:col-span-2',
    3: 'sm:col-span-3',
    4: 'sm:col-span-4',
    5: 'sm:col-span-5',
    6: 'sm:col-span-6',
    12: 'sm:col-span-12',
    full: 'sm:col-span-full',
  },
  md: {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    6: 'md:col-span-6',
    12: 'md:col-span-12',
    full: 'md:col-span-full',
  },
  lg: {
    1: 'lg:col-span-1',
    2: 'lg:col-span-2',
    3: 'lg:col-span-3',
    4: 'lg:col-span-4',
    5: 'lg:col-span-5',
    6: 'lg:col-span-6',
    12: 'lg:col-span-12',
    full: 'lg:col-span-full',
  },
  xl: {
    1: 'xl:col-span-1',
    2: 'xl:col-span-2',
    3: 'xl:col-span-3',
    4: 'xl:col-span-4',
    5: 'xl:col-span-5',
    6: 'xl:col-span-6',
    12: 'xl:col-span-12',
    full: 'xl:col-span-full',
  },
  '2xl': {
    1: '2xl:col-span-1',
    2: '2xl:col-span-2',
    3: '2xl:col-span-3',
    4: '2xl:col-span-4',
    5: '2xl:col-span-5',
    6: '2xl:col-span-6',
    12: '2xl:col-span-12',
    full: '2xl:col-span-full',
  },
};

export function GridItem({
  children,
  colSpan,
  rowSpan,
  responsiveColSpan,
  className,
}: GridItemProps) {
  const spanClasses: string[] = [];
  
  if (colSpan) {
    spanClasses.push(colSpanMap[colSpan]);
  }
  
  if (rowSpan) {
    spanClasses.push(rowSpanMap[rowSpan]);
  }
  
  if (responsiveColSpan) {
    for (const [bp, span] of Object.entries(responsiveColSpan)) {
      if (span !== undefined) {
        spanClasses.push(responsiveColSpanMap[bp as Breakpoint][span]);
      }
    }
  }

  return (
    <div className={cn(spanClasses, className)}>
      {children}
    </div>
  );
}
