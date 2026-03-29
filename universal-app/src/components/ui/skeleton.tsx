'use client';

import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  /** Enable shimmer effect instead of pulse */
  shimmer?: boolean;
  /** Animation duration in ms */
  duration?: number;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * Base Skeleton component for loading states
 * Supports pulse animation (default) and optional shimmer effect
 * Respects prefers-reduced-motion automatically via Tailwind
 */
export function Skeleton({ className, shimmer = false, duration, style }: SkeletonProps) {
  const computedStyle = duration ? { ...style, animationDuration: `${duration}ms` } : style;
  
  return (
    <div
      className={cn(
        'rounded-md bg-muted motion-reduce:animate-none',
        shimmer 
          ? 'skeleton-shimmer'
          : 'animate-pulse motion-reduce:animate-none',
        className
      )}
      style={computedStyle}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonText - For text line placeholders
 */
export function SkeletonText({ 
  lines = 1, 
  className,
  shimmer,
  lastLineWidth = '75%'
}: SkeletonProps & { 
  lines?: number;
  lastLineWidth?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          shimmer={shimmer}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? `w-[${lastLineWidth}]` : 'w-full'
          )} 
        />
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar - Circular skeleton for avatars/profile images
 */
export function SkeletonAvatar({ 
  size = 'md',
  className,
  shimmer
}: SkeletonProps & { 
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizes = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  
  return (
    <Skeleton 
      shimmer={shimmer}
      className={cn('rounded-full', sizes[size], className)} 
    />
  );
}

/**
 * SkeletonButton - Button placeholder skeleton
 */
export function SkeletonButton({ 
  size = 'md',
  className,
  shimmer
}: SkeletonProps & { 
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };
  
  return (
    <Skeleton 
      shimmer={shimmer}
      className={cn('rounded-lg', sizes[size], className)} 
    />
  );
}

/**
 * SkeletonCard - Card placeholder with title, description, and badges
 */
export function SkeletonCard({ className, shimmer }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-4 shadow-sm', className)}>
      <Skeleton shimmer={shimmer} className="h-5 w-3/4" />
      <Skeleton shimmer={shimmer} className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton shimmer={shimmer} className="h-6 w-16 rounded-full" />
        <Skeleton shimmer={shimmer} className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * SkeletonBadge - Badge/tag placeholder
 */
export function SkeletonBadge({ className, shimmer }: SkeletonProps) {
  return (
    <Skeleton 
      shimmer={shimmer}
      className={cn('h-6 w-16 rounded-full', className)} 
    />
  );
}

/**
 * SkeletonList - List of items with avatar and text
 */
export function SkeletonList({ 
  count = 3, 
  className,
  shimmer
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonAvatar shimmer={shimmer} />
          <div className="flex-1 space-y-2">
            <Skeleton shimmer={shimmer} className="h-4 w-3/4" />
            <Skeleton shimmer={shimmer} className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonTable - Table placeholder with header and rows
 */
export function SkeletonTable({ 
  rows = 5, 
  cols = 4, 
  className,
  shimmer
}: SkeletonProps & { rows?: number; cols?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 py-3 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} shimmer={shimmer} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-3">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} shimmer={shimmer} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonMetricCard - Metric/stat card placeholder
 */
export function SkeletonMetricCard({ className, shimmer }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-2 shadow-sm', className)}>
      <Skeleton shimmer={shimmer} className="h-3 w-20" />
      <Skeleton shimmer={shimmer} className="h-8 w-16" />
      <Skeleton shimmer={shimmer} className="h-3 w-24" />
    </div>
  );
}

/**
 * SkeletonDashboard - Full dashboard layout placeholder
 */
export function SkeletonDashboard({ className, shimmer }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Hero section */}
      <div className="space-y-2">
        <Skeleton shimmer={shimmer} className="h-8 w-48" />
        <Skeleton shimmer={shimmer} className="h-4 w-72" />
      </div>
      
      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonMetricCard key={i} shimmer={shimmer} />
        ))}
      </div>
      
      {/* Content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} shimmer={shimmer} />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonInput - Form input placeholder
 */
export function SkeletonInput({ className, shimmer }: SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton shimmer={shimmer} className="h-4 w-24" />
      <Skeleton shimmer={shimmer} className="h-10 w-full rounded-lg" />
    </div>
  );
}

/**
 * SkeletonTextarea - Form textarea placeholder
 */
export function SkeletonTextarea({ className, shimmer }: SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton shimmer={shimmer} className="h-4 w-24" />
      <Skeleton shimmer={shimmer} className="h-24 w-full rounded-lg" />
    </div>
  );
}
