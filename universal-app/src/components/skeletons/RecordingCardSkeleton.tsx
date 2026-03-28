'use client';

import { cn } from '@/lib/utils';
import { Skeleton, SkeletonBadge, type SkeletonProps } from '@/components/ui/skeleton';

export interface RecordingCardSkeletonProps extends SkeletonProps {
  /** Display as compact card */
  compact?: boolean;
}

/**
 * Skeleton for recording/meeting list cards
 * Matches the MeetingCard component layout
 */
export function RecordingCardSkeleton({ 
  className, 
  compact = false,
  shimmer 
}: RecordingCardSkeletonProps) {
  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-4 p-4 rounded-xl border bg-card',
        className
      )}>
        <Skeleton shimmer={shimmer} className="h-12 w-12 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton shimmer={shimmer} className="h-4 w-2/3" />
          <Skeleton shimmer={shimmer} className="h-3 w-1/3" />
        </div>
        <SkeletonBadge shimmer={shimmer} />
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border bg-card shadow-sm overflow-hidden',
      className
    )}>
      <div className="p-5">
        {/* Header with badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            <SkeletonBadge shimmer={shimmer} className="w-20" />
            <SkeletonBadge shimmer={shimmer} className="w-16" />
          </div>
          <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-lg" />
        </div>

        {/* Title */}
        <Skeleton shimmer={shimmer} className="h-5 w-4/5 mb-2" />
        
        {/* Subject/case info */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton shimmer={shimmer} className="h-6 w-24 rounded-full" />
          <Skeleton shimmer={shimmer} className="h-6 w-20 rounded-full" />
        </div>

        {/* Meta info row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Skeleton shimmer={shimmer} className="h-4 w-4 rounded" />
            <Skeleton shimmer={shimmer} className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton shimmer={shimmer} className="h-4 w-4 rounded" />
            <Skeleton shimmer={shimmer} className="h-3 w-12" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-muted/30 border-t flex items-center justify-between">
        <Skeleton shimmer={shimmer} className="h-3 w-24" />
        <div className="flex items-center gap-1">
          <Skeleton shimmer={shimmer} className="h-3 w-16" />
          <Skeleton shimmer={shimmer} className="h-4 w-4 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Multiple recording card skeletons for list views
 */
export function RecordingListSkeleton({ 
  count = 5, 
  compact = false,
  shimmer,
  className 
}: RecordingCardSkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <RecordingCardSkeleton key={i} compact={compact} shimmer={shimmer} />
      ))}
    </div>
  );
}
