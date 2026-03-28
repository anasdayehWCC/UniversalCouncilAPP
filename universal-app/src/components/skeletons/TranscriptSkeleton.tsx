'use client';

import { cn } from '@/lib/utils';
import { Skeleton, SkeletonAvatar, type SkeletonProps } from '@/components/ui/skeleton';

export interface TranscriptSkeletonProps extends SkeletonProps {
  /** Number of transcript segments to show */
  segments?: number;
  /** Include search bar skeleton */
  withSearch?: boolean;
  /** Include speaker legend */
  withSpeakerLegend?: boolean;
}

/**
 * Skeleton for transcript viewer
 * Matches the TranscriptViewer component layout
 */
export function TranscriptSkeleton({ 
  className, 
  segments = 8,
  withSearch = true,
  withSpeakerLegend = true,
  shimmer 
}: TranscriptSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with search */}
      {withSearch && (
        <div className="flex items-center gap-4">
          <Skeleton shimmer={shimmer} className="h-10 flex-1 rounded-lg" />
          <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
          <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
        </div>
      )}

      {/* Speaker legend */}
      {withSpeakerLegend && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton shimmer={shimmer} className="h-3 w-3 rounded-full" />
              <Skeleton shimmer={shimmer} className="h-4 w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Transcript segments */}
      <div className="space-y-4">
        {Array.from({ length: segments }).map((_, i) => (
          <TranscriptSegmentSkeleton 
            key={i} 
            shimmer={shimmer}
            // Vary the text length for visual interest
            lineCount={i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Single transcript segment skeleton
 */
export function TranscriptSegmentSkeleton({ 
  shimmer,
  className,
  lineCount = 2,
}: SkeletonProps & { lineCount?: number }) {
  return (
    <div className={cn(
      'flex gap-3 p-3 rounded-lg border border-transparent',
      className
    )}>
      {/* Speaker indicator */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <SkeletonAvatar shimmer={shimmer} size="sm" />
        <Skeleton shimmer={shimmer} className="h-3 w-10" />
      </div>
      
      {/* Content */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <Skeleton shimmer={shimmer} className="h-4 w-20" />
          <Skeleton shimmer={shimmer} className="h-3 w-12" />
        </div>
        {Array.from({ length: lineCount }).map((_, i) => (
          <Skeleton 
            key={i} 
            shimmer={shimmer}
            className={cn(
              'h-4',
              i === lineCount - 1 ? 'w-3/4' : 'w-full'
            )} 
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Audio player skeleton component
 */
export function AudioPlayerSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-xl border bg-card',
      className
    )}>
      {/* Play button */}
      <Skeleton shimmer={shimmer} className="h-12 w-12 rounded-full shrink-0" />
      
      {/* Waveform/progress */}
      <div className="flex-1 space-y-2">
        <Skeleton shimmer={shimmer} className="h-8 w-full rounded" />
        <div className="flex justify-between">
          <Skeleton shimmer={shimmer} className="h-3 w-12" />
          <Skeleton shimmer={shimmer} className="h-3 w-12" />
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <Skeleton shimmer={shimmer} className="h-8 w-8 rounded" />
        <Skeleton shimmer={shimmer} className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}
