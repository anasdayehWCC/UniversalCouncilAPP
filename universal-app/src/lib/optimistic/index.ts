/**
 * Optimistic Updates Module
 * 
 * Provides utilities for implementing optimistic UI updates
 * with automatic rollback, conflict detection, and offline support.
 * 
 * @module lib/optimistic
 */

// Types
export type {
  OptimisticUpdate,
  OptimisticUpdateStatus,
  OptimisticOperationType,
  OptimisticConfig,
  OptimisticConflict,
  OptimisticStoreState,
  OptimisticStoreActions,
  RollbackFn,
  RollbackContext,
  UpdateResult,
  BatchUpdateResult,
  ConflictType,
  ConflictResolutionStrategy,
  MergeFn,
  MergeStrategy,
  MergeConfig,
  UseOptimisticOptions,
  UseOptimisticReturn,
  UseOptimisticMutationOptions,
  UseOptimisticMutationReturn,
} from './types';

export { DEFAULT_OPTIMISTIC_CONFIG } from './types';

// Store
export {
  useOptimisticStore,
  selectPendingCount,
  selectIsSyncing,
  selectConflicts,
  selectPendingUpdates,
  selectUpdatesByEntity,
  selectUpdatesByType,
  calculateRetryDelay,
  shouldRetry,
  getPendingUpdatesForEntities,
  clearCompletedUpdates,
} from './store';

// Strategies
export {
  generateOptimisticId,
  isOptimisticId,
  createOptimistically,
  updateOptimistically,
  deleteOptimistically,
  batchOptimistically,
  shallowMerge,
  deepMerge,
  arrayConcat,
  arrayUnion,
  getMergeFn,
  applyMergeConfig,
  applyOptimisticUpdates,
  applyOptimisticUpdate,
  confirmOptimisticUpdate,
  failOptimisticUpdate,
} from './strategies';

export type {
  CreateOptimisticallyOptions,
  UpdateOptimisticallyOptions,
  DeleteOptimisticallyOptions,
  BatchOperation,
  BatchOptimisticallyOptions,
} from './strategies';

// Query Helpers (TanStack Query native patterns)
export {
  createOptimisticHandlers,
  createAddToListUpdate,
  createUpdateInListUpdate,
  createRemoveFromListUpdate,
  createToggleFieldUpdate,
  createReorderUpdate,
  createMultiQueryOptimisticHandlers,
  batchOptimisticUpdates,
  rollbackOptimisticUpdates,
  createQueryKey,
  generateTempId,
  isTempId,
  replaceTempId,
} from './query-helpers';

export type {
  OptimisticUpdateFn,
  OptimisticContext,
  SimpleOptimisticMutationOptions,
  OptimisticMutationSetup,
  MultiQueryOptimisticOptions,
  MultiQueryContext,
} from './query-helpers';
