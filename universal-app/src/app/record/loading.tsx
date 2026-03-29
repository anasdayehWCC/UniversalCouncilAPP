'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ShellPage } from '@/components/layout';

/**
 * Loading skeleton for Record page
 * Displays while recording interface is being prepared
 */
export default function RecordLoading() {
  return (
    <ShellPage className="flex flex-col animate-in fade-in duration-300" padded={false} contentClassName="h-full" >
      {/* Header skeleton */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton shimmer className="h-8 w-48" />
              <Skeleton shimmer className="h-4 w-72" />
            </div>
            <Skeleton shimmer className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Recording mode selector skeleton */}
          <div className="flex justify-center">
            <Skeleton shimmer className="h-12 w-64 rounded-full" />
          </div>

          {/* Central recording area skeleton */}
          <Card className="p-8 text-center">
            <div className="space-y-6">
              {/* Recording button skeleton */}
              <div className="flex justify-center">
                <Skeleton shimmer className="h-32 w-32 rounded-full" />
              </div>
              
              {/* Timer skeleton */}
              <Skeleton shimmer className="h-8 w-24 mx-auto" />
              
              {/* Waveform visualization skeleton */}
              <Skeleton shimmer className="h-16 w-full rounded-lg" />
              
              {/* Controls skeleton */}
              <div className="flex justify-center gap-4">
                <Skeleton shimmer className="h-12 w-12 rounded-full" />
                <Skeleton shimmer className="h-12 w-12 rounded-full" />
                <Skeleton shimmer className="h-12 w-12 rounded-full" />
              </div>
            </div>
          </Card>

          {/* Device settings skeleton */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Skeleton shimmer className="h-10 w-full sm:w-48 rounded-lg" />
            <Skeleton shimmer className="h-10 w-full sm:w-48 rounded-lg" />
          </div>

          {/* Quality settings skeleton */}
          <div className="flex justify-center">
            <Skeleton shimmer className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      </div>
      
      <span className="sr-only">Preparing recording interface</span>
    </ShellPage>
  );
}
