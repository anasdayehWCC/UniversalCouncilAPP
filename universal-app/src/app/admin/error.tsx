'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { ShellPage } from '@/components/layout';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isPermissionError = error.message.includes('403') || 
    error.message.includes('Forbidden') ||
    error.message.includes('permission');

  return (
    <ShellPage className="flex items-center justify-center bg-background transition-colors" padded={false} contentClassName="flex h-full items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            {isPermissionError ? (
              <Shield className="h-6 w-6 text-destructive" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-destructive" />
            )}
          </div>
          <CardTitle>
            {isPermissionError ? 'Access Denied' : 'Admin Panel Error'}
          </CardTitle>
          <CardDescription>
            {isPermissionError 
              ? 'You don\'t have permission to access this admin feature.'
              : 'An error occurred in the admin panel.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPermissionError && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-100">
              <p className="font-medium mb-1">What happened?</p>
              <p className="text-xs">
                This feature requires admin privileges. Please contact your system administrator if you believe this is an error.
              </p>
            </div>
          )}
          
          {process.env.NODE_ENV === 'development' && !isPermissionError && (
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
            {!isPermissionError && (
              <Button variant="outline" className="flex-1" onClick={reset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            )}
            <Button
              variant="default"
              className="flex-1"
              onClick={() => window.location.href = '/'}
            >
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </ShellPage>
  );
}
