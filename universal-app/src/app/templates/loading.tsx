'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Loading skeleton for Templates page
 * Displays while templates data is being fetched
 */
export default function TemplatesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" role="status" aria-busy="true" aria-label="Loading templates">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton shimmer className="h-8 w-48" />
          <Skeleton shimmer className="h-4 w-72" />
        </div>
        <Skeleton shimmer className="h-10 w-36 rounded-lg" />
      </div>

      {/* Filters and search skeleton */}
      <div className="bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton shimmer className="h-10 flex-1 rounded-lg" />
          <div className="flex gap-3">
            <Skeleton shimmer className="h-10 w-[160px] rounded-lg" />
            <Skeleton shimmer className="h-10 w-[160px] rounded-lg" />
          </div>
        </div>
      </div>

      {/* Category chips skeleton */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} shimmer className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Templates grid skeleton - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="p-5 h-[200px]">
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton shimmer className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton shimmer className="h-5 w-32" />
                    <Skeleton shimmer className="h-4 w-20 rounded-full" />
                  </div>
                </div>
                <Skeleton shimmer className="h-6 w-6 rounded" />
              </div>
              <Skeleton shimmer className="h-4 w-full" />
              <Skeleton shimmer className="h-4 w-3/4" />
              <div className="flex gap-2 mt-auto">
                <Skeleton shimmer className="h-6 w-16 rounded-full" />
                <Skeleton shimmer className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <span className="sr-only">Loading templates</span>
    </div>
  );
}
