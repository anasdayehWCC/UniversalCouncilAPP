'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for Profile page
 * The profile route redirects to /settings, so this shows a minimal
 * centered loading state while the redirect resolves.
 */
export default function ProfileLoading() {
  return (
    <div
      className="flex items-center justify-center min-h-[50vh]"
      role="status"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="flex flex-col items-center gap-4">
        <Skeleton shimmer className="h-16 w-16 rounded-full" />
        <Skeleton shimmer className="h-5 w-32" />
        <Skeleton shimmer className="h-4 w-44" />
      </div>

      <span className="sr-only">Loading profile</span>
    </div>
  );
}
