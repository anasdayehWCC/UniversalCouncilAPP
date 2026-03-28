'use client';

import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  SelectableId,
  UseBatchSelectionOptions,
  UseBatchSelectionReturn,
} from '@/lib/batch/types';
import {
  useBatchStore,
  selectSelection,
  selectSelectedCount,
} from '@/lib/batch/store';
import { calculateRange } from '@/lib/batch';

/**
 * Hook for managing batch selection state with support for
 * single, multiple, and range selection modes.
 * 
 * @example
 * ```tsx
 * const {
 *   selectedIds,
 *   selectedCount,
 *   isSelected,
 *   toggle,
 *   selectAll,
 *   deselectAll,
 * } = useBatchSelection({
 *   itemIds: items.map(i => i.id),
 *   onSelectionChange: (ids) => console.log('Selected:', ids.size),
 * });
 * 
 * return items.map(item => (
 *   <SelectableItem
 *     key={item.id}
 *     id={item.id}
 *     isSelected={isSelected(item.id)}
 *     onToggle={toggle}
 *   >
 *     {item.name}
 *   </SelectableItem>
 * ));
 * ```
 */
export function useBatchSelection(
  options: UseBatchSelectionOptions
): UseBatchSelectionReturn {
  const {
    itemIds,
    initialSelection = [],
    mode = 'multiple',
    onSelectionChange,
    maxSelectable,
    enableMultiSelect = true,
    enableRangeSelect = true,
  } = options;

  // Store access
  const selection = useBatchStore(selectSelection);
  const selectedCount = useBatchStore(selectSelectedCount);
  const {
    select: storeSelect,
    deselect: storeDeselect,
    toggle: storeToggle,
    selectAll: storeSelectAll,
    deselectAll: storeDeselectAll,
    selectRange: storeSelectRange,
    setRangeAnchor,
    setMode,
  } = useBatchStore();

  // Track previous selection for change callback
  const prevSelectionSize = useRef(selection.selectedIds.size);

  // Initialize selection mode
  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  // Initialize with initial selection
  useEffect(() => {
    if (initialSelection.length > 0) {
      storeSelectAll(initialSelection);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Call onSelectionChange when selection changes
  useEffect(() => {
    if (selection.selectedIds.size !== prevSelectionSize.current) {
      prevSelectionSize.current = selection.selectedIds.size;
      onSelectionChange?.(selection.selectedIds);
    }
  }, [selection.selectedIds, onSelectionChange]);

  // Derived state
  const selectedIds = selection.selectedIds;
  const hasSelection = selectedCount > 0;
  const isAllSelected = selectedCount > 0 && selectedCount === itemIds.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < itemIds.length;

  // Check if item is selected
  const isSelected = useCallback(
    (id: SelectableId): boolean => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  // Select single item
  const select = useCallback(
    (id: SelectableId) => {
      if (maxSelectable && selectedCount >= maxSelectable) {
        return;
      }
      storeSelect(id);
      setRangeAnchor(id);
    },
    [storeSelect, setRangeAnchor, maxSelectable, selectedCount]
  );

  // Deselect single item
  const deselect = useCallback(
    (id: SelectableId) => {
      storeDeselect(id);
    },
    [storeDeselect]
  );

  // Toggle selection with event support for shift+click
  const toggle = useCallback(
    (id: SelectableId, event?: React.MouseEvent) => {
      // Handle shift+click for range selection
      if (
        event?.shiftKey &&
        enableRangeSelect &&
        selection.rangeAnchor &&
        selection.rangeAnchor !== id
      ) {
        const rangeIds = calculateRange(selection.rangeAnchor, id, itemIds);
        
        // Check max selectable
        if (maxSelectable) {
          const newSelectionSize = new Set([...selectedIds, ...rangeIds]).size;
          if (newSelectionSize > maxSelectable) {
            return;
          }
        }
        
        storeSelectRange(selection.rangeAnchor, id, itemIds);
        return;
      }

      // Handle cmd/ctrl+click for add to selection (default multi-select behavior)
      if (event?.metaKey || event?.ctrlKey) {
        if (selectedIds.has(id)) {
          storeDeselect(id);
        } else {
          if (maxSelectable && selectedCount >= maxSelectable) {
            return;
          }
          storeSelect(id);
          setRangeAnchor(id);
        }
        return;
      }

      // Standard toggle behavior
      if (!enableMultiSelect && !selectedIds.has(id)) {
        // Single select mode - clear others first
        storeDeselectAll();
      }

      if (selectedIds.has(id)) {
        storeDeselect(id);
      } else {
        if (maxSelectable && selectedCount >= maxSelectable) {
          return;
        }
        storeSelect(id);
        setRangeAnchor(id);
      }
    },
    [
      enableRangeSelect,
      enableMultiSelect,
      selection.rangeAnchor,
      selectedIds,
      selectedCount,
      maxSelectable,
      itemIds,
      storeSelect,
      storeDeselect,
      storeDeselectAll,
      storeSelectRange,
      setRangeAnchor,
    ]
  );

  // Select all items
  const selectAll = useCallback(() => {
    const idsToSelect = maxSelectable
      ? itemIds.slice(0, maxSelectable)
      : itemIds;
    storeSelectAll(idsToSelect);
    setRangeAnchor(idsToSelect[idsToSelect.length - 1] ?? null);
  }, [itemIds, maxSelectable, storeSelectAll, setRangeAnchor]);

  // Deselect all items
  const deselectAll = useCallback(() => {
    storeDeselectAll();
  }, [storeDeselectAll]);

  // Select range from anchor to target
  const selectRange = useCallback(
    (toId: SelectableId) => {
      if (!selection.rangeAnchor) {
        select(toId);
        return;
      }

      const rangeIds = calculateRange(selection.rangeAnchor, toId, itemIds);
      
      if (maxSelectable) {
        const newSelectionSize = new Set([...selectedIds, ...rangeIds]).size;
        if (newSelectionSize > maxSelectable) {
          return;
        }
      }

      storeSelectRange(selection.rangeAnchor, toId, itemIds);
    },
    [selection.rangeAnchor, itemIds, selectedIds, maxSelectable, select, storeSelectRange]
  );

  // Invert selection
  const invertSelection = useCallback(() => {
    const currentSelected = new Set(selectedIds);
    const inverted = itemIds.filter((id) => !currentSelected.has(id));
    
    // Check max selectable
    if (maxSelectable && inverted.length > maxSelectable) {
      storeDeselectAll();
      storeSelectAll(inverted.slice(0, maxSelectable));
    } else {
      storeDeselectAll();
      storeSelectAll(inverted);
    }
  }, [itemIds, selectedIds, maxSelectable, storeDeselectAll, storeSelectAll]);

  return useMemo(
    () => ({
      selectedIds,
      selectedCount,
      hasSelection,
      isAllSelected,
      isIndeterminate,
      isSelected,
      select,
      deselect,
      toggle,
      selectAll,
      deselectAll,
      selectRange,
      invertSelection,
    }),
    [
      selectedIds,
      selectedCount,
      hasSelection,
      isAllSelected,
      isIndeterminate,
      isSelected,
      select,
      deselect,
      toggle,
      selectAll,
      deselectAll,
      selectRange,
      invertSelection,
    ]
  );
}

export default useBatchSelection;
