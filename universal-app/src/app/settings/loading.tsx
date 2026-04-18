'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Loading skeleton for Settings page
 * Mirrors the SettingsPage structure: hero card, appearance controls,
 * status cards, and live preview panel.
 */
export default function SettingsLoading() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      role="status"
      aria-busy="true"
      aria-label="Loading settings"
    >
      {/* Hero card skeleton */}
      <Card className="overflow-hidden border-border/30 bg-muted/40">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Skeleton shimmer className="h-6 w-24 rounded-full" />
              <Skeleton shimmer className="h-8 w-72" />
              <Skeleton shimmer className="h-4 w-96 max-w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton shimmer className="h-6 w-28 rounded-full" />
              <Skeleton shimmer className="h-6 w-24 rounded-full" />
              <Skeleton shimmer className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </Card>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        {/* Appearance card */}
        <Card className="p-6">
          <div className="space-y-2 mb-6">
            <Skeleton shimmer className="h-6 w-28" />
            <Skeleton shimmer className="h-4 w-72" />
          </div>

          <div className="space-y-6">
            {/* Mode toggle buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton shimmer className="h-10 w-28 rounded-lg" />
              <Skeleton shimmer className="h-10 w-24 rounded-lg" />
              <Skeleton shimmer className="h-10 w-28 rounded-lg" />
              <Skeleton shimmer className="h-10 w-32 rounded-lg" />
              <Skeleton shimmer className="h-10 w-24 rounded-lg" />
            </div>

            {/* Status info cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-muted/50 p-4 space-y-2"
                >
                  <Skeleton shimmer className="h-3 w-16" />
                  <Skeleton shimmer className="h-5 w-20" />
                </div>
              ))}
            </div>

            {/* Storage and sync cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton shimmer className="h-4 w-4 rounded" />
                    <Skeleton shimmer className="h-4 w-16" />
                  </div>
                  <Skeleton shimmer className="h-4 w-28" />
                  <Skeleton shimmer className="h-3 w-36" />
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Skeleton shimmer className="h-10 w-28 rounded-lg" />
              <Skeleton shimmer className="h-10 w-40 rounded-lg" />
            </div>
          </div>
        </Card>

        {/* Live preview card */}
        <Card className="p-6">
          <div className="space-y-2 mb-6">
            <Skeleton shimmer className="h-6 w-28" />
            <Skeleton shimmer className="h-4 w-64" />
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
            {/* Preview header */}
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="space-y-1">
                <Skeleton shimmer className="h-3 w-20" />
                <Skeleton shimmer className="h-4 w-28" />
              </div>
              <Skeleton shimmer className="h-6 w-20 rounded-full" />
            </div>

            {/* Preview content */}
            <div className="space-y-4 p-4">
              <div className="rounded-xl bg-background p-4 shadow-sm border border-border space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Skeleton shimmer className="h-3 w-20" />
                    <Skeleton shimmer className="h-5 w-32" />
                    <Skeleton shimmer className="h-4 w-40" />
                  </div>
                  <Skeleton shimmer className="h-6 w-16 rounded-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton shimmer className="h-6 w-20 rounded-full" />
                  <Skeleton shimmer className="h-6 w-24 rounded-full" />
                  <Skeleton shimmer className="h-6 w-28 rounded-full" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-3 space-y-1"
                  >
                    <Skeleton shimmer className="h-3 w-12" />
                    <Skeleton shimmer className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <span className="sr-only">Loading settings</span>
    </div>
  );
}
