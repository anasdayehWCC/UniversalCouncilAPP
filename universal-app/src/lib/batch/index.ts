/**
 * Batch Operations Module
 * 
 * Multi-select and bulk operations system with undo support.
 * Enables efficient batch actions on lists of items.
 * 
 * @module lib/batch
 */

// Types
export type {
  SelectableId,
  SelectionMode,
  BatchSelectionState,
  BatchOperationStatus,
  BatchActionType,
  BatchActionConfig,
  BatchActionResult,
  BatchProgress,
  BatchUndoEntry,
  BatchState,
  BatchActions,
  UseBatchSelectionOptions,
  UseBatchSelectionReturn,
  SelectableItemProps,
  BatchActionBarProps,
} from './types';

// Constants
export { DEFAULT_BATCH_STATE, DEFAULT_BATCH_ACTIONS } from './types';

// Store
export {
  useBatchStore,
  selectSelection,
  selectSelectedIds,
  selectSelectedCount,
  selectIsSelectionActive,
  selectProgress,
  selectActions,
  selectUndoStack,
  selectCanUndo,
  createIsSelectedSelector,
  createAvailableActionsSelector,
} from './store';

// ============================================================================
// Utility Functions
// ============================================================================

import { SelectableId, BatchActionResult } from './types';

/**
 * Create a batch action result
 */
export function createBatchResult(
  success: boolean,
  processedCount: number,
  failedIds: SelectableId[] = [],
  errorMessage?: string
): BatchActionResult {
  return {
    success,
    processedCount,
    failedCount: failedIds.length,
    failedIds,
    errorMessage,
    undoId: success ? crypto.randomUUID() : undefined,
  };
}

/**
 * Process items in batches with progress updates
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: {
    onProgress?: (processed: number, total: number, current: T) => void;
    onError?: (item: T, error: Error) => void;
    concurrency?: number;
    stopOnError?: boolean;
  } = {}
): Promise<{ results: R[]; errors: Array<{ item: T; error: Error }> }> {
  const { onProgress, onError, concurrency = 5, stopOnError = false } = options;
  const results: R[] = [];
  const errors: Array<{ item: T; error: Error }> = [];

  // Process in chunks based on concurrency
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (item, chunkIndex) => {
      const index = i + chunkIndex;
      try {
        const result = await processor(item, index);
        results.push(result);
        onProgress?.(index + 1, items.length, item);
        return { success: true, result };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push({ item, error: err });
        onError?.(item, err);
        onProgress?.(index + 1, items.length, item);
        
        if (stopOnError) {
          throw err;
        }
        return { success: false, error: err };
      }
    });

    try {
      await Promise.all(chunkPromises);
    } catch {
      if (stopOnError) break;
    }
  }

  return { results, errors };
}

/**
 * Calculate range of IDs between two points
 */
export function calculateRange(
  fromId: SelectableId,
  toId: SelectableId,
  allIds: SelectableId[]
): SelectableId[] {
  const fromIndex = allIds.indexOf(fromId);
  const toIndex = allIds.indexOf(toId);

  if (fromIndex === -1 || toIndex === -1) {
    return [];
  }

  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);

  return allIds.slice(start, end + 1);
}

/**
 * Merge selected IDs efficiently
 */
export function mergeSelections(
  current: Set<SelectableId>,
  toAdd: SelectableId[]
): Set<SelectableId> {
  const result = new Set(current);
  toAdd.forEach((id) => result.add(id));
  return result;
}

/**
 * Format batch progress as percentage string
 */
export function formatProgress(processed: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((processed / total) * 100)}%`;
}

/**
 * Format batch result message
 */
export function formatBatchResultMessage(result: BatchActionResult, action: string): string {
  if (result.success && result.failedCount === 0) {
    return `Successfully ${action} ${result.processedCount} item${result.processedCount !== 1 ? 's' : ''}`;
  }

  if (result.failedCount > 0 && result.processedCount > result.failedCount) {
    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${result.processedCount - result.failedCount} item${result.processedCount - result.failedCount !== 1 ? 's' : ''}, ${result.failedCount} failed`;
  }

  return result.errorMessage || `Failed to ${action} items`;
}
