'use client';

import { cn } from '@/lib/utils';
import { 
  Skeleton, 
  SkeletonAvatar, 
  SkeletonBadge, 
  SkeletonCard,
  type SkeletonProps 
} from '@/components/ui/skeleton';

export interface ProfileSkeletonProps extends SkeletonProps {
  /** Profile layout variant */
  variant?: 'full' | 'compact' | 'card';
  /** Include stats section */
  withStats?: boolean;
  /** Include activity section */
  withActivity?: boolean;
}

/**
 * User profile skeleton
 */
export function ProfileSkeleton({ 
  className, 
  variant = 'full',
  withStats = true,
  withActivity = true,
  shimmer 
}: ProfileSkeletonProps) {
  if (variant === 'card') {
    return <ProfileCardSkeleton shimmer={shimmer} className={className} />;
  }

  if (variant === 'compact') {
    return <ProfileCompactSkeleton shimmer={shimmer} className={className} />;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <ProfileHeaderSkeleton shimmer={shimmer} />

      {/* Stats */}
      {withStats && <ProfileStatsSkeleton shimmer={shimmer} />}

      {/* Activity */}
      {withActivity && <ProfileActivitySkeleton shimmer={shimmer} />}
    </div>
  );
}

/**
 * Profile header skeleton
 */
export function ProfileHeaderSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Cover image */}
      <Skeleton shimmer={shimmer} className="h-32 sm:h-48 w-full rounded-xl" />
      
      {/* Avatar and info */}
      <div className="px-4 sm:px-6 pb-4 -mt-12 sm:-mt-16 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <SkeletonAvatar 
            shimmer={shimmer} 
            size="xl" 
            className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-background" 
          />
          
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <Skeleton shimmer={shimmer} className="h-7 w-48" />
                <Skeleton shimmer={shimmer} className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton shimmer={shimmer} className="h-10 w-28 rounded-lg" />
                <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
              </div>
            </div>
            
            {/* Role badges */}
            <div className="flex items-center gap-2">
              <SkeletonBadge shimmer={shimmer} className="w-20" />
              <SkeletonBadge shimmer={shimmer} className="w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Profile stats skeleton
 */
export function ProfileStatsSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn(
      'grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border bg-card',
      className
    )}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="text-center space-y-1">
          <Skeleton shimmer={shimmer} className="h-8 w-12 mx-auto" />
          <Skeleton shimmer={shimmer} className="h-4 w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}

/**
 * Profile activity skeleton
 */
export function ProfileActivitySkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('p-6 rounded-xl border bg-card space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton shimmer={shimmer} className="h-6 w-32" />
        <Skeleton shimmer={shimmer} className="h-8 w-20 rounded-lg" />
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton shimmer={shimmer} className="h-4 w-full" />
              <Skeleton shimmer={shimmer} className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact profile skeleton
 */
export function ProfileCompactSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <SkeletonAvatar shimmer={shimmer} size="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton shimmer={shimmer} className="h-5 w-32" />
        <Skeleton shimmer={shimmer} className="h-4 w-24" />
        <div className="flex items-center gap-2">
          <SkeletonBadge shimmer={shimmer} className="w-16" />
          <SkeletonBadge shimmer={shimmer} className="w-14" />
        </div>
      </div>
    </div>
  );
}

/**
 * Profile card skeleton
 */
export function ProfileCardSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn(
      'p-6 rounded-xl border bg-card text-center space-y-4',
      className
    )}>
      <SkeletonAvatar shimmer={shimmer} size="xl" className="mx-auto" />
      <div className="space-y-2">
        <Skeleton shimmer={shimmer} className="h-6 w-32 mx-auto" />
        <Skeleton shimmer={shimmer} className="h-4 w-24 mx-auto" />
      </div>
      <div className="flex justify-center gap-2">
        <SkeletonBadge shimmer={shimmer} className="w-16" />
        <SkeletonBadge shimmer={shimmer} className="w-20" />
      </div>
      <Skeleton shimmer={shimmer} className="h-10 w-full rounded-lg" />
    </div>
  );
}

/**
 * Team member list skeleton
 */
export function TeamMemberListSkeleton({ 
  shimmer, 
  className,
  count = 4,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ProfileCardSkeleton key={i} shimmer={shimmer} />
      ))}
    </div>
  );
}

/**
 * User dropdown skeleton
 */
export function UserDropdownSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn(
      'w-64 p-2 rounded-xl border bg-card shadow-lg space-y-2',
      className
    )}>
      {/* User info */}
      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
        <SkeletonAvatar shimmer={shimmer} size="sm" />
        <div className="flex-1 space-y-1">
          <Skeleton shimmer={shimmer} className="h-4 w-24" />
          <Skeleton shimmer={shimmer} className="h-3 w-32" />
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-1 py-2 border-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <Skeleton shimmer={shimmer} className="h-4 w-4 rounded" />
            <Skeleton shimmer={shimmer} className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div className="flex items-center gap-3 px-2 py-2">
        <Skeleton shimmer={shimmer} className="h-4 w-4 rounded" />
        <Skeleton shimmer={shimmer} className="h-4 w-16" />
      </div>
    </div>
  );
}
