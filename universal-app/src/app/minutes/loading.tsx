'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ShellPage } from '@/components/layout';

/**
 * Loading skeleton for Minutes page
 * Displays while minutes data is being fetched
 */
export default function MinutesLoading() {
  return (
    <ShellPage className="space-y-6 animate-in fade-in duration-300" role="status" aria-busy="true" aria-label="Loading minutes">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton shimmer className="h-8 w-40" />
          <Skeleton shimmer className="h-4 w-64" />
        </div>
        <Skeleton shimmer className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats grid skeleton - responsive: 1 col mobile, 2 tablet, 4 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton shimmer className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton shimmer className="h-4 w-20" />
                <Skeleton shimmer className="h-6 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <Skeleton shimmer className="h-10 flex-1 rounded-lg" />
        <div className="flex gap-3 w-full md:w-auto">
          <Skeleton shimmer className="h-10 w-[140px] rounded-lg" />
          <Skeleton shimmer className="h-10 w-[140px] rounded-lg" />
        </div>
      </div>

      {/* Minutes list skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <Skeleton shimmer className="h-6 w-48" />
                  <Skeleton shimmer className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton shimmer className="h-4 w-full max-w-md" />
                <div className="flex flex-wrap gap-4">
                  <Skeleton shimmer className="h-4 w-24" />
                  <Skeleton shimmer className="h-4 w-32" />
                  <Skeleton shimmer className="h-4 w-20" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton shimmer className="h-9 w-24 rounded-lg" />
                <Skeleton shimmer className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <span className="sr-only">Loading minutes</span>
    </ShellPage>
  );
}
