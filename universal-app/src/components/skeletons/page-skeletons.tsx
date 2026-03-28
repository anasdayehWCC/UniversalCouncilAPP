'use client';

import { cn } from '@/lib/utils';
import { type SkeletonProps } from '@/components/ui/skeleton';
import { NavigationSkeleton, SidebarSkeleton, BreadcrumbSkeleton } from './NavigationSkeleton';
import { RecordingListSkeleton } from './RecordingCardSkeleton';
import { DashboardSkeleton, DashboardHeaderSkeleton, ChartSkeleton } from './DashboardSkeleton';
import { TableSkeleton } from './TableSkeleton';
import { FormSkeleton } from './FormSkeleton';
import { MinuteSkeleton } from './MinuteSkeleton';
import { TranscriptSkeleton, AudioPlayerSkeleton } from './TranscriptSkeleton';

export interface PageSkeletonProps extends SkeletonProps {
  /** Include header/nav */
  withHeader?: boolean;
  /** Include sidebar */
  withSidebar?: boolean;
}

/**
 * Layout wrapper for page skeletons
 */
function PageLayout({ 
  children, 
  withHeader = true, 
  withSidebar = false,
  shimmer,
  className 
}: PageSkeletonProps & { children: React.ReactNode }) {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      {withHeader && <NavigationSkeleton shimmer={shimmer} />}
      
      <div className="flex flex-1">
        {withSidebar && <SidebarSkeleton shimmer={shimmer} />}
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Home page skeleton
 * Used for dashboard/landing views
 */
export function HomePageSkeleton({ shimmer, className, ...props }: PageSkeletonProps) {
  return (
    <PageLayout shimmer={shimmer} {...props}>
      <div className={cn('max-w-7xl mx-auto space-y-6', className)}>
        <DashboardSkeleton shimmer={shimmer} />
      </div>
    </PageLayout>
  );
}

/**
 * Record page skeleton
 * Used for recording interface
 */
export function RecordPageSkeleton({ shimmer, className, ...props }: PageSkeletonProps) {
  return (
    <PageLayout shimmer={shimmer} {...props}>
      <div className={cn('max-w-4xl mx-auto space-y-8', className)}>
        {/* Header */}
        <DashboardHeaderSkeleton shimmer={shimmer} />

        {/* Recording interface */}
        <div className="p-8 rounded-2xl border bg-card space-y-6">
          {/* Waveform/visualizer placeholder */}
          <div className="h-32 rounded-xl bg-muted/30 flex items-center justify-center">
            <div className="flex items-end gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 bg-muted rounded-full animate-pulse',
                    { 'h-8': i % 4 === 0, 'h-12': i % 4 === 1, 'h-6': i % 4 === 2, 'h-16': i % 4 === 3 }
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="h-10 w-32 rounded-lg bg-muted animate-pulse mx-auto" />
          </div>
        </div>

        {/* Recent recordings */}
        <div className="space-y-4">
          <div className="h-6 w-40 rounded bg-muted animate-pulse" />
          <RecordingListSkeleton shimmer={shimmer} count={3} compact />
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Minutes page skeleton
 * Used for minute list/editor views
 */
export function MinutesPageSkeleton({ 
  shimmer, 
  className,
  variant = 'list',
  ...props 
}: PageSkeletonProps & { variant?: 'list' | 'editor' }) {
  return (
    <PageLayout shimmer={shimmer} {...props}>
      <div className={cn('max-w-7xl mx-auto', className)}>
        {/* Breadcrumb */}
        <BreadcrumbSkeleton shimmer={shimmer} className="mb-6" />

        {variant === 'editor' ? (
          <MinuteSkeleton shimmer={shimmer} />
        ) : (
          <div className="space-y-6">
            <DashboardHeaderSkeleton shimmer={shimmer} />
            
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
            
            {/* Minutes list */}
            <RecordingListSkeleton shimmer={shimmer} count={6} />
          </div>
        )}
      </div>
    </PageLayout>
  );
}

/**
 * Admin page skeleton
 * Used for admin dashboard views
 */
export function AdminPageSkeleton({ shimmer, className, ...props }: PageSkeletonProps) {
  return (
    <PageLayout shimmer={shimmer} withSidebar {...props}>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <DashboardHeaderSkeleton shimmer={shimmer} />

        {/* Admin panels */}
        <DashboardSkeleton shimmer={shimmer} variant="admin" />

        {/* Users table */}
        <div className="space-y-4">
          <div className="h-6 w-24 rounded bg-muted animate-pulse" />
          <TableSkeleton shimmer={shimmer} rows={8} cols={5} />
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Insights page skeleton
 * Used for analytics/reports views
 */
export function InsightsPageSkeleton({ shimmer, className, ...props }: PageSkeletonProps) {
  return (
    <PageLayout shimmer={shimmer} withSidebar {...props}>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <DashboardHeaderSkeleton shimmer={shimmer} />

        {/* Date range selector */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
        </div>

        {/* Metrics */}
        <DashboardSkeleton 
          shimmer={shimmer} 
          variant="insights" 
          metrics={5} 
          withCharts 
        />
      </div>
    </PageLayout>
  );
}

/**
 * Transcript page skeleton
 * Used for transcript viewer/editor
 */
export function TranscriptPageSkeleton({ shimmer, className, ...props }: PageSkeletonProps) {
  return (
    <PageLayout shimmer={shimmer} {...props}>
      <div className={cn('max-w-5xl mx-auto space-y-6', className)}>
        {/* Breadcrumb */}
        <BreadcrumbSkeleton shimmer={shimmer} />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 rounded bg-muted animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>

        {/* Audio player */}
        <AudioPlayerSkeleton shimmer={shimmer} />

        {/* Transcript */}
        <TranscriptSkeleton shimmer={shimmer} segments={10} />
      </div>
    </PageLayout>
  );
}

/**
 * Review page skeleton
 * Used for QA/review workflow
 */
export function ReviewPageSkeleton({ shimmer, className, ...props }: PageSkeletonProps) {
  return (
    <PageLayout shimmer={shimmer} withSidebar {...props}>
      <div className={cn('space-y-6', className)}>
        <DashboardHeaderSkeleton shimmer={shimmer} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <MinuteSkeleton shimmer={shimmer} withSidebar={false} />
          </div>
          
          {/* Review sidebar */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl border bg-card space-y-4">
              <div className="h-6 w-24 rounded bg-muted animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                    <div className="h-5 w-5 rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="h-10 flex-1 rounded-lg bg-muted animate-pulse" />
              <div className="h-10 flex-1 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Settings page skeleton
 */
export function SettingsPageSkeleton({ shimmer, className, ...props }: PageSkeletonProps) {
  return (
    <PageLayout shimmer={shimmer} withSidebar {...props}>
      <div className={cn('max-w-3xl space-y-6', className)}>
        <DashboardHeaderSkeleton shimmer={shimmer} />
        <FormSkeleton shimmer={shimmer} sections={3} fields={8} />
      </div>
    </PageLayout>
  );
}

/**
 * Error page skeleton (generic)
 */
export function ErrorPageSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn(
      'min-h-screen flex flex-col items-center justify-center p-6 text-center',
      className
    )}>
      <div className="h-24 w-24 rounded-full bg-muted animate-pulse mb-6" />
      <div className="h-8 w-48 rounded bg-muted animate-pulse mb-3" />
      <div className="h-4 w-72 rounded bg-muted animate-pulse mb-6" />
      <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}

/**
 * Empty state skeleton
 */
export function EmptyStateSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center',
      className
    )}>
      <div className="h-16 w-16 rounded-xl bg-muted animate-pulse mb-4" />
      <div className="h-6 w-40 rounded bg-muted animate-pulse mb-2" />
      <div className="h-4 w-56 rounded bg-muted animate-pulse mb-6" />
      <div className="h-10 w-36 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}
