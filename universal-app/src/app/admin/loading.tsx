'use client';

import { Skeleton, SkeletonMetricCard } from '@/components/ui/skeleton';

/**
 * Loading skeleton for Admin Dashboard
 * Shows KPI cards and activity placeholders while loading
 */
export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" role="status" aria-busy="true" aria-label="Loading admin dashboard">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton shimmer className="h-8 w-48" />
          <Skeleton shimmer className="h-4 w-72" />
        </div>
        <Skeleton shimmer className="h-10 w-28 rounded-lg" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonMetricCard key={index} shimmer />
        ))}
      </div>

      {/* Quick Actions & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 rounded-xl border bg-card p-5 shadow-sm">
          <Skeleton shimmer className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} shimmer className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="lg:col-span-1 rounded-xl border bg-card p-5 shadow-sm">
          <Skeleton shimmer className="h-5 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton shimmer className="h-4 w-24" />
                  <Skeleton shimmer className="h-4 w-12" />
                </div>
                <Skeleton shimmer className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 rounded-xl border bg-card p-5 shadow-sm">
          <Skeleton shimmer className="h-5 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <Skeleton shimmer className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton shimmer className="h-4 w-3/4" />
                  <Skeleton shimmer className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log section */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Skeleton shimmer className="h-5 w-40" />
          <Skeleton shimmer className="h-8 w-24 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
              <Skeleton shimmer className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton shimmer className="h-4 w-1/3" />
                <Skeleton shimmer className="h-3 w-1/4" />
              </div>
              <Skeleton shimmer className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
