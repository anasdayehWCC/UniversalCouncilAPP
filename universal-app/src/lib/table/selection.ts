/**
 * Table Selection Utilities
 * Row selection state management for the data table
 */

import type { RowData } from './types';

export type SelectionMode = 'single' | 'multiple';

export interface SelectionState {
  selectedIds: Set<string | number>;
  mode: SelectionMode;
}

/**
 * Create initial selection state
 */
export function createSelectionState(
  mode: SelectionMode = 'multiple',
  initialSelection: Array<string | number> = []
): SelectionState {
  return {
    selectedIds: new Set(initialSelection),
    mode,
  };
}

/**
 * Select a single row
 */
export function selectRow(
  state: SelectionState,
  id: string | number
): SelectionState {
  if (state.mode === 'single') {
    return {
      ...state,
      selectedIds: new Set([id]),
    };
  }

  const newSelected = new Set(state.selectedIds);
  newSelected.add(id);
  return {
    ...state,
    selectedIds: newSelected,
  };
}

/**
 * Deselect a row
 */
export function deselectRow(
  state: SelectionState,
  id: string | number
): SelectionState {
  const newSelected = new Set(state.selectedIds);
  newSelected.delete(id);
  return {
    ...state,
    selectedIds: newSelected,
  };
}

/**
 * Toggle row selection
 */
export function toggleRowSelection(
  state: SelectionState,
  id: string | number
): SelectionState {
  if (state.selectedIds.has(id)) {
    return deselectRow(state, id);
  }
  return selectRow(state, id);
}

/**
 * Select all rows
 */
export function selectAllRows<T extends RowData>(
  state: SelectionState,
  data: T[],
  idKey: keyof T = 'id'
): SelectionState {
  const allIds = data.map((row) => row[idKey] as string | number);
  return {
    ...state,
    selectedIds: new Set(allIds),
  };
}

/**
 * Deselect all rows
 */
export function deselectAllRows(state: SelectionState): SelectionState {
  return {
    ...state,
    selectedIds: new Set(),
  };
}

/**
 * Toggle select all
 */
export function toggleSelectAll<T extends RowData>(
  state: SelectionState,
  data: T[],
  idKey: keyof T = 'id'
): SelectionState {
  const allIds = data.map((row) => row[idKey] as string | number);
  const allSelected = allIds.length > 0 && allIds.every((id) => state.selectedIds.has(id));

  if (allSelected) {
    return deselectAllRows(state);
  }
  return selectAllRows(state, data, idKey);
}

/**
 * Check if a row is selected
 */
export function isRowSelected(
  state: SelectionState,
  id: string | number
): boolean {
  return state.selectedIds.has(id);
}

/**
 * Check if all rows are selected
 */
export function isAllSelected<T extends RowData>(
  state: SelectionState,
  data: T[],
  idKey: keyof T = 'id'
): boolean {
  if (data.length === 0) return false;
  return data.every((row) => state.selectedIds.has(row[idKey] as string | number));
}

/**
 * Check if some (but not all) rows are selected
 */
export function isSomeSelected<T extends RowData>(
  state: SelectionState,
  data: T[],
  idKey: keyof T = 'id'
): boolean {
  if (data.length === 0) return false;
  const selectedCount = data.filter((row) =>
    state.selectedIds.has(row[idKey] as string | number)
  ).length;
  return selectedCount > 0 && selectedCount < data.length;
}

/**
 * Get selection count
 */
export function getSelectionCount(state: SelectionState): number {
  return state.selectedIds.size;
}

/**
 * Get selected rows data
 */
export function getSelectedRows<T extends RowData>(
  state: SelectionState,
  data: T[],
  idKey: keyof T = 'id'
): T[] {
  return data.filter((row) => state.selectedIds.has(row[idKey] as string | number));
}

/**
 * Select range of rows (for shift-click selection)
 */
export function selectRange<T extends RowData>(
  state: SelectionState,
  data: T[],
  startId: string | number,
  endId: string | number,
  idKey: keyof T = 'id'
): SelectionState {
  const startIndex = data.findIndex((row) => row[idKey] === startId);
  const endIndex = data.findIndex((row) => row[idKey] === endId);

  if (startIndex === -1 || endIndex === -1) {
    return state;
  }

  const [minIndex, maxIndex] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
  const rangeIds = data.slice(minIndex, maxIndex + 1).map((row) => row[idKey] as string | number);

  const newSelected = new Set(state.selectedIds);
  rangeIds.forEach((id) => newSelected.add(id));

  return {
    ...state,
    selectedIds: newSelected,
  };
}

/**
 * Serialize selection to array
 */
export function serializeSelection(state: SelectionState): Array<string | number> {
  return Array.from(state.selectedIds);
}

/**
 * Deserialize selection from array
 */
export function deserializeSelection(
  ids: Array<string | number>,
  mode: SelectionMode = 'multiple'
): SelectionState {
  return {
    selectedIds: new Set(ids),
    mode,
  };
}

/**
 * Filter selection to only include valid IDs from current data
 */
export function filterValidSelection<T extends RowData>(
  state: SelectionState,
  data: T[],
  idKey: keyof T = 'id'
): SelectionState {
  const validIds = new Set(data.map((row) => row[idKey] as string | number));
  const filteredSelection = new Set(
    Array.from(state.selectedIds).filter((id) => validIds.has(id))
  );

  return {
    ...state,
    selectedIds: filteredSelection,
  };
}
