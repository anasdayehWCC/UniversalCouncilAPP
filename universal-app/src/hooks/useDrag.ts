'use client';

/**
 * useDrag Hook
 * Hook for making elements draggable
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useDndContext } from '@/lib/dnd/context';
import {
  getPointerPosition,
  calculateOffset,
  exceedsDragThreshold,
  LONG_PRESS_THRESHOLD,
} from '@/lib/dnd/utils';
import type { DragId, DragItemType, Position, DragItem } from '@/lib/dnd/types';

export interface UseDragOptions<T = unknown> {
  /** Unique identifier for the draggable item */
  id: DragId;
  /** Type of the draggable item */
  type?: DragItemType;
  /** Data payload */
  data?: T;
  /** Whether dragging is disabled */
  disabled?: boolean;
  /** Callback when drag starts */
  onDragStart?: () => void;
  /** Callback when drag ends */
  onDragEnd?: (dropZoneId: DragId | null) => void;
}

export interface UseDragReturn {
  /** Whether this item is currently being dragged */
  isDragging: boolean;
  /** Props to spread on the draggable element */
  dragProps: {
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerCancel: () => void;
    'data-draggable-id': DragId;
    'data-dragging': boolean;
    className: string;
    style: React.CSSProperties;
  };
  /** Ref to attach to the draggable element */
  setNodeRef: (element: HTMLElement | null) => void;
  /** Manually start dragging */
  startDrag: (position: Position) => void;
  /** Manually cancel dragging */
  cancelDrag: () => void;
}

export function useDrag<T = unknown>({
  id,
  type = 'default',
  data,
  disabled = false,
  onDragStart,
  onDragEnd,
}: UseDragOptions<T>): UseDragReturn {
  const { state, startDrag, updateDrag, endDrag, cancelDrag: contextCancelDrag } = useDndContext();
  
  const nodeRef = useRef<HTMLElement | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const startPositionRef = useRef<Position | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);

  const isDragging = state.isDragging && state.item?.id === id;

  // Create drag item
  const createDragItem = useCallback((): DragItem<T> => ({
    id,
    type,
    data: data as T,
  }), [id, type, data]);

  // Start dragging programmatically
  const startDragManual = useCallback((position: Position) => {
    if (disabled || !nodeRef.current) return;
    
    const offset = calculateOffset(nodeRef.current, position);
    const item = createDragItem();
    startDrag(item, position, offset);
    isDraggingRef.current = true;
    onDragStart?.();
  }, [disabled, createDragItem, startDrag, onDragStart]);

  // Cancel drag programmatically
  const cancelDragManual = useCallback(() => {
    if (isDraggingRef.current) {
      contextCancelDrag();
      isDraggingRef.current = false;
    }
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    setIsPressed(false);
    startPositionRef.current = null;
  }, [contextCancelDrag]);

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
        if (startPositionRef.current) {
          startDragManual(startPositionRef.current);
        }
      }, LONG_PRESS_THRESHOLD);
    }

    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, [disabled, startDragManual]);

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
        startDragManual(position);
      }
    }

    // Cancel for touch if moved too far
    if (event.pointerType === 'touch' && startPositionRef.current && !isDraggingRef.current) {
      if (exceedsDragThreshold(startPositionRef.current, position)) {
        cancelDragManual();
      }
    }
  }, [isPressed, disabled, updateDrag, startDragManual, cancelDragManual]);

  // Handle pointer up
  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    (event.target as HTMLElement).releasePointerCapture(event.pointerId);

    if (isDraggingRef.current) {
      const dropZoneId = state.overId;
      endDrag();
      onDragEnd?.(dropZoneId);
    }

    setIsPressed(false);
    startPositionRef.current = null;
    isDraggingRef.current = false;
  }, [state.overId, endDrag, onDragEnd]);

  // Handle pointer cancel
  const handlePointerCancel = useCallback(() => {
    cancelDragManual();
  }, [cancelDragManual]);

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

  // Calculate style for dragging state
  const dragStyle: React.CSSProperties = isDragging && state.position && state.offset
    ? {
        position: 'fixed',
        left: state.position.x - state.offset.x,
        top: state.position.y - state.offset.y,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: 0.8,
        transform: 'scale(1.02)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      }
    : {};

  return {
    isDragging,
    dragProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      'data-draggable-id': id,
      'data-dragging': isDragging,
      className: `touch-none select-none ${disabled ? 'cursor-not-allowed opacity-50' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`,
      style: dragStyle,
    },
    setNodeRef,
    startDrag: startDragManual,
    cancelDrag: cancelDragManual,
  };
}

export default useDrag;
