'use client';

import { useCallback, useState } from 'react';

// ============================================================
// TYPES
// ============================================================

export interface ChunkLoadErrorProps {
  /** Name of the component that failed to load */
  componentName?: string;
  /** Custom error message */
  message?: string;
  /** Custom retry handler */
  onRetry?: () => void;
  /** Whether to show technical details */
  showDetails?: boolean;
  /** The actual error object */
  error?: Error;
}

// ============================================================
// CHUNK LOAD ERROR COMPONENT
// ============================================================

/**
 * Error boundary fallback for failed chunk loads
 * 
 * Handles:
 * - Network failures during chunk loading
 * - Chunk hash mismatches after deployment
 * - General dynamic import failures
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ChunkLoadError componentName="Dashboard" />}>
 *   <LazyDashboard />
 * </ErrorBoundary>
 * ```
 */
export function ChunkLoadError({
  componentName = 'component',
  message,
  onRetry,
  showDetails = false,
  error,
}: ChunkLoadErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    
    if (onRetry) {
      onRetry();
    } else {
      // Default: hard reload to get fresh chunks
      window.location.reload();
    }
  }, [onRetry]);

  const isChunkError = error?.message?.includes('Loading chunk') || 
                        error?.message?.includes('ChunkLoadError') ||
                        error?.name === 'ChunkLoadError';

  const isNetworkError = error?.message?.includes('Failed to fetch') ||
                          error?.message?.includes('NetworkError');

  // Determine user-friendly message
  const displayMessage = message || (
    isNetworkError
      ? 'Unable to load due to network issues. Please check your connection.'
      : isChunkError
        ? 'A new version is available. Refreshing will load the latest version.'
        : `Failed to load ${componentName}. Please try again.`
  );

  return (
    <div 
      className="flex flex-col items-center justify-center p-8 rounded-lg border border-destructive/30 bg-destructive/5"
      role="alert"
      aria-live="polite"
    >
      {/* Error Icon */}
      <div className="w-12 h-12 mb-4 text-destructive">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* Error Message */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
        {displayMessage}
      </p>

      {/* Retry Button */}
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isRetrying ? (
          <>
            <svg 
              className="animate-spin h-4 w-4" 
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Reloading...
          </>
        ) : (
          <>
            <svg 
              className="h-4 w-4" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            {isChunkError ? 'Refresh Page' : 'Try Again'}
          </>
        )}
      </button>

      {/* Technical Details (development only) */}
      {showDetails && error && (
        <details className="mt-4 w-full max-w-md">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Technical details
          </summary>
          <pre className="mt-2 p-2 text-xs bg-muted rounded overflow-auto max-h-32">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </div>
  );
}

// ============================================================
// CHUNK PRELOAD ERROR HANDLER
// ============================================================

/**
 * Global handler for chunk loading errors
 * Add to your app's error handling setup
 */
export function setupChunkErrorHandler(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections from dynamic imports
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    if (
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.name === 'ChunkLoadError'
    ) {
      // Log for debugging
      console.error('[ChunkLoadError]', error);
      
      // Optionally: Show a toast notification
      // toast.error('New version available. Refreshing...');
      
      // Optionally: Auto-reload after a short delay
      // setTimeout(() => window.location.reload(), 2000);
    }
  });
}

export default ChunkLoadError;
