'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for Minute Detail page
 * Mirrors the minute editor layout: breadcrumb, title + status badge,
 * section blocks with left-border indented paragraphs, optional info sidebar on lg+.
 */
export default function MinuteDetailLoading() {
  return (
    <div
      className="min-h-0 bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading minute"
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton shimmer className="h-4 w-16" />
          <Skeleton shimmer className="h-4 w-2" />
          <Skeleton shimmer className="h-4 w-48" />
          <Skeleton shimmer className="h-5 w-16 rounded-full" />
        </div>

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Header — title + status + actions */}
            <div className="space-y-4 pb-6 border-b border-border">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Skeleton shimmer className="h-8 w-64" />
                  <div className="flex items-center gap-3">
                    <Skeleton shimmer className="h-5 w-20 rounded-full" />
                    <Skeleton shimmer className="h-4 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton shimmer className="h-10 w-24 rounded-lg" />
                  <Skeleton shimmer className="h-10 w-10 rounded-lg" />
                </div>
              </div>

              {/* Meta tags */}
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton shimmer className="h-6 w-32 rounded-full" />
                <Skeleton shimmer className="h-6 w-24 rounded-full" />
                <Skeleton shimmer className="h-6 w-28 rounded-full" />
              </div>
            </div>

            {/* Section blocks */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                {/* Section heading */}
                <div className="flex items-center justify-between">
                  <Skeleton shimmer className="h-6 w-40" />
                  <Skeleton shimmer className="h-6 w-6 rounded" />
                </div>

                {/* Indented paragraph lines with left border */}
                <div className="space-y-3 pl-4 border-l-2 border-muted">
                  {Array.from({ length: i % 2 === 0 ? 3 : 2 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton shimmer className="h-4 w-full" />
                      <Skeleton shimmer className="h-4 w-full" />
                      <Skeleton shimmer className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>

                {/* Evidence citation placeholder */}
                <div className="flex items-center gap-2 pt-2">
                  <Skeleton shimmer className="h-5 w-5 rounded" />
                  <Skeleton shimmer className="h-4 w-20" />
                </div>
              </div>
            ))}

            {/* Action items placeholder */}
            <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between">
                <Skeleton shimmer className="h-6 w-28" />
                <Skeleton shimmer className="h-8 w-20 rounded-lg" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Skeleton shimmer className="h-5 w-5 rounded shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <Skeleton shimmer className="h-4 w-full" />
                      <div className="flex items-center gap-2">
                        <Skeleton shimmer className="h-5 w-16 rounded-full" />
                        <Skeleton shimmer className="h-3 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info sidebar — visible on lg+ only */}
          <div className="hidden lg:block w-80 shrink-0 space-y-6">
            {/* Status card */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <Skeleton shimmer className="h-5 w-20" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton shimmer className="h-4 w-20" />
                    <Skeleton shimmer className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Activity log */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <Skeleton shimmer className="h-5 w-24" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton shimmer className="h-6 w-6 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton shimmer className="h-3 w-full" />
                      <Skeleton shimmer className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading minute</span>
    </div>
  );
}
