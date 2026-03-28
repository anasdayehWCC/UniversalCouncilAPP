'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { SearchResult, SearchResults as SearchResultsType } from '@/lib/search/types';
import { getHighlightSegments, type HighlightedSegment } from '@/lib/search/highlight';

// ============================================================================
// Types
// ============================================================================

export interface SearchResultsProps<T> {
  /** Search results to display */
  results: SearchResultsType<T> | null;
  /** Render function for each result item */
  renderItem: (result: SearchResult<T>, index: number) => React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** No results message */
  noResultsMessage?: string;
  /** Error state */
  error?: Error | null;
  /** Show result count */
  showCount?: boolean;
  /** Show search duration */
  showDuration?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom empty component */
  emptyComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** Container className */
  className?: string;
  /** List className */
  listClassName?: string;
}

// ============================================================================
// Highlight Component
// ============================================================================

export interface HighlightTextProps {
  /** Text to highlight */
  text: string;
  /** Query to highlight */
  query: string;
  /** Highlight className */
  highlightClassName?: string;
  /** Container className */
  className?: string;
}

export function HighlightText({
  text,
  query,
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5',
  className,
}: HighlightTextProps) {
  const segments = React.useMemo(
    () => getHighlightSegments(text, query),
    [text, query]
  );

  return (
    <span className={className}>
      {segments.map((segment: HighlightedSegment, index: number) =>
        segment.isHighlight ? (
          <mark key={index} className={highlightClassName}>
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </span>
  );
}

// ============================================================================
// Result Item Component
// ============================================================================

export interface SearchResultItemProps {
  /** Primary content */
  title: React.ReactNode;
  /** Secondary content */
  subtitle?: React.ReactNode;
  /** Additional metadata */
  meta?: React.ReactNode;
  /** Leading icon or avatar */
  leading?: React.ReactNode;
  /** Trailing content */
  trailing?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Is selected */
  isSelected?: boolean;
  /** Container className */
  className?: string;
}

export function SearchResultItem({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  onClick,
  isSelected,
  className,
}: SearchResultItemProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring',
        isSelected && 'bg-muted',
        className
      )}
    >
      {/* Leading */}
      {leading && (
        <div className="shrink-0 text-muted-foreground">{leading}</div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{title}</div>
        {subtitle && (
          <div className="text-sm text-muted-foreground truncate">{subtitle}</div>
        )}
        {meta && (
          <div className="text-xs text-muted-foreground mt-1">{meta}</div>
        )}
      </div>

      {/* Trailing */}
      {trailing && (
        <div className="shrink-0 text-muted-foreground">{trailing}</div>
      )}
    </div>
  );
}

// ============================================================================
// Search Results Component
// ============================================================================

export function SearchResults<T>({
  results,
  renderItem,
  isLoading = false,
  emptyMessage = 'Start typing to search',
  noResultsMessage = 'No results found',
  error = null,
  showCount = true,
  showDuration = false,
  loadingComponent,
  emptyComponent,
  errorComponent,
  className,
  listClassName,
}: SearchResultsProps<T>) {
  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div className={cn('space-y-2', className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-muted/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-destructive font-medium">Error searching</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  // Empty state (no search performed)
  if (!results) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // No results
  if (results.items.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-muted-foreground">{noResultsMessage}</p>
        {results.query.text && (
          <p className="text-sm text-muted-foreground mt-1">
            for &ldquo;{results.query.text}&rdquo;
          </p>
        )}
      </div>
    );
  }

  // Results
  return (
    <div className={className}>
      {/* Results header */}
      {(showCount || showDuration) && (
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          {showCount && (
            <span>
              {results.total} result{results.total !== 1 ? 's' : ''}
              {results.query.text && (
                <> for &ldquo;{results.query.text}&rdquo;</>
              )}
            </span>
          )}
          {showDuration && results.duration > 0 && (
            <span>{results.duration.toFixed(0)}ms</span>
          )}
        </div>
      )}

      {/* Results list */}
      <div
        role="list"
        className={cn('space-y-1', listClassName)}
      >
        {results.items.map((result, index) => (
          <div key={index} role="listitem">
            {renderItem(result, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Virtualized Results (for large lists)
// ============================================================================

export interface VirtualizedSearchResultsProps<T> extends SearchResultsProps<T> {
  /** Item height for virtualization */
  itemHeight?: number;
  /** Container height */
  height?: number;
  /** Overscan count */
  overscan?: number;
}

export function VirtualizedSearchResults<T>({
  results,
  renderItem,
  itemHeight = 64,
  height = 400,
  overscan = 5,
  ...props
}: VirtualizedSearchResultsProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);

  const items = results?.items ?? [];
  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );
  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  if (!results || results.items.length === 0) {
    return <SearchResults results={results} renderItem={renderItem} {...props} />;
  }

  return (
    <div
      ref={containerRef}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
      className={props.className}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((result, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(result, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchResults;
