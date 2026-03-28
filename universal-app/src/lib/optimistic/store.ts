/**
 * Optimistic Update Store
 * 
 * Manages pending optimistic updates with rollback support,
 * conflict detection, and persistence.
 * 
 * @module lib/optimistic/store
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  OptimisticUpdate,
  OptimisticUpdateStatus,
  OptimisticConflict,
  OptimisticConfig,
  OptimisticStoreState,
  OptimisticStoreActions,
  RollbackContext,
  RollbackFn,
  ConflictType,
  ConflictResolutionStrategy,
  DEFAULT_OPTIMISTIC_CONFIG,
} from './types';

// ============================================================================
// ID Generation
// ============================================================================

let updateCounter = 0;

function generateUpdateId(): string {
  return `opt_${Date.now()}_${++updateCounter}_${Math.random().toString(36).substring(2, 7)}`;
}

// ============================================================================
// Store Interface
// ============================================================================

interface OptimisticStore extends OptimisticStoreState, OptimisticStoreActions {
  config: OptimisticConfig;
  setConfig: (config: Partial<OptimisticConfig>) => void;
  rollbackHandlers: Map<string, RollbackFn>;
  registerRollbackHandler: (entityType: string, handler: RollbackFn) => void;
  unregisterRollbackHandler: (entityType: string) => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useOptimisticStore = create<OptimisticStore>()(
  persist(
    (set, get) => ({
      // State
      updates: new Map(),
      byEntityType: new Map(),
      byEntityId: new Map(),
      conflicts: [],
      isSyncing: false,
      lastSyncAt: 0,
      pendingCount: 0,
      config: DEFAULT_OPTIMISTIC_CONFIG,
      rollbackHandlers: new Map(),

      // Config
      setConfig: (config) =>
        set((state) => ({
          config: { ...state.config, ...config },
        })),

      // Rollback handlers
      registerRollbackHandler: (entityType, handler) => {
        const handlers = get().rollbackHandlers;
        handlers.set(entityType, handler);
        set({ rollbackHandlers: new Map(handlers) });
      },

      unregisterRollbackHandler: (entityType) => {
        const handlers = get().rollbackHandlers;
        handlers.delete(entityType);
        set({ rollbackHandlers: new Map(handlers) });
      },

      // Add update
      addUpdate: <T>(
        partial: Omit<OptimisticUpdate<T>, 'id' | 'createdAt' | 'updatedAt' | 'status'>
      ): string => {
        const id = generateUpdateId();
        const now = Date.now();
        const update: OptimisticUpdate<T> = {
          ...partial,
          id,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          retryCount: 0,
        };

        set((state) => {
          const updates = new Map(state.updates);
          updates.set(id, update as OptimisticUpdate);

          const byEntityType = new Map(state.byEntityType);
          const typeSet = byEntityType.get(update.entityType) || new Set();
          typeSet.add(id);
          byEntityType.set(update.entityType, typeSet);

          const byEntityId = new Map(state.byEntityId);
          if (update.entityId) {
            const entitySet = byEntityId.get(update.entityId) || new Set();
            entitySet.add(id);
            byEntityId.set(update.entityId, entitySet);
          }

          return {
            updates,
            byEntityType,
            byEntityId,
            pendingCount: state.pendingCount + 1,
          };
        });

        return id;
      },

      // Update status
      updateStatus: (id, status, error) =>
        set((state) => {
          const updates = new Map(state.updates);
          const existing = updates.get(id);
          if (!existing) return state;

          const updated: OptimisticUpdate = {
            ...existing,
            status,
            updatedAt: Date.now(),
            errorMessage: error?.message,
            retryCount:
              status === 'syncing' ? existing.retryCount + 1 : existing.retryCount,
          };
          updates.set(id, updated);

          const pendingDelta =
            existing.status === 'pending' && status !== 'pending' ? -1 : 0;

          return {
            updates,
            pendingCount: state.pendingCount + pendingDelta,
          };
        }),

      // Remove update
      removeUpdate: (id) =>
        set((state) => {
          const updates = new Map(state.updates);
          const existing = updates.get(id);
          if (!existing) return state;

          updates.delete(id);

          const byEntityType = new Map(state.byEntityType);
          const typeSet = byEntityType.get(existing.entityType);
          if (typeSet) {
            typeSet.delete(id);
            if (typeSet.size === 0) {
              byEntityType.delete(existing.entityType);
            }
          }

          const byEntityId = new Map(state.byEntityId);
          if (existing.entityId) {
            const entitySet = byEntityId.get(existing.entityId);
            if (entitySet) {
              entitySet.delete(id);
              if (entitySet.size === 0) {
                byEntityId.delete(existing.entityId);
              }
            }
          }

          const pendingDelta = existing.status === 'pending' ? -1 : 0;

          return {
            updates,
            byEntityType,
            byEntityId,
            pendingCount: state.pendingCount + pendingDelta,
          };
        }),

      // Rollback
      rollback: async <T>(id: string, context?: Partial<RollbackContext>) => {
        const state = get();
        const update = state.updates.get(id) as OptimisticUpdate<T> | undefined;
        if (!update) return;

        const rollbackContext: RollbackContext = {
          error: new Error(update.errorMessage || 'Rollback requested'),
          isAutomatic: context?.isAutomatic ?? false,
          isOffline: context?.isOffline ?? !navigator.onLine,
        };

        // Execute registered rollback handler
        const handler = state.rollbackHandlers.get(update.entityType);
        if (handler) {
          try {
            await handler(update, rollbackContext);
          } catch (err) {
            console.error('Rollback handler failed:', err);
          }
        }

        // Update status to rolled back
        get().updateStatus(id, 'rolledBack');

        // Remove after a short delay
        setTimeout(() => {
          get().removeUpdate(id);
        }, 1000);
      },

      // Rollback entity
      rollbackEntity: async (entityId) => {
        const state = get();
        const updateIds = state.byEntityId.get(entityId);
        if (!updateIds) return;

        await Promise.all(
          Array.from(updateIds).map((id) =>
            get().rollback(id, { isAutomatic: true })
          )
        );
      },

      // Clear all
      clear: () =>
        set({
          updates: new Map(),
          byEntityType: new Map(),
          byEntityId: new Map(),
          conflicts: [],
          pendingCount: 0,
        }),

      // Get updates for entity
      getUpdatesForEntity: <T>(entityId: string): OptimisticUpdate<T>[] => {
        const state = get();
        const updateIds = state.byEntityId.get(entityId);
        if (!updateIds) return [];

        return Array.from(updateIds)
          .map((id) => state.updates.get(id) as OptimisticUpdate<T>)
          .filter(Boolean)
          .sort((a, b) => a.createdAt - b.createdAt);
      },

      // Get updates by type
      getUpdatesByType: <T>(entityType: string): OptimisticUpdate<T>[] => {
        const state = get();
        const updateIds = state.byEntityType.get(entityType);
        if (!updateIds) return [];

        return Array.from(updateIds)
          .map((id) => state.updates.get(id) as OptimisticUpdate<T>)
          .filter(Boolean)
          .sort((a, b) => a.createdAt - b.createdAt);
      },

      // Check conflicts
      checkConflicts: <T>(
        update: OptimisticUpdate<T>,
        serverData: T
      ): OptimisticConflict<T> | null => {
        const config = get().config;
        if (!config.detectConflicts) return null;

        // Simple timestamp-based conflict detection
        if (
          update.previousData &&
          JSON.stringify(update.previousData) !== JSON.stringify(serverData)
        ) {
          return {
            type: 'server_modified' as ConflictType,
            update,
            serverVersion: serverData,
            localVersion: update.data,
            suggestedResolution: 'manual',
          };
        }

        return null;
      },

      // Resolve conflict
      resolveConflict: <T>(
        _conflictId: string,
        resolution: ConflictResolutionStrategy,
        mergedData?: T
      ) => {
        set((state) => {
          const conflicts = state.conflicts.filter(
            (c) => c.update.id !== _conflictId
          );

          // If resolution involves keeping local, confirm the update
          if (resolution === 'local_wins' || resolution === 'merge') {
            const update = state.updates.get(_conflictId);
            if (update) {
              const updates = new Map(state.updates);
              updates.set(_conflictId, {
                ...update,
                data: mergedData ?? update.data,
                status: 'confirmed',
                updatedAt: Date.now(),
              });
              return { conflicts, updates };
            }
          }

          return { conflicts };
        });
      },
    }),
    {
      name: 'optimistic-updates',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential data
        updates: Array.from(state.updates.entries()),
        pendingCount: state.pendingCount,
      }),
      onRehydrateStorage: () => (state) => {
        // Rebuild Maps from persisted arrays
        if (state && Array.isArray(state.updates)) {
          const updates = new Map(state.updates as [string, OptimisticUpdate][]);
          const byEntityType = new Map<string, Set<string>>();
          const byEntityId = new Map<string, Set<string>>();

          updates.forEach((update, id) => {
            const typeSet = byEntityType.get(update.entityType) || new Set();
            typeSet.add(id);
            byEntityType.set(update.entityType, typeSet);

            if (update.entityId) {
              const entitySet = byEntityId.get(update.entityId) || new Set();
              entitySet.add(id);
              byEntityId.set(update.entityId, entitySet);
            }
          });

          state.updates = updates;
          state.byEntityType = byEntityType;
          state.byEntityId = byEntityId;
        }
      },
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectPendingCount = (state: OptimisticStore) => state.pendingCount;

export const selectIsSyncing = (state: OptimisticStore) => state.isSyncing;

export const selectConflicts = (state: OptimisticStore) => state.conflicts;

export const selectPendingUpdates = (state: OptimisticStore) =>
  Array.from(state.updates.values()).filter((u) => u.status === 'pending');

export const selectUpdatesByEntity = (entityId: string) => (state: OptimisticStore) =>
  state.getUpdatesForEntity(entityId);

export const selectUpdatesByType = (entityType: string) => (state: OptimisticStore) =>
  state.getUpdatesByType(entityType);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  retryCount: number,
  config: OptimisticConfig = DEFAULT_OPTIMISTIC_CONFIG
): number {
  const delay = config.retryBaseDelay * Math.pow(2, retryCount);
  return Math.min(delay, config.retryMaxDelay);
}

/**
 * Check if update should be retried
 */
export function shouldRetry(
  update: OptimisticUpdate,
  config: OptimisticConfig = DEFAULT_OPTIMISTIC_CONFIG
): boolean {
  return (
    update.status === 'failed' &&
    update.retryCount < config.maxRetries
  );
}

/**
 * Get all pending updates for a list of entities
 */
export function getPendingUpdatesForEntities(
  entityIds: string[]
): OptimisticUpdate[] {
  const store = useOptimisticStore.getState();
  return entityIds.flatMap((id) => store.getUpdatesForEntity(id));
}

/**
 * Clear old completed updates (garbage collection)
 */
export function clearCompletedUpdates(maxAge: number = 60000): void {
  const store = useOptimisticStore.getState();
  const now = Date.now();

  store.updates.forEach((update, id) => {
    if (
      (update.status === 'confirmed' || update.status === 'rolledBack') &&
      now - update.updatedAt > maxAge
    ) {
      store.removeUpdate(id);
    }
  });
}
