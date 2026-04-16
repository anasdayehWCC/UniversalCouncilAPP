'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ListChecks } from 'lucide-react';
import { ShellPage } from '@/components/layout';

export default function ReviewItemError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[review-queue/[id]/error.tsx] Error caught:', error);
  }, [error]);

  const isNotFound = error.message.includes('404') ||
    error.message.includes('not found') ||
    error.message.includes('Not Found');

  return (
    <ShellPage className="flex items-center justify-center bg-background transition-colors" padded={false} contentClassName="flex h-full items-center justify-center p-6">
      <Card className="max-w-lg w-full shadow-lg border-destructive/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center ring-4 ring-destructive/5">
            <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">
            {isNotFound ? 'Review Item Not Found' : 'Failed to Load Review'}
          </CardTitle>
          <CardDescription className="text-base">
            {isNotFound
              ? 'This review item may have been completed, removed, or you may not have access.'
              : 'This review item couldn\u2019t be loaded. Please try again.'}
          </CardDescription>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <details className="rounded-md bg-muted p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Error details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => reset()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
            <Link href="/review-queue" className="flex-1">
              <Button variant="default" className="w-full gap-2">
                <ListChecks className="h-4 w-4" aria-hidden="true" />
                Back to queue
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </ShellPage>
  );
}
