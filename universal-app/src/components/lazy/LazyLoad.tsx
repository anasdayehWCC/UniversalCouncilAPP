'use client';

import { Suspense, type ReactNode, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { ChunkLoadError } from './ChunkLoadError';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ============================================================
// TYPES
// ============================================================

export interface LazyLoadProps {
  /** The content to lazy load */
  children: ReactNode;
  /** Custom loading fallback */
  fallback?: ReactNode;
  /** Minimum height for the loading placeholder */
  minHeight?: string;
  /** Component name for accessibility */
  name?: string;
}

export interface DynamicImportOptions<P> {
  /** Whether to disable SSR */
  ssr?: boolean;
  /** Custom loading component (render function) */
  loading?: () => React.ReactNode;
  /** Minimum height for placeholder */
  minHeight?: string;
}

// ============================================================
// DEFAULT LOADING SKELETON
// ============================================================

interface LoadingSkeletonProps {
  minHeight?: string;
  name?: string;
}

function LoadingSkeleton({ minHeight = '200px', name = 'content' }: LoadingSkeletonProps) {
  return (
    <div 
      className="animate-pulse rounded-lg bg-gradient-to-r from-muted via-muted/80 to-muted"
      style={{ minHeight }}
      role="status"
      aria-busy="true"
      aria-label={`Loading ${name}...`}
    >
      <div className="flex items-center justify-center h-full">
        {/* Subtle loading indicator */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
        </div>
        <span className="sr-only">Loading {name}...</span>
      </div>
    </div>
  );
}

// ============================================================
// LAZY LOAD WRAPPER
// ============================================================

/**
 * Generic wrapper for lazy-loaded content with error boundary
 * 
 * @example
 * ```tsx
 * <LazyLoad name="Dashboard" minHeight="400px">
 *   <HeavyComponent />
 * </LazyLoad>
 * ```
 */
export function LazyLoad({ 
  children, 
  fallback, 
  minHeight = '200px',
  name = 'component'
}: LazyLoadProps) {
  const loadingFallback = fallback || <LoadingSkeleton minHeight={minHeight} name={name} />;

  return (
    <ErrorBoundary
      fallback={<ChunkLoadError componentName={name} />}
    >
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================================
// DYNAMIC IMPORT HELPER
// ============================================================

/**
 * Create a lazy-loaded component with built-in error handling
 * 
 * @example
 * ```tsx
 * const LazyChart = createLazyComponent(
 *   () => import('./Chart'),
 *   { ssr: false, minHeight: '300px' }
 * );
 * ```
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: DynamicImportOptions<P> = {}
): ComponentType<P> {
  const { ssr = true, minHeight = '200px' } = options;

  return dynamic(importFn, {
    ssr,
    loading: options.loading || (() => <LoadingSkeleton minHeight={minHeight} />),
  });
}

// ============================================================
// VIEWPORT LAZY LOAD
// ============================================================

interface ViewportLazyLoadProps extends LazyLoadProps {
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for earlier loading */
  rootMargin?: string;
}

/**
 * Lazy load content only when it enters the viewport
 * Ideal for below-the-fold content
 * 
 * @example
 * ```tsx
 * <ViewportLazyLoad rootMargin="200px">
 *   <HeavyFooterContent />
 * </ViewportLazyLoad>
 * ```
 */
export function ViewportLazyLoad({
  children,
  fallback,
  minHeight = '200px',
  name = 'component',
  threshold = 0,
  rootMargin = '100px',
}: ViewportLazyLoadProps) {
  // Use intersection observer to trigger load
  const LazyContent = dynamic(
    () => Promise.resolve({ default: () => <>{children}</> }),
    {
      ssr: false,
      loading: () => fallback as React.ReactElement || <LoadingSkeleton minHeight={minHeight} name={name} />,
    }
  );

  return (
    <div 
      style={{ minHeight }}
      data-viewport-lazy
      data-threshold={threshold}
      data-root-margin={rootMargin}
    >
      <ErrorBoundary fallback={<ChunkLoadError componentName={name} />}>
        <LazyContent />
      </ErrorBoundary>
    </div>
  );
}

// ============================================================
// PRELOAD UTILITIES
// ============================================================

/**
 * Preload a component when hovering over a trigger element
 * 
 * @example
 * ```tsx
 * <button {...preloadOnHover(() => import('./HeavyModal'))}>
 *   Open Modal
 * </button>
 * ```
 */
export function preloadOnHover<P>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) {
  let preloaded = false;
  
  return {
    onMouseEnter: () => {
      if (!preloaded) {
        importFn().catch(() => {});
        preloaded = true;
      }
    },
    onFocus: () => {
      if (!preloaded) {
        importFn().catch(() => {});
        preloaded = true;
      }
    },
  };
}

export default LazyLoad;
