/**
 * Batch Operations Store
 * 
 * Zustand store for managing batch selection state, action execution,
 * progress tracking, and undo operations.
 * 
 * @module lib/batch/store
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import {
  BatchState,
  BatchActions,
  SelectableId,
  SelectionMode,
  BatchProgress,
  BatchActionResult,
  BatchUndoEntry,
  BatchActionConfig,
  DEFAULT_BATCH_STATE,
} from './types';

// ============================================================================
// Store Type
// ============================================================================

type BatchStore = BatchState & BatchActions;

// ============================================================================
// Store Implementation
// ============================================================================

export const useBatchStore = create<BatchStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        ...DEFAULT_BATCH_STATE,

        // ========================================================================
        // Selection Actions
        // ========================================================================

        select: (id: SelectableId) => {
          set((state) => {
            state.selection.selectedIds.add(id);
            state.selection.lastSelectedId = id;
            state.selection.isSelectionActive = true;
          });
        },

        deselect: (id: SelectableId) => {
          set((state) => {
            state.selection.selectedIds.delete(id);
            if (state.selection.lastSelectedId === id) {
              state.selection.lastSelectedId = null;
            }
            if (state.selection.selectedIds.size === 0) {
              state.selection.isSelectionActive = false;
            }
          });
        },

        toggle: (id: SelectableId) => {
          const { selection } = get();
          if (selection.selectedIds.has(id)) {
            get().deselect(id);
          } else {
            get().select(id);
          }
        },

        selectAll: (ids: SelectableId[]) => {
          set((state) => {
            ids.forEach((id) => state.selection.selectedIds.add(id));
            state.selection.isSelectionActive = ids.length > 0;
            state.selection.lastSelectedId = ids[ids.length - 1] ?? null;
          });
        },

        deselectAll: () => {
          set((state) => {
            state.selection.selectedIds.clear();
            state.selection.lastSelectedId = null;
            state.selection.isSelectionActive = false;
            state.selection.rangeAnchor = null;
          });
        },

        selectRange: (fromId: SelectableId, toId: SelectableId, allIds: SelectableId[]) => {
          const fromIndex = allIds.indexOf(fromId);
          const toIndex = allIds.indexOf(toId);

          if (fromIndex === -1 || toIndex === -1) return;

          const start = Math.min(fromIndex, toIndex);
          const end = Math.max(fromIndex, toIndex);
          const rangeIds = allIds.slice(start, end + 1);

          set((state) => {
            rangeIds.forEach((id) => state.selection.selectedIds.add(id));
            state.selection.lastSelectedId = toId;
            state.selection.isSelectionActive = true;
          });
        },

        setMode: (mode: SelectionMode) => {
          set((state) => {
            state.selection.mode = mode;
          });
        },

        setRangeAnchor: (id: SelectableId | null) => {
          set((state) => {
            state.selection.rangeAnchor = id;
          });
        },

        // ========================================================================
        // Action Management
        // ========================================================================

        registerAction: (action: BatchActionConfig) => {
          set((state) => {
            const existingIndex = state.actions.findIndex((a) => a.id === action.id);
            if (existingIndex >= 0) {
              state.actions[existingIndex] = action;
            } else {
              state.actions.push(action);
            }
          });
        },

        unregisterAction: (actionId: string) => {
          set((state) => {
            state.actions = state.actions.filter((a) => a.id !== actionId);
          });
        },

        executeAction: async (actionId: string, payload?: unknown): Promise<BatchActionResult> => {
          const { actions, selection, pushUndo, setProgress, updateProgress, deselectAll } = get();
          const action = actions.find((a) => a.id === actionId);

          if (!action) {
            return {
              success: false,
              processedCount: 0,
              failedCount: 0,
              failedIds: [],
              errorMessage: `Action "${actionId}" not found`,
            };
          }

          const selectedIds = Array.from(selection.selectedIds);

          // Validate item count
          if (action.minItems && selectedIds.length < action.minItems) {
            return {
              success: false,
              processedCount: 0,
              failedCount: 0,
              failedIds: [],
              errorMessage: `At least ${action.minItems} items required`,
            };
          }

          if (action.maxItems && selectedIds.length > action.maxItems) {
            return {
              success: false,
              processedCount: 0,
              failedCount: 0,
              failedIds: [],
              errorMessage: `Maximum ${action.maxItems} items allowed`,
            };
          }

          // Initialize progress
          const operationId = uuidv4();
          setProgress({
            operationId,
            status: 'processing',
            totalItems: selectedIds.length,
            processedItems: 0,
            failedItems: 0,
            percentage: 0,
            startedAt: Date.now(),
            errors: [],
          });

          try {
            const result = await action.handler(selectedIds, payload);

            // Update progress to completed
            updateProgress({
              status: result.success ? 'completed' : 'failed',
              processedItems: result.processedCount,
              failedItems: result.failedCount,
              percentage: 100,
            });

            // Add to undo stack if supported
            if (result.success && action.supportsUndo && action.undoHandler) {
              pushUndo({
                actionType: action.id,
                label: `Undo ${action.label.toLowerCase()}`,
                affectedIds: selectedIds,
                undoData: result.undoData,
                undoHandler: async () => {
                  if (action.undoHandler) {
                    await action.undoHandler(result);
                  }
                },
              });
            }

            // Clear selection on success
            if (result.success) {
              deselectAll();
            }

            // Clear progress after delay
            setTimeout(() => {
              setProgress(null);
            }, 2000);

            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            updateProgress({
              status: 'failed',
              errors: [{ id: operationId, message: errorMessage }],
            });

            return {
              success: false,
              processedCount: 0,
              failedCount: selectedIds.length,
              failedIds: selectedIds,
              errorMessage,
            };
          }
        },

        // ========================================================================
        // Progress Tracking
        // ========================================================================

        setProgress: (progress: BatchProgress | null) => {
          set((state) => {
            state.progress = progress;
          });
        },

        updateProgress: (update: Partial<BatchProgress>) => {
          set((state) => {
            if (state.progress) {
              Object.assign(state.progress, update);
              if (update.processedItems !== undefined && state.progress.totalItems > 0) {
                state.progress.percentage = Math.round(
                  (update.processedItems / state.progress.totalItems) * 100
                );
              }
            }
          });
        },

        // ========================================================================
        // Undo Management
        // ========================================================================

        pushUndo: (entry: Omit<BatchUndoEntry, 'id' | 'createdAt' | 'expiresAt'>): string => {
          const id = uuidv4();
          const now = Date.now();
          const { undoWindowMs, maxUndoStackSize } = get();

          set((state) => {
            state.undoStack.unshift({
              ...entry,
              id,
              createdAt: now,
              expiresAt: now + undoWindowMs,
            });

            // Trim stack if needed
            if (state.undoStack.length > maxUndoStackSize) {
              state.undoStack = state.undoStack.slice(0, maxUndoStackSize);
            }
          });

          return id;
        },

        popUndo: (): BatchUndoEntry | undefined => {
          const { undoStack } = get();
          const entry = undoStack[0];

          if (entry) {
            set((state) => {
              state.undoStack.shift();
            });
          }

          return entry;
        },

        executeUndo: async (undoId?: string): Promise<void> => {
          const { undoStack, clearExpiredUndo } = get();

          // Clear expired entries first
          clearExpiredUndo();

          // Find entry to undo
          const entry = undoId
            ? get().undoStack.find((e) => e.id === undoId)
            : get().undoStack[0];

          if (!entry) {
            throw new Error('No undo operation available');
          }

          // Remove from stack
          set((state) => {
            state.undoStack = state.undoStack.filter((e) => e.id !== entry.id);
          });

          // Execute undo
          await entry.undoHandler();
        },

        clearExpiredUndo: () => {
          const now = Date.now();
          set((state) => {
            state.undoStack = state.undoStack.filter((e) => e.expiresAt > now);
          });
        },

        // ========================================================================
        // Reset
        // ========================================================================

        reset: () => {
          set((state) => {
            Object.assign(state, DEFAULT_BATCH_STATE);
          });
        },
      }))
    ),
    { name: 'batch-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select the current selection state
 */
export const selectSelection = (state: BatchStore) => state.selection;

/**
 * Select selected IDs as array
 */
export const selectSelectedIds = (state: BatchStore) => Array.from(state.selection.selectedIds);

/**
 * Select count of selected items
 */
export const selectSelectedCount = (state: BatchStore) => state.selection.selectedIds.size;

/**
 * Select whether selection is active
 */
export const selectIsSelectionActive = (state: BatchStore) => state.selection.isSelectionActive;

/**
 * Select current progress
 */
export const selectProgress = (state: BatchStore) => state.progress;

/**
 * Select available actions
 */
export const selectActions = (state: BatchStore) => state.actions;

/**
 * Select undo stack
 */
export const selectUndoStack = (state: BatchStore) => state.undoStack;

/**
 * Select whether undo is available
 */
export const selectCanUndo = (state: BatchStore) => {
  const now = Date.now();
  return state.undoStack.some((e) => e.expiresAt > now);
};

/**
 * Create selector for checking if specific item is selected
 */
export const createIsSelectedSelector = (id: SelectableId) => (state: BatchStore) =>
  state.selection.selectedIds.has(id);

/**
 * Create selector for filtering available actions
 */
export const createAvailableActionsSelector = (selectedIds: Set<SelectableId>) => (state: BatchStore) =>
  state.actions.filter((action) => {
    if (action.isAvailable) {
      return action.isAvailable(selectedIds);
    }
    if (action.minItems && selectedIds.size < action.minItems) {
      return false;
    }
    if (action.maxItems && selectedIds.size > action.maxItems) {
      return false;
    }
    return true;
  });

/**
 * Select executeUndo action
 */
export const selectExecuteUndo = (state: BatchStore) => state.executeUndo;
