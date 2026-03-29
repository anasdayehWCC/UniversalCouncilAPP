'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react';
import { ShellPage } from '@/components/layout';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    // Log to Sentry if configured
    console.error('[error.tsx] Error caught:', error);
  }, [error]);

  return (
    <ShellPage className="flex items-center justify-center bg-background transition-colors" padded={false} contentClassName="flex h-full items-center justify-center p-6">
      <Card className="max-w-lg w-full shadow-lg border-destructive/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center ring-4 ring-destructive/5">
            <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription className="text-base">
            An unexpected error occurred. Please try again.
          </CardDescription>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg bg-muted/50 border border-border/50 overflow-hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 text-sm font-medium flex items-center justify-between hover:bg-muted/80 transition-colors"
                aria-expanded={isOpen}
              >
                <span>Error details</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="p-3 pt-0 border-t border-border/50">
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono overflow-auto max-h-48">
                    {error.message}
                    {'\n\n'}
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => reset()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
            <Button
              variant="default"
              className="flex-1 gap-2"
              onClick={() => window.location.href = '/'}
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </ShellPage>
  );
}
