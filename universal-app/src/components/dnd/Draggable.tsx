'use client';

/**
 * Draggable Component
 * Wrapper that makes children draggable
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useDndContext } from '@/lib/dnd/context';
import {
  getPointerPosition,
  calculateOffset,
  exceedsDragThreshold,
  LONG_PRESS_THRESHOLD,
} from '@/lib/dnd/utils';
import type { DraggableProps, DragItem, Position } from '@/lib/dnd/types';

export function Draggable<T = unknown>({
  id,
  type = 'default',
  data,
  disabled = false,
  handle = false,
  children,
  onDragStart,
  onDragEnd,
  className,
  style,
}: DraggableProps<T>) {
  const { state, startDrag, updateDrag, endDrag } = useDndContext();
  const elementRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  
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

  // Handle pointer down
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled) return;
    
    // If using handle mode, check if the target is the handle
    if (handle && handleRef.current && !handleRef.current.contains(event.target as Node)) {
      return;
    }

    // Only respond to primary button (left click / touch)
    if (event.button !== 0) return;

    event.preventDefault();
    setIsPressed(true);
    
    const position = getPointerPosition(event);
    startPositionRef.current = position;

    // Set up long press detection for touch
    if (event.pointerType === 'touch') {
      longPressTimerRef.current = setTimeout(() => {
        if (startPositionRef.current && elementRef.current) {
          const offset = calculateOffset(elementRef.current, startPositionRef.current);
          const item = createDragItem();
          startDrag(item, startPositionRef.current, offset);
          isDraggingRef.current = true;
          onDragStart?.();
        }
      }, LONG_PRESS_THRESHOLD);
    }

    // Capture pointer for tracking
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, [disabled, handle, createDragItem, startDrag, onDragStart]);

  // Handle pointer move
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isPressed || disabled) return;

    const position = getPointerPosition(event);

    // If already dragging, update position
    if (isDraggingRef.current) {
      updateDrag(position);
      return;
    }

    // Check if we should start dragging (for mouse/pen)
    if (startPositionRef.current && event.pointerType !== 'touch') {
      if (exceedsDragThreshold(startPositionRef.current, position)) {
        // Clear long press timer
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        if (elementRef.current) {
          const offset = calculateOffset(elementRef.current, startPositionRef.current);
          const item = createDragItem();
          startDrag(item, position, offset);
          isDraggingRef.current = true;
          onDragStart?.();
        }
      }
    }

    // For touch, check if moved too far before long press completed
    if (event.pointerType === 'touch' && startPositionRef.current && !isDraggingRef.current) {
      if (exceedsDragThreshold(startPositionRef.current, position)) {
        // Cancel long press
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        setIsPressed(false);
        startPositionRef.current = null;
      }
    }
  }, [isPressed, disabled, updateDrag, createDragItem, startDrag, onDragStart]);

  // Handle pointer up
  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Release pointer capture
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
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDraggingRef.current) {
      endDrag();
    }

    setIsPressed(false);
    startPositionRef.current = null;
    isDraggingRef.current = false;
  }, [endDrag]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Calculate drag preview position
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

  return (
    <div
      ref={elementRef}
      className={cn(
        'touch-none select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && !isDragging && 'cursor-grab',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={{ ...style, ...dragStyle }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      data-draggable-id={id}
      data-dragging={isDragging}
    >
      {handle && (
        <div ref={handleRef} className="drag-handle cursor-grab">
          {/* Handle is identified by ref, children contain handle UI */}
        </div>
      )}
      {typeof children === 'function' ? children({ isDragging }) : children}
    </div>
  );
}

/** Drag handle component to use within Draggable */
export function DragHandle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('drag-handle cursor-grab', className)}>
      {children}
    </div>
  );
}

export default Draggable;
