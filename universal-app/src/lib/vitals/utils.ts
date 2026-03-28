/**
 * Web Vitals Utilities
 *
 * Helper functions for rating calculations, formatting,
 * and percentile computations.
 */

import type { MetricName, MetricRating, MetricThresholds, Metric, PerformanceReport } from './types';
import { DEFAULT_THRESHOLDS } from './types';

/**
 * Calculate rating for a metric value
 */
export function getMetricRating(
  name: MetricName,
  value: number,
  thresholds: MetricThresholds = DEFAULT_THRESHOLDS
): MetricRating {
  const threshold = thresholds[name];
  if (!threshold) return 'poor';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Get color for rating
 */
export function getRatingColor(rating: MetricRating): string {
  switch (rating) {
    case 'good':
      return '#0CCE6B'; // Green
    case 'needs-improvement':
      return '#FFA400'; // Orange/Amber
    case 'poor':
      return '#FF4E42'; // Red
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Get Tailwind color class for rating
 */
export function getRatingColorClass(rating: MetricRating): string {
  switch (rating) {
    case 'good':
      return 'text-green-500 bg-green-500/10';
    case 'needs-improvement':
      return 'text-amber-500 bg-amber-500/10';
    case 'poor':
      return 'text-red-500 bg-red-500/10';
    default:
      return 'text-gray-500 bg-gray-500/10';
  }
}

/**
 * Get icon for rating
 */
export function getRatingIcon(rating: MetricRating): string {
  switch (rating) {
    case 'good':
      return '✓';
    case 'needs-improvement':
      return '⚠';
    case 'poor':
      return '✗';
    default:
      return '•';
  }
}

/**
 * Format metric value for display
 */
export function formatMetricValue(name: MetricName, value: number): string {
  switch (name) {
    case 'LCP':
    case 'FID':
    case 'TTFB':
    case 'INP':
    case 'FCP':
      // Time-based metrics - show in seconds or milliseconds
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}s`;
      }
      return `${Math.round(value)}ms`;
    case 'CLS':
      // Cumulative Layout Shift - unitless, show 3 decimal places
      return value.toFixed(3);
    default:
      return String(Math.round(value));
  }
}

/**
 * Get metric description
 */
export function getMetricDescription(name: MetricName): string {
  switch (name) {
    case 'LCP':
      return 'Largest Contentful Paint - measures loading performance';
    case 'FID':
      return 'First Input Delay - measures interactivity';
    case 'CLS':
      return 'Cumulative Layout Shift - measures visual stability';
    case 'TTFB':
      return 'Time to First Byte - measures server response time';
    case 'INP':
      return 'Interaction to Next Paint - measures responsiveness';
    case 'FCP':
      return 'First Contentful Paint - measures initial render time';
    default:
      return 'Performance metric';
  }
}

/**
 * Get metric full name
 */
export function getMetricFullName(name: MetricName): string {
  switch (name) {
    case 'LCP':
      return 'Largest Contentful Paint';
    case 'FID':
      return 'First Input Delay';
    case 'CLS':
      return 'Cumulative Layout Shift';
    case 'TTFB':
      return 'Time to First Byte';
    case 'INP':
      return 'Interaction to Next Paint';
    case 'FCP':
      return 'First Contentful Paint';
    default:
      return name;
  }
}

/**
 * Calculate percentile from a sorted array of values
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sorted.length) return sorted[sorted.length - 1];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate overall performance score (0-100)
 */
export function calculateOverallScore(metrics: Partial<Record<MetricName, Metric>>): number {
  const weights: Record<MetricName, number> = {
    LCP: 25,
    FID: 25,
    CLS: 25,
    INP: 15,
    TTFB: 5,
    FCP: 5,
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const [name, metric] of Object.entries(metrics) as [MetricName, Metric][]) {
    if (!metric || !(name in weights)) continue;

    const weight = weights[name];
    totalWeight += weight;

    // Convert rating to score
    let score: number;
    switch (metric.rating) {
      case 'good':
        score = 100;
        break;
      case 'needs-improvement':
        score = 50;
        break;
      case 'poor':
        score = 0;
        break;
      default:
        score = 0;
    }

    weightedScore += score * weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedScore / totalWeight);
}

/**
 * Get performance score rating
 */
export function getScoreRating(score: number): MetricRating {
  if (score >= 90) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}

/**
 * Generate unique ID for metrics/reports
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Get connection information
 */
export function getConnectionInfo(): {
  connectionType?: string;
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
} {
  if (typeof navigator === 'undefined') return {};

  const connection = (navigator as Navigator & {
    connection?: {
      type?: string;
      effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
    };
  }).connection;

  return {
    connectionType: connection?.type,
    effectiveType: connection?.effectiveType,
  };
}

/**
 * Get device information
 */
export function getDeviceInfo(): {
  deviceMemory?: number;
  hardwareConcurrency?: number;
} {
  if (typeof navigator === 'undefined') return {};

  return {
    deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
  };
}

/**
 * Create empty performance report
 */
export function createEmptyReport(): PerformanceReport {
  const { connectionType, effectiveType } = getConnectionInfo();
  const { deviceMemory, hardwareConcurrency } = getDeviceInfo();

  return {
    id: generateId(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    connectionType,
    effectiveType,
    deviceMemory,
    hardwareConcurrency,
    metrics: {},
    marks: [],
    score: 0,
    timestamp: Date.now(),
  };
}

/**
 * Debounce function for reporting
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if we should sample this session
 */
export function shouldSample(sampleRate: number): boolean {
  if (sampleRate >= 1) return true;
  if (sampleRate <= 0) return false;

  // Use session storage to maintain consistent sampling within a session
  if (typeof sessionStorage !== 'undefined') {
    const key = 'vitals_sample_decision';
    const cached = sessionStorage.getItem(key);
    if (cached !== null) {
      return cached === 'true';
    }

    const decision = Math.random() < sampleRate;
    sessionStorage.setItem(key, String(decision));
    return decision;
  }

  return Math.random() < sampleRate;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Get threshold values for a metric
 */
export function getThresholds(
  name: MetricName,
  thresholds: MetricThresholds = DEFAULT_THRESHOLDS
): { good: number; poor: number } {
  return thresholds[name] || { good: 0, poor: Infinity };
}
