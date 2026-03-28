/**
 * Performance Monitoring Types
 *
 * Type definitions for the comprehensive performance monitoring system.
 * Extends the existing vitals types with budgets, slow render detection,
 * and component-level tracking.
 */

import type { MetricName, Metric, MetricRating } from '@/lib/vitals/types';

/**
 * Performance budget configuration
 */
export interface PerformanceBudget {
  /** Budget name/identifier */
  name: string;
  /** Budget type */
  type: 'timing' | 'size' | 'count' | 'score';
  /** Metric or measurement to track */
  metric: MetricName | string;
  /** Warning threshold */
  warning: number;
  /** Error threshold */
  error: number;
  /** Current value */
  value?: number;
  /** Budget status */
  status?: 'ok' | 'warning' | 'error';
}

/**
 * Default performance budgets
 */
export const DEFAULT_BUDGETS: PerformanceBudget[] = [
  // Core Web Vitals budgets
  { name: 'LCP', type: 'timing', metric: 'LCP', warning: 2500, error: 4000 },
  { name: 'FID', type: 'timing', metric: 'FID', warning: 100, error: 300 },
  { name: 'CLS', type: 'score', metric: 'CLS', warning: 0.1, error: 0.25 },
  { name: 'INP', type: 'timing', metric: 'INP', warning: 200, error: 500 },
  { name: 'TTFB', type: 'timing', metric: 'TTFB', warning: 800, error: 1800 },
  { name: 'FCP', type: 'timing', metric: 'FCP', warning: 1800, error: 3000 },

  // Custom budgets
  { name: 'Total Blocking Time', type: 'timing', metric: 'TBT', warning: 200, error: 600 },
  { name: 'Time to Interactive', type: 'timing', metric: 'TTI', warning: 3800, error: 7300 },
  { name: 'JS Bundle Size', type: 'size', metric: 'js-bundle', warning: 250 * 1024, error: 500 * 1024 },
  { name: 'Component Render', type: 'timing', metric: 'component-render', warning: 16, error: 50 },
];

/**
 * Slow render detection configuration
 */
export interface SlowRenderConfig {
  /** Enable slow render detection */
  enabled: boolean;
  /** Threshold in ms to consider a render slow */
  threshold: number;
  /** Minimum renders before alerting */
  minRenderCount: number;
  /** Callback when slow render is detected */
  onSlowRender?: (info: SlowRenderInfo) => void;
}

/**
 * Information about a slow render
 */
export interface SlowRenderInfo {
  /** Component name */
  componentName: string;
  /** Render duration in ms */
  duration: number;
  /** Render count */
  renderCount: number;
  /** Phase (mount/update) */
  phase: 'mount' | 'update';
  /** Timestamp */
  timestamp: number;
  /** Stack trace if available */
  stackTrace?: string;
}

/**
 * User journey mark for tracking user flows
 */
export interface JourneyMark {
  /** Journey identifier */
  journeyId: string;
  /** Mark name */
  name: string;
  /** Phase in the journey */
  phase: 'start' | 'step' | 'end';
  /** High-resolution timestamp */
  timestamp: number;
  /** Duration from journey start */
  durationFromStart: number;
  /** Duration from previous mark */
  durationFromPrevious: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * User journey configuration
 */
export interface JourneyConfig {
  /** Journey identifier */
  id: string;
  /** Journey name */
  name: string;
  /** Expected duration (warning) */
  expectedDuration: number;
  /** Maximum duration (error) */
  maxDuration: number;
  /** Journey steps */
  steps: string[];
}

/**
 * Predefined user journey configurations
 */
export const USER_JOURNEYS: Record<string, JourneyConfig> = {
  // Recording journey
  recording: {
    id: 'recording',
    name: 'Recording Session',
    expectedDuration: 3000,
    maxDuration: 5000,
    steps: ['page-load', 'auth-check', 'recorder-init', 'recording-ready'],
  },
  // Review journey
  review: {
    id: 'review',
    name: 'Review Workflow',
    expectedDuration: 2000,
    maxDuration: 4000,
    steps: ['page-load', 'data-fetch', 'transcript-render', 'review-ready'],
  },
  // Login journey
  login: {
    id: 'login',
    name: 'Login Flow',
    expectedDuration: 2000,
    maxDuration: 5000,
    steps: ['login-start', 'msal-redirect', 'token-acquired', 'user-loaded'],
  },
  // Navigation journey
  navigation: {
    id: 'navigation',
    name: 'Page Navigation',
    expectedDuration: 500,
    maxDuration: 1500,
    steps: ['nav-start', 'route-change', 'data-ready', 'render-complete'],
  },
};

/**
 * Component performance entry
 */
export interface ComponentPerformance {
  /** Component name */
  name: string;
  /** Total render count */
  renderCount: number;
  /** Average render duration */
  avgRenderTime: number;
  /** Maximum render duration */
  maxRenderTime: number;
  /** Last render duration */
  lastRenderTime: number;
  /** Slow render count */
  slowRenderCount: number;
  /** First render timestamp */
  firstRender: number;
  /** Last render timestamp */
  lastRender: number;
  /** Render times history (limited) */
  renderHistory: number[];
}

/**
 * Performance monitor state
 */
export interface PerformanceMonitorState {
  /** Is monitoring active */
  isActive: boolean;
  /** Current FPS */
  fps: number;
  /** Memory usage if available */
  memory: MemoryInfo | null;
  /** Active budgets */
  budgets: PerformanceBudget[];
  /** Component performance map */
  components: Map<string, ComponentPerformance>;
  /** Active journeys */
  journeys: Map<string, JourneyMark[]>;
  /** Slow renders detected */
  slowRenders: SlowRenderInfo[];
  /** Long tasks detected */
  longTasks: LongTaskInfo[];
}

/**
 * Memory information
 */
export interface MemoryInfo {
  /** Used JS heap size in bytes */
  usedJSHeapSize: number;
  /** Total JS heap size in bytes */
  totalJSHeapSize: number;
  /** JS heap size limit in bytes */
  jsHeapSizeLimit: number;
  /** Usage percentage */
  usagePercent: number;
}

/**
 * Long task information
 */
export interface LongTaskInfo {
  /** Task duration in ms */
  duration: number;
  /** Start time */
  startTime: number;
  /** Attribution (script name, etc.) */
  attribution: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Performance monitor configuration
 */
export interface PerformanceMonitorConfig {
  /** Enable monitoring */
  enabled: boolean;
  /** Enable FPS tracking */
  trackFps: boolean;
  /** Enable memory tracking */
  trackMemory: boolean;
  /** Memory tracking interval in ms */
  memoryInterval: number;
  /** Enable long task detection */
  trackLongTasks: boolean;
  /** Long task threshold in ms */
  longTaskThreshold: number;
  /** Custom budgets */
  budgets: PerformanceBudget[];
  /** Slow render configuration */
  slowRender: SlowRenderConfig;
  /** Debug mode */
  debug: boolean;
  /** Max history entries per component */
  maxHistorySize: number;
  /** Max slow renders to store */
  maxSlowRenders: number;
}

/**
 * Default performance monitor configuration
 */
export const DEFAULT_MONITOR_CONFIG: PerformanceMonitorConfig = {
  enabled: true,
  trackFps: true,
  trackMemory: true,
  memoryInterval: 2000,
  trackLongTasks: true,
  longTaskThreshold: 50,
  budgets: DEFAULT_BUDGETS,
  slowRender: {
    enabled: true,
    threshold: 16, // ~60fps
    minRenderCount: 3,
  },
  debug: process.env.NODE_ENV === 'development',
  maxHistorySize: 100,
  maxSlowRenders: 50,
};

/**
 * Batch report for analytics
 */
export interface PerformanceBatchReport {
  /** Report ID */
  id: string;
  /** Session ID */
  sessionId: string;
  /** Timestamp */
  timestamp: number;
  /** URL/route */
  url: string;
  /** Core Web Vitals */
  vitals: Partial<Record<MetricName, number>>;
  /** Budget violations */
  budgetViolations: PerformanceBudget[];
  /** Slow renders */
  slowRenders: SlowRenderInfo[];
  /** Long tasks */
  longTasks: LongTaskInfo[];
  /** Journey summaries */
  journeys: JourneySummary[];
  /** Component summaries */
  components: ComponentSummary[];
  /** Device info */
  device: DeviceInfo;
}

/**
 * Journey summary for reporting
 */
export interface JourneySummary {
  /** Journey ID */
  id: string;
  /** Journey name */
  name: string;
  /** Total duration */
  duration: number;
  /** Status based on expected duration */
  status: 'ok' | 'slow' | 'critical';
  /** Completed steps */
  completedSteps: number;
  /** Total steps */
  totalSteps: number;
}

/**
 * Component summary for reporting
 */
export interface ComponentSummary {
  /** Component name */
  name: string;
  /** Render count */
  renderCount: number;
  /** Average render time */
  avgRenderTime: number;
  /** Slow render count */
  slowRenderCount: number;
}

/**
 * Device information for reporting
 */
export interface DeviceInfo {
  /** User agent */
  userAgent: string;
  /** Connection type */
  connectionType?: string;
  /** Effective connection type */
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  /** Device memory in GB */
  deviceMemory?: number;
  /** Hardware concurrency */
  hardwareConcurrency?: number;
  /** Viewport dimensions */
  viewport: { width: number; height: number };
}
