/**
 * Web Vitals Module
 *
 * Core Web Vitals monitoring for Universal Council App.
 * Tracks LCP, FID, CLS, TTFB, INP, and FCP metrics.
 *
 * @example
 * ```tsx
 * // Initialize in instrumentation
 * import { setupWebVitals } from '@/lib/vitals';
 * setupWebVitals({ debug: true });
 *
 * // Use hook in components
 * import { useWebVitals } from '@/hooks/useWebVitals';
 * const { metrics, score, addMark } = useWebVitals();
 * ```
 */

// Types
export type {
  Metric,
  MetricName,
  MetricRating,
  MetricThresholds,
  PerformanceReport,
  PerformanceMark,
  VitalsConfig,
  VitalsState,
  VitalsReporter as VitalsReporterType,
  WebVitalsMetric,
} from './types';

export { DEFAULT_CONFIG, DEFAULT_THRESHOLDS } from './types';

// Utils
export {
  getMetricRating,
  getRatingColor,
  getRatingColorClass,
  getRatingIcon,
  formatMetricValue,
  getMetricDescription,
  getMetricFullName,
  calculatePercentile,
  calculateOverallScore,
  getScoreRating,
  generateId,
  getConnectionInfo,
  getDeviceInfo,
  createEmptyReport,
  debounce,
  shouldSample,
  formatTimestamp,
  getThresholds,
} from './utils';

// Reporter
export {
  initVitalsReporter,
  setupWebVitals,
  addPerformanceMark,
  measureBetweenMarks,
  getCurrentMetrics,
  getPerformanceMarks,
  generatePerformanceReport,
  getStoredReports,
  clearStoredReports,
  getVitalsState,
  isReporterActive,
  getVitalsConfig,
  updateVitalsConfig,
  VitalsReporter,
} from './reporter';
