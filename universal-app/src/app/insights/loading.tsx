'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ShellPage } from '@/components/layout';

/**
 * Loading skeleton for Insights page
 * Displays while insights data is being fetched
 */
export default function InsightsLoading() {
  return (
    <ShellPage className="space-y-6 animate-in fade-in duration-300" role="status" aria-busy="true" aria-label="Loading insights">
      {/* Header skeleton */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-primary/20 to-accent/20 dark:from-primary/10 dark:to-accent/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton shimmer className="h-8 w-40" />
            <Skeleton shimmer className="h-4 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton shimmer className="h-10 w-[180px] rounded-lg" />
            <Skeleton shimmer className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      {/* KPI cards skeleton - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton shimmer className="h-12 w-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton shimmer className="h-4 w-24" />
                <Skeleton shimmer className="h-8 w-20" />
              </div>
            </div>
            <div className="mt-4">
              <Skeleton shimmer className="h-12 w-full rounded" />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity chart */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton shimmer className="h-6 w-32" />
              <Skeleton shimmer className="h-8 w-[120px] rounded-lg" />
            </div>
            <Skeleton shimmer className="h-[200px] w-full rounded" />
          </div>
        </Card>
        
        {/* Distribution chart */}
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton shimmer className="h-6 w-40" />
            <div className="flex items-center justify-center">
              <Skeleton shimmer className="h-[200px] w-[200px] rounded-full" />
            </div>
            <div className="flex justify-center gap-4">
              <Skeleton shimmer className="h-4 w-20" />
              <Skeleton shimmer className="h-4 w-20" />
              <Skeleton shimmer className="h-4 w-20" />
            </div>
          </div>
        </Card>
      </div>

      {/* Heatmap skeleton */}
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton shimmer className="h-6 w-36" />
          <Skeleton shimmer className="h-[160px] w-full rounded" />
        </div>
      </Card>

      {/* Activity feed skeleton */}
      <Card className="p-6">
        <Skeleton shimmer className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton shimmer className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton shimmer className="h-4 w-3/4" />
                <Skeleton shimmer className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      <span className="sr-only">Loading insights dashboard</span>
    </ShellPage>
  );
}
