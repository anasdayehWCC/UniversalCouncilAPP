'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export interface UseSkeletonOptions {
  /** Minimum time to show skeleton (prevents flash) in ms */
  minDisplayTime?: number;
  /** Initial loading state */
  initialLoading?: boolean;
  /** Delay before showing skeleton (avoids flash for fast loads) */
  delay?: number;
  /** Disable animations (respects reduced motion by default) */
  disableAnimation?: boolean;
}

export interface UseSkeletonReturn {
  /** Whether skeleton should be shown */
  isLoading: boolean;
  /** Start loading state */
  startLoading: () => void;
  /** Stop loading state (respects minDisplayTime) */
  stopLoading: () => void;
  /** Toggle loading state */
  toggleLoading: () => void;
  /** Force stop immediately (ignores minDisplayTime) */
  forceStop: () => void;
  /** Whether animations should be disabled */
  shouldReduceMotion: boolean;
  /** Elapsed loading time in ms */
  loadingTime: number;
}

/**
 * Custom hook for controlled skeleton loading states
 * 
 * @example
 * ```tsx
 * const { isLoading, startLoading, stopLoading } = useSkeleton({
 *   minDisplayTime: 500,
 *   delay: 100,
 * });
 * 
 * useEffect(() => {
 *   startLoading();
 *   fetchData().finally(stopLoading);
 * }, []);
 * 
 * return isLoading ? <MySkeleton /> : <MyContent />;
 * ```
 */
export function useSkeleton(options: UseSkeletonOptions = {}): UseSkeletonReturn {
  const {
    minDisplayTime = 300,
    initialLoading = true,
    delay = 0,
    disableAnimation = false,
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading && delay === 0);
  const [loadingTime, setLoadingTime] = useState(0);
  
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldReduceMotion = disableAnimation || prefersReducedMotion;

  const loadingStartTime = useRef<number | null>(initialLoading ? Date.now() : null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minTimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStopRef = useRef(false);
  const loadingTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle initial delay
  useEffect(() => {
    if (initialLoading && delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        setIsLoading(true);
        loadingStartTime.current = Date.now();
      }, delay);

      return () => {
        if (delayTimeoutRef.current) {
          clearTimeout(delayTimeoutRef.current);
        }
      };
    }
  }, [initialLoading, delay]);

  // Track loading time
  useEffect(() => {
    if (isLoading && loadingStartTime.current) {
      loadingTimeIntervalRef.current = setInterval(() => {
        setLoadingTime(Date.now() - (loadingStartTime.current ?? Date.now()));
      }, 100);

      return () => {
        if (loadingTimeIntervalRef.current) {
          clearInterval(loadingTimeIntervalRef.current);
        }
      };
    }
  }, [isLoading]);

  const startLoading = useCallback(() => {
    pendingStopRef.current = false;
    
    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        if (!pendingStopRef.current) {
          setIsLoading(true);
          loadingStartTime.current = Date.now();
          setLoadingTime(0);
        }
      }, delay);
    } else {
      setIsLoading(true);
      loadingStartTime.current = Date.now();
      setLoadingTime(0);
    }
  }, [delay]);

  const stopLoading = useCallback(() => {
    pendingStopRef.current = true;

    // Clear delay timeout if still pending
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    // If not currently loading, nothing to do
    if (!isLoading || !loadingStartTime.current) {
      setIsLoading(false);
      return;
    }

    const elapsed = Date.now() - loadingStartTime.current;
    const remaining = minDisplayTime - elapsed;

    if (remaining > 0) {
      // Wait for minimum display time
      minTimeTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        loadingStartTime.current = null;
        setLoadingTime(0);
      }, remaining);
    } else {
      setIsLoading(false);
      loadingStartTime.current = null;
      setLoadingTime(0);
    }
  }, [isLoading, minDisplayTime]);

  const forceStop = useCallback(() => {
    pendingStopRef.current = true;
    
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }
    if (minTimeTimeoutRef.current) {
      clearTimeout(minTimeTimeoutRef.current);
    }
    
    setIsLoading(false);
    loadingStartTime.current = null;
    setLoadingTime(0);
  }, []);

  const toggleLoading = useCallback(() => {
    if (isLoading) {
      stopLoading();
    } else {
      startLoading();
    }
  }, [isLoading, startLoading, stopLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
      if (minTimeTimeoutRef.current) clearTimeout(minTimeTimeoutRef.current);
      if (loadingTimeIntervalRef.current) clearInterval(loadingTimeIntervalRef.current);
    };
  }, []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    forceStop,
    shouldReduceMotion,
    loadingTime,
  };
}

/**
 * Hook for async data fetching with skeleton state
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSkeletonAsync(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { minDisplayTime: 500 }
 * );
 * 
 * if (isLoading) return <DataSkeleton />;
 * if (error) return <ErrorState />;
 * return <DataView data={data} />;
 * ```
 */
export function useSkeletonAsync<T>(
  fetcher: () => Promise<T>,
  options: UseSkeletonOptions & {
    /** Dependencies that trigger refetch */
    deps?: React.DependencyList;
    /** Skip initial fetch */
    skip?: boolean;
  } = {}
) {
  const { deps = [], skip = false, ...skeletonOptions } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const skeleton = useSkeleton({
    ...skeletonOptions,
    initialLoading: !skip,
  });

  const refetch = useCallback(async () => {
    skeleton.startLoading();
    setError(null);
    
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      skeleton.stopLoading();
    }
  }, [fetcher, skeleton]);

  useEffect(() => {
    if (!skip) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  return {
    data,
    error,
    isLoading: skeleton.isLoading,
    refetch,
    shouldReduceMotion: skeleton.shouldReduceMotion,
    loadingTime: skeleton.loadingTime,
  };
}

export default useSkeleton;
