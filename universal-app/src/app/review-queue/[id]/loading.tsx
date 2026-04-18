'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Loading skeleton for Review Queue detail page
 * Mirrors the ReviewDetailPage structure: hero header, status badges,
 * content card, and feedback panel.
 */
export default function ReviewDetailLoading() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      role="status"
      aria-busy="true"
      aria-label="Loading review details"
    >
      {/* Hero header skeleton */}
      <Card className="p-6 border-none bg-muted/60">
        <Skeleton shimmer className="h-4 w-28 mb-2" />
        <Skeleton shimmer className="h-7 w-56 mb-2" />
        <Skeleton shimmer className="h-4 w-80" />
      </Card>

      {/* Status bar skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton shimmer className="h-6 w-24 rounded-full" />
        <Skeleton shimmer className="h-6 w-20 rounded-full" />
        <Skeleton shimmer className="h-6 w-28 rounded-full" />
        <div className="ml-auto flex gap-2">
          <Skeleton shimmer className="h-4 w-32" />
        </div>
      </div>

      {/* Main content area */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Content card */}
        <Card className="p-6">
          <div className="space-y-5">
            {/* Title and metadata */}
            <div className="space-y-3">
              <Skeleton shimmer className="h-6 w-64" />
              <div className="flex gap-3">
                <Skeleton shimmer className="h-4 w-28" />
                <Skeleton shimmer className="h-4 w-20" />
                <Skeleton shimmer className="h-4 w-24" />
              </div>
            </div>

            {/* Summary section */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Skeleton shimmer className="h-5 w-24" />
              <Skeleton shimmer className="h-4 w-full" />
              <Skeleton shimmer className="h-4 w-full" />
              <Skeleton shimmer className="h-4 w-3/4" />
            </div>

            {/* Transcript / content section */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Skeleton shimmer className="h-5 w-32" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 py-2">
                  <Skeleton shimmer className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton shimmer className="h-4 w-24" />
                    <Skeleton shimmer className="h-4 w-full" />
                    <Skeleton shimmer className="h-4 w-5/6" />
                  </div>
                </div>
              ))}
            </div>

            {/* Action items */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Skeleton shimmer className="h-5 w-28" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <Skeleton shimmer className="h-5 w-5 rounded" />
                  <Skeleton shimmer className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Feedback panel */}
        <div className="space-y-4">
          {/* Approval actions */}
          <Card className="p-5">
            <Skeleton shimmer className="h-5 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton shimmer className="h-10 w-full rounded-lg" />
              <Skeleton shimmer className="h-10 w-full rounded-lg" />
              <Skeleton shimmer className="h-10 w-full rounded-lg" />
            </div>
          </Card>

          {/* Feedback list */}
          <Card className="p-5">
            <Skeleton shimmer className="h-5 w-24 mb-4" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton shimmer className="h-6 w-6 rounded-full" />
                    <Skeleton shimmer className="h-4 w-24" />
                    <Skeleton shimmer className="h-4 w-16 ml-auto" />
                  </div>
                  <Skeleton shimmer className="h-4 w-full" />
                  <Skeleton shimmer className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </Card>

          {/* Add feedback */}
          <Card className="p-5">
            <Skeleton shimmer className="h-5 w-28 mb-3" />
            <Skeleton shimmer className="h-24 w-full rounded-lg mb-3" />
            <Skeleton shimmer className="h-9 w-32 rounded-lg" />
          </Card>
        </div>
      </div>

      <span className="sr-only">Loading review details</span>
    </div>
  );
}
