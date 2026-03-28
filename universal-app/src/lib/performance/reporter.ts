/**
 * Performance Reporter
 *
 * Batch reporting of performance metrics to analytics services.
 * Integrates with PostHog, Sentry, and custom endpoints with
 * sampling support for high-traffic scenarios.
 *
 * @example
 * ```tsx
 * import { initPerformanceReporter, flushReports } from '@/lib/performance/reporter';
 *
 * // Initialize reporter
 * initPerformanceReporter({ sampleRate: 0.1 });
 *
 * // Manually flush pending reports
 * await flushReports();
 * ```
 */

import type {
  PerformanceBatchReport,
  JourneySummary,
  ComponentSummary,
  DeviceInfo,
  SlowRenderInfo,
  LongTaskInfo,
  PerformanceBudget,
} from './types';
import {
  getMonitorState,
  getSessionId,
  getBudgetViolations,
  getSlowRenders,
  getLongTasks,
  getAllComponentPerformance,
  getActiveJourneys,
} from './monitor';
import { getCurrentMetrics } from '@/lib/vitals/reporter';
import type { MetricName } from '@/lib/vitals/types';
import { USER_JOURNEYS } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Reporter configuration
 */
export interface PerformanceReporterConfig {
  /** Enable reporting */
  enabled: boolean;
  /** Sample rate (0-1) for production */
  sampleRate: number;
  /** Report destinations */
  destinations: ('posthog' | 'sentry' | 'custom')[];
  /** Custom endpoint URL */
  customEndpoint?: string;
  /** Batch size before sending */
  batchSize: number;
  /** Batch interval in ms */
  batchInterval: number;
  /** Include slow renders in reports */
  includeSlowRenders: boolean;
  /** Include long tasks in reports */
  includeLongTasks: boolean;
  /** Include component summaries */
  includeComponents: boolean;
  /** Include journey summaries */
  includeJourneys: boolean;
  /** Max items per category in batch */
  maxItemsPerCategory: number;
  /** Debug mode */
  debug: boolean;
  /** Report on page hide (visibilitychange) */
  reportOnPageHide: boolean;
  /** Report on beforeunload */
  reportOnUnload: boolean;
}

/**
 * Default reporter configuration
 */
const DEFAULT_REPORTER_CONFIG: PerformanceReporterConfig = {
  enabled: true,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  destinations: ['posthog', 'sentry'],
  batchSize: 10,
  batchInterval: 30000, // 30 seconds
  includeSlowRenders: true,
  includeLongTasks: true,
  includeComponents: true,
  includeJourneys: true,
  maxItemsPerCategory: 20,
  debug: process.env.NODE_ENV === 'development',
  reportOnPageHide: true,
  reportOnUnload: true,
};

// ============================================================================
// State
// ============================================================================

let config: PerformanceReporterConfig = { ...DEFAULT_REPORTER_CONFIG };
let pendingReports: PerformanceBatchReport[] = [];
let batchIntervalId: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;
let isSampled = false;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the performance reporter
 */
export function initPerformanceReporter(
  customConfig?: Partial<PerformanceReporterConfig>
): void {
  config = { ...DEFAULT_REPORTER_CONFIG, ...customConfig };

  if (!config.enabled) {
    if (config.debug) {
      console.debug('[PerfReporter] Reporter disabled');
    }
    return;
  }

  // Determine if this session should be sampled
  isSampled = Math.random() < config.sampleRate;

  if (!isSampled) {
    if (config.debug) {
      console.debug('[PerfReporter] Session not sampled');
    }
    return;
  }

  isInitialized = true;

  // Start batch interval
  if (config.batchInterval > 0) {
    batchIntervalId = setInterval(() => {
      void flushReports();
    }, config.batchInterval);
  }

  // Set up page lifecycle handlers
  if (typeof window !== 'undefined') {
    if (config.reportOnPageHide) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (config.reportOnUnload) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
  }

  if (config.debug) {
    console.debug('[PerfReporter] Reporter initialized', { config, isSampled });
  }
}

/**
 * Shutdown the reporter
 */
export function shutdownPerformanceReporter(): void {
  if (batchIntervalId !== null) {
    clearInterval(batchIntervalId);
    batchIntervalId = null;
  }

  if (typeof window !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }

  // Flush any pending reports
  void flushReports();

  isInitialized = false;

  if (config.debug) {
    console.debug('[PerfReporter] Reporter shutdown');
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Handle visibility change (page hide)
 */
function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    void flushReports();
  }
}

/**
 * Handle beforeunload
 */
function handleBeforeUnload(): void {
  // Use sendBeacon for reliable delivery
  flushReportsSync();
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate a batch report from current state
 */
export function generateBatchReport(): PerformanceBatchReport {
  const metrics = getCurrentMetrics();
  const vitals: Partial<Record<MetricName, number>> = {};

  metrics.forEach((metric, name) => {
    vitals[name] = metric.value;
  });

  const report: PerformanceBatchReport = {
    id: generateReportId(),
    sessionId: getSessionId(),
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    vitals,
    budgetViolations: config.includeSlowRenders ? getBudgetViolations() : [],
    slowRenders: config.includeSlowRenders
      ? getSlowRenders().slice(-config.maxItemsPerCategory)
      : [],
    longTasks: config.includeLongTasks
      ? getLongTasks().slice(-config.maxItemsPerCategory)
      : [],
    journeys: config.includeJourneys ? getJourneySummaries() : [],
    components: config.includeComponents ? getComponentSummaries() : [],
    device: getDeviceInfo(),
  };

  return report;
}

/**
 * Get journey summaries for reporting
 */
function getJourneySummaries(): JourneySummary[] {
  const summaries: JourneySummary[] = [];
  const journeys = getActiveJourneys();

  journeys.forEach((marks, id) => {
    const endMark = marks.find((m) => m.phase === 'end');
    if (!endMark) return;

    const journeyConfig = USER_JOURNEYS[id];
    const duration = endMark.durationFromStart;
    const status =
      journeyConfig && duration > journeyConfig.maxDuration
        ? 'critical'
        : journeyConfig && duration > journeyConfig.expectedDuration
          ? 'slow'
          : 'ok';

    summaries.push({
      id,
      name: journeyConfig?.name || id,
      duration,
      status,
      completedSteps: marks.length - 2, // Exclude start and end
      totalSteps: journeyConfig?.steps.length || 0,
    });
  });

  return summaries.slice(0, config.maxItemsPerCategory);
}

/**
 * Get component summaries for reporting
 */
function getComponentSummaries(): ComponentSummary[] {
  const components = getAllComponentPerformance();

  return components
    .map((c) => ({
      name: c.name,
      renderCount: c.renderCount,
      avgRenderTime: Math.round(c.avgRenderTime * 100) / 100,
      slowRenderCount: c.slowRenderCount,
    }))
    .sort((a, b) => b.avgRenderTime - a.avgRenderTime)
    .slice(0, config.maxItemsPerCategory);
}

/**
 * Get device information
 */
function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      viewport: { width: 0, height: 0 },
    };
  }

  const nav = navigator as Navigator & {
    connection?: {
      type?: string;
      effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
    };
    deviceMemory?: number;
  };

  return {
    userAgent: navigator.userAgent,
    connectionType: nav.connection?.type,
    effectiveType: nav.connection?.effectiveType,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

// ============================================================================
// Report Queue Management
// ============================================================================

/**
 * Add a report to the queue
 */
export function queueReport(report?: PerformanceBatchReport): void {
  if (!isInitialized || !isSampled) return;

  const reportToQueue = report || generateBatchReport();
  pendingReports.push(reportToQueue);

  // Auto-flush if batch size reached
  if (pendingReports.length >= config.batchSize) {
    void flushReports();
  }
}

/**
 * Flush all pending reports
 */
export async function flushReports(): Promise<void> {
  if (!isInitialized || !isSampled || pendingReports.length === 0) return;

  const reportsToSend = [...pendingReports];
  pendingReports = [];

  if (config.debug) {
    console.debug(`[PerfReporter] Flushing ${reportsToSend.length} reports`);
  }

  const promises = config.destinations.map(async (destination) => {
    try {
      switch (destination) {
        case 'posthog':
          await sendToPostHog(reportsToSend);
          break;
        case 'sentry':
          await sendToSentry(reportsToSend);
          break;
        case 'custom':
          if (config.customEndpoint) {
            await sendToCustomEndpoint(reportsToSend);
          }
          break;
      }
    } catch (error) {
      console.error(`[PerfReporter] Failed to send to ${destination}:`, error);
      // Re-queue failed reports
      pendingReports.push(...reportsToSend);
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Flush reports synchronously (for beforeunload)
 */
function flushReportsSync(): void {
  if (!isInitialized || !isSampled || pendingReports.length === 0) return;

  const reportsToSend = [...pendingReports];
  pendingReports = [];

  // Use sendBeacon for reliable delivery
  if (config.customEndpoint && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const data = JSON.stringify({ reports: reportsToSend });
    navigator.sendBeacon(config.customEndpoint, data);
  }
}

// ============================================================================
// Analytics Integration
// ============================================================================

/**
 * Send reports to PostHog
 */
async function sendToPostHog(reports: PerformanceBatchReport[]): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const posthog = await import('posthog-js').then((m) => m.default);

    if (!posthog.__loaded) return;

    for (const report of reports) {
      // Send batch report as event
      posthog.capture('performance_report', {
        ...flattenReportForPostHog(report),
        $current_url: report.url,
      });

      // Send budget violations as separate events
      for (const violation of report.budgetViolations) {
        posthog.capture('performance_budget_violation', {
          budget_name: violation.name,
          budget_type: violation.type,
          budget_metric: violation.metric,
          budget_value: violation.value,
          budget_warning: violation.warning,
          budget_error: violation.error,
          budget_status: violation.status,
          session_id: report.sessionId,
        });
      }

      // Send slow renders as events (sampled)
      if (report.slowRenders.length > 0 && Math.random() < 0.5) {
        posthog.capture('performance_slow_renders', {
          slow_render_count: report.slowRenders.length,
          slow_renders: report.slowRenders.slice(0, 5),
          session_id: report.sessionId,
        });
      }
    }
  } catch {
    // PostHog not available
  }
}

/**
 * Flatten report for PostHog properties
 */
function flattenReportForPostHog(report: PerformanceBatchReport): Record<string, unknown> {
  return {
    session_id: report.sessionId,
    // Core Web Vitals
    vital_lcp: report.vitals.LCP,
    vital_fid: report.vitals.FID,
    vital_cls: report.vitals.CLS,
    vital_inp: report.vitals.INP,
    vital_ttfb: report.vitals.TTFB,
    vital_fcp: report.vitals.FCP,
    // Summaries
    budget_violations_count: report.budgetViolations.length,
    slow_renders_count: report.slowRenders.length,
    long_tasks_count: report.longTasks.length,
    journeys_count: report.journeys.length,
    components_count: report.components.length,
    // Device
    connection_type: report.device.effectiveType,
    device_memory: report.device.deviceMemory,
    viewport_width: report.device.viewport.width,
    viewport_height: report.device.viewport.height,
  };
}

/**
 * Send reports to Sentry
 */
async function sendToSentry(reports: PerformanceBatchReport[]): Promise<void> {
  try {
    const Sentry = await import('@sentry/nextjs');

    for (const report of reports) {
      // Add measurements for Core Web Vitals
      if (report.vitals.LCP) Sentry.setMeasurement('LCP', report.vitals.LCP, 'millisecond');
      if (report.vitals.FID) Sentry.setMeasurement('FID', report.vitals.FID, 'millisecond');
      if (report.vitals.CLS) Sentry.setMeasurement('CLS', report.vitals.CLS, 'none');
      if (report.vitals.INP) Sentry.setMeasurement('INP', report.vitals.INP, 'millisecond');
      if (report.vitals.TTFB) Sentry.setMeasurement('TTFB', report.vitals.TTFB, 'millisecond');
      if (report.vitals.FCP) Sentry.setMeasurement('FCP', report.vitals.FCP, 'millisecond');

      // Add breadcrumbs for violations
      for (const violation of report.budgetViolations) {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `Budget violation: ${violation.name}`,
          level: violation.status === 'error' ? 'error' : 'warning',
          data: {
            metric: violation.metric,
            value: violation.value,
            threshold: violation.status === 'error' ? violation.error : violation.warning,
          },
        });
      }

      // Add breadcrumbs for slow renders
      for (const slowRender of report.slowRenders.slice(0, 5)) {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `Slow render: ${slowRender.componentName}`,
          level: 'warning',
          data: {
            duration: slowRender.duration,
            phase: slowRender.phase,
            renderCount: slowRender.renderCount,
          },
        });
      }

      // Set context for current performance
      Sentry.setContext('performance', {
        slowRenders: report.slowRenders.length,
        longTasks: report.longTasks.length,
        budgetViolations: report.budgetViolations.length,
        connectionType: report.device.effectiveType,
      });
    }
  } catch {
    // Sentry not available
  }
}

/**
 * Send reports to custom endpoint
 */
async function sendToCustomEndpoint(
  reports: PerformanceBatchReport[]
): Promise<void> {
  if (!config.customEndpoint) return;

  try {
    const response = await fetch(config.customEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reports }),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('[PerfReporter] Custom endpoint error:', error);
    throw error;
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a unique report ID
 */
function generateReportId(): string {
  return `perf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get reporter config
 */
export function getReporterConfig(): PerformanceReporterConfig {
  return { ...config };
}

/**
 * Update reporter config
 */
export function updateReporterConfig(
  updates: Partial<PerformanceReporterConfig>
): void {
  config = { ...config, ...updates };
}

/**
 * Check if reporter is active
 */
export function isReporterActive(): boolean {
  return isInitialized && isSampled;
}

/**
 * Get pending report count
 */
export function getPendingReportCount(): number {
  return pendingReports.length;
}
