/**
 * Web Vitals Type Definitions
 *
 * Core Web Vitals and performance metric types for monitoring
 * application performance and user experience.
 *
 * @see https://web.dev/vitals/
 */

/**
 * Core Web Vitals metric names
 */
export type MetricName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP' | 'FCP';

/**
 * Performance rating based on Google's thresholds
 */
export type MetricRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Individual metric measurement
 */
export interface Metric {
  /** Metric identifier */
  id: string;
  /** Metric name (LCP, FID, CLS, etc.) */
  name: MetricName;
  /** Metric value */
  value: number;
  /** Performance rating */
  rating: MetricRating;
  /** Delta from previous measurement */
  delta: number;
  /** Navigation type that triggered the metric */
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore';
  /** Attribution entries for debugging */
  entries: PerformanceEntry[];
  /** Timestamp when metric was captured */
  timestamp: number;
}

/**
 * Custom performance mark
 */
export interface PerformanceMark {
  /** Mark name */
  name: string;
  /** Start time (high-resolution timestamp) */
  startTime: number;
  /** Duration if measuring between two marks */
  duration?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Thresholds for Core Web Vitals ratings
 * Based on Google's recommendations
 */
export interface MetricThresholds {
  /** Largest Contentful Paint (ms) */
  LCP: { good: number; poor: number };
  /** First Input Delay (ms) */
  FID: { good: number; poor: number };
  /** Cumulative Layout Shift (unitless) */
  CLS: { good: number; poor: number };
  /** Time to First Byte (ms) */
  TTFB: { good: number; poor: number };
  /** Interaction to Next Paint (ms) */
  INP: { good: number; poor: number };
  /** First Contentful Paint (ms) */
  FCP: { good: number; poor: number };
}

/**
 * Default thresholds based on Google's recommendations
 */
export const DEFAULT_THRESHOLDS: MetricThresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
};

/**
 * Performance report aggregating all metrics
 */
export interface PerformanceReport {
  /** Unique report ID */
  id: string;
  /** Page URL */
  url: string;
  /** User agent string */
  userAgent: string;
  /** Connection type if available */
  connectionType?: string;
  /** Effective connection type */
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  /** Device memory in GB */
  deviceMemory?: number;
  /** Hardware concurrency (CPU cores) */
  hardwareConcurrency?: number;
  /** Collected metrics */
  metrics: Partial<Record<MetricName, Metric>>;
  /** Custom performance marks */
  marks: PerformanceMark[];
  /** Overall performance score (0-100) */
  score: number;
  /** Report timestamp */
  timestamp: number;
  /** Session ID for correlation */
  sessionId?: string;
  /** Page route/path */
  route?: string;
  /** Tenant ID for multi-tenant apps */
  tenantId?: string;
}

/**
 * Configuration for vitals collection and reporting
 */
export interface VitalsConfig {
  /** Enable vitals collection */
  enabled: boolean;
  /** Enable debug mode (console logging, overlay) */
  debug: boolean;
  /** Report destination */
  reportTo: 'posthog' | 'sentry' | 'custom' | 'all';
  /** Custom endpoint URL for reporting */
  customEndpoint?: string;
  /** Sample rate (0-1) for production */
  sampleRate: number;
  /** Custom thresholds override */
  thresholds?: Partial<MetricThresholds>;
  /** Enable local storage for debugging */
  enableLocalStorage: boolean;
  /** Max reports to store locally */
  maxLocalReports: number;
  /** Threshold alerts configuration */
  alerts: {
    /** Enable threshold alerts */
    enabled: boolean;
    /** Console warn on needs-improvement */
    warnOnNeedsImprovement: boolean;
    /** Custom alert callback */
    onAlert?: (metric: Metric) => void;
  };
}

/**
 * Default vitals configuration
 */
export const DEFAULT_CONFIG: VitalsConfig = {
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
  reportTo: 'all',
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  enableLocalStorage: process.env.NODE_ENV === 'development',
  maxLocalReports: 50,
  alerts: {
    enabled: true,
    warnOnNeedsImprovement: process.env.NODE_ENV === 'development',
  },
};

/**
 * Vitals collection state
 */
export interface VitalsState {
  /** Whether collection is active */
  isCollecting: boolean;
  /** Current metrics */
  metrics: Map<MetricName, Metric>;
  /** Custom marks */
  marks: Map<string, PerformanceMark>;
  /** Reports history */
  reports: PerformanceReport[];
  /** Last report timestamp */
  lastReportTime?: number;
}

/**
 * Reporter interface for sending metrics
 */
export interface VitalsReporter {
  /** Report a single metric */
  reportMetric(metric: Metric): Promise<void>;
  /** Report full performance report */
  reportPerformance(report: PerformanceReport): Promise<void>;
  /** Flush any batched reports */
  flush(): Promise<void>;
}

/**
 * Metric entry for web-vitals library
 */
export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
  entries: PerformanceEntry[];
}
