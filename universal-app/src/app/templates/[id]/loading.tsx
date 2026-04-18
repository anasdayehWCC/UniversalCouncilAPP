'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Loading skeleton for Template detail page
 * Mirrors the TemplateDetailPage structure: back button, template header,
 * action buttons, and template preview with sections.
 */
export default function TemplateDetailLoading() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      role="status"
      aria-busy="true"
      aria-label="Loading template details"
    >
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton shimmer className="h-9 w-28 rounded-lg" />
          <div className="space-y-2">
            <Skeleton shimmer className="h-7 w-56" />
            <Skeleton shimmer className="h-4 w-80" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton shimmer className="h-9 w-28 rounded-lg" />
          <Skeleton shimmer className="h-9 w-32 rounded-lg" />
          <Skeleton shimmer className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Template preview card */}
      <div className="max-w-3xl">
        <Card className="p-6 space-y-6">
          {/* Template meta */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton shimmer className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton shimmer className="h-6 w-44" />
                <Skeleton shimmer className="h-4 w-28" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton shimmer className="h-6 w-20 rounded-full" />
              <Skeleton shimmer className="h-6 w-24 rounded-full" />
              <Skeleton shimmer className="h-6 w-16 rounded-full" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-4 border-t border-border">
            <Skeleton shimmer className="h-5 w-28" />
            <Skeleton shimmer className="h-4 w-full" />
            <Skeleton shimmer className="h-4 w-3/4" />
          </div>

          {/* Sections accordion */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Skeleton shimmer className="h-5 w-20" />
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Skeleton shimmer className="h-5 w-40" />
                  <Skeleton shimmer className="h-5 w-5 rounded" />
                </div>
                <Skeleton shimmer className="h-4 w-full" />
                <Skeleton shimmer className="h-4 w-2/3" />
              </div>
            ))}
          </div>

          {/* Use template button */}
          <div className="pt-4 border-t border-border">
            <Skeleton shimmer className="h-10 w-40 rounded-lg" />
          </div>
        </Card>
      </div>

      <span className="sr-only">Loading template details</span>
    </div>
  );
}
