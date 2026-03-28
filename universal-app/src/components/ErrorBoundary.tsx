'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react';
import { captureException, isSentryEnabled, Sentry } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  /** Show Sentry feedback dialog on error */
  showReportDialog?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  eventId: string | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in child component tree,
 * logs the error, and displays a fallback UI.
 * 
 * Integrates with Sentry for error tracking and user feedback.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    // Report to Sentry with proper integration
    if (isSentryEnabled()) {
      const eventId = captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
        tags: { errorBoundary: 'true' },
      });
      if (eventId) {
        this.setState({ eventId });
      }
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleReportFeedback = (): void => {
    if (this.state.eventId && isSentryEnabled()) {
      Sentry.showReportDialog({
        eventId: this.state.eventId,
        title: 'Help us fix this issue',
        subtitle: 'Our team has been notified.',
        subtitle2: 'If you would like to help, tell us what happened below.',
        labelName: 'Name (optional)',
        labelEmail: 'Email (optional)',
        labelComments: 'What happened?',
        labelClose: 'Close',
        labelSubmit: 'Submit',
        successMessage: 'Thank you for your feedback!',
      });
    }
  };

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, eventId: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.props.showDetails && this.state.error && (
                <details className="rounded-md bg-muted p-3 text-sm">
                  <summary className="cursor-pointer font-medium">
                    Error details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={this.handleReset}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={this.handleReload}
                >
                  Reload page
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={this.handleGoHome}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go home
                </Button>
              </div>
              
              {/* Report feedback button and event ID */}
              {this.state.eventId && isSentryEnabled() && (
                <div className="pt-2 border-t space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={this.handleReportFeedback}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Report this issue
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Error ID: {this.state.eventId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
