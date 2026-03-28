/**
 * Web Vitals Reporter
 *
 * Collects Core Web Vitals and reports them to analytics services
 * (PostHog, Sentry, custom endpoints).
 */

import type {
  Metric,
  MetricName,
  PerformanceReport,
  PerformanceMark,
  VitalsConfig,
  VitalsState,
  WebVitalsMetric,
} from './types';
import { DEFAULT_CONFIG, DEFAULT_THRESHOLDS } from './types';
import {
  getMetricRating,
  calculateOverallScore,
  generateId,
  createEmptyReport,
  shouldSample,
  formatMetricValue,
  getRatingIcon,
} from './utils';

// Storage key for local reports
const STORAGE_KEY = 'universal_app_vitals';

/**
 * Global vitals state
 */
let state: VitalsState = {
  isCollecting: false,
  metrics: new Map(),
  marks: new Map(),
  reports: [],
};

/**
 * Current configuration
 */
let config: VitalsConfig = { ...DEFAULT_CONFIG };

/**
 * Session ID for correlation
 */
let sessionId: string | null = null;

/**
 * Initialize the vitals reporter
 */
export function initVitalsReporter(customConfig?: Partial<VitalsConfig>): void {
  config = { ...DEFAULT_CONFIG, ...customConfig };

  if (!config.enabled) {
    console.debug('[Vitals] Reporter disabled');
    return;
  }

  if (!shouldSample(config.sampleRate)) {
    console.debug('[Vitals] Session not sampled for reporting');
    return;
  }

  sessionId = generateId();
  state.isCollecting = true;

  // Load stored reports if local storage is enabled
  if (config.enableLocalStorage) {
    loadStoredReports();
  }

  // Start collecting vitals
  collectWebVitals();

  if (config.debug) {
    console.debug('[Vitals] Reporter initialized', { config, sessionId });
  }
}

/**
 * Collect Core Web Vitals using web-vitals library
 */
async function collectWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Dynamic import of web-vitals library
    const webVitals = await import('web-vitals');

    // Collect all Core Web Vitals
    webVitals.onLCP(handleMetric);
    webVitals.onFID(handleMetric);
    webVitals.onCLS(handleMetric);
    webVitals.onTTFB(handleMetric);
    webVitals.onINP(handleMetric);
    webVitals.onFCP(handleMetric);

    if (config.debug) {
      console.debug('[Vitals] Web vitals collection started');
    }
  } catch (error) {
    console.error('[Vitals] Failed to load web-vitals library:', error);
  }
}

/**
 * Handle incoming metric from web-vitals
 */
function handleMetric(webVitalsMetric: WebVitalsMetric): void {
  const name = webVitalsMetric.name as MetricName;
  const thresholds = config.thresholds
    ? { ...DEFAULT_THRESHOLDS, ...config.thresholds }
    : DEFAULT_THRESHOLDS;

  const metric: Metric = {
    id: webVitalsMetric.id,
    name,
    value: webVitalsMetric.value,
    rating: getMetricRating(name, webVitalsMetric.value, thresholds),
    delta: webVitalsMetric.delta,
    navigationType: webVitalsMetric.navigationType as Metric['navigationType'],
    entries: webVitalsMetric.entries,
    timestamp: Date.now(),
  };

  // Store metric
  state.metrics.set(name, metric);

  // Handle alerts
  handleAlerts(metric);

  // Debug logging
  if (config.debug) {
    const icon = getRatingIcon(metric.rating);
    const formatted = formatMetricValue(name, metric.value);
    console.debug(`[Vitals] ${icon} ${name}: ${formatted} (${metric.rating})`);
  }

  // Report metric
  reportMetric(metric);
}

/**
 * Handle threshold alerts
 */
function handleAlerts(metric: Metric): void {
  if (!config.alerts.enabled) return;

  if (metric.rating === 'poor') {
    console.warn(`[Vitals] Poor ${metric.name}: ${formatMetricValue(metric.name, metric.value)}`);
    config.alerts.onAlert?.(metric);
  } else if (config.alerts.warnOnNeedsImprovement && metric.rating === 'needs-improvement') {
    console.warn(`[Vitals] ${metric.name} needs improvement: ${formatMetricValue(metric.name, metric.value)}`);
    config.alerts.onAlert?.(metric);
  }
}

/**
 * Report a single metric to configured destinations
 */
async function reportMetric(metric: Metric): Promise<void> {
  const destinations = getReportDestinations();

  const promises = destinations.map(async (destination) => {
    try {
      switch (destination) {
        case 'posthog':
          await reportToPostHog(metric);
          break;
        case 'sentry':
          await reportToSentry(metric);
          break;
        case 'custom':
          if (config.customEndpoint) {
            await reportToCustomEndpoint(metric);
          }
          break;
      }
    } catch (error) {
      console.error(`[Vitals] Failed to report to ${destination}:`, error);
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Get report destinations based on config
 */
function getReportDestinations(): ('posthog' | 'sentry' | 'custom')[] {
  if (config.reportTo === 'all') {
    return ['posthog', 'sentry', 'custom'];
  }
  return [config.reportTo];
}

/**
 * Report metric to PostHog
 */
async function reportToPostHog(metric: Metric): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const posthog = await import('posthog-js').then((m) => m.default);

    if (!posthog.__loaded) return;

    posthog.capture('web_vital', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      navigation_type: metric.navigationType,
      session_id: sessionId,
      $current_url: window.location.href,
    });
  } catch {
    // PostHog not available
  }
}

/**
 * Report metric to Sentry
 */
async function reportToSentry(metric: Metric): Promise<void> {
  try {
    const Sentry = await import('@sentry/nextjs');

    // Add metric as measurement
    Sentry.setMeasurement(metric.name, metric.value, getMetricUnit(metric.name));

    // For poor ratings, add breadcrumb
    if (metric.rating === 'poor') {
      Sentry.addBreadcrumb({
        category: 'web-vital',
        message: `Poor ${metric.name}: ${formatMetricValue(metric.name, metric.value)}`,
        level: 'warning',
        data: {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
        },
      });
    }
  } catch {
    // Sentry not available
  }
}

/**
 * Get Sentry measurement unit for metric
 */
function getMetricUnit(name: MetricName): 'millisecond' | 'none' {
  if (name === 'CLS') return 'none';
  return 'millisecond';
}

/**
 * Report metric to custom endpoint
 */
async function reportToCustomEndpoint(metric: Metric): Promise<void> {
  if (!config.customEndpoint) return;

  try {
    await fetch(config.customEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'metric',
        ...metric,
        sessionId,
        url: typeof window !== 'undefined' ? window.location.href : '',
      }),
      keepalive: true,
    });
  } catch (error) {
    console.error('[Vitals] Custom endpoint error:', error);
  }
}

/**
 * Add a custom performance mark
 */
export function addPerformanceMark(
  name: string,
  metadata?: Record<string, unknown>
): PerformanceMark {
  const mark: PerformanceMark = {
    name,
    startTime: performance.now(),
    metadata,
  };

  state.marks.set(name, mark);

  if (config.debug) {
    console.debug(`[Vitals] Mark: ${name}`);
  }

  return mark;
}

/**
 * Measure duration between two marks
 */
export function measureBetweenMarks(
  startMarkName: string,
  endMarkName?: string
): number | null {
  const startMark = state.marks.get(startMarkName);
  if (!startMark) return null;

  const endTime = endMarkName
    ? state.marks.get(endMarkName)?.startTime
    : performance.now();

  if (endTime === undefined) return null;

  const duration = endTime - startMark.startTime;
  startMark.duration = duration;

  if (config.debug) {
    console.debug(`[Vitals] Measure ${startMarkName}: ${duration.toFixed(2)}ms`);
  }

  return duration;
}

/**
 * Get current metrics
 */
export function getCurrentMetrics(): Map<MetricName, Metric> {
  return new Map(state.metrics);
}

/**
 * Get all performance marks
 */
export function getPerformanceMarks(): Map<string, PerformanceMark> {
  return new Map(state.marks);
}

/**
 * Generate and report a full performance report
 */
export function generatePerformanceReport(): PerformanceReport {
  const report = createEmptyReport();
  report.sessionId = sessionId ?? undefined;
  report.route = typeof window !== 'undefined' ? window.location.pathname : undefined;

  // Add all collected metrics
  state.metrics.forEach((metric, name) => {
    report.metrics[name] = metric;
  });

  // Add all marks
  state.marks.forEach((mark) => {
    report.marks.push(mark);
  });

  // Calculate overall score
  report.score = calculateOverallScore(report.metrics);

  // Store locally if enabled
  if (config.enableLocalStorage) {
    storeReport(report);
  }

  // Report to destinations
  reportFullPerformanceReport(report);

  return report;
}

/**
 * Report full performance report to destinations
 */
async function reportFullPerformanceReport(report: PerformanceReport): Promise<void> {
  const destinations = getReportDestinations();

  for (const destination of destinations) {
    try {
      if (destination === 'posthog') {
        const posthog = await import('posthog-js').then((m) => m.default);
        if (posthog.__loaded) {
          posthog.capture('performance_report', {
            score: report.score,
            metrics: Object.fromEntries(
              Object.entries(report.metrics).map(([k, v]) => [k, v?.value])
            ),
            ratings: Object.fromEntries(
              Object.entries(report.metrics).map(([k, v]) => [k, v?.rating])
            ),
            session_id: report.sessionId,
          });
        }
      } else if (destination === 'custom' && config.customEndpoint) {
        await fetch(config.customEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'report', ...report }),
          keepalive: true,
        });
      }
    } catch {
      // Ignore reporting errors
    }
  }

  if (config.debug) {
    console.debug('[Vitals] Performance report generated', report);
  }

  state.reports.push(report);
  state.lastReportTime = Date.now();
}

/**
 * Store report in local storage
 */
function storeReport(report: PerformanceReport): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as PerformanceReport[];
    stored.push(report);

    // Trim to max reports
    while (stored.length > config.maxLocalReports) {
      stored.shift();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('[Vitals] Failed to store report:', error);
  }
}

/**
 * Load stored reports from local storage
 */
function loadStoredReports(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as PerformanceReport[];
    state.reports = stored;

    if (config.debug && stored.length > 0) {
      console.debug(`[Vitals] Loaded ${stored.length} stored reports`);
    }
  } catch {
    // Ignore parse errors
  }
}

/**
 * Get stored reports
 */
export function getStoredReports(): PerformanceReport[] {
  return [...state.reports];
}

/**
 * Clear stored reports
 */
export function clearStoredReports(): void {
  state.reports = [];
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Get current vitals state
 */
export function getVitalsState(): VitalsState {
  return { ...state };
}

/**
 * Check if reporter is active
 */
export function isReporterActive(): boolean {
  return state.isCollecting;
}

/**
 * Get current config
 */
export function getVitalsConfig(): VitalsConfig {
  return { ...config };
}

/**
 * Update config at runtime
 */
export function updateVitalsConfig(updates: Partial<VitalsConfig>): void {
  config = { ...config, ...updates };

  if (config.debug) {
    console.debug('[Vitals] Config updated', config);
  }
}

/**
 * Setup web vitals - exported function for instrumentation
 */
export function setupWebVitals(customConfig?: Partial<VitalsConfig>): void {
  // Only run on client side
  if (typeof window === 'undefined') return;

  initVitalsReporter(customConfig);

  // Generate report on page unload
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        generatePerformanceReport();
      }
    });
  }
}

/**
 * Export all functions as a namespace
 */
export const VitalsReporter = {
  init: initVitalsReporter,
  setup: setupWebVitals,
  addMark: addPerformanceMark,
  measure: measureBetweenMarks,
  getMetrics: getCurrentMetrics,
  getMarks: getPerformanceMarks,
  generateReport: generatePerformanceReport,
  getStoredReports,
  clearStoredReports,
  getState: getVitalsState,
  isActive: isReporterActive,
  getConfig: getVitalsConfig,
  updateConfig: updateVitalsConfig,
};

export default VitalsReporter;
