'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { RecordingCardSkeleton } from '@/components/skeletons/RecordingCardSkeleton';
import { ShellPage } from '@/components/layout';

/**
 * Loading skeleton for My Notes page
 * Displays while data is being fetched
 */
export default function MyNotesLoading() {
  return (
    <ShellPage className="space-y-6 animate-in fade-in duration-300" role="status" aria-busy="true" aria-label="Loading notes">
      {/* Header skeleton */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-primary/20 to-accent/20 dark:from-primary/10 dark:to-accent/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton shimmer className="h-8 w-40" />
            <Skeleton shimmer className="h-4 w-64" />
            <div className="flex gap-4 mt-3">
              <Skeleton shimmer className="h-5 w-24 rounded-full" />
              <Skeleton shimmer className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton shimmer className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <Skeleton shimmer className="h-10 flex-1 rounded-lg" />
        <div className="flex gap-3 w-full md:w-auto">
          <Skeleton shimmer className="h-10 w-[180px] rounded-lg" />
          <Skeleton shimmer className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* Results skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <RecordingCardSkeleton key={index} shimmer />
        ))}
      </div>
    </ShellPage>
  );
}
