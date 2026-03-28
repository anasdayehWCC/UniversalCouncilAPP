'use client';

/**
 * useWebVitals Hook
 *
 * React hook for component-level web vitals tracking,
 * custom performance marks, and metric access.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { metrics, score, addMark, measure } = useWebVitals();
 *
 *   useEffect(() => {
 *     addMark('component-mount');
 *     return () => {
 *       const duration = measure('component-mount');
 *       console.log('Component lifetime:', duration);
 *     };
 *   }, []);
 *
 *   return <div>Score: {score}</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Metric, MetricName, MetricRating, PerformanceMark, PerformanceReport } from '@/lib/vitals/types';
import {
  getCurrentMetrics,
  getPerformanceMarks,
  addPerformanceMark,
  measureBetweenMarks,
  generatePerformanceReport,
  isReporterActive,
  getStoredReports,
} from '@/lib/vitals/reporter';
import { calculateOverallScore, getScoreRating } from '@/lib/vitals/utils';

/**
 * Hook return type
 */
interface UseWebVitalsReturn {
  /** Current metrics map */
  metrics: Map<MetricName, Metric>;
  /** Array of metrics for iteration */
  metricsArray: Metric[];
  /** Overall performance score (0-100) */
  score: number;
  /** Score rating (good/needs-improvement/poor) */
  scoreRating: MetricRating;
  /** Whether vitals reporter is active */
  isActive: boolean;
  /** Performance marks map */
  marks: Map<string, PerformanceMark>;
  /** Add a performance mark */
  addMark: (name: string, metadata?: Record<string, unknown>) => PerformanceMark;
  /** Measure duration from a mark */
  measure: (startMarkName: string, endMarkName?: string) => number | null;
  /** Start a performance measurement */
  startMeasure: (name: string) => () => number | null;
  /** Generate a full performance report */
  generateReport: () => PerformanceReport;
  /** Get stored reports */
  getReports: () => PerformanceReport[];
  /** Get a specific metric */
  getMetric: (name: MetricName) => Metric | undefined;
  /** Refresh metrics from reporter */
  refresh: () => void;
}

/**
 * Hook options
 */
interface UseWebVitalsOptions {
  /** Auto-refresh interval in ms (0 to disable) */
  refreshInterval?: number;
  /** Track component mount/unmount automatically */
  trackMount?: boolean;
  /** Component name for automatic tracking */
  componentName?: string;
}

/**
 * Hook for accessing web vitals in React components
 */
export function useWebVitals(options: UseWebVitalsOptions = {}): UseWebVitalsReturn {
  const { refreshInterval = 1000, trackMount = false, componentName } = options;

  const [metrics, setMetrics] = useState<Map<MetricName, Metric>>(new Map());
  const [marks, setMarks] = useState<Map<string, PerformanceMark>>(new Map());
  const [score, setScore] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const mountMarkRef = useRef<string | null>(null);

  // Refresh metrics from reporter
  const refresh = useCallback(() => {
    const currentMetrics = getCurrentMetrics();
    const currentMarks = getPerformanceMarks();

    setMetrics(currentMetrics);
    setMarks(currentMarks);
    setIsActive(isReporterActive());

    // Calculate score from metrics object
    const metricsObj: Partial<Record<MetricName, Metric>> = {};
    currentMetrics.forEach((metric, name) => {
      metricsObj[name] = metric;
    });
    setScore(calculateOverallScore(metricsObj));
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    refresh();

    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  // Track component mount/unmount
  useEffect(() => {
    if (trackMount && componentName) {
      const markName = `${componentName}-mount`;
      mountMarkRef.current = markName;
      addPerformanceMark(markName, { component: componentName });

      return () => {
        if (mountMarkRef.current) {
          measureBetweenMarks(mountMarkRef.current);
        }
      };
    }
  }, [trackMount, componentName]);

  // Add performance mark
  const addMark = useCallback(
    (name: string, metadata?: Record<string, unknown>): PerformanceMark => {
      const mark = addPerformanceMark(name, metadata);
      refresh();
      return mark;
    },
    [refresh]
  );

  // Measure between marks
  const measure = useCallback(
    (startMarkName: string, endMarkName?: string): number | null => {
      const duration = measureBetweenMarks(startMarkName, endMarkName);
      refresh();
      return duration;
    },
    [refresh]
  );

  // Start a measurement and return a function to end it
  const startMeasure = useCallback(
    (name: string): (() => number | null) => {
      const startMarkName = `${name}-start`;
      addPerformanceMark(startMarkName);

      return () => {
        return measureBetweenMarks(startMarkName);
      };
    },
    []
  );

  // Get a specific metric
  const getMetric = useCallback(
    (name: MetricName): Metric | undefined => {
      return metrics.get(name);
    },
    [metrics]
  );

  // Generate performance report
  const generateReportCallback = useCallback((): PerformanceReport => {
    const report = generatePerformanceReport();
    refresh();
    return report;
  }, [refresh]);

  // Get stored reports
  const getReports = useCallback((): PerformanceReport[] => {
    return getStoredReports();
  }, []);

  // Convert metrics map to array
  const metricsArray = Array.from(metrics.values());

  // Calculate score rating
  const scoreRating = getScoreRating(score);

  return {
    metrics,
    metricsArray,
    score,
    scoreRating,
    isActive,
    marks,
    addMark,
    measure,
    startMeasure,
    generateReport: generateReportCallback,
    getReports,
    getMetric,
    refresh,
  };
}

/**
 * Hook for measuring async operations
 */
export function useAsyncMeasure(measureName: string): {
  wrapAsync: <T>(promise: Promise<T>) => Promise<T>;
  getLastDuration: () => number | null;
} {
  const lastDurationRef = useRef<number | null>(null);
  let measureCount = 0;

  const wrapAsync = useCallback(
    async <T>(promise: Promise<T>): Promise<T> => {
      const markName = `${measureName}-${++measureCount}`;
      addPerformanceMark(markName);

      try {
        const result = await promise;
        lastDurationRef.current = measureBetweenMarks(markName);
        return result;
      } catch (error) {
        lastDurationRef.current = measureBetweenMarks(markName);
        throw error;
      }
    },
    [measureName]
  );

  const getLastDuration = useCallback((): number | null => {
    return lastDurationRef.current;
  }, []);

  return { wrapAsync, getLastDuration };
}

/**
 * Hook for component render timing
 */
export function useRenderTiming(componentName: string): {
  renderCount: number;
  lastRenderTime: number | null;
  averageRenderTime: number | null;
} {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const [lastRenderTime, setLastRenderTime] = useState<number | null>(null);
  const [averageRenderTime, setAverageRenderTime] = useState<number | null>(null);

  useEffect(() => {
    renderCountRef.current++;
    const markName = `${componentName}-render-${renderCountRef.current}`;
    const mark = addPerformanceMark(markName);

    // requestAnimationFrame to measure after paint
    requestAnimationFrame(() => {
      const duration = measureBetweenMarks(markName);
      if (duration !== null) {
        renderTimesRef.current.push(duration);
        setLastRenderTime(duration);

        const avg = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
        setAverageRenderTime(avg);

        // Keep only last 10 render times
        if (renderTimesRef.current.length > 10) {
          renderTimesRef.current.shift();
        }
      }
    });
  });

  return {
    renderCount: renderCountRef.current,
    lastRenderTime,
    averageRenderTime,
  };
}

export default useWebVitals;
