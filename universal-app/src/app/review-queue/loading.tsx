'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Loading skeleton for Review Queue page
 * Displays while review data is being fetched
 */
export default function ReviewQueueLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" role="status" aria-busy="true" aria-label="Loading review queue">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton shimmer className="h-8 w-48" />
          <Skeleton shimmer className="h-4 w-72" />
        </div>
        <div className="flex gap-3">
          <Skeleton shimmer className="h-10 w-[180px] rounded-lg" />
          <Skeleton shimmer className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton shimmer className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton shimmer className="h-4 w-24" />
                <Skeleton shimmer className="h-6 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="bg-card rounded-xl p-1 w-fit">
        <div className="flex gap-1">
          <Skeleton shimmer className="h-9 w-32 rounded-md" />
          <Skeleton shimmer className="h-9 w-32 rounded-md" />
          <Skeleton shimmer className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* List items skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton shimmer className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex justify-between">
                  <Skeleton shimmer className="h-5 w-48" />
                  <Skeleton shimmer className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton shimmer className="h-4 w-full" />
                <Skeleton shimmer className="h-4 w-3/4" />
                <div className="flex gap-4 pt-2">
                  <Skeleton shimmer className="h-4 w-24" />
                  <Skeleton shimmer className="h-4 w-24" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <span className="sr-only">Loading review queue items</span>
    </div>
  );
}
