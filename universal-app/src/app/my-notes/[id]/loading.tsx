'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for Note Detail page
 * Mirrors the actual page layout: breadcrumb, header with badges,
 * title/metadata, tab bar, content area, and AI sidebar on xl+.
 */
export default function NoteDetailLoading() {
  return (
    <div
      className="flex min-h-0 min-w-0"
      role="status"
      aria-busy="true"
      aria-label="Loading note"
    >
      {/* Main Content Area — xl:mr-80 makes room for fixed AI sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/30 xl:mr-80">
        {/* Header */}
        <div className="px-4 sm:px-8 py-6 border-b border-border bg-card flex-shrink-0 shadow-sm space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <Skeleton shimmer className="h-4 w-4" />
            <Skeleton shimmer className="h-4 w-20" />
            <Skeleton shimmer className="h-4 w-2" />
            <Skeleton shimmer className="h-4 w-48" />
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Skeleton shimmer className="h-5 w-28 rounded-full" />
            <Skeleton shimmer className="h-5 w-20 rounded-full" />
            <Skeleton shimmer className="h-5 w-24 rounded-full" />
          </div>

          {/* Title and actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
            <div className="space-y-3">
              <Skeleton shimmer className="h-8 w-64 sm:w-80" />
              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <Skeleton shimmer className="h-4 w-36" />
                <Skeleton shimmer className="h-4 w-20" />
                <Skeleton shimmer className="h-5 w-32 rounded-full" />
                <Skeleton shimmer className="h-4 w-28" />
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Skeleton shimmer className="h-10 w-24 rounded-lg" />
              <Skeleton shimmer className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="px-4 sm:px-8 pt-6 pb-0 bg-card border-b border-border flex-shrink-0">
          <div className="flex gap-4 sm:gap-8 overflow-x-auto">
            <Skeleton shimmer className="h-9 w-24 rounded-t-md" />
            <Skeleton shimmer className="h-9 w-40 rounded-t-md" />
            <Skeleton shimmer className="h-9 w-20 rounded-t-md" />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton shimmer className="h-5 w-40" />
                <Skeleton shimmer className="h-4 w-full" />
                <Skeleton shimmer className="h-4 w-full" />
                <Skeleton shimmer className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Sidebar skeleton — visible on xl+ only */}
      <div className="hidden xl:block fixed right-0 top-0 h-full w-80 border-l border-border bg-card p-6 space-y-6">
        <Skeleton shimmer className="h-6 w-32" />
        <Skeleton shimmer className="h-4 w-48" />
        <div className="space-y-3 pt-4">
          <Skeleton shimmer className="h-10 w-full rounded-lg" />
          <Skeleton shimmer className="h-10 w-full rounded-lg" />
          <Skeleton shimmer className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2 pt-4">
          <Skeleton shimmer className="h-4 w-24" />
          <Skeleton shimmer className="h-20 w-full rounded-lg" />
        </div>
      </div>

      <span className="sr-only">Loading note</span>
    </div>
  );
}
