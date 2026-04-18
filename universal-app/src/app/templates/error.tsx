'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import { ShellPage } from '@/components/layout';

export default function TemplatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isNotFound =
    error.message.toLowerCase().includes('not found') ||
    error.message.includes('404');

  return (
    <ShellPage
      className="flex items-center justify-center bg-background"
      padded={false}
      contentClassName="flex h-full items-center justify-center p-6"
    >
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>
            {isNotFound ? 'Template Not Found' : 'Failed to Load Templates'}
          </CardTitle>
          <CardDescription>
            {isNotFound
              ? 'The template you were looking for could not be found. It may have been deleted or the link is incorrect.'
              : 'Something went wrong while loading your templates. Please try again.'}
          </CardDescription>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2">
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
            <Button variant="outline" className="flex-1" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Link href="/templates" className="flex-1">
              <Button variant="default" className="w-full">
                <LayoutTemplate className="mr-2 h-4 w-4" />
                All templates
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </ShellPage>
  );
}
