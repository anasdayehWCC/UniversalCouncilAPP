'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, AlertTriangle, Home, PhoneOff } from 'lucide-react';

export default function RecordError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isMicError = error.message.includes('microphone') || 
    error.message.includes('getUserMedia') ||
    error.message.includes('NotAllowedError');

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            {isMicError ? (
              <PhoneOff className="h-6 w-6 text-destructive" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-destructive" />
            )}
          </div>
          <CardTitle>
            {isMicError ? 'Microphone Access Required' : 'Recording Error'}
          </CardTitle>
          <CardDescription>
            {isMicError 
              ? 'Please enable microphone permissions in your browser settings.'
              : 'An error occurred while initializing the recorder.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMicError && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">How to fix:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Click the lock icon in your browser&apos;s address bar</li>
                <li>Allow microphone access for this site</li>
                <li>Reload the page</li>
              </ol>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              <Mic className="mr-2 h-4 w-4" />
              Try again
            </Button>
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
    </div>
  );
}
