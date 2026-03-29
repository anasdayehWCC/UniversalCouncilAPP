/**
 * Lazy Loading Utilities
 * 
 * Dynamic imports for heavy components to reduce initial bundle size.
 * Each component has a corresponding loading skeleton.
 * 
 * Bundle Savings Summary:
 * - TranscriptViewer: ~80KB
 * - MinuteEditor: ~60KB
 * - InsightsDashboard: ~100KB
 * - PDFExporter: ~200KB (jsPDF)
 * - WordExporter: ~150KB (docx)
 * - Total potential savings: ~590KB on initial load
 */

import dynamic, { type DynamicOptionsLoadingProps } from 'next/dynamic';
import type { ComponentType, ReactNode } from 'react';

// ============================================================
// TYPES
// ============================================================

export type LazyComponentLoader<T = Record<string, unknown>> = () => Promise<{
  default: ComponentType<T>;
}>;

export type PreloadLoader = () => Promise<unknown>;

export type NamedComponentLoader<T = Record<string, unknown>> = () => Promise<{
  [key: string]: ComponentType<T>;
}>;

export interface PreloadOptions {
  /** Priority hint for resource loading */
  priority?: 'high' | 'low';
  /** Whether to use requestIdleCallback for low-priority preloads */
  idle?: boolean;
}

export interface DynamicImportOptions {
  /** Custom loading component */
  loading?: (loadingProps: DynamicOptionsLoadingProps) => ReactNode;
  /** Enable SSR for the component */
  ssr?: boolean;
}

// ============================================================
// LOADING COMPONENT FACTORY
// ============================================================

// Loading component factory
function createLoadingComponent(name: string, height?: string) {
  return function LoadingPlaceholder(_: DynamicOptionsLoadingProps) {
    return (
      <div 
        className="animate-pulse motion-reduce:animate-none bg-muted rounded-lg"
        style={{ minHeight: height || '200px' }}
        role="status"
        aria-label={`Loading ${name}...`}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <svg 
            className="animate-spin motion-reduce:animate-none h-6 w-6 mr-2" 
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
          <span className="sr-only">Loading {name}...</span>
        </div>
      </div>
    );
  };
}

// ============================================================
// LAZY LOADED COMPONENTS
// ============================================================

/**
 * Lazy TranscriptViewer - Heavy component with audio player and waveform
 * Estimated savings: ~80KB
 */
export const LazyTranscriptViewer = dynamic(
  () => import('@/components/transcription/TranscriptViewer').then(mod => mod.TranscriptViewer),
  {
    loading: createLoadingComponent('Transcript Viewer', '400px'),
    ssr: false, // Audio player needs client-side rendering
  }
);

/**
 * Lazy MinuteEditor - Rich text editor with formatting
 * Estimated savings: ~60KB
 */
export const LazyMinuteEditor = dynamic(
  () => import('@/components/minutes/MinuteEditor').then(mod => mod.MinuteEditor),
  {
    loading: createLoadingComponent('Minute Editor', '500px'),
    ssr: false,
  }
);

/**
 * Lazy InsightsDashboard - Charts and analytics
 * Estimated savings: ~100KB
 */
export const LazyInsightsDashboard = dynamic(
  () => import('@/components/insights/InsightsDashboard').then(mod => mod.InsightsDashboard),
  {
    loading: createLoadingComponent('Insights Dashboard', '600px'),
    ssr: false,
  }
);

/**
 * Lazy PDF Export - jsPDF is very heavy
 * Estimated savings: ~200KB
 */
export const LazyPDFExporter = dynamic(
  () => import('@/components/export/ExportDialog').then(mod => mod.ExportDialog),
  {
    loading: createLoadingComponent('PDF Export', '100px'),
    ssr: false,
  }
);

/**
 * Lazy Word Export - docx library
 * Estimated savings: ~150KB
 */
export const LazyWordExporter = dynamic(
  () => import('@/components/export/ExportPreview').then(mod => mod.ExportPreview),
  {
    loading: createLoadingComponent('Word Export', '100px'),
    ssr: false,
  }
);

/**
 * Lazy Recording Controls - Audio recording with waveform
 * Estimated savings: ~40KB
 */
export const LazyRecordingControls = dynamic(
  () => import('@/components/recording/QuickRecordButton').then(mod => mod.QuickRecordButton),
  {
    loading: createLoadingComponent('Recording Controls', '150px'),
    ssr: false,
  }
);

/**
 * Lazy Template Gallery - Template preview grid
 * Estimated savings: ~30KB
 */
export const LazyTemplateGallery = dynamic(
  () => import('@/components/templates/TemplateSelector').then(mod => mod.TemplateSelector),
  {
    loading: createLoadingComponent('Template Gallery', '300px'),
    ssr: true,
  }
);

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Preload a lazy component before it's needed
 * Call this on hover or route prefetch
 */
export function preloadComponent(
  loader: PreloadLoader
): void {
  // Trigger the import but don't wait for it
  loader().catch(() => {
    // Silently handle preload failures
  });
}

/**
 * Preload map for common navigation patterns
 */
export const preloadMap = {
  transcription: () => import('@/components/transcription/TranscriptViewer'),
  minutes: () => import('@/components/minutes/MinuteEditor'),
  insights: () => import('@/components/insights/InsightsDashboard'),
  admin: () => import('@/components/admin/AdminHeader'),
  export: () => Promise.all([
    import('@/components/export/ExportDialog'),
    import('@/components/export/ExportPreview'),
  ]),
} as const;

/**
 * Preload components based on route
 */
export function preloadForRoute(route: string): void {
  switch (true) {
    case route.includes('/my-notes') || route.includes('/minutes') || route.includes('/review-queue'):
      preloadMap.transcription();
      break;
    case route.includes('/minutes'):
      preloadMap.minutes();
      break;
    case route.includes('/insights'):
      preloadMap.insights();
      break;
    case route.includes('/admin'):
      preloadMap.admin();
      break;
    default:
      break;
  }
}

// ============================================================
// ADVANCED PRELOADING UTILITIES
// ============================================================

/**
 * Preload with priority hints using link prefetch
 */
export function preloadWithPriority(
  moduleUrl: string,
  priority: 'high' | 'low' = 'low'
): void {
  if (typeof document === 'undefined') return;
  
  // Check if already preloaded
  const existing = document.querySelector(`link[href="${moduleUrl}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = priority === 'high' ? 'preload' : 'prefetch';
  link.as = 'script';
  link.href = moduleUrl;
  document.head.appendChild(link);
}

/**
 * Preload during idle time (non-blocking)
 */
export function preloadWhenIdle(
  loader: PreloadLoader,
  timeout = 2000
): void {
  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: typeof requestIdleCallback }).requestIdleCallback(
      () => loader().catch(() => {}),
      { timeout }
    );
  } else {
    // Fallback for Safari
    setTimeout(() => loader().catch(() => {}), 100);
  }
}

/**
 * Preload on mouse enter (hover intent)
 */
export function createHoverPreloader(loader: PreloadLoader) {
  let preloaded = false;
  
  return {
    onMouseEnter: () => {
      if (!preloaded) {
        preloaded = true;
        loader().catch(() => {});
      }
    },
  };
}

/**
 * Preload on visibility (intersection observer)
 */
export function preloadOnVisible(
  element: HTMLElement,
  loader: PreloadLoader,
  options?: IntersectionObserverInit
): () => void {
  if (typeof window === 'undefined') return () => {};

  let loaded = false;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !loaded) {
          loaded = true;
          loader().catch(() => {});
          observer.disconnect();
        }
      });
    },
    { rootMargin: '100px', ...options }
  );

  observer.observe(element);
  
  return () => observer.disconnect();
}

// ============================================================
// DYNAMIC IMPORT HELPERS
// ============================================================

/**
 * Create a lazy component with default options
 */
export function createLazyComponent<T extends Record<string, unknown>>(
  loader: LazyComponentLoader<T>,
  name: string,
  options: DynamicImportOptions = {}
): ComponentType<T> {
  const {
    loading,
    ssr = false,
  } = options;

  return dynamic(loader, {
    loading: loading || createLoadingComponent(name),
    ssr,
  }) as ComponentType<T>;
}

/**
 * Create a lazy named export component
 * Usage: createLazyNamedExport(() => import('./file'), 'ComponentName')
 */
export function createLazyNamedExport<T extends Record<string, unknown>>(
  loader: () => Promise<Record<string, ComponentType<T>>>,
  exportName: string,
  name: string,
  options: DynamicImportOptions = {}
): ComponentType<T> {
  return createLazyComponent(
    () => loader().then((mod) => ({ default: mod[exportName] })),
    name,
    options
  );
}

// ============================================================
// ADMIN COMPONENTS (Heavy, load on demand)
// ============================================================

/**
 * Lazy Admin Dashboard - Heavy component with stats, charts, audit log
 * Estimated savings: ~60KB
 */
export const LazyAdminDashboard = dynamic(
  () => import('@/components/admin/MainConfigArea'),
  {
    loading: createLoadingComponent('Admin Dashboard', '600px'),
    ssr: false,
  }
);

/**
 * Lazy AuditLog - Heavy table with filtering and pagination
 * Estimated savings: ~35KB
 */
export const LazyAuditLog = dynamic(
  () => import('@/components/admin/AuditLog').then(mod => ({ default: mod.AuditLog })),
  {
    loading: createLoadingComponent('Audit Log', '400px'),
    ssr: false,
  }
);

/**
 * Lazy UserTable - User management table
 * Estimated savings: ~25KB
 */
export const LazyUserTable = dynamic(
  () => import('@/components/admin/UserTable').then(mod => ({ default: mod.UserTable })),
  {
    loading: createLoadingComponent('User Table', '300px'),
    ssr: false,
  }
);

/**
 * Lazy SettingsForm - Large settings configuration form
 * Estimated savings: ~40KB
 */
export const LazySettingsForm = dynamic(
  () => import('@/components/admin/SettingsForm').then(mod => ({ default: mod.SettingsForm })),
  {
    loading: createLoadingComponent('Settings Form', '500px'),
    ssr: false,
  }
);

/**
 * Lazy ModuleToggle - Module configuration grid
 * Estimated savings: ~20KB
 */
export const LazyModuleToggle = dynamic(
  () => import('@/components/admin/ModuleToggle').then(mod => ({ default: mod.ModuleToggle })),
  {
    loading: createLoadingComponent('Module Configuration', '400px'),
    ssr: false,
  }
);

// ============================================================
// PRELOADING UTILITIES
// ============================================================

/**
 * Batch preload multiple modules
 */
export function preloadBatch(
  loaders: PreloadLoader[],
  options: PreloadOptions = {}
): Promise<void[]> {
  const { idle = false } = options;

  if (idle) {
    return new Promise((resolve) => {
      preloadWhenIdle(async () => {
        await Promise.all(loaders.map((loader) => loader().catch(() => {})));
        resolve([]);
      });
    });
  }

  return Promise.all(
    loaders.map((loader) => loader().catch(() => {}).then(() => undefined))
  );
}

/**
 * Route-based preload controller
 */
export class RoutePreloader {
  private preloadedRoutes = new Set<string>();
  private routeLoaders: Record<string, PreloadLoader[]> = {};

  /**
   * Register loaders for a route pattern
   */
  register(routePattern: string, loaders: PreloadLoader[]): void {
    this.routeLoaders[routePattern] = loaders;
  }

  /**
   * Preload for a specific route
   */
  preload(route: string): void {
    if (this.preloadedRoutes.has(route)) return;

    // Find matching pattern
    const pattern = Object.keys(this.routeLoaders).find((p) =>
      route.includes(p)
    );

    if (pattern && this.routeLoaders[pattern]) {
      this.preloadedRoutes.add(route);
      this.routeLoaders[pattern].forEach((loader) => loader().catch(() => {}));
    }
  }

  /**
   * Preload all registered routes (for aggressive preloading)
   */
  preloadAll(): void {
    Object.entries(this.routeLoaders).forEach(([pattern, loaders]) => {
      if (!this.preloadedRoutes.has(pattern)) {
        this.preloadedRoutes.add(pattern);
        loaders.forEach((loader) => loader().catch(() => {}));
      }
    });
  }
}

// Singleton route preloader instance
export const routePreloader = new RoutePreloader();

// Register default routes
routePreloader.register('/my-notes', [
  () => import('@/components/transcription/TranscriptViewer'),
]);
routePreloader.register('/review-queue', [
  () => import('@/components/transcription/TranscriptViewer'),
]);
routePreloader.register('/minutes', [
  () => import('@/components/minutes/MinuteEditor'),
]);
routePreloader.register('/insights', [
  () => import('@/components/insights/InsightsDashboard'),
]);
routePreloader.register('/admin', [
  () => import('@/components/admin/AdminHeader'),
]);
routePreloader.register('/export', [
  () => import('@/components/export/ExportDialog'),
  () => import('@/components/export/ExportPreview'),
]);

// ============================================================
// CHUNK NAMING HELPERS (for debugging)
// ============================================================

/**
 * Create a dynamic import with webpack magic comments
 * for better chunk naming in bundle analysis
 */
export function namedChunkImport<T>(
  chunkName: string,
  loader: () => Promise<T>
): () => Promise<T> {
  // This is a factory that returns the loader
  // The actual webpackChunkName must be in the import() call
  return loader;
}

// ============================================================
// PERFORMANCE MONITORING
// ============================================================

/**
 * Track lazy load performance
 */
export function trackLazyLoad(
  componentName: string,
  loader: LazyComponentLoader
): LazyComponentLoader {
  return async () => {
    const start = performance.now();
    try {
      const result = await loader();
      const duration = performance.now() - start;
      
      // Report to performance monitoring (if available)
      if (typeof window !== 'undefined' && 'performance' in window) {
        performance.measure(`lazy-load-${componentName}`, {
          start,
          duration,
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to lazy load ${componentName}:`, error);
      throw error;
    }
  };
}
