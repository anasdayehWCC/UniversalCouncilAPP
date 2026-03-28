'use client';

import { cn } from '@/lib/utils';
import { Skeleton, SkeletonAvatar, type SkeletonProps } from '@/components/ui/skeleton';

export interface NavigationSkeletonProps extends SkeletonProps {
  /** Number of nav items */
  items?: number;
  /** Include user menu */
  withUserMenu?: boolean;
}

/**
 * Main navigation skeleton
 */
export function NavigationSkeleton({ 
  className, 
  items = 5,
  withUserMenu = true,
  shimmer 
}: NavigationSkeletonProps) {
  return (
    <nav className={cn(
      'flex items-center justify-between h-16 px-4 border-b bg-card',
      className
    )}>
      {/* Logo */}
      <div className="flex items-center gap-4">
        <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-lg" />
        <Skeleton shimmer={shimmer} className="h-5 w-28 hidden sm:block" />
      </div>

      {/* Nav items */}
      <div className="hidden md:flex items-center gap-1">
        {Array.from({ length: items }).map((_, i) => (
          <NavItemSkeleton key={i} shimmer={shimmer} />
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <Skeleton shimmer={shimmer} className="h-9 w-9 rounded-lg" />
        {withUserMenu && (
          <UserMenuSkeleton shimmer={shimmer} />
        )}
      </div>
    </nav>
  );
}

/**
 * Single nav item skeleton
 */
export function NavItemSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <Skeleton 
      shimmer={shimmer}
      className={cn('h-9 w-20 rounded-lg', className)} 
    />
  );
}

/**
 * User menu skeleton
 */
export function UserMenuSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SkeletonAvatar shimmer={shimmer} size="sm" />
      <Skeleton shimmer={shimmer} className="h-4 w-20 hidden lg:block" />
    </div>
  );
}

/**
 * Sidebar navigation skeleton
 */
export function SidebarSkeleton({ 
  shimmer, 
  className,
  sections = 3,
  itemsPerSection = 4,
}: SkeletonProps & { 
  sections?: number; 
  itemsPerSection?: number;
}) {
  return (
    <aside className={cn(
      'w-64 shrink-0 border-r bg-card h-full',
      className
    )}>
      {/* Header */}
      <div className="h-16 flex items-center gap-3 px-4 border-b">
        <Skeleton shimmer={shimmer} className="h-10 w-10 rounded-lg" />
        <Skeleton shimmer={shimmer} className="h-5 w-28" />
      </div>

      {/* Nav sections */}
      <div className="p-4 space-y-6">
        {Array.from({ length: sections }).map((_, sectionIdx) => (
          <NavSectionSkeleton 
            key={sectionIdx}
            shimmer={shimmer}
            items={itemsPerSection}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
        <div className="flex items-center gap-3">
          <SkeletonAvatar shimmer={shimmer} size="sm" />
          <div className="flex-1 min-w-0">
            <Skeleton shimmer={shimmer} className="h-4 w-24" />
            <Skeleton shimmer={shimmer} className="h-3 w-16 mt-1" />
          </div>
          <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </aside>
  );
}

/**
 * Nav section skeleton
 */
export function NavSectionSkeleton({ 
  shimmer, 
  className,
  items = 4,
}: SkeletonProps & { items?: number }) {
  return (
    <div className={cn('space-y-1', className)}>
      <Skeleton shimmer={shimmer} className="h-4 w-16 mb-2" />
      {Array.from({ length: items }).map((_, i) => (
        <SidebarItemSkeleton key={i} shimmer={shimmer} />
      ))}
    </div>
  );
}

/**
 * Sidebar item skeleton
 */
export function SidebarItemSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg',
      className
    )}>
      <Skeleton shimmer={shimmer} className="h-5 w-5 rounded" />
      <Skeleton shimmer={shimmer} className="h-4 flex-1" />
    </div>
  );
}

/**
 * Mobile navigation skeleton
 */
export function MobileNavSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn(
      'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
      className
    )}>
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r shadow-xl">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="flex items-center gap-3">
            <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-lg" />
            <Skeleton shimmer={shimmer} className="h-5 w-24" />
          </div>
          <Skeleton shimmer={shimmer} className="h-8 w-8 rounded-lg" />
        </div>

        {/* Nav items */}
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg">
              <Skeleton shimmer={shimmer} className="h-6 w-6 rounded" />
              <Skeleton shimmer={shimmer} className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Breadcrumb skeleton
 */
export function BreadcrumbSkeleton({ 
  shimmer, 
  className,
  items = 3,
}: SkeletonProps & { items?: number }) {
  return (
    <nav className={cn('flex items-center gap-2', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton shimmer={shimmer} className={cn(
            'h-4',
            i === items - 1 ? 'w-28' : 'w-16'
          )} />
          {i < items - 1 && (
            <Skeleton shimmer={shimmer} className="h-4 w-4" />
          )}
        </div>
      ))}
    </nav>
  );
}

/**
 * Tab navigation skeleton
 */
export function TabsSkeleton({ 
  shimmer, 
  className,
  tabs = 4,
}: SkeletonProps & { tabs?: number }) {
  return (
    <div className={cn('flex items-center gap-1 border-b', className)}>
      {Array.from({ length: tabs }).map((_, i) => (
        <Skeleton 
          key={i} 
          shimmer={shimmer}
          className="h-10 w-24 rounded-t-lg" 
        />
      ))}
    </div>
  );
}
