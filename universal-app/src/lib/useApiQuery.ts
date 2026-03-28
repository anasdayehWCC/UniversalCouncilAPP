'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from './api-client';
import { isRetryableError, getErrorMessage } from './api-errors';

interface QueryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isRefetching: boolean;
  isStale: boolean;
}

interface QueryOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  retry?: number;
  retryDelay?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

interface QueryResult<T> extends QueryState<T> {
  refetch: () => Promise<void>;
  reset: () => void;
}

// Simple in-memory cache
const queryCache = new Map<string, { data: unknown; timestamp: number }>();

const DEFAULT_STALE_TIME = 30000; // 30 seconds
// Note: Cache time could be used for cache eviction in future versions

/**
 * Custom hook for data fetching with caching and error handling
 */
export function useApiQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    staleTime = DEFAULT_STALE_TIME,
    refetchOnMount = true,
    refetchOnWindowFocus = true,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isRefetching: false,
    isStale: false,
  });

  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  // Check cache for existing data
  useEffect(() => {
    const cached = queryCache.get(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      setState(prev => ({
        ...prev,
        data: cached.data as T,
        isStale: age > staleTime,
      }));
    }
  }, [key, staleTime]);

  const fetchData = useCallback(async (isRefetch = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setState(prev => ({
      ...prev,
      isLoading: !prev.data && !isRefetch,
      isRefetching: isRefetch && !!prev.data,
      error: null,
    }));

    try {
      const data = await fetcher();
      
      if (!mountedRef.current) return;

      // Update cache
      queryCache.set(key, { data, timestamp: Date.now() });

      setState(prev => ({
        ...prev,
        data,
        error: null,
        isLoading: false,
        isRefetching: false,
        isStale: false,
      }));

      onSuccess?.(data);
    } catch (error) {
      if (!mountedRef.current) return;

      const err = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({
        ...prev,
        error: err,
        isLoading: false,
        isRefetching: false,
      }));

      onError?.(err);
    } finally {
      fetchingRef.current = false;
    }
  }, [key, fetcher, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    
    if (!enabled) return;

    const cached = queryCache.get(key);
    const shouldFetch = refetchOnMount || !cached || (Date.now() - cached.timestamp > staleTime);

    if (shouldFetch) {
      fetchData(!!cached);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [key, enabled, refetchOnMount, staleTime, fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => {
      const cached = queryCache.get(key);
      if (cached && Date.now() - cached.timestamp > staleTime) {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, enabled, refetchOnWindowFocus, staleTime, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const reset = useCallback(() => {
    queryCache.delete(key);
    setState({
      data: null,
      error: null,
      isLoading: false,
      isRefetching: false,
      isStale: false,
    });
  }, [key]);

  return {
    ...state,
    refetch,
    reset,
  };
}

/**
 * Custom hook for mutations with optimistic updates
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void;
    invalidateKeys?: string[];
  } = {}
) {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: Error | null;
    data: TData | null;
  }>({
    isLoading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(async (variables: TVariables) => {
    setState({ isLoading: true, error: null, data: null });

    try {
      const data = await mutationFn(variables);
      
      setState({ isLoading: false, error: null, data });
      
      // Invalidate cache keys
      options.invalidateKeys?.forEach(key => queryCache.delete(key));
      
      options.onSuccess?.(data, variables);
      options.onSettled?.(data, null, variables);
      
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      setState({ isLoading: false, error: err, data: null });
      
      options.onError?.(err, variables);
      options.onSettled?.(null, err, variables);
      
      throw err;
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

// Re-export utilities
export { apiClient, isRetryableError, getErrorMessage };
