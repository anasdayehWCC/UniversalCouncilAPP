'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for Capture page
 * The capture route redirects to /record, so this shows a minimal
 * centered loading state while the redirect resolves.
 */
export default function CaptureLoading() {
  return (
    <div
      className="flex items-center justify-center min-h-[50vh]"
      role="status"
      aria-busy="true"
      aria-label="Preparing capture interface"
    >
      <div className="flex flex-col items-center gap-4">
        <Skeleton shimmer className="h-16 w-16 rounded-full" />
        <Skeleton shimmer className="h-5 w-36" />
        <Skeleton shimmer className="h-4 w-48" />
      </div>

      <span className="sr-only">Preparing capture interface</span>
    </div>
  );
}
