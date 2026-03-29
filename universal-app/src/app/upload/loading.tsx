'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ShellPage } from '@/components/layout';

/**
 * Loading skeleton for Upload page
 * Displays while upload interface is being prepared
 */
export default function UploadLoading() {
  return (
    <ShellPage className="animate-in fade-in duration-300" role="status" aria-busy="true" aria-label="Preparing upload interface">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="text-center space-y-3">
          <Skeleton shimmer className="h-8 w-48 mx-auto" />
          <Skeleton shimmer className="h-4 w-64 mx-auto" />
        </div>

        {/* Upload area skeleton */}
        <Card className="p-8">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Skeleton shimmer className="h-16 w-16 rounded-full" />
              <div className="space-y-2 text-center">
                <Skeleton shimmer className="h-6 w-48 mx-auto" />
                <Skeleton shimmer className="h-4 w-64 mx-auto" />
              </div>
              <Skeleton shimmer className="h-10 w-36 rounded-lg" />
            </div>
          </div>
        </Card>

        {/* Metadata form skeleton */}
        <Card className="p-6">
          <div className="space-y-6">
            <Skeleton shimmer className="h-6 w-32" />
            
            {/* Form fields skeleton */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton shimmer className="h-4 w-20" />
                <Skeleton shimmer className="h-10 w-full rounded-lg" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton shimmer className="h-4 w-24" />
                  <Skeleton shimmer className="h-10 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton shimmer className="h-4 w-24" />
                  <Skeleton shimmer className="h-10 w-full rounded-lg" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Skeleton shimmer className="h-4 w-32" />
                <Skeleton shimmer className="h-24 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </Card>

        {/* Submit button skeleton */}
        <div className="flex justify-end">
          <Skeleton shimmer className="h-12 w-40 rounded-lg" />
        </div>
      </div>
      
      <span className="sr-only">Preparing upload interface</span>
    </ShellPage>
  );
}
