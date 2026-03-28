'use client';

import { cn } from '@/lib/utils';
import { 
  Skeleton, 
  SkeletonMetricCard, 
  SkeletonCard, 
  type SkeletonProps 
} from '@/components/ui/skeleton';

export interface DashboardSkeletonProps extends SkeletonProps {
  /** Number of metric cards */
  metrics?: number;
  /** Number of content cards */
  cards?: number;
  /** Include charts */
  withCharts?: boolean;
  /** Layout variant */
  variant?: 'default' | 'insights' | 'admin';
}

/**
 * Dashboard skeleton for insights and overview pages
 */
export function DashboardSkeleton({ 
  className, 
  metrics = 4,
  cards = 4,
  withCharts = true,
  variant = 'default',
  shimmer 
}: DashboardSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <DashboardHeaderSkeleton shimmer={shimmer} />

      {/* Metrics row */}
      <div className={cn(
        'grid gap-4',
        'grid-cols-1 sm:grid-cols-2',
        metrics <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5'
      )}>
        {Array.from({ length: metrics }).map((_, i) => (
          <SkeletonMetricCard key={i} shimmer={shimmer} />
        ))}
      </div>

      {/* Charts section */}
      {withCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton shimmer={shimmer} />
          <ChartSkeleton shimmer={shimmer} variant="bar" />
        </div>
      )}

      {/* Content cards */}
      {variant === 'insights' ? (
        <InsightsGridSkeleton shimmer={shimmer} />
      ) : variant === 'admin' ? (
        <AdminPanelsSkeleton shimmer={shimmer} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <SkeletonCard key={i} shimmer={shimmer} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Dashboard header skeleton
 */
export function DashboardHeaderSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
      <div className="space-y-2">
        <Skeleton shimmer={shimmer} className="h-8 w-48" />
        <Skeleton shimmer={shimmer} className="h-4 w-72" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton shimmer={shimmer} className="h-10 w-32 rounded-lg" />
        <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Chart placeholder skeleton
 */
export function ChartSkeleton({ 
  shimmer, 
  className,
  variant = 'line'
}: SkeletonProps & { variant?: 'line' | 'bar' | 'pie' }) {
  return (
    <div className={cn('p-6 rounded-xl border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <Skeleton shimmer={shimmer} className="h-5 w-32" />
          <Skeleton shimmer={shimmer} className="h-3 w-48" />
        </div>
        <Skeleton shimmer={shimmer} className="h-8 w-24 rounded-lg" />
      </div>

      {/* Chart area */}
      <div className="h-64 flex items-end justify-between gap-2">
        {variant === 'bar' ? (
          // Bar chart skeleton
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton 
              key={i} 
              shimmer={shimmer}
              className={cn('flex-1 rounded-t', {
                'h-32': i % 3 === 0,
                'h-48': i % 3 === 1,
                'h-24': i % 3 === 2,
              })}
            />
          ))
        ) : variant === 'pie' ? (
          // Pie chart skeleton
          <div className="w-full flex items-center justify-center">
            <Skeleton shimmer={shimmer} className="h-48 w-48 rounded-full" />
          </div>
        ) : (
          // Line chart skeleton (wavy lines effect)
          <div className="w-full flex flex-col justify-end h-full relative">
            <Skeleton shimmer={shimmer} className="absolute bottom-0 left-0 right-0 h-px" />
            <Skeleton shimmer={shimmer} className="absolute bottom-1/4 left-0 right-0 h-px opacity-50" />
            <Skeleton shimmer={shimmer} className="absolute bottom-1/2 left-0 right-0 h-px opacity-50" />
            <Skeleton shimmer={shimmer} className="absolute bottom-3/4 left-0 right-0 h-px opacity-50" />
            <Skeleton 
              shimmer={shimmer}
              className="h-32 w-full rounded"
              style={{ clipPath: 'polygon(0 80%, 15% 60%, 30% 70%, 50% 40%, 70% 55%, 85% 30%, 100% 50%, 100% 100%, 0 100%)' }}
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton shimmer={shimmer} className="h-3 w-3 rounded-full" />
            <Skeleton shimmer={shimmer} className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Insights-specific grid skeleton
 */
export function InsightsGridSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Trends */}
      <div className="p-6 rounded-xl border bg-card space-y-4">
        <Skeleton shimmer={shimmer} className="h-6 w-24" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-lg" />
                <Skeleton shimmer={shimmer} className="h-4 w-24" />
              </div>
              <Skeleton shimmer={shimmer} className="h-6 w-16" />
              <Skeleton shimmer={shimmer} className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="p-6 rounded-xl border bg-card space-y-4">
        <Skeleton shimmer={shimmer} className="h-6 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton shimmer={shimmer} className="h-4 w-3/4" />
                <Skeleton shimmer={shimmer} className="h-3 w-1/4" />
              </div>
              <Skeleton shimmer={shimmer} className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Admin panels skeleton
 */
export function AdminPanelsSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6', className)}>
      {/* Users panel */}
      <div className="p-6 rounded-xl border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton shimmer={shimmer} className="h-6 w-20" />
          <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton shimmer={shimmer} className="h-4 w-24" />
              </div>
              <Skeleton shimmer={shimmer} className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Modules panel */}
      <div className="p-6 rounded-xl border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton shimmer={shimmer} className="h-6 w-24" />
          <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-lg" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <Skeleton shimmer={shimmer} className="h-4 w-28" />
              <Skeleton shimmer={shimmer} className="h-5 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Settings panel */}
      <div className="p-6 rounded-xl border bg-card space-y-4">
        <Skeleton shimmer={shimmer} className="h-6 w-24" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton shimmer={shimmer} className="h-4 w-32" />
              <Skeleton shimmer={shimmer} className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
