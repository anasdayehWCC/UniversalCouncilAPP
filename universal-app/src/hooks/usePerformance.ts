'use client';

/**
 * usePerformance Hook
 *
 * React hook for component-level performance tracking.
 * Automatically tracks render times, slow renders, and provides
 * utilities for manual performance measurements.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const perf = usePerformance('MyComponent');
 *
 *   // Track async operation
 *   const handleClick = async () => {
 *     const { result, duration } = await perf.measureAsync('api-call', async () => {
 *       return await fetchData();
 *     });
 *     console.log(`API call took ${duration}ms`);
 *   };
 *
 *   return (
 *     <div>
 *       <p>Render count: {perf.renderCount}</p>
 *       <p>Avg render time: {perf.avgRenderTime}ms</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { ComponentPerformance, SlowRenderInfo, MemoryInfo } from '@/lib/performance/types';
import {
  trackRender,
  getComponentPerformance,
  getCurrentFps,
  getMemoryInfo,
  startTiming,
  endTiming,
  measureFunction,
  measureAsyncFunction,
  startJourney,
  markJourneyStep,
  endJourney,
  isMonitorActive,
} from '@/lib/performance/monitor';

/**
 * Hook return type
 */
interface UsePerformanceReturn {
  /** Render count for this component */
  renderCount: number;
  /** Average render time in ms */
  avgRenderTime: number;
  /** Max render time in ms */
  maxRenderTime: number;
  /** Last render time in ms */
  lastRenderTime: number;
  /** Slow render count */
  slowRenderCount: number;
  /** Current FPS */
  fps: number;
  /** Memory info */
  memory: MemoryInfo | null;
  /** Whether performance monitoring is active */
  isActive: boolean;
  /** Start a timing measurement */
  startMeasure: (name: string) => void;
  /** End a timing measurement and get duration */
  endMeasure: (name: string) => number | null;
  /** Measure a sync function */
  measure: <T>(name: string, fn: () => T) => { result: T; duration: number };
  /** Measure an async function */
  measureAsync: <T>(
    name: string,
    fn: () => Promise<T>
  ) => Promise<{ result: T; duration: number }>;
  /** Mark a render manually (if not using auto-tracking) */
  markRender: (duration: number, phase?: 'mount' | 'update') => void;
  /** Start a user journey */
  startJourney: (journeyId: string, metadata?: Record<string, unknown>) => void;
  /** Mark a journey step */
  markJourneyStep: (journeyId: string, stepName: string, metadata?: Record<string, unknown>) => void;
  /** End a journey */
  endJourney: (journeyId: string, metadata?: Record<string, unknown>) => void;
  /** Get full component performance data */
  getPerformanceData: () => ComponentPerformance | undefined;
  /** Refresh performance data */
  refresh: () => void;
}

/**
 * Hook options
 */
interface UsePerformanceOptions {
  /** Auto-track renders using React Profiler API */
  autoTrack?: boolean;
  /** Refresh interval for performance data in ms (0 to disable) */
  refreshInterval?: number;
  /** Track component mount/unmount as journey */
  trackLifecycle?: boolean;
}

/**
 * usePerformance hook for component-level performance tracking
 */
export function usePerformance(
  componentName: string,
  options: UsePerformanceOptions = {}
): UsePerformanceReturn {
  const { autoTrack = true, refreshInterval = 1000, trackLifecycle = false } = options;

  // State for performance data
  const [perfData, setPerfData] = useState<ComponentPerformance | undefined>();
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<MemoryInfo | null>(null);

  // Refs for tracking
  const renderStartRef = useRef<number>(0);
  const renderCountRef = useRef(0);
  const isMountedRef = useRef(false);

  // Refresh performance data
  const refresh = useCallback(() => {
    setPerfData(getComponentPerformance(componentName));
    setFps(getCurrentFps());
    setMemory(getMemoryInfo());
  }, [componentName]);

  // Auto-track render timing
  useEffect(() => {
    if (autoTrack) {
      const renderEnd = performance.now();
      const renderDuration = renderEnd - renderStartRef.current;
      const phase = isMountedRef.current ? 'update' : 'mount';

      if (renderStartRef.current > 0 && renderDuration > 0) {
        trackRender(componentName, renderDuration, phase);
        renderCountRef.current++;
      }

      isMountedRef.current = true;
      renderStartRef.current = performance.now();
    }
  });

  // Track component lifecycle
  useEffect(() => {
    if (trackLifecycle) {
      startJourney(`component:${componentName}`, { component: componentName });
      markJourneyStep(`component:${componentName}`, 'mounted');
    }

    return () => {
      if (trackLifecycle) {
        endJourney(`component:${componentName}`);
      }
    };
  }, [componentName, trackLifecycle]);

  // Periodic refresh
  useEffect(() => {
    refresh();

    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, refreshInterval]);

  // Mark render manually
  const markRender = useCallback(
    (duration: number, phase: 'mount' | 'update' = 'update') => {
      trackRender(componentName, duration, phase);
      renderCountRef.current++;
    },
    [componentName]
  );

  // Start timing measurement
  const startMeasure = useCallback((name: string) => {
    startTiming(`${componentName}:${name}`);
  }, [componentName]);

  // End timing measurement
  const endMeasure = useCallback(
    (name: string): number | null => {
      return endTiming(`${componentName}:${name}`);
    },
    [componentName]
  );

  // Measure sync function
  const measure = useCallback(
    <T>(name: string, fn: () => T): { result: T; duration: number } => {
      return measureFunction(`${componentName}:${name}`, fn);
    },
    [componentName]
  );

  // Measure async function
  const measureAsync = useCallback(
    async <T>(
      name: string,
      fn: () => Promise<T>
    ): Promise<{ result: T; duration: number }> => {
      return measureAsyncFunction(`${componentName}:${name}`, fn);
    },
    [componentName]
  );

  // Journey helpers bound to component
  const handleStartJourney = useCallback(
    (journeyId: string, metadata?: Record<string, unknown>) => {
      startJourney(journeyId, { ...metadata, initiatedBy: componentName });
    },
    [componentName]
  );

  const handleMarkJourneyStep = useCallback(
    (journeyId: string, stepName: string, metadata?: Record<string, unknown>) => {
      markJourneyStep(journeyId, stepName, { ...metadata, component: componentName });
    },
    [componentName]
  );

  const handleEndJourney = useCallback(
    (journeyId: string, metadata?: Record<string, unknown>) => {
      endJourney(journeyId, { ...metadata, completedBy: componentName });
    },
    [componentName]
  );

  // Get full performance data
  const getPerformanceData = useCallback(() => {
    return getComponentPerformance(componentName);
  }, [componentName]);

  // Memoize return values
  return useMemo(
    () => ({
      renderCount: perfData?.renderCount ?? renderCountRef.current,
      avgRenderTime: Math.round((perfData?.avgRenderTime ?? 0) * 100) / 100,
      maxRenderTime: Math.round((perfData?.maxRenderTime ?? 0) * 100) / 100,
      lastRenderTime: Math.round((perfData?.lastRenderTime ?? 0) * 100) / 100,
      slowRenderCount: perfData?.slowRenderCount ?? 0,
      fps,
      memory,
      isActive: isMonitorActive(),
      startMeasure,
      endMeasure,
      measure,
      measureAsync,
      markRender,
      startJourney: handleStartJourney,
      markJourneyStep: handleMarkJourneyStep,
      endJourney: handleEndJourney,
      getPerformanceData,
      refresh,
    }),
    [
      perfData,
      fps,
      memory,
      startMeasure,
      endMeasure,
      measure,
      measureAsync,
      markRender,
      handleStartJourney,
      handleMarkJourneyStep,
      handleEndJourney,
      getPerformanceData,
      refresh,
    ]
  );
}

/**
 * Lightweight hook for just FPS monitoring
 */
export function useFps(refreshInterval = 1000): number {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const update = () => setFps(getCurrentFps());
    update();

    if (refreshInterval > 0) {
      const interval = setInterval(update, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return fps;
}

/**
 * Lightweight hook for memory monitoring
 */
export function useMemory(refreshInterval = 2000): MemoryInfo | null {
  const [memory, setMemory] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    const update = () => setMemory(getMemoryInfo());
    update();

    if (refreshInterval > 0) {
      const interval = setInterval(update, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return memory;
}

/**
 * Hook for measuring render time with Profiler
 */
export function useRenderProfiler(
  componentName: string,
  onRender?: (duration: number, phase: 'mount' | 'update') => void
): React.ProfilerOnRenderCallback {
  return useCallback(
    (
      id: string,
      phase: 'mount' | 'update' | 'nested-update',
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      const normalizedPhase = phase === 'nested-update' ? 'update' : phase;
      trackRender(componentName, actualDuration, normalizedPhase);
      onRender?.(actualDuration, normalizedPhase);
    },
    [componentName, onRender]
  );
}
