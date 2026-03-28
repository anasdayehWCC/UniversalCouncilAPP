'use client';

/**
 * useDragAndDrop Hook
 * Unified hook for drag and drop functionality
 * 
 * Provides hooks for draggable items, droppable zones, and sorting helpers.
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useDndContext as useNativeDndContext } from '@/lib/dnd/context';
import {
  reorderItems,
  moveItemBetweenLists,
  canAcceptDrop,
  type DragData,
  type DraggableEntityType,
  type DropZoneConfig,
} from '@/lib/dnd/dnd-kit-adapter';
import type { DragId, Position, SortableItem, ReorderResult } from '@/lib/dnd/types';

// ============================================================================
// Main Hook - useDragAndDrop
// ============================================================================

export interface UseDragAndDropOptions {
  /** Unique identifier for the draggable/droppable */
  id: DragId;
  /** Whether dragging is disabled */
  disabled?: boolean;
}

export interface UseDragAndDropReturn {
  /** Hook for making elements draggable */
  useDraggable: <T extends DragData>(options: UseDraggableOptions<T>) => UseDraggableReturn;
  /** Hook for creating drop zones */
  useDroppable: <T extends DragData>(options: UseDroppableOptions<T>) => UseDroppableReturn<T>;
  /** Hook for sortable lists */
  useSortableList: <T>(options: UseSortableListOptions<T>) => UseSortableListReturn<T>;
}

/** Main hook providing access to all DnD functionality */
export function useDragAndDrop(): UseDragAndDropReturn {
  return {
    useDraggable,
    useDroppable,
    useSortableList,
  };
}

// ============================================================================
// useDraggable Hook
// ============================================================================

export interface UseDraggableOptions<T extends DragData = DragData> {
  /** Unique identifier */
  id: DragId;
  /** Data payload */
  data?: T;
  /** Whether dragging is disabled */
  disabled?: boolean;
  /** Called when drag starts */
  onDragStart?: () => void;
  /** Called when drag ends */
  onDragEnd?: (droppedOn: DragId | null) => void;
}

export interface UseDraggableReturn {
  /** Whether this item is being dragged */
  isDragging: boolean;
  /** Transform while dragging */
  transform: { x: number; y: number } | null;
  /** Props to spread on the draggable element */
  attributes: {
    role: string;
    'aria-describedby': string;
    'aria-roledescription': string;
    tabIndex: number;
  };
  /** Event listeners for the draggable element */
  listeners: {
    onPointerDown: (event: React.PointerEvent) => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
  /** Ref setter for the draggable element */
  setNodeRef: (element: HTMLElement | null) => void;
  /** Ref setter for the drag handle (if separate) */
  setActivatorNodeRef: (element: HTMLElement | null) => void;
}

export function useDraggable<T extends DragData = DragData>({
  id,
  data,
  disabled = false,
  onDragStart,
  onDragEnd,
}: UseDraggableOptions<T>): UseDraggableReturn {
  const context = useNativeDndContext();
  const nodeRef = useRef<HTMLElement | null>(null);
  const activatorRef = useRef<HTMLElement | null>(null);
  
  const isDragging = context.state.isDragging && context.state.item?.id === id;
  
  const transform = useMemo(() => {
    if (!isDragging || !context.state.position || !context.state.startPosition) {
      return null;
    }
    return {
      x: context.state.position.x - context.state.startPosition.x,
      y: context.state.position.y - context.state.startPosition.y,
    };
  }, [isDragging, context.state.position, context.state.startPosition]);
  
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled || event.button !== 0) return;
    
    event.preventDefault();
    const position = { x: event.clientX, y: event.clientY };
    const element = nodeRef.current;
    
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const offset = {
      x: position.x - rect.left,
      y: position.y - rect.top,
    };
    
    context.startDrag(
      {
        id,
        type: data?.type || 'default',
        data: data as unknown,
      },
      position,
      offset
    );
    
    onDragStart?.();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, [id, data, disabled, context, onDragStart]);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      // TODO: Implement keyboard drag start
    }
  }, [disabled]);
  
  const setNodeRef = useCallback((element: HTMLElement | null) => {
    nodeRef.current = element;
  }, []);
  
  const setActivatorNodeRef = useCallback((element: HTMLElement | null) => {
    activatorRef.current = element;
  }, []);
  
  const attributes = useMemo(() => ({
    role: 'button' as const,
    'aria-describedby': `draggable-${id}-description`,
    'aria-roledescription': 'draggable',
    tabIndex: disabled ? -1 : 0,
  }), [id, disabled]);
  
  const listeners = useMemo(() => ({
    onPointerDown: handlePointerDown,
    onKeyDown: handleKeyDown,
  }), [handlePointerDown, handleKeyDown]);
  
  return {
    isDragging,
    transform,
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
  };
}

// ============================================================================
// useDroppable Hook
// ============================================================================

export interface UseDroppableOptions<T extends DragData = DragData> {
  /** Unique identifier */
  id: DragId;
  /** Entity types this zone accepts */
  accepts?: DraggableEntityType[];
  /** Whether dropping is disabled */
  disabled?: boolean;
  /** Called when item is dropped */
  onDrop?: (item: T) => void;
  /** Called when drag enters zone */
  onDragEnter?: (item: T) => void;
  /** Called when drag leaves zone */
  onDragLeave?: (item: T) => void;
}

export interface UseDroppableReturn<T extends DragData = DragData> {
  /** Whether a dragged item is over this zone */
  isOver: boolean;
  /** Whether the current item can be dropped here */
  canDrop: boolean;
  /** The item being dragged over (if any) */
  active: T | null;
  /** Props for the droppable element */
  attributes: {
    'data-droppable-id': DragId;
    'aria-dropeffect': 'move' | 'none';
  };
  /** Ref setter for the droppable element */
  setNodeRef: (element: HTMLElement | null) => void;
}

export function useDroppable<T extends DragData = DragData>({
  id,
  accepts = [],
  disabled = false,
  onDrop,
  onDragEnter,
  onDragLeave,
}: UseDroppableOptions<T>): UseDroppableReturn<T> {
  const context = useNativeDndContext();
  const nodeRef = useRef<HTMLElement | null>(null);
  const wasOverRef = useRef(false);
  
  const isOver = context.state.isDragging && context.state.overId === id;
  
  const active = useMemo(() => {
    if (!context.state.isDragging || !context.state.item) return null;
    return context.state.item.data as T | null;
  }, [context.state.isDragging, context.state.item]);
  
  const canDrop = useMemo(() => {
    if (disabled || !active) return false;
    if (accepts.length === 0) return true;
    return accepts.includes(active.type as DraggableEntityType);
  }, [disabled, active, accepts]);
  
  // Register drop zone
  useEffect(() => {
    context.registerDropZone({
      id,
      acceptTypes: accepts.length > 0 ? accepts : ['default'],
      disabled,
    });
    
    return () => {
      context.unregisterDropZone(id);
    };
  }, [id, accepts, disabled, context]);
  
  // Handle enter/leave callbacks
  useEffect(() => {
    if (isOver && !wasOverRef.current && active) {
      onDragEnter?.(active);
    } else if (!isOver && wasOverRef.current && active) {
      onDragLeave?.(active);
    }
    wasOverRef.current = isOver;
  }, [isOver, active, onDragEnter, onDragLeave]);
  
  const setNodeRef = useCallback((element: HTMLElement | null) => {
    nodeRef.current = element;
    if (element) {
      const rect = element.getBoundingClientRect();
      context.updateDropZoneRect(id, {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [id, context]);
  
  const attributes = useMemo(() => ({
    'data-droppable-id': id,
    'aria-dropeffect': (canDrop ? 'move' : 'none') as 'move' | 'none',
  }), [id, canDrop]);
  
  return {
    isOver,
    canDrop,
    active,
    attributes,
    setNodeRef,
  };
}

// ============================================================================
// useSortableList Hook
// ============================================================================

export interface UseSortableListOptions<T> {
  /** Unique identifier for the list */
  id: DragId;
  /** Items to sort */
  items: Array<T & { id: DragId }>;
  /** Called when items are reordered */
  onReorder: (result: ReorderResult<T>) => void;
  /** Sort direction */
  direction?: 'vertical' | 'horizontal' | 'grid';
  /** Whether sorting is disabled */
  disabled?: boolean;
}

export interface UseSortableListReturn<T> {
  /** Active item being dragged */
  activeItem: (T & { id: DragId }) | null;
  /** Current order of items (may differ during drag) */
  items: Array<T & { id: DragId }>;
  /** Hook for individual sortable items */
  useSortableItem: (id: DragId) => UseSortableItemReturn;
  /** Container props */
  containerProps: {
    role: string;
    'aria-label': string;
  };
}

export interface UseSortableItemReturn {
  /** Whether this item is being sorted */
  isDragging: boolean;
  /** Whether another item is over this one */
  isOver: boolean;
  /** Transform for animation */
  transform: { x: number; y: number } | null;
  /** Sort index */
  index: number;
  /** Props for the sortable item */
  attributes: {
    role: string;
    'aria-roledescription': string;
    tabIndex: number;
  };
  /** Event listeners */
  listeners: {
    onPointerDown: (event: React.PointerEvent) => void;
  };
  /** Ref setter */
  setNodeRef: (element: HTMLElement | null) => void;
  /** Style for animation */
  style: React.CSSProperties;
}

export function useSortableList<T>({
  id,
  items,
  onReorder,
  direction = 'vertical',
  disabled = false,
}: UseSortableListOptions<T>): UseSortableListReturn<T> {
  const context = useNativeDndContext();
  const [activeId, setActiveId] = useState<DragId | null>(null);
  const [previewItems, setPreviewItems] = useState(items);
  const itemRefs = useRef<Map<DragId, HTMLElement>>(new Map());
  
  // Sync preview items
  useEffect(() => {
    if (!activeId) {
      setPreviewItems(items);
    }
  }, [items, activeId]);
  
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return items.find((item) => item.id === activeId) ?? null;
  }, [items, activeId]);
  
  const useSortableItem = useCallback((itemId: DragId): UseSortableItemReturn => {
    const isDragging = context.state.isDragging && context.state.item?.id === itemId;
    const isOver = context.state.overId === itemId && !isDragging;
    const index = previewItems.findIndex((item) => item.id === itemId);
    
    const transform = useMemo((): { x: number; y: number } | null => {
      if (!context.state.isDragging || isDragging) return null;
      // Calculate displacement based on active item position
      return null; // Simplified - full implementation would track positions
    }, [context.state.isDragging, isDragging]);
    
    const handlePointerDown = useCallback((event: React.PointerEvent) => {
      if (disabled || event.button !== 0) return;
      
      event.preventDefault();
      const element = itemRefs.current.get(itemId);
      if (!element) return;
      
      const position = { x: event.clientX, y: event.clientY };
      const rect = element.getBoundingClientRect();
      const offset = {
        x: position.x - rect.left,
        y: position.y - rect.top,
      };
      
      setActiveId(itemId);
      context.startDrag(
        {
          id: itemId,
          type: 'sortable',
          data: { index },
          index,
          sourceId: id,
        },
        position,
        offset
      );
      
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    }, [itemId, index, disabled, context, id]);
    
    const setNodeRef = useCallback((element: HTMLElement | null) => {
      if (element) {
        itemRefs.current.set(itemId, element);
      } else {
        itemRefs.current.delete(itemId);
      }
    }, [itemId]);
    
    const style: React.CSSProperties = useMemo(() => ({
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition: isDragging ? 'none' : 'transform 200ms ease',
      opacity: isDragging ? 0.5 : 1,
      cursor: isDragging ? 'grabbing' : 'grab',
    }), [transform, isDragging]);
    
    return {
      isDragging,
      isOver,
      transform,
      index,
      attributes: {
        role: 'listitem',
        'aria-roledescription': 'sortable item',
        tabIndex: disabled ? -1 : 0,
      },
      listeners: {
        onPointerDown: handlePointerDown,
      },
      setNodeRef,
      style,
    };
  }, [context, previewItems, disabled, id]);
  
  const containerProps = useMemo(() => ({
    role: 'list',
    'aria-label': 'Sortable list',
  }), []);
  
  return {
    activeItem,
    items: previewItems,
    useSortableItem,
    containerProps,
  };
}

// ============================================================================
// Sorting Helpers
// ============================================================================

/** Get the new order after a sort operation */
export function getSortedOrder<T extends { id: DragId }>(
  items: T[],
  activeId: DragId,
  overId: DragId
): T[] {
  return reorderItems(items, activeId, overId);
}

/** Calculate insertion index based on pointer position */
export function getInsertionPoint(
  items: Array<{ id: DragId; rect: DOMRect }>,
  pointer: Position,
  direction: 'vertical' | 'horizontal'
): number {
  for (let i = 0; i < items.length; i++) {
    const { rect } = items[i];
    const center = direction === 'vertical'
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    const pointerPos = direction === 'vertical' ? pointer.y : pointer.x;
    
    if (pointerPos < center) {
      return i;
    }
  }
  return items.length;
}

/** Create a stable sort key for animation */
export function createSortKey(id: DragId, index: number): string {
  return `${id}-${index}`;
}

export default useDragAndDrop;
