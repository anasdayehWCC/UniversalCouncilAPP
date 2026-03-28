/**
 * TanStack Query Optimistic Update Helpers
 *
 * Provides type-safe utilities for optimistic mutations that work
 * directly with TanStack Query's cache manipulation APIs.
 *
 * @module lib/optimistic/query-helpers
 *
 * @example
 * ```typescript
 * const mutation = useOptimisticMutation({
 *   mutationFn: updateMeeting,
 *   queryKey: ['meetings'],
 *   optimisticUpdate: (old, newData) => [...old, newData],
 * });
 * ```
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

/**
 * Function to transform cached data optimistically
 */
export type OptimisticUpdateFn<TData, TVariables> = (
  oldData: TData | undefined,
  variables: TVariables
) => TData;

/**
 * Context returned from optimistic mutation setup
 */
export interface OptimisticContext<TData> {
  /** Previous data snapshot for rollback */
  previousData: TData | undefined;
  /** Query key that was updated */
  queryKey: QueryKey;
  /** Timestamp of the update */
  timestamp: number;
}

/**
 * Options for simple optimistic mutation
 */
export interface SimpleOptimisticMutationOptions<TData, TVariables, TError = Error> {
  /** The mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Query key to update optimistically */
  queryKey: QueryKey;
  /** Function to compute optimistic data */
  optimisticUpdate: OptimisticUpdateFn<TData, TVariables>;
  /** Called after mutation settles (success or error) */
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: OptimisticContext<TData> | undefined
  ) => void;
  /** Called on successful mutation */
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: OptimisticContext<TData> | undefined
  ) => void;
  /** Called on mutation error */
  onError?: (
    error: TError,
    variables: TVariables,
    context: OptimisticContext<TData> | undefined
  ) => void;
  /** Additional query keys to invalidate on success */
  invalidateKeys?: QueryKey[];
  /** Whether to refetch the query on success (default: true) */
  refetchOnSuccess?: boolean;
}

/**
 * Result of setting up an optimistic mutation
 */
export interface OptimisticMutationSetup<TData, TVariables> {
  /** onMutate handler for useMutation */
  onMutate: (variables: TVariables) => Promise<OptimisticContext<TData>>;
  /** onError handler for useMutation */
  onError: (
    error: Error,
    variables: TVariables,
    context: OptimisticContext<TData> | undefined
  ) => void;
  /** onSettled handler for useMutation */
  onSettled: () => void;
}

// ============================================================================
// Core Helpers
// ============================================================================

/**
 * Create optimistic mutation handlers for TanStack Query
 *
 * Returns onMutate, onError, and onSettled handlers that can be spread
 * into useMutation options.
 *
 * @example
 * ```typescript
 * const { onMutate, onError, onSettled } = createOptimisticHandlers<Meeting[], UpdateMeetingInput>({
 *   queryClient,
 *   queryKey: ['meetings'],
 *   optimisticUpdate: (old, vars) => old?.map(m =>
 *     m.id === vars.id ? { ...m, ...vars } : m
 *   ) ?? [],
 * });
 *
 * const mutation = useMutation({
 *   mutationFn: updateMeeting,
 *   onMutate,
 *   onError,
 *   onSettled,
 * });
 * ```
 */
export function createOptimisticHandlers<TData, TVariables>(options: {
  queryClient: QueryClient;
  queryKey: QueryKey;
  optimisticUpdate: OptimisticUpdateFn<TData, TVariables>;
  onRollback?: (previousData: TData | undefined, variables: TVariables) => void;
}): OptimisticMutationSetup<TData, TVariables> {
  const { queryClient, queryKey, optimisticUpdate, onRollback } = options;

  return {
    onMutate: async (variables: TVariables): Promise<OptimisticContext<TData>> => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData<TData>(queryKey, (old) =>
        optimisticUpdate(old, variables)
      );

      return {
        previousData,
        queryKey,
        timestamp: Date.now(),
      };
    },

    onError: (
      _error: Error,
      variables: TVariables,
      context: OptimisticContext<TData> | undefined
    ) => {
      // Rollback to previous data
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
        onRollback?.(context.previousData, variables);
      }
    },

    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Create an optimistic update function for adding an item to a list
 */
export function createAddToListUpdate<TItem extends { id?: string }>(
  generateId?: () => string
): OptimisticUpdateFn<TItem[], Partial<TItem>> {
  return (old, newItem) => {
    const id = newItem.id ?? generateId?.() ?? `temp_${Date.now()}`;
    return [...(old ?? []), { ...newItem, id } as TItem];
  };
}

/**
 * Create an optimistic update function for updating an item in a list
 */
export function createUpdateInListUpdate<
  TItem extends { id: string },
  TVariables extends { id: string }
>(): OptimisticUpdateFn<TItem[], TVariables> {
  return (old, variables) =>
    old?.map((item) =>
      item.id === variables.id ? { ...item, ...variables } : item
    ) ?? [];
}

/**
 * Create an optimistic update function for removing an item from a list
 */
export function createRemoveFromListUpdate<
  TItem extends { id: string }
>(): OptimisticUpdateFn<TItem[], { id: string }> {
  return (old, { id }) => old?.filter((item) => item.id !== id) ?? [];
}

/**
 * Create an optimistic update function for toggling a boolean field
 */
export function createToggleFieldUpdate<
  TItem extends { id: string },
  TField extends keyof TItem
>(field: TField): OptimisticUpdateFn<TItem[], { id: string }> {
  return (old, { id }) =>
    old?.map((item) =>
      item.id === id
        ? { ...item, [field]: !item[field] }
        : item
    ) ?? [];
}

/**
 * Create an optimistic update function for reordering items
 */
export function createReorderUpdate<TItem extends { id: string }>(): OptimisticUpdateFn<
  TItem[],
  { fromIndex: number; toIndex: number }
> {
  return (old, { fromIndex, toIndex }) => {
    if (!old) return [];
    const result = [...old];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  };
}

// ============================================================================
// Multi-Query Helpers
// ============================================================================

/**
 * Options for updating multiple queries optimistically
 */
export interface MultiQueryOptimisticOptions<TVariables> {
  queryClient: QueryClient;
  updates: Array<{
    queryKey: QueryKey;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    optimisticUpdate: OptimisticUpdateFn<any, TVariables>;
  }>;
}

/**
 * Context for multi-query optimistic updates
 */
export interface MultiQueryContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previousData: Map<string, any>;
  timestamp: number;
}

/**
 * Create handlers for optimistically updating multiple queries
 *
 * @example
 * ```typescript
 * const handlers = createMultiQueryOptimisticHandlers({
 *   queryClient,
 *   updates: [
 *     {
 *       queryKey: ['meetings'],
 *       optimisticUpdate: (old, vars) => [...old, vars.meeting],
 *     },
 *     {
 *       queryKey: ['meeting-count'],
 *       optimisticUpdate: (old) => (old ?? 0) + 1,
 *     },
 *   ],
 * });
 * ```
 */
export function createMultiQueryOptimisticHandlers<TVariables>(
  options: MultiQueryOptimisticOptions<TVariables>
) {
  const { queryClient, updates } = options;

  return {
    onMutate: async (variables: TVariables): Promise<MultiQueryContext> => {
      // Cancel all relevant queries
      await Promise.all(
        updates.map(({ queryKey }) =>
          queryClient.cancelQueries({ queryKey })
        )
      );

      // Snapshot all previous data
      const previousData = new Map<string, unknown>();
      for (const { queryKey } of updates) {
        const key = JSON.stringify(queryKey);
        previousData.set(key, queryClient.getQueryData(queryKey));
      }

      // Apply all optimistic updates
      for (const { queryKey, optimisticUpdate } of updates) {
        queryClient.setQueryData(queryKey, (old: unknown) =>
          optimisticUpdate(old, variables)
        );
      }

      return {
        previousData,
        timestamp: Date.now(),
      };
    },

    onError: (
      _error: Error,
      _variables: TVariables,
      context: MultiQueryContext | undefined
    ) => {
      // Rollback all queries
      if (context?.previousData) {
        for (const { queryKey } of updates) {
          const key = JSON.stringify(queryKey);
          const previous = context.previousData.get(key);
          if (previous !== undefined) {
            queryClient.setQueryData(queryKey, previous);
          }
        }
      }
    },

    onSettled: () => {
      // Invalidate all queries
      for (const { queryKey } of updates) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  };
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Apply multiple optimistic updates as a batch
 */
export function batchOptimisticUpdates<TVariables>(
  queryClient: QueryClient,
  updates: Array<{
    queryKey: QueryKey;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: OptimisticUpdateFn<any, TVariables>;
  }>,
  variables: TVariables
): Map<string, unknown> {
  const previousData = new Map<string, unknown>();

  for (const { queryKey, update } of updates) {
    const key = JSON.stringify(queryKey);
    previousData.set(key, queryClient.getQueryData(queryKey));
    queryClient.setQueryData(queryKey, (old: unknown) => update(old, variables));
  }

  return previousData;
}

/**
 * Rollback multiple optimistic updates
 */
export function rollbackOptimisticUpdates(
  queryClient: QueryClient,
  previousData: Map<string, unknown>
): void {
  for (const [keyStr, data] of previousData) {
    const queryKey = JSON.parse(keyStr) as QueryKey;
    queryClient.setQueryData(queryKey, data);
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create a type-safe query key tuple builder
 */
export function createQueryKey<T extends readonly unknown[]>(...parts: T): T {
  return parts;
}

/**
 * Generate a temporary ID for optimistic creates
 */
export function generateTempId(prefix = 'temp'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if an ID is a temporary/optimistic ID
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp_') || id.startsWith('opt_');
}

/**
 * Replace a temporary ID with a real ID in cached data
 */
export function replaceTempId<TItem extends { id: string }>(
  items: TItem[],
  tempId: string,
  realId: string
): TItem[] {
  return items.map((item) =>
    item.id === tempId ? { ...item, id: realId } : item
  );
}
