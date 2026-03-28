/**
 * Optimistic Update Types
 * 
 * Type definitions for optimistic updates, enabling instant UI feedback
 * while mutations are processed in the background.
 * 
 * @module lib/optimistic/types
 */

// ============================================================================
// Update Status
// ============================================================================

/**
 * Status of an optimistic update
 */
export type OptimisticUpdateStatus = 
  | 'pending'     // Applied locally, awaiting server confirmation
  | 'syncing'     // Currently syncing with server
  | 'confirmed'   // Server confirmed the change
  | 'failed'      // Server rejected, needs rollback
  | 'rolledBack'; // Successfully rolled back

/**
 * Category of optimistic operation
 */
export type OptimisticOperationType = 
  | 'create'
  | 'update'
  | 'delete'
  | 'batch';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Represents a single optimistic update
 */
export interface OptimisticUpdate<T = unknown> {
  /** Unique identifier for this update */
  id: string;
  /** Type of operation being performed */
  type: OptimisticOperationType;
  /** Entity type being modified (e.g., 'minute', 'review', 'favorite') */
  entityType: string;
  /** ID of the entity being modified (undefined for creates) */
  entityId?: string;
  /** The optimistically applied data */
  data: T;
  /** Original data before the update (for rollback) */
  previousData?: T;
  /** Current status of the update */
  status: OptimisticUpdateStatus;
  /** Timestamp when update was created */
  createdAt: number;
  /** Timestamp of last status change */
  updatedAt: number;
  /** Number of retry attempts */
  retryCount: number;
  /** Error message if failed */
  errorMessage?: string;
  /** Request ID for correlation */
  requestId?: string;
  /** Custom metadata */
  meta?: Record<string, unknown>;
}

/**
 * Function to rollback an optimistic update
 */
export type RollbackFn<T = unknown> = (
  update: OptimisticUpdate<T>,
  context: RollbackContext
) => void | Promise<void>;

/**
 * Context provided during rollback
 */
export interface RollbackContext {
  /** The error that triggered the rollback */
  error: Error;
  /** Whether this is an automatic rollback */
  isAutomatic: boolean;
  /** Whether offline mode is active */
  isOffline: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for optimistic update behavior
 */
export interface OptimisticConfig {
  /** Maximum number of pending updates per entity type */
  maxPendingPerType: number;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay for exponential backoff (ms) */
  retryBaseDelay: number;
  /** Maximum retry delay (ms) */
  retryMaxDelay: number;
  /** Whether to show toast on rollback */
  toastOnRollback: boolean;
  /** Whether to show toast on error */
  toastOnError: boolean;
  /** Timeout for sync operations (ms) */
  syncTimeout: number;
  /** Whether to persist pending updates */
  persistUpdates: boolean;
  /** Debounce interval for batched updates (ms) */
  batchDebounceMs: number;
  /** Enable conflict detection */
  detectConflicts: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_OPTIMISTIC_CONFIG: OptimisticConfig = {
  maxPendingPerType: 100,
  maxRetries: 3,
  retryBaseDelay: 500,
  retryMaxDelay: 10000,
  toastOnRollback: true,
  toastOnError: true,
  syncTimeout: 30000,
  persistUpdates: true,
  batchDebounceMs: 100,
  detectConflicts: true,
};

// ============================================================================
// Results
// ============================================================================

/**
 * Result of an optimistic update operation
 */
export interface UpdateResult<T = unknown> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The update record */
  update: OptimisticUpdate<T>;
  /** Server response data (if confirmed) */
  serverData?: T;
  /** Error if failed */
  error?: Error;
  /** Whether the update was rolled back */
  wasRolledBack: boolean;
  /** Duration of the operation (ms) */
  duration: number;
}

/**
 * Result of a batch operation
 */
export interface BatchUpdateResult<T = unknown> {
  /** Total number of updates in batch */
  total: number;
  /** Number of successful updates */
  succeeded: number;
  /** Number of failed updates */
  failed: number;
  /** Individual results */
  results: UpdateResult<T>[];
}

// ============================================================================
// Conflict Detection
// ============================================================================

/**
 * Conflict type between optimistic updates
 */
export type ConflictType =
  | 'concurrent_edit'    // Same entity edited by multiple sources
  | 'stale_data'         // Local data is outdated
  | 'server_modified'    // Server version differs
  | 'delete_conflict';   // Deleting modified entity

/**
 * Detected conflict between updates
 */
export interface OptimisticConflict<T = unknown> {
  /** Type of conflict */
  type: ConflictType;
  /** The conflicting update */
  update: OptimisticUpdate<T>;
  /** Server version of the data */
  serverVersion?: T;
  /** Local version of the data */
  localVersion?: T;
  /** Timestamp of server version */
  serverTimestamp?: number;
  /** Suggested resolution */
  suggestedResolution: 'keep_local' | 'keep_server' | 'merge' | 'manual';
}

/**
 * Strategy for resolving conflicts
 */
export type ConflictResolutionStrategy = 
  | 'local_wins'     // Keep local changes
  | 'server_wins'    // Accept server version
  | 'last_write_wins' // Most recent timestamp wins
  | 'merge'          // Attempt to merge
  | 'manual';        // Require user intervention

// ============================================================================
// Merge Strategies
// ============================================================================

/**
 * Function to merge two versions of data
 */
export type MergeFn<T> = (
  local: T,
  server: T,
  base?: T
) => T;

/**
 * Built-in merge strategies
 */
export type MergeStrategy = 
  | 'shallow_merge'   // Object.assign style
  | 'deep_merge'      // Deep recursive merge
  | 'array_concat'    // Concatenate arrays
  | 'array_union'     // Union of array elements
  | 'custom';         // Use custom merge function

/**
 * Merge configuration
 */
export interface MergeConfig<T> {
  /** Strategy to use */
  strategy: MergeStrategy;
  /** Custom merge function (if strategy is 'custom') */
  customMerge?: MergeFn<T>;
  /** Fields to exclude from merge */
  excludeFields?: string[];
  /** Fields that should always use server value */
  serverOnlyFields?: string[];
  /** Fields that should always use local value */
  localOnlyFields?: string[];
}

// ============================================================================
// Store Types
// ============================================================================

/**
 * State of the optimistic update store
 */
export interface OptimisticStoreState {
  /** Map of pending updates by ID */
  updates: Map<string, OptimisticUpdate>;
  /** Map of entity type to update IDs */
  byEntityType: Map<string, Set<string>>;
  /** Map of entity ID to update IDs */
  byEntityId: Map<string, Set<string>>;
  /** Current conflicts */
  conflicts: OptimisticConflict[];
  /** Whether store is syncing */
  isSyncing: boolean;
  /** Last sync timestamp */
  lastSyncAt: number;
  /** Total pending count */
  pendingCount: number;
}

/**
 * Store actions
 */
export interface OptimisticStoreActions {
  /** Add a new update */
  addUpdate: <T>(update: Omit<OptimisticUpdate<T>, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string;
  /** Update status of an existing update */
  updateStatus: (id: string, status: OptimisticUpdateStatus, error?: Error) => void;
  /** Remove an update */
  removeUpdate: (id: string) => void;
  /** Rollback an update */
  rollback: <T>(id: string, context?: Partial<RollbackContext>) => Promise<void>;
  /** Rollback all updates for an entity */
  rollbackEntity: (entityId: string) => Promise<void>;
  /** Clear all updates */
  clear: () => void;
  /** Get updates for an entity */
  getUpdatesForEntity: <T>(entityId: string) => OptimisticUpdate<T>[];
  /** Get updates by type */
  getUpdatesByType: <T>(entityType: string) => OptimisticUpdate<T>[];
  /** Check for conflicts */
  checkConflicts: <T>(update: OptimisticUpdate<T>, serverData: T) => OptimisticConflict<T> | null;
  /** Resolve a conflict */
  resolveConflict: <T>(conflictId: string, resolution: ConflictResolutionStrategy, mergedData?: T) => void;
}

// ============================================================================
// Hooks Types
// ============================================================================

/**
 * Options for useOptimistic hook
 */
export interface UseOptimisticOptions<T> {
  /** Entity type being managed */
  entityType: string;
  /** Custom rollback function */
  onRollback?: RollbackFn<T>;
  /** Called when update confirms */
  onConfirm?: (update: OptimisticUpdate<T>, serverData: T) => void;
  /** Called when conflict detected */
  onConflict?: (conflict: OptimisticConflict<T>) => ConflictResolutionStrategy;
  /** Merge configuration */
  mergeConfig?: MergeConfig<T>;
  /** Override default config */
  config?: Partial<OptimisticConfig>;
}

/**
 * Return type for useOptimistic hook
 */
export interface UseOptimisticReturn<T> {
  /** Current pending updates */
  pending: OptimisticUpdate<T>[];
  /** Whether any updates are syncing */
  isSyncing: boolean;
  /** Current conflicts */
  conflicts: OptimisticConflict<T>[];
  /** Apply an optimistic update */
  apply: (data: T, previousData?: T, meta?: Record<string, unknown>) => string;
  /** Confirm an update from server */
  confirm: (updateId: string, serverData: T) => void;
  /** Fail an update */
  fail: (updateId: string, error: Error) => void;
  /** Manual rollback */
  rollback: (updateId: string) => Promise<void>;
  /** Rollback all pending */
  rollbackAll: () => Promise<void>;
  /** Resolve a conflict */
  resolveConflict: (conflictId: string, resolution: ConflictResolutionStrategy, mergedData?: T) => void;
  /** Get merged data (optimistic + server) */
  getMergedData: (serverData: T) => T;
}

/**
 * Options for useOptimisticMutation hook
 */
export interface UseOptimisticMutationOptions<TData, TVariables, TContext = unknown> {
  /** Mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Generate optimistic data from variables */
  getOptimisticData: (variables: TVariables) => TData;
  /** Get previous data for rollback */
  getPreviousData?: () => TData | undefined;
  /** Entity type */
  entityType: string;
  /** Entity ID (if updating existing) */
  getEntityId?: (variables: TVariables) => string | undefined;
  /** Called before mutation */
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;
  /** Called on success */
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  /** Called on error */
  onError?: (error: Error, variables: TVariables, context: TContext) => void;
  /** Called after mutation settles */
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables, context: TContext) => void;
  /** TanStack Query mutation key */
  mutationKey?: string[];
  /** Invalidate queries on success */
  invalidateQueries?: string[][];
  /** Override config */
  config?: Partial<OptimisticConfig>;
}

/**
 * Return type for useOptimisticMutation hook
 */
export interface UseOptimisticMutationReturn<TData, TVariables> {
  /** Execute the mutation */
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
  /** Last mutation data */
  data: TData | undefined;
  /** Reset mutation state */
  reset: () => void;
  /** Current optimistic update */
  optimisticUpdate: OptimisticUpdate<TData> | null;
}
