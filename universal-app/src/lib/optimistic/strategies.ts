/**
 * Optimistic Update Strategies
 * 
 * Provides strategies for different types of optimistic operations
 * including create, update, delete, and merge strategies.
 * 
 * @module lib/optimistic/strategies
 */

import {
  OptimisticUpdate,
  OptimisticOperationType,
  MergeStrategy,
  MergeFn,
  MergeConfig,
} from './types';
import { useOptimisticStore } from './store';

// ============================================================================
// Generate ID for optimistic creates
// ============================================================================

/**
 * Generate a temporary ID for optimistic creates
 */
export function generateOptimisticId(prefix: string = 'temp'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if an ID is an optimistic/temporary ID
 */
export function isOptimisticId(id: string): boolean {
  return id.startsWith('temp_') || id.startsWith('opt_');
}

// ============================================================================
// Create Strategy
// ============================================================================

export interface CreateOptimisticallyOptions<T> {
  /** Entity type */
  entityType: string;
  /** Data to create */
  data: T;
  /** Generate temporary ID */
  generateId?: () => string;
  /** Transform data for optimistic display */
  transform?: (data: T, tempId: string) => T;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Apply an optimistic create operation
 */
export function createOptimistically<T extends { id?: string }>(
  options: CreateOptimisticallyOptions<T>
): { updateId: string; optimisticData: T } {
  const {
    entityType,
    data,
    generateId = () => generateOptimisticId(entityType),
    transform,
    meta,
  } = options;

  const store = useOptimisticStore.getState();
  const tempId = generateId();

  // Apply transform or add ID directly
  const optimisticData: T = transform
    ? transform(data, tempId)
    : { ...data, id: tempId };

  const updateId = store.addUpdate({
    type: 'create',
    entityType,
    entityId: tempId,
    data: optimisticData,
    previousData: undefined,
    retryCount: 0,
    meta: { ...meta, isCreate: true, tempId },
  });

  return { updateId, optimisticData };
}

// ============================================================================
// Update Strategy
// ============================================================================

export interface UpdateOptimisticallyOptions<T> {
  /** Entity type */
  entityType: string;
  /** Entity ID being updated */
  entityId: string;
  /** New data */
  data: T;
  /** Previous data for rollback */
  previousData: T;
  /** Merge strategy for partial updates */
  merge?: boolean;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Apply an optimistic update operation
 */
export function updateOptimistically<T>(
  options: UpdateOptimisticallyOptions<T>
): { updateId: string; optimisticData: T } {
  const {
    entityType,
    entityId,
    data,
    previousData,
    merge = true,
    meta,
  } = options;

  const store = useOptimisticStore.getState();

  // Merge with previous data if requested
  const optimisticData: T = merge && typeof data === 'object' && typeof previousData === 'object'
    ? { ...previousData, ...data }
    : data;

  const updateId = store.addUpdate({
    type: 'update',
    entityType,
    entityId,
    data: optimisticData,
    previousData,
    retryCount: 0,
    meta,
  });

  return { updateId, optimisticData };
}

// ============================================================================
// Delete Strategy
// ============================================================================

export interface DeleteOptimisticallyOptions<T> {
  /** Entity type */
  entityType: string;
  /** Entity ID being deleted */
  entityId: string;
  /** Previous data for rollback */
  previousData: T;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Apply an optimistic delete operation
 */
export function deleteOptimistically<T>(
  options: DeleteOptimisticallyOptions<T>
): { updateId: string } {
  const { entityType, entityId, previousData, meta } = options;

  const store = useOptimisticStore.getState();

  const updateId = store.addUpdate({
    type: 'delete',
    entityType,
    entityId,
    data: null as unknown as T, // For deletes, data is null/undefined
    previousData,
    retryCount: 0,
    meta: { ...meta, isDelete: true },
  });

  return { updateId };
}

// ============================================================================
// Batch Strategy
// ============================================================================

export interface BatchOperation<T> {
  type: OptimisticOperationType;
  entityId?: string;
  data: T;
  previousData?: T;
}

export interface BatchOptimisticallyOptions<T> {
  /** Entity type */
  entityType: string;
  /** Operations to perform */
  operations: BatchOperation<T>[];
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Apply multiple optimistic operations as a batch
 */
export function batchOptimistically<T>(
  options: BatchOptimisticallyOptions<T>
): { updateIds: string[]; optimisticResults: Array<{ data: T; updateId: string }> } {
  const { entityType, operations, meta } = options;
  const updateIds: string[] = [];
  const optimisticResults: Array<{ data: T; updateId: string }> = [];

  for (const op of operations) {
    let result: { updateId: string; optimisticData?: T };

    switch (op.type) {
      case 'create':
        result = createOptimistically({
          entityType,
          data: op.data,
          meta,
        });
        optimisticResults.push({ data: result.optimisticData!, updateId: result.updateId });
        break;

      case 'update':
        if (!op.entityId || !op.previousData) {
          throw new Error('Update operations require entityId and previousData');
        }
        result = updateOptimistically({
          entityType,
          entityId: op.entityId,
          data: op.data,
          previousData: op.previousData,
          meta,
        });
        optimisticResults.push({ data: result.optimisticData!, updateId: result.updateId });
        break;

      case 'delete':
        if (!op.entityId || !op.previousData) {
          throw new Error('Delete operations require entityId and previousData');
        }
        result = deleteOptimistically({
          entityType,
          entityId: op.entityId,
          previousData: op.previousData,
          meta,
        });
        optimisticResults.push({ data: op.previousData, updateId: result.updateId });
        break;

      default:
        continue;
    }

    updateIds.push(result.updateId);
  }

  return { updateIds, optimisticResults };
}

// ============================================================================
// Merge Strategies
// ============================================================================

/**
 * Shallow merge two objects
 */
export function shallowMerge<T extends object>(local: T, server: T): T {
  return { ...server, ...local };
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends object>(local: T, server: T): T {
  const result = { ...server };

  for (const key in local) {
    const localValue = local[key];
    const serverValue = server[key];

    if (
      typeof localValue === 'object' &&
      localValue !== null &&
      !Array.isArray(localValue) &&
      typeof serverValue === 'object' &&
      serverValue !== null &&
      !Array.isArray(serverValue)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        localValue as object,
        serverValue as object
      );
    } else {
      (result as Record<string, unknown>)[key] = localValue;
    }
  }

  return result;
}

/**
 * Concatenate arrays
 */
export function arrayConcat<T>(local: T[], server: T[]): T[] {
  return [...server, ...local];
}

/**
 * Union arrays (no duplicates by ID)
 */
export function arrayUnion<T extends { id: string }>(local: T[], server: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  // Local items take precedence
  for (const item of local) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }

  // Add server items that aren't in local
  for (const item of server) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }

  return result;
}

/**
 * Get merge function for strategy
 */
export function getMergeFn<T>(config: MergeConfig<T>): MergeFn<T> {
  switch (config.strategy) {
    case 'shallow_merge':
      return shallowMerge as MergeFn<T>;
    case 'deep_merge':
      return deepMerge as MergeFn<T>;
    case 'array_concat':
      return arrayConcat as unknown as MergeFn<T>;
    case 'array_union':
      return arrayUnion as unknown as MergeFn<T>;
    case 'custom':
      if (!config.customMerge) {
        throw new Error('Custom merge function required for custom strategy');
      }
      return config.customMerge;
    default:
      return shallowMerge as MergeFn<T>;
  }
}

/**
 * Apply merge with field exclusions
 */
export function applyMergeConfig<T extends object>(
  local: T,
  server: T,
  config: MergeConfig<T>
): T {
  const mergeFn = getMergeFn(config);
  let result = mergeFn(local, server);

  // Apply server-only fields
  if (config.serverOnlyFields) {
    for (const field of config.serverOnlyFields) {
      if (field in server) {
        (result as Record<string, unknown>)[field] = (server as Record<string, unknown>)[field];
      }
    }
  }

  // Apply local-only fields
  if (config.localOnlyFields) {
    for (const field of config.localOnlyFields) {
      if (field in local) {
        (result as Record<string, unknown>)[field] = (local as Record<string, unknown>)[field];
      }
    }
  }

  // Remove excluded fields (keep from server)
  if (config.excludeFields) {
    for (const field of config.excludeFields) {
      if (field in server) {
        (result as Record<string, unknown>)[field] = (server as Record<string, unknown>)[field];
      }
    }
  }

  return result;
}

// ============================================================================
// Apply Optimistic Updates to Data
// ============================================================================

/**
 * Apply pending optimistic updates to server data
 */
export function applyOptimisticUpdates<T extends { id: string }>(
  serverData: T[],
  entityType: string
): T[] {
  const store = useOptimisticStore.getState();
  const updates = store.getUpdatesByType<T>(entityType);

  if (updates.length === 0) {
    return serverData;
  }

  // Create a map of server data by ID
  const dataMap = new Map(serverData.map((item) => [item.id, item]));

  // Apply each update
  for (const update of updates) {
    if (update.status === 'rolledBack' || update.status === 'failed') {
      continue;
    }

    switch (update.type) {
      case 'create':
        if (update.data && (update.data as T).id) {
          dataMap.set((update.data as T).id, update.data as T);
        }
        break;

      case 'update':
        if (update.entityId && update.data) {
          const existing = dataMap.get(update.entityId);
          if (existing) {
            dataMap.set(update.entityId, { ...existing, ...(update.data as T) });
          }
        }
        break;

      case 'delete':
        if (update.entityId) {
          dataMap.delete(update.entityId);
        }
        break;
    }
  }

  return Array.from(dataMap.values());
}

/**
 * Apply optimistic update to single item
 */
export function applyOptimisticUpdate<T extends { id: string }>(
  serverData: T | undefined,
  entityType: string,
  entityId: string
): T | undefined {
  const store = useOptimisticStore.getState();
  const updates = store.getUpdatesForEntity<T>(entityId);

  if (updates.length === 0) {
    return serverData;
  }

  let result = serverData;

  for (const update of updates) {
    if (update.status === 'rolledBack' || update.status === 'failed') {
      continue;
    }

    if (update.entityType !== entityType) {
      continue;
    }

    switch (update.type) {
      case 'create':
      case 'update':
        if (update.data) {
          result = result
            ? { ...result, ...(update.data as T) }
            : (update.data as T);
        }
        break;

      case 'delete':
        result = undefined;
        break;
    }
  }

  return result;
}

// ============================================================================
// Confirm/Fail Updates
// ============================================================================

/**
 * Confirm an optimistic update succeeded
 */
export function confirmOptimisticUpdate(
  updateId: string,
  serverData?: unknown,
  options?: { updateEntityId?: string }
): void {
  const store = useOptimisticStore.getState();
  const update = store.updates.get(updateId);

  if (!update) return;

  // If this was a create with temp ID, update the entity ID mapping
  if (
    update.type === 'create' &&
    options?.updateEntityId &&
    update.meta?.tempId
  ) {
    // Remove from old entity ID index
    const byEntityId = new Map(store.byEntityId);
    const oldSet = byEntityId.get(update.meta.tempId as string);
    if (oldSet) {
      oldSet.delete(updateId);
      if (oldSet.size === 0) {
        byEntityId.delete(update.meta.tempId as string);
      }
    }

    // Add to new entity ID index
    const newSet = byEntityId.get(options.updateEntityId) || new Set();
    newSet.add(updateId);
    byEntityId.set(options.updateEntityId, newSet);
  }

  store.updateStatus(updateId, 'confirmed');

  // Remove confirmed update after short delay
  setTimeout(() => {
    store.removeUpdate(updateId);
  }, 2000);
}

/**
 * Mark an optimistic update as failed
 */
export function failOptimisticUpdate(
  updateId: string,
  error: Error,
  options?: { autoRollback?: boolean }
): void {
  const store = useOptimisticStore.getState();
  
  store.updateStatus(updateId, 'failed', error);

  if (options?.autoRollback !== false) {
    store.rollback(updateId, { isAutomatic: true });
  }
}
