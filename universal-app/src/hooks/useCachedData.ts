'use client';

/**
 * Cached Data Hook
 *
 * React hook that integrates our caching strategy with TanStack Query.
 * Provides automatic cache management, prefetching, and invalidation.
 *
 * @module hooks/useCachedData
 *
 * @example
 * ```typescript
 * import { useCachedQuery, useCachedMutation, usePrefetch } from '@/hooks/useCachedData';
 *
 * // Fetch with caching
 * const { data, isLoading } = useCachedQuery({
 *   key: minuteKeys.detail(id),
 *   fetcher: () => api.getMinute(id),
 *   options: {
 *     strategy: 'stale-while-revalidate',
 *     ttl: CacheTTL.STANDARD,
 *   },
 * });
 *
 * // Mutation with automatic cache invalidation
 * const mutation = useCachedMutation({
 *   mutationFn: api.updateMinute,
 *   invalidateTags: [cacheTags.minute(id)],
 * });
 *
 * // Prefetch on hover
 * const prefetch = usePrefetch();
 * <button onMouseEnter={() => prefetch(minuteKeys.detail(id), () => api.getMinute(id))}>
 * ```
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  getCacheManager,
  type CacheStrategy,
  type CacheOptions,
  CacheTTL,
  CacheStaleTime,
} from '@/lib/cache';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for useCachedQuery hook
 */
export interface UseCachedQueryOptions<TData, TError = Error> {
  /** Cache key (uses our key format) */
  key: string;
  /** Fetcher function */
  fetcher: () => Promise<TData>;
  /** Cache strategy options */
  cacheOptions?: CacheOptions;
  /** TanStack Query options (override defaults) */
  queryOptions?: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'>;
  /** Whether to use the dual-layer cache (memory + IndexedDB) */
  useDualLayerCache?: boolean;
}

/**
 * Options for useCachedMutation hook
 */
export interface UseCachedMutationOptions<TData, TVariables, TError = Error> {
  /** Mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Tags to invalidate on success */
  invalidateTags?: string[];
  /** Query keys to invalidate on success */
  invalidateKeys?: string[];
  /** TanStack Query mutation options */
  mutationOptions?: Omit<
    UseMutationOptions<TData, TError, TVariables>,
    'mutationFn'
  >;
  /** Optimistic update function */
  getOptimisticData?: (variables: TVariables) => TData;
  /** Key to update optimistically */
  optimisticKey?: string;
}

/**
 * Options for prefetching
 */
export interface PrefetchOptions extends CacheOptions {
  /** Prefetch immediately or on idle */
  timing?: 'immediate' | 'idle';
}

// ============================================================================
// useCachedQuery Hook
// ============================================================================

/**
 * Query hook with integrated caching strategy
 *
 * Combines TanStack Query's powerful fetching/caching with our
 * dual-layer (memory + IndexedDB) cache for persistent offline support.
 */
export function useCachedQuery<TData, TError = Error>({
  key,
  fetcher,
  cacheOptions = {},
  queryOptions = {},
  useDualLayerCache = true,
}: UseCachedQueryOptions<TData, TError>) {
  const {
    strategy = 'stale-while-revalidate',
    ttl = CacheTTL.STANDARD,
    tags = [],
    staleTime: optionStaleTime,
  } = cacheOptions;

  const cacheManager = getCacheManager();

  // Convert our cache key to TanStack Query key format
  const queryKey = useMemo(() => [key, { strategy, ttl }], [key, strategy, ttl]);

  // Calculate stale/cache times based on strategy
  const { staleTime, gcTime } = useMemo(() => {
    switch (strategy) {
      case 'cache-first':
        return {
          staleTime: ttl, // Consider fresh for full TTL
          gcTime: ttl * 2, // Keep in TQ cache longer
        };
      case 'network-first':
        return {
          staleTime: 0, // Always refetch
          gcTime: ttl,
        };
      case 'stale-while-revalidate':
        return {
          staleTime: optionStaleTime ?? CacheStaleTime.MEDIUM,
          gcTime: ttl,
        };
      case 'network-only':
        return {
          staleTime: 0,
          gcTime: 0,
        };
      case 'cache-only':
        return {
          staleTime: Infinity,
          gcTime: Infinity,
        };
      default:
        return {
          staleTime: CacheStaleTime.MEDIUM,
          gcTime: ttl,
        };
    }
  }, [strategy, ttl, optionStaleTime]);

  // Wrapped fetcher that uses our cache manager
  const wrappedFetcher = useCallback(async (): Promise<TData> => {
    if (!useDualLayerCache) {
      // Just use TanStack Query's caching
      return fetcher();
    }

    // Use our dual-layer cache
    const result = await cacheManager.fetch<TData>(key, fetcher, {
      ...cacheOptions,
      strategy,
      ttl,
      tags,
    });

    return result.data;
  }, [key, fetcher, cacheManager, useDualLayerCache, cacheOptions, strategy, ttl, tags]);

  // Initialize from IndexedDB cache on mount (for offline support)
  const initialDataRef = useRef<TData | undefined>(undefined);

  useEffect(() => {
    if (!useDualLayerCache) return;

    // Try to get initial data from our cache
    cacheManager.get<TData>(key).then((entry) => {
      if (entry) {
        initialDataRef.current = entry.data;
      }
    });
  }, [key, cacheManager, useDualLayerCache]);

  return useQuery<TData, TError, TData, QueryKey>({
    queryKey,
    queryFn: wrappedFetcher,
    staleTime,
    gcTime,
    // Use our cached data as initial data if available
    initialData: initialDataRef.current,
    initialDataUpdatedAt: initialDataRef.current
      ? () => Date.now() - staleTime - 1000 // Mark as stale so we refetch
      : undefined,
    ...queryOptions,
  });
}

// ============================================================================
// useCachedMutation Hook
// ============================================================================

/**
 * Mutation hook with automatic cache invalidation
 */
export function useCachedMutation<TData, TVariables, TError = Error>({
  mutationFn,
  invalidateTags = [],
  invalidateKeys = [],
  mutationOptions = {},
  getOptimisticData,
  optimisticKey,
}: UseCachedMutationOptions<TData, TVariables, TError>) {
  const queryClient = useQueryClient();
  const cacheManager = getCacheManager();

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    onMutate: async (variables) => {
      // Handle optimistic update
      if (getOptimisticData && optimisticKey) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: [optimisticKey] });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData([optimisticKey]);

        // Optimistically update
        const optimisticData = getOptimisticData(variables);
        queryClient.setQueryData([optimisticKey], optimisticData);

        // Also update our cache
        await cacheManager.set(optimisticKey, optimisticData);

        // Return context with snapshot for rollback
        return { previousData } as { previousData: unknown };
      }

      // Call the provided onMutate if one exists
      return mutationOptions.onMutate 
        ? (mutationOptions.onMutate as (vars: TVariables) => unknown)(variables)
        : undefined;
    },
    onError: async (error, variables, context) => {
      // Rollback optimistic update on error
      if (optimisticKey && context && typeof context === 'object' && 'previousData' in context) {
        queryClient.setQueryData(
          [optimisticKey],
          (context as { previousData: unknown }).previousData
        );
      }

      // Call provided onError callback if exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mutationOptions.onError as any)?.(error, variables, context);
    },
    onSuccess: async (data, variables, context) => {
      // Invalidate tags in our cache
      if (invalidateTags.length > 0) {
        await cacheManager.invalidateByTags(invalidateTags);
      }

      // Invalidate TanStack Query cache
      for (const key of invalidateKeys) {
        await queryClient.invalidateQueries({ queryKey: [key] });
      }

      // Also invalidate any matching keys by tag pattern
      for (const tag of invalidateTags) {
        // Find and invalidate all related queries
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === 'string' && key.includes(tag);
          },
        });
      }

      // Call provided onSuccess callback if exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mutationOptions.onSuccess as any)?.(data, variables, context);
    },
    onSettled: mutationOptions.onSettled,
    ...mutationOptions,
  });
}

// ============================================================================
// usePrefetch Hook
// ============================================================================

/**
 * Hook for prefetching data
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  const cacheManager = getCacheManager();

  const prefetch = useCallback(
    <T>(
      key: string,
      fetcher: () => Promise<T>,
      options: PrefetchOptions = {}
    ) => {
      const {
        timing = 'idle',
        strategy = 'stale-while-revalidate',
        ttl = CacheTTL.STANDARD,
        tags = [],
      } = options;

      const doPrefetch = async () => {
        // Prefetch into our cache
        cacheManager.prefetch(key, fetcher, { strategy, ttl, tags });

        // Also prefetch into TanStack Query cache
        await queryClient.prefetchQuery({
          queryKey: [key, { strategy, ttl }],
          queryFn: fetcher,
          staleTime: CacheStaleTime.MEDIUM,
        });
      };

      if (timing === 'immediate') {
        void doPrefetch();
      } else {
        // Use requestIdleCallback for non-blocking prefetch
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => doPrefetch(), { timeout: 2000 });
        } else {
          // Fallback with setTimeout
          setTimeout(doPrefetch, 100);
        }
      }
    },
    [cacheManager, queryClient]
  );

  return prefetch;
}

// ============================================================================
// useCacheInvalidation Hook
// ============================================================================

/**
 * Hook for manual cache invalidation
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  const cacheManager = getCacheManager();

  const invalidateByTags = useCallback(
    async (tags: string[]) => {
      // Invalidate our cache
      await cacheManager.invalidateByTags(tags);

      // Invalidate TanStack Query cache
      for (const tag of tags) {
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === 'string' && key.includes(tag.replace(/^(ns|entity|user|tenant):/, ''));
          },
        });
      }
    },
    [cacheManager, queryClient]
  );

  const invalidateByPattern = useCallback(
    async (pattern: RegExp) => {
      // Invalidate our cache
      await cacheManager.invalidateByPattern(pattern);

      // Invalidate TanStack Query cache
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && pattern.test(key);
        },
      });
    },
    [cacheManager, queryClient]
  );

  const clearAll = useCallback(async () => {
    await cacheManager.clear();
    queryClient.clear();
  }, [cacheManager, queryClient]);

  return {
    invalidateByTags,
    invalidateByPattern,
    clearAll,
  };
}

// ============================================================================
// useCacheWarming Hook
// ============================================================================

/**
 * Hook for warming cache with critical data on mount
 */
export function useCacheWarming(
  entries: Array<{
    key: string;
    fetcher: () => Promise<unknown>;
    options?: CacheOptions;
  }>,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const cacheManager = getCacheManager();
  const warmedRef = useRef(false);

  useEffect(() => {
    if (!enabled || warmedRef.current) return;
    warmedRef.current = true;

    // Warm cache in background
    cacheManager.warm(entries).catch((error) => {
      console.error('[Cache] Warming failed:', error);
    });
  }, [enabled, cacheManager, entries]);
}

// ============================================================================
// useCacheStats Hook
// ============================================================================

/**
 * Hook to get cache statistics (useful for debugging)
 */
export function useCacheStats() {
  const cacheManager = getCacheManager();

  const getStats = useCallback(() => {
    return cacheManager.getStats();
  }, [cacheManager]);

  const getFullStats = useCallback(async () => {
    return cacheManager.getFullStats();
  }, [cacheManager]);

  return { getStats, getFullStats };
}

// ============================================================================
// useOfflineCache Hook
// ============================================================================

/**
 * Hook that provides offline-aware caching
 * Falls back to cached data when offline
 */
export function useOfflineCache<TData, TError = Error>(
  key: string,
  fetcher: () => Promise<TData>,
  options: UseCachedQueryOptions<TData, TError>['cacheOptions'] = {}
) {
  // Check online status
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return useCachedQuery<TData, TError>({
    key,
    fetcher,
    cacheOptions: {
      ...options,
      // Use cache-only strategy when offline
      strategy: isOnline ? (options.strategy ?? 'stale-while-revalidate') : 'cache-only',
    },
    queryOptions: {
      // Don't retry when offline
      retry: isOnline ? 3 : false,
      // Enable network mode awareness
      networkMode: 'offlineFirst',
    },
    useDualLayerCache: true,
  });
}
