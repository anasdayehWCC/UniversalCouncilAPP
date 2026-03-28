'use client';

/**
 * DnD Provider Component
 * Context provider for drag and drop functionality
 */

import React, { useCallback, useReducer, useMemo, useEffect, useRef } from 'react';
import { DndContext, initialDragState } from '@/lib/dnd/context';
import { detectCollision } from '@/lib/dnd/utils';
import type {
  DndContextValue,
  DragState,
  DragItem,
  DropZone,
  DragId,
  Position,
  Rect,
  DragHandlers,
  CollisionAlgorithm,
} from '@/lib/dnd/types';

// Action types
type DragAction =
  | { type: 'START_DRAG'; item: DragItem; position: Position; offset: Position }
  | { type: 'UPDATE_DRAG'; position: Position }
  | { type: 'SET_OVER'; overId: DragId | null; overPosition?: Position | null }
  | { type: 'END_DRAG' }
  | { type: 'CANCEL_DRAG' };

// Reducer
function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case 'START_DRAG':
      return {
        isDragging: true,
        item: action.item,
        position: action.position,
        startPosition: action.position,
        offset: action.offset,
        overId: null,
        overPosition: null,
      };

    case 'UPDATE_DRAG':
      return {
        ...state,
        position: action.position,
      };

    case 'SET_OVER':
      return {
        ...state,
        overId: action.overId,
        overPosition: action.overPosition ?? null,
      };

    case 'END_DRAG':
    case 'CANCEL_DRAG':
      return initialDragState;

    default:
      return state;
  }
}

interface DndProviderProps extends DragHandlers {
  children: React.ReactNode;
  collisionAlgorithm?: CollisionAlgorithm;
  autoScroll?: boolean;
}

export function DndProvider({
  children,
  collisionAlgorithm = 'pointer',
  autoScroll = true,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: DndProviderProps) {
  const [state, dispatch] = useReducer(dragReducer, initialDragState);
  const dropZonesRef = useRef<Map<DragId, DropZone>>(new Map());
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Drop zone management
  const registerDropZone = useCallback((zone: DropZone) => {
    dropZonesRef.current.set(zone.id, zone);
  }, []);

  const unregisterDropZone = useCallback((id: DragId) => {
    dropZonesRef.current.delete(id);
  }, []);

  const updateDropZoneRect = useCallback((id: DragId, rect: Rect) => {
    const zone = dropZonesRef.current.get(id);
    if (zone) {
      dropZonesRef.current.set(id, { ...zone, rect });
    }
  }, []);

  // Drag operations
  const startDrag = useCallback((item: DragItem, position: Position, offset: Position) => {
    dispatch({ type: 'START_DRAG', item, position, offset });
    onDragStart?.(item);
  }, [onDragStart]);

  const updateDrag = useCallback((position: Position) => {
    dispatch({ type: 'UPDATE_DRAG', position });
    
    if (state.item) {
      onDragMove?.(state.item, position);

      // Collision detection
      const hitZone = detectCollision(
        position,
        null, // Could pass drag element rect here
        dropZonesRef.current,
        collisionAlgorithm
      );

      const newOverId = hitZone?.id ?? null;
      if (newOverId !== state.overId) {
        dispatch({ type: 'SET_OVER', overId: newOverId, overPosition: position });
      }
    }
  }, [state.item, state.overId, collisionAlgorithm, onDragMove]);

  const endDrag = useCallback(() => {
    if (state.item) {
      onDragEnd?.(state.item, state.overId);
    }
    dispatch({ type: 'END_DRAG' });
  }, [state.item, state.overId, onDragEnd]);

  const cancelDrag = useCallback(() => {
    if (state.item) {
      onDragCancel?.(state.item);
    }
    dispatch({ type: 'CANCEL_DRAG' });
  }, [state.item, onDragCancel]);

  const setOverId = useCallback((overId: DragId | null) => {
    dispatch({ type: 'SET_OVER', overId });
  }, []);

  // Auto-scroll during drag
  useEffect(() => {
    if (!autoScroll || !state.isDragging || !state.position) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    const scrollMargin = 50;
    const scrollSpeed = 10;

    const checkAndScroll = () => {
      if (!state.position) return;

      const { x, y } = state.position;
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      let scrollX = 0;
      let scrollY = 0;

      if (y < scrollMargin) {
        scrollY = -scrollSpeed;
      } else if (y > vh - scrollMargin) {
        scrollY = scrollSpeed;
      }

      if (x < scrollMargin) {
        scrollX = -scrollSpeed;
      } else if (x > vw - scrollMargin) {
        scrollX = scrollSpeed;
      }

      if (scrollX !== 0 || scrollY !== 0) {
        window.scrollBy(scrollX, scrollY);
      }
    };

    scrollIntervalRef.current = setInterval(checkAndScroll, 16);

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [autoScroll, state.isDragging, state.position]);

  // Handle escape key to cancel drag
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.isDragging) {
        cancelDrag();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isDragging, cancelDrag]);

  // Global pointer move/up handlers for reliable tracking
  useEffect(() => {
    if (!state.isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      updateDrag({ x: event.clientX, y: event.clientY });
    };

    const handlePointerUp = () => {
      endDrag();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [state.isDragging, updateDrag, endDrag]);

  // Context value
  const contextValue: DndContextValue = useMemo(() => ({
    state,
    dropZones: dropZonesRef.current,
    registerDropZone,
    unregisterDropZone,
    updateDropZoneRect,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    setOverId,
  }), [
    state,
    registerDropZone,
    unregisterDropZone,
    updateDropZoneRect,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    setOverId,
  ]);

  return (
    <DndContext.Provider value={contextValue}>
      {children}
      {/* Drag overlay for visual feedback */}
      {state.isDragging && (
        <div
          className="fixed inset-0 z-[9998] pointer-events-none"
          aria-hidden="true"
        />
      )}
    </DndContext.Provider>
  );
}

export default DndProvider;
