'use client';

import { useCallback, useMemo, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import {
  OptimisticUpdate,
  OptimisticConflict,
  UseOptimisticOptions,
  UseOptimisticReturn,
  ConflictResolutionStrategy,
  RollbackContext,
  MergeConfig,
} from '@/lib/optimistic/types';
import {
  useOptimisticStore,
  selectUpdatesByType,
} from '@/lib/optimistic/store';
import {
  createOptimistically,
  updateOptimistically,
  applyMergeConfig,
} from '@/lib/optimistic/strategies';

/**
 * Generic hook for optimistic updates
 * 
 * @example
 * ```tsx
 * const { apply, pending, rollback } = useOptimistic<Minute>({
 *   entityType: 'minute',
 *   onRollback: (update) => {
 *     // Handle rollback (e.g., refetch data)
 *   },
 * });
 * 
 * // Apply optimistic update
 * const updateId = apply(newMinute, previousMinute);
 * 
 * // On success
 * confirm(updateId, serverResponse);
 * 
 * // On failure
 * fail(updateId, new Error('Failed to save'));
 * ```
 */
export function useOptimistic<T extends { id?: string }>(
  options: UseOptimisticOptions<T>
): UseOptimisticReturn<T> {
  const {
    entityType,
    onRollback,
    onConfirm,
    onConflict,
    mergeConfig,
    config,
  } = options;

  const toast = useToast();
  const store = useOptimisticStore();

  // Get pending updates for this entity type
  const allUpdates = useOptimisticStore(selectUpdatesByType(entityType)) as OptimisticUpdate<T>[];
  
  const pending = useMemo(
    () => allUpdates.filter((u) => u.status === 'pending' || u.status === 'syncing'),
    [allUpdates]
  );

  const isSyncing = useMemo(
    () => allUpdates.some((u) => u.status === 'syncing'),
    [allUpdates]
  );

  const conflicts = useMemo(
    () => store.conflicts.filter((c: OptimisticConflict) => c.update.entityType === entityType) as OptimisticConflict<T>[],
    [store.conflicts, entityType]
  );

  // Register rollback handler
  useEffect(() => {
    if (onRollback) {
      store.registerRollbackHandler(entityType, async (update: OptimisticUpdate, context: RollbackContext) => {
        await onRollback(update as OptimisticUpdate<T>, context);
        
        // Show toast if configured
        if (config?.toastOnRollback !== false) {
          toast.warning(
            'Change rolled back',
            update.errorMessage || 'The change could not be saved'
          );
        }
      });

      return () => {
        store.unregisterRollbackHandler(entityType);
      };
    }
  }, [entityType, onRollback, store, toast, config?.toastOnRollback]);

  // Apply optimistic update
  const apply = useCallback(
    (data: T, previousData?: T, meta?: Record<string, unknown>): string => {
      // Determine if this is a create or update
      const isCreate = !data.id || data.id.startsWith('temp_');

      if (isCreate) {
        const { updateId } = createOptimistically({
          entityType,
          data,
          meta,
        });
        return updateId;
      } else {
        const { updateId } = updateOptimistically({
          entityType,
          entityId: data.id!,
          data,
          previousData: previousData as T,
          meta,
        });
        return updateId;
      }
    },
    [entityType]
  );

  // Confirm update
  const confirm = useCallback(
    (updateId: string, serverData: T) => {
      const update = store.updates.get(updateId) as OptimisticUpdate<T> | undefined;
      if (!update) return;

      // Check for conflicts if config enables it
      if (config?.detectConflicts !== false) {
        const conflict = store.checkConflicts(update, serverData);
        if (conflict) {
          // Ask consumer how to resolve
          if (onConflict) {
            const resolution = onConflict(conflict as OptimisticConflict<T>);
            store.resolveConflict(updateId, resolution);
          }
          return;
        }
      }

      store.updateStatus(updateId, 'confirmed');
      
      if (onConfirm) {
        onConfirm(update, serverData);
      }

      // Clean up after delay
      setTimeout(() => {
        store.removeUpdate(updateId);
      }, 2000);
    },
    [store, config?.detectConflicts, onConflict, onConfirm]
  );

  // Fail update
  const fail = useCallback(
    (updateId: string, error: Error) => {
      store.updateStatus(updateId, 'failed', error);
      
      // Show toast if configured
      if (config?.toastOnError !== false) {
        toast.error('Failed to save', error.message);
      }

      // Auto rollback
      const rollbackContext: RollbackContext = {
        error,
        isAutomatic: true,
        isOffline: !navigator.onLine,
      };
      store.rollback(updateId, rollbackContext);
    },
    [store, toast, config?.toastOnError]
  );

  // Manual rollback
  const rollback = useCallback(
    async (updateId: string) => {
      await store.rollback(updateId, { isAutomatic: false });
    },
    [store]
  );

  // Rollback all pending
  const rollbackAll = useCallback(async () => {
    await Promise.all(
      pending.map((update) => store.rollback(update.id, { isAutomatic: false }))
    );
  }, [pending, store]);

  // Resolve conflict
  const resolveConflict = useCallback(
    (conflictId: string, resolution: ConflictResolutionStrategy, mergedData?: T) => {
      store.resolveConflict(conflictId, resolution, mergedData);
    },
    [store]
  );

  // Get merged data
  const getMergedData = useCallback(
    (serverData: T): T => {
      // Find relevant pending updates
      const entityId = serverData.id;
      if (!entityId) return serverData;

      const entityUpdates = store.getUpdatesForEntity<T>(entityId);
      if (entityUpdates.length === 0) return serverData;

      // Get the most recent pending update
      const latestUpdate = entityUpdates
        .filter((u: OptimisticUpdate<T>) => u.status === 'pending' || u.status === 'syncing')
        .sort((a: OptimisticUpdate<T>, b: OptimisticUpdate<T>) => b.createdAt - a.createdAt)[0];

      if (!latestUpdate) return serverData;

      // Apply merge config if provided
      if (mergeConfig && typeof serverData === 'object') {
        return applyMergeConfig(
          latestUpdate.data as object,
          serverData as object,
          mergeConfig as unknown as MergeConfig<object>
        ) as T;
      }

      // Default shallow merge
      return { ...serverData, ...(latestUpdate.data as T) };
    },
    [store, mergeConfig]
  );

  return {
    pending,
    isSyncing,
    conflicts,
    apply,
    confirm,
    fail,
    rollback,
    rollbackAll,
    resolveConflict,
    getMergedData,
  };
}

export default useOptimistic;
