'use client';

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import {
  OptimisticUpdate,
  UseOptimisticMutationOptions,
  UseOptimisticMutationReturn,
} from '@/lib/optimistic/types';
import {
  useOptimisticStore,
} from '@/lib/optimistic/store';
import {
  createOptimistically,
  updateOptimistically,
  confirmOptimisticUpdate,
  failOptimisticUpdate,
  isOptimisticId,
} from '@/lib/optimistic/strategies';
import { queueSyncOperation } from '@/lib/offline-queue';

type MutationStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * Wrapper around mutation logic with optimistic update support
 * 
 * @example
 * ```tsx
 * const mutation = useOptimisticMutation({
 *   mutationFn: (variables) => api.updateMinute(variables),
 *   getOptimisticData: (variables) => ({
 *     ...currentMinute,
 *     ...variables,
 *   }),
 *   getPreviousData: () => currentMinute,
 *   entityType: 'minute',
 *   getEntityId: (variables) => variables.id,
 *   invalidateQueries: [['minutes']],
 * });
 * 
 * // Execute mutation
 * mutation.mutate({ id: '123', title: 'New Title' });
 * ```
 */
export function useOptimisticMutation<TData extends { id?: string } | Array<{ id?: string }>, TVariables, TContext = unknown>(
  options: UseOptimisticMutationOptions<TData, TVariables, TContext>
): UseOptimisticMutationReturn<TData, TVariables> {
  const {
    mutationFn,
    getOptimisticData,
    getPreviousData,
    entityType,
    getEntityId,
    onMutate,
    onSuccess,
    onError,
    onSettled,
    invalidateQueries,
    config,
  } = options;

  const queryClient = useQueryClient();
  const toast = useToast();
  const store = useOptimisticStore();

  const [status, setStatus] = useState<MutationStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);
  const [optimisticUpdate, setOptimisticUpdate] = useState<OptimisticUpdate<TData> | null>(null);

  const contextRef = useRef<TContext | undefined>(undefined);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setStatus('pending');
      setError(null);

      // Get entity ID if available
      const entityId = getEntityId?.(variables);

      // Generate optimistic data
      const optimisticData = getOptimisticData(variables);
      const previousData = getPreviousData?.();

      // Apply optimistic update
      let updateId: string;
      const isCreate = !entityId || isOptimisticId(entityId);

      if (isCreate) {
        const result = createOptimistically({
          entityType,
          data: optimisticData as { id?: string },
          meta: { variables },
        });
        updateId = result.updateId;
      } else {
        const result = updateOptimistically({
          entityType,
          entityId,
          data: optimisticData as { id?: string },
          previousData: previousData as { id?: string },
          meta: { variables },
        });
        updateId = result.updateId;
      }

      // Store the update reference
      const update = store.updates.get(updateId) as OptimisticUpdate<TData>;
      setOptimisticUpdate(update);

      // Run onMutate callback
      try {
        const ctx = await onMutate?.(variables);
        contextRef.current = ctx;
      } catch (err) {
        console.error('onMutate failed:', err);
      }

      // Update status to syncing
      store.updateStatus(updateId, 'syncing');

      try {
        // Check if offline - queue instead
        if (!navigator.onLine && config?.persistUpdates !== false) {
          await queueSyncOperation('custom', {
            entityType,
            updateId,
            variables,
            entityId,
          });

          // Keep as pending (will sync when online)
          store.updateStatus(updateId, 'pending');
          
          toast.info('Saved offline', 'Changes will sync when you\'re back online');
          
          setData(optimisticData);
          setStatus('success');
          return optimisticData;
        }

        // Execute the mutation
        const result = await mutationFn(variables);

        // Confirm the optimistic update
        confirmOptimisticUpdate(updateId, result, {
          updateEntityId: (result as unknown as { id?: string })?.id,
        });

        setData(result);
        setStatus('success');

        // Call success callback
        onSuccess?.(result, variables, contextRef.current as TContext);

        // Invalidate queries
        if (invalidateQueries) {
          for (const queryKey of invalidateQueries) {
            queryClient.invalidateQueries({ queryKey });
          }
        }

        // Call settled callback
        onSettled?.(result, null, variables, contextRef.current as TContext);

        return result;
      } catch (err) {
        const mutationError = err instanceof Error ? err : new Error(String(err));

        // Fail the optimistic update
        failOptimisticUpdate(updateId, mutationError, { autoRollback: true });

        setError(mutationError);
        setStatus('error');

        // Show toast
        if (config?.toastOnError !== false) {
          toast.error('Failed to save', mutationError.message);
        }

        // Call error callback
        onError?.(mutationError, variables, contextRef.current as TContext);

        // Call settled callback
        onSettled?.(undefined, mutationError, variables, contextRef.current as TContext);

        throw mutationError;
      }
    },
    [
      mutationFn,
      getOptimisticData,
      getPreviousData,
      entityType,
      getEntityId,
      onMutate,
      onSuccess,
      onError,
      onSettled,
      invalidateQueries,
      config,
      queryClient,
      toast,
      store,
    ]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {
        // Error already handled in mutateAsync
      });
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setData(undefined);
    setOptimisticUpdate(null);
    contextRef.current = undefined;
  }, []);

  return {
    mutate,
    mutateAsync,
    isPending: status === 'pending',
    isIdle: status === 'idle',
    isSuccess: status === 'success',
    isError: status === 'error',
    error,
    data,
    reset,
    optimisticUpdate,
  };
}

// ============================================================================
// Simple TanStack Query-native Optimistic Mutation Hook
// ============================================================================

/**
 * Options for the simpler TanStack Query-native optimistic mutation
 */
export interface SimpleOptimisticOptions<TData, TVariables, TError = Error> {
  /** The mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Query key to update optimistically */
  queryKey: readonly unknown[];
  /** Function to compute optimistic data from old cache + new variables */
  optimisticUpdate: (oldData: TData | undefined, variables: TVariables) => TData;
  /** Called on successful mutation */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Called on mutation error */
  onError?: (error: TError, variables: TVariables) => void;
  /** Called after mutation settles */
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables
  ) => void;
  /** Additional query keys to invalidate on success */
  invalidateKeys?: readonly unknown[][];
  /** Skip automatic refetch on success */
  skipRefetch?: boolean;
  /** Show toast on error (default: true) */
  showErrorToast?: boolean;
}

/**
 * Return type for simple optimistic mutation
 */
export interface SimpleOptimisticReturn<TData, TVariables> {
  /** Execute mutation without waiting */
  mutate: (variables: TVariables) => void;
  /** Execute mutation and return promise */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Whether mutation is in progress */
  isPending: boolean;
  /** Whether mutation is idle */
  isIdle: boolean;
  /** Whether mutation succeeded */
  isSuccess: boolean;
  /** Whether mutation failed */
  isError: boolean;
  /** Error if failed */
  error: Error | null;
  /** Last mutation result data */
  data: TData | undefined;
  /** Reset mutation state */
  reset: () => void;
  /** Variables from last mutation */
  variables: TVariables | undefined;
}

/**
 * Simple, TanStack Query-native optimistic mutation hook
 *
 * Provides a streamlined API for optimistic updates that works directly
 * with TanStack Query's cache. Automatically handles rollback on error
 * and cache invalidation on success.
 *
 * @example
 * ```typescript
 * // Add item to list
 * const addMutation = useSimpleOptimisticMutation({
 *   mutationFn: createMeeting,
 *   queryKey: ['meetings'],
 *   optimisticUpdate: (old, newMeeting) => [...(old ?? []), newMeeting],
 * });
 *
 * // Update item in list
 * const updateMutation = useSimpleOptimisticMutation({
 *   mutationFn: updateMeeting,
 *   queryKey: ['meetings'],
 *   optimisticUpdate: (old, updated) =>
 *     old?.map(m => m.id === updated.id ? { ...m, ...updated } : m) ?? [],
 * });
 *
 * // Delete item from list
 * const deleteMutation = useSimpleOptimisticMutation({
 *   mutationFn: deleteMeeting,
 *   queryKey: ['meetings'],
 *   optimisticUpdate: (old, { id }) => old?.filter(m => m.id !== id) ?? [],
 * });
 * ```
 */
export function useSimpleOptimisticMutation<TData, TVariables, TError = Error>(
  options: SimpleOptimisticOptions<TData, TVariables, TError>
): SimpleOptimisticReturn<TData, TVariables> {
  const {
    mutationFn,
    queryKey,
    optimisticUpdate,
    onSuccess,
    onError,
    onSettled,
    invalidateKeys,
    skipRefetch = false,
    showErrorToast = true,
  } = options;

  const queryClient = useQueryClient();
  const toast = useToast();

  const [status, setStatus] = useState<MutationStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);
  const [variables, setVariables] = useState<TVariables | undefined>(undefined);

  const previousDataRef = useRef<TData | undefined>(undefined);

  const mutateAsync = useCallback(
    async (vars: TVariables): Promise<TData> => {
      setStatus('pending');
      setError(null);
      setVariables(vars);

      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKey as unknown[] });

      // Snapshot previous data for rollback
      previousDataRef.current = queryClient.getQueryData<TData>(queryKey as unknown[]);

      // Apply optimistic update
      queryClient.setQueryData<TData>(queryKey as unknown[], (old) =>
        optimisticUpdate(old, vars)
      );

      try {
        // Execute mutation
        const result = await mutationFn(vars);

        setData(result);
        setStatus('success');

        // Callback
        onSuccess?.(result, vars);
        onSettled?.(result, null, vars);

        // Invalidate queries
        if (!skipRefetch) {
          queryClient.invalidateQueries({ queryKey: queryKey as unknown[] });
        }
        if (invalidateKeys) {
          for (const key of invalidateKeys) {
            queryClient.invalidateQueries({ queryKey: key as unknown[] });
          }
        }

        return result;
      } catch (err) {
        const mutationError = err instanceof Error ? err : new Error(String(err));

        // Rollback to previous data
        if (previousDataRef.current !== undefined) {
          queryClient.setQueryData(queryKey as unknown[], previousDataRef.current);
        }

        setError(mutationError);
        setStatus('error');

        // Show error toast
        if (showErrorToast) {
          toast.error('Action failed', mutationError.message);
        }

        // Callbacks
        onError?.(mutationError as TError, vars);
        onSettled?.(undefined, mutationError as TError, vars);

        throw mutationError;
      }
    },
    [
      mutationFn,
      queryKey,
      optimisticUpdate,
      onSuccess,
      onError,
      onSettled,
      invalidateKeys,
      skipRefetch,
      showErrorToast,
      queryClient,
      toast,
    ]
  );

  const mutate = useCallback(
    (vars: TVariables) => {
      mutateAsync(vars).catch(() => {
        // Error already handled
      });
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setData(undefined);
    setVariables(undefined);
    previousDataRef.current = undefined;
  }, []);

  return {
    mutate,
    mutateAsync,
    isPending: status === 'pending',
    isIdle: status === 'idle',
    isSuccess: status === 'success',
    isError: status === 'error',
    error,
    data,
    reset,
    variables,
  };
}

export default useOptimisticMutation;
