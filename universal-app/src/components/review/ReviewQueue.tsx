'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
  RefreshCw,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReview } from '@/hooks/useReview';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import ReviewCard from './ReviewCard';
import ReviewFilters from './ReviewFilters';
import ReviewStats from './ReviewStats';
import { ReviewItem } from '@/lib/review/types';

interface ReviewQueueProps {
  onViewItem?: (item: ReviewItem) => void;
  showStats?: boolean;
  className?: string;
}

export default function ReviewQueue({
  onViewItem,
  showStats = true,
  className,
}: ReviewQueueProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const {
    filteredItems,
    selectedIds,
    isLoading,
    error,
    filter,
    sortBy,
    sortOrder,
    stats,
    setFilter,
    setSortBy,
    setSortOrder,
    toggleSelection,
    selectAll,
    clearSelection,
    submitReview,
    bulkReview,
    refresh,
  } = useReview();

  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');

  const authors = useMemo(() => {
    const uniqueAuthors = new Map<string, { id: string; name: string }>();
    filteredItems.forEach(item => {
      uniqueAuthors.set(item.author.id, {
        id: item.author.id,
        name: item.author.name,
      });
    });
    return Array.from(uniqueAuthors.values());
  }, [filteredItems]);

  const handleApprove = async (item: ReviewItem) => {
    await submitReview(item.id, 'approve');
  };

  const handleReject = async (item: ReviewItem) => {
    await submitReview(item.id, 'request_changes');
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Approve ${selectedIds.size} selected items?`)) {
      await bulkReview('approve');
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Request changes for ${selectedIds.size} selected items?`)) {
      await bulkReview('request_changes');
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats section */}
      {showStats && (
        <ReviewStats stats={stats} compact />
      )}

      {/* Filters */}
      <ReviewFilters
        filter={filter}
        onFilterChange={setFilter}
        stats={stats}
        authors={authors}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <>
              <Badge variant="secondary" className="px-3 py-1">
                {selectedIds.size} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkApprove}
                disabled={isLoading}
                className="gap-1 text-success hover:bg-success/10"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkReject}
                disabled={isLoading}
                className="gap-1 text-warning hover:bg-warning/10"
              >
                <XCircle className="w-4 h-4" />
                Request Changes
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
              </span>
              {filteredItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select all
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Sort:</span>
            {(['priority', 'submittedAt', 'author'] as const).map(field => (
              <Button
                key={field}
                variant={sortBy === field ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleSort(field)}
                className={cn('text-xs', sortBy === field && 'bg-muted')}
              >
                {field === 'submittedAt' ? 'Date' : field.charAt(0).toUpperCase() + field.slice(1)}
                {sortBy === field && (
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                )}
              </Button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('compact')}
              className="rounded-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className={cn(isLoading && 'animate-spin motion-reduce:animate-none')}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-4 border-destructive/20 bg-destructive/10">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      {/* Queue list */}
      <div
        className={cn(
          'space-y-3',
          viewMode === 'compact' && 'space-y-1'
        )}
      >
        {filteredItems.length === 0 && !isLoading && (
          <Card className="p-12 text-center border-dashed border-2">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-bold text-foreground">All caught up!</h3>
            <p className="text-muted-foreground mb-4">No items match your current filters.</p>
            <Button variant="outline" onClick={() => setFilter({})}>
              Clear filters
            </Button>
          </Card>
        )}

        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            className={!prefersReducedMotion ? 'animate-in fade-in slide-in-from-bottom-2' : ''}
            style={
              !prefersReducedMotion
                ? { animationDelay: `${Math.min(index * 50, 300)}ms` }
                : undefined
            }
          >
            <ReviewCard
              item={item}
              isSelected={selectedIds.has(item.id)}
              onSelect={() => toggleSelection(item.id)}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
              onView={() => onViewItem?.(item)}
              compact={viewMode === 'compact'}
            />
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && filteredItems.length > 0 && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg shadow-lg border border-border">
            <RefreshCw className="w-5 h-5 animate-spin motion-reduce:animate-none text-primary" />
            <span className="text-sm font-medium">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
