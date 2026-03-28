'use client';

/**
 * useSortable Hook
 * Hook for creating sortable list items
 */

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useDndContext, getElementRect } from '@/lib/dnd/context';
import {
  getPointerPosition,
  calculateOffset,
  exceedsDragThreshold,
  reorderArray,
  LONG_PRESS_THRESHOLD,
} from '@/lib/dnd/utils';
import type { DragId, Position, SortableItem, ReorderResult, Rect } from '@/lib/dnd/types';

// ============================================================================
// useSortable - Individual sortable item hook
// ============================================================================

export interface UseSortableOptions {
  /** Unique identifier for the sortable item */
  id: DragId;
  /** Whether sorting is disabled */
  disabled?: boolean;
  /** Index of this item in the list */
  index: number;
  /** Group identifier for multi-list sorting */
  groupId?: DragId;
}

export interface UseSortableReturn {
  /** Whether this item is being dragged */
  isDragging: boolean;
  /** Whether another item is being dragged over this one */
  isOver: boolean;
  /** Sorting attributes to spread on the element */
  sortableProps: {
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerCancel: () => void;
    'data-sortable-id': DragId;
    'data-sortable-index': number;
    'data-dragging': boolean;
    'data-over': boolean;
    className: string;
    style: React.CSSProperties;
  };
  /** Ref to attach to the sortable element */
  setNodeRef: (element: HTMLElement | null) => void;
  /** Transform style for animation */
  transform: { x: number; y: number } | null;
}

export function useSortable({
  id,
  disabled = false,
  index,
  groupId = 'default-sortable',
}: UseSortableOptions): UseSortableReturn {
  const { state, startDrag, updateDrag, endDrag, cancelDrag } = useDndContext();
  
  const nodeRef = useRef<HTMLElement | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const startPositionRef = useRef<Position | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);

  const isSortable = state.item?.type === 'sortable' && state.item?.sourceId === groupId;
  const isDragging = state.isDragging && state.item?.id === id;
  const isOver = isSortable && state.overId === id && !isDragging;

  // Calculate transform for displaced items
  const transform = useMemo(() => {
    if (!isSortable || isDragging || !state.item) return null;
    
    const activeIndex = state.item.index ?? -1;
    if (activeIndex === -1) return null;

    // Items between active and over positions get displaced
    const overIndex = state.overId !== null ? index : -1;
    
    if (overIndex !== -1 && index !== activeIndex) {
      // Calculate displacement based on positions
      if (activeIndex < index && index <= overIndex) {
        return { x: 0, y: -40 }; // Move up
      }
      if (activeIndex > index && index >= overIndex) {
        return { x: 0, y: 40 }; // Move down
      }
    }
    
    return null;
  }, [isSortable, isDragging, state.item, state.overId, index]);

  // Handle pointer down
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled || event.button !== 0) return;

    event.preventDefault();
    setIsPressed(true);
    
    const position = getPointerPosition(event);
    startPositionRef.current = position;

    // Long press for touch
    if (event.pointerType === 'touch') {
      longPressTimerRef.current = setTimeout(() => {
        if (startPositionRef.current && nodeRef.current) {
          const offset = calculateOffset(nodeRef.current, startPositionRef.current);
          startDrag(
            {
              id,
              type: 'sortable',
              data: null,
              index,
              sourceId: groupId,
            },
            startPositionRef.current,
            offset
          );
          isDraggingRef.current = true;
        }
      }, LONG_PRESS_THRESHOLD);
    }

    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, [disabled, id, index, groupId, startDrag]);

  // Handle pointer move
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isPressed || disabled) return;

    const position = getPointerPosition(event);

    if (isDraggingRef.current) {
      updateDrag(position);
      return;
    }

    // Start drag for mouse/pen
    if (startPositionRef.current && event.pointerType !== 'touch') {
      if (exceedsDragThreshold(startPositionRef.current, position)) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        
        if (nodeRef.current) {
          const offset = calculateOffset(nodeRef.current, startPositionRef.current);
          startDrag(
            {
              id,
              type: 'sortable',
              data: null,
              index,
              sourceId: groupId,
            },
            position,
            offset
          );
          isDraggingRef.current = true;
        }
      }
    }

    // Cancel for touch if moved before long press
    if (event.pointerType === 'touch' && startPositionRef.current && !isDraggingRef.current) {
      if (exceedsDragThreshold(startPositionRef.current, position)) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        setIsPressed(false);
        startPositionRef.current = null;
      }
    }
  }, [isPressed, disabled, id, index, groupId, updateDrag, startDrag]);

  // Handle pointer up
  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    (event.target as HTMLElement).releasePointerCapture(event.pointerId);

    if (isDraggingRef.current) {
      endDrag();
    }

    setIsPressed(false);
    startPositionRef.current = null;
    isDraggingRef.current = false;
  }, [endDrag]);

  // Handle pointer cancel
  const handlePointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDraggingRef.current) {
      cancelDrag();
    }

    setIsPressed(false);
    startPositionRef.current = null;
    isDraggingRef.current = false;
  }, [cancelDrag]);

  // Set node ref
  const setNodeRef = useCallback((element: HTMLElement | null) => {
    nodeRef.current = element;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Calculate style
  const style: React.CSSProperties = useMemo(() => {
    if (isDragging && state.position && state.offset) {
      return {
        position: 'fixed',
        left: state.position.x - state.offset.x,
        top: state.position.y - state.offset.y,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: 0.9,
        transform: 'scale(1.02)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      };
    }
    
    if (transform) {
      return {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        transition: 'transform 200ms ease',
      };
    }
    
    return {};
  }, [isDragging, state.position, state.offset, transform]);

  return {
    isDragging,
    isOver,
    sortableProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      'data-sortable-id': id,
      'data-sortable-index': index,
      'data-dragging': isDragging,
      'data-over': isOver,
      className: `touch-none select-none ${disabled ? 'cursor-not-allowed opacity-50' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`,
      style,
    },
    setNodeRef,
    transform,
  };
}

// ============================================================================
// useSortableList - List-level sorting hook
// ============================================================================

export interface UseSortableListOptions<T> {
  /** Items in the list */
  items: SortableItem<T>[];
  /** Callback when items are reordered */
  onReorder: (result: ReorderResult<T>) => void;
  /** Sorting direction */
  direction?: 'vertical' | 'horizontal';
  /** Group identifier */
  groupId?: DragId;
  /** Whether sorting is disabled */
  disabled?: boolean;
}

export interface UseSortableListReturn<T> {
  /** Whether a drag is in progress */
  isDragging: boolean;
  /** Currently active item ID */
  activeId: DragId | null;
  /** Currently hovered item ID */
  overId: DragId | null;
  /** Items in preview order (during drag) */
  previewItems: SortableItem<T>[];
  /** Get props for a sortable item */
  getSortableProps: (id: DragId, index: number) => UseSortableReturn;
}

export function useSortableList<T>({
  items,
  onReorder,
  direction = 'vertical',
  groupId = 'default-sortable',
  disabled = false,
}: UseSortableListOptions<T>): UseSortableListReturn<T> {
  const { state } = useDndContext();
  
  const [previewItems, setPreviewItems] = useState<SortableItem<T>[]>(items);
  const itemRectsRef = useRef<Map<DragId, Rect>>(new Map());

  // Check if this list's items are being sorted
  const isSorting = state.isDragging && 
    state.item?.type === 'sortable' && 
    state.item?.sourceId === groupId;

  const activeId = isSorting ? state.item?.id ?? null : null;
  const overId = isSorting ? state.overId : null;

  // Sync preview with items when not sorting
  useEffect(() => {
    if (!isSorting) {
      setPreviewItems(items);
    }
  }, [items, isSorting]);

  // Update preview order based on hover position
  useEffect(() => {
    if (!isSorting || activeId === null || overId === null) return;
    
    const activeIndex = items.findIndex(i => i.id === activeId);
    const overIndex = items.findIndex(i => i.id === overId);
    
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      setPreviewItems(reorderArray(items, activeIndex, overIndex));
    }
  }, [isSorting, activeId, overId, items]);

  // Handle reorder on drag end
  const prevIsDraggingRef = useRef(state.isDragging);
  useEffect(() => {
    if (prevIsDraggingRef.current && !state.isDragging && isSorting && activeId !== null) {
      const fromIndex = items.findIndex(i => i.id === activeId);
      const toIndex = previewItems.findIndex(i => i.id === activeId);
      
      if (fromIndex !== toIndex && fromIndex !== -1 && toIndex !== -1) {
        onReorder({
          items: previewItems,
          fromIndex,
          toIndex,
        });
      }
    }
    prevIsDraggingRef.current = state.isDragging;
  }, [state.isDragging, isSorting, activeId, items, previewItems, onReorder]);

  // Get sortable props for an item
  const getSortableProps = useCallback((id: DragId, index: number): UseSortableReturn => {
    // This returns a useSortable-compatible result
    // In practice, you'd call useSortable directly in the component
    return useSortable({
      id,
      index,
      groupId,
      disabled,
    });
  }, [groupId, disabled]);

  return {
    isDragging: isSorting,
    activeId,
    overId,
    previewItems: isSorting ? previewItems : items,
    getSortableProps,
  };
}

export default useSortable;
