'use client';

import { cn } from '@/lib/utils';
import { Skeleton, SkeletonBadge, type SkeletonProps } from '@/components/ui/skeleton';

export interface MinuteSkeletonProps extends SkeletonProps {
  /** Number of content sections */
  sections?: number;
  /** Include action items */
  withActionItems?: boolean;
  /** Include sidebar */
  withSidebar?: boolean;
}

/**
 * Skeleton for minute editor/viewer
 * Matches the MinuteEditor component layout
 */
export function MinuteSkeleton({ 
  className, 
  sections = 4,
  withActionItems = true,
  withSidebar = true,
  shimmer 
}: MinuteSkeletonProps) {
  return (
    <div className={cn('flex gap-6', className)}>
      {/* Main content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <MinuteHeaderSkeleton shimmer={shimmer} />

        {/* Content sections */}
        <div className="space-y-6">
          {Array.from({ length: sections }).map((_, i) => (
            <MinuteSectionSkeleton 
              key={i} 
              shimmer={shimmer}
              paragraphs={i % 2 === 0 ? 3 : 2}
            />
          ))}
        </div>

        {/* Action items */}
        {withActionItems && (
          <ActionItemsListSkeleton shimmer={shimmer} count={3} />
        )}
      </div>

      {/* Sidebar */}
      {withSidebar && (
        <MinuteSidebarSkeleton shimmer={shimmer} />
      )}
    </div>
  );
}

/**
 * Minute header skeleton
 */
export function MinuteHeaderSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('space-y-4 pb-6 border-b', className)}>
      {/* Title and status */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton shimmer={shimmer} className="h-8 w-64" />
          <div className="flex items-center gap-3">
            <SkeletonBadge shimmer={shimmer} className="w-24" />
            <Skeleton shimmer={shimmer} className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton shimmer={shimmer} className="h-10 w-24 rounded-lg" />
          <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      
      {/* Meta tags */}
      <div className="flex items-center gap-2">
        <Skeleton shimmer={shimmer} className="h-6 w-32 rounded-full" />
        <Skeleton shimmer={shimmer} className="h-6 w-24 rounded-full" />
        <Skeleton shimmer={shimmer} className="h-6 w-28 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Single minute section skeleton
 */
export function MinuteSectionSkeleton({ 
  shimmer,
  className,
  paragraphs = 2,
}: SkeletonProps & { paragraphs?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <Skeleton shimmer={shimmer} className="h-6 w-40" />
        <Skeleton shimmer={shimmer} className="h-6 w-6 rounded" />
      </div>
      
      {/* Content */}
      <div className="space-y-3 pl-4 border-l-2 border-muted">
        {Array.from({ length: paragraphs }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton shimmer={shimmer} className="h-4 w-full" />
            <Skeleton shimmer={shimmer} className="h-4 w-full" />
            <Skeleton shimmer={shimmer} className="h-4 w-3/4" />
          </div>
        ))}
      </div>

      {/* Evidence citations */}
      <div className="flex items-center gap-2 pt-2">
        <Skeleton shimmer={shimmer} className="h-5 w-5 rounded" />
        <Skeleton shimmer={shimmer} className="h-4 w-20" />
      </div>
    </div>
  );
}

/**
 * Action items list skeleton
 */
export function ActionItemsListSkeleton({ 
  shimmer,
  className,
  count = 3,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-4 p-4 rounded-xl border bg-card', className)}>
      <div className="flex items-center justify-between">
        <Skeleton shimmer={shimmer} className="h-6 w-28" />
        <Skeleton shimmer={shimmer} className="h-8 w-20 rounded-lg" />
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Skeleton shimmer={shimmer} className="h-5 w-5 rounded shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <Skeleton shimmer={shimmer} className="h-4 w-full" />
              <div className="flex items-center gap-2">
                <SkeletonBadge shimmer={shimmer} className="w-16" />
                <Skeleton shimmer={shimmer} className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Minute sidebar skeleton
 */
export function MinuteSidebarSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('w-80 shrink-0 space-y-6', className)}>
      {/* Status card */}
      <div className="p-4 rounded-xl border bg-card space-y-4">
        <Skeleton shimmer={shimmer} className="h-5 w-20" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton shimmer={shimmer} className="h-4 w-20" />
              <Skeleton shimmer={shimmer} className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Activity log */}
      <div className="p-4 rounded-xl border bg-card space-y-4">
        <Skeleton shimmer={shimmer} className="h-5 w-24" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton shimmer={shimmer} className="h-6 w-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton shimmer={shimmer} className="h-3 w-full" />
                <Skeleton shimmer={shimmer} className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
