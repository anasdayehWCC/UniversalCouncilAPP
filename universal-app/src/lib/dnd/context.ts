/**
 * DnD Context
 * React context for drag and drop state management
 */

import { createContext, useContext } from 'react';
import type {
  DndContextValue,
  DragState,
  DragItem,
  DropZone,
  DragId,
  Position,
  Rect,
} from './types';

/** Initial drag state */
export const initialDragState: DragState = {
  isDragging: false,
  item: null,
  position: null,
  startPosition: null,
  offset: null,
  overId: null,
  overPosition: null,
};

/** Default context value (throws if used outside provider) */
const defaultContextValue: DndContextValue = {
  state: initialDragState,
  dropZones: new Map(),
  registerDropZone: () => {
    throw new Error('DndContext: registerDropZone called outside provider');
  },
  unregisterDropZone: () => {
    throw new Error('DndContext: unregisterDropZone called outside provider');
  },
  updateDropZoneRect: () => {
    throw new Error('DndContext: updateDropZoneRect called outside provider');
  },
  startDrag: () => {
    throw new Error('DndContext: startDrag called outside provider');
  },
  updateDrag: () => {
    throw new Error('DndContext: updateDrag called outside provider');
  },
  endDrag: () => {
    throw new Error('DndContext: endDrag called outside provider');
  },
  cancelDrag: () => {
    throw new Error('DndContext: cancelDrag called outside provider');
  },
  setOverId: () => {
    throw new Error('DndContext: setOverId called outside provider');
  },
};

/** DnD Context */
export const DndContext = createContext<DndContextValue>(defaultContextValue);

/** Hook to access DnD context */
export function useDndContext(): DndContextValue {
  const context = useContext(DndContext);
  if (context === defaultContextValue) {
    throw new Error('useDndContext must be used within a DndProvider');
  }
  return context;
}

/** Create a new drag state with item */
export function createDragState<T>(
  item: DragItem<T>,
  position: Position,
  offset: Position
): DragState<T> {
  return {
    isDragging: true,
    item,
    position,
    startPosition: position,
    offset,
    overId: null,
    overPosition: null,
  };
}

/** Update drag position in state */
export function updateDragPosition(
  state: DragState,
  position: Position
): DragState {
  return {
    ...state,
    position,
  };
}

/** Set over drop zone in state */
export function setOverDropZone(
  state: DragState,
  overId: DragId | null,
  overPosition: Position | null = null
): DragState {
  return {
    ...state,
    overId,
    overPosition,
  };
}

/** Reset drag state */
export function resetDragState(): DragState {
  return { ...initialDragState };
}

/** Check if item can be dropped in zone */
export function canDropInZone(item: DragItem, zone: DropZone): boolean {
  if (zone.disabled) return false;
  return zone.acceptTypes.includes(item.type) || zone.acceptTypes.includes('default');
}

/** Find drop zone at position */
export function findDropZoneAtPosition(
  dropZones: Map<DragId, DropZone>,
  position: Position,
  excludeId?: DragId
): DropZone | null {
  for (const [id, zone] of dropZones) {
    if (id === excludeId) continue;
    if (!zone.rect) continue;
    
    const { top, left, right, bottom } = zone.rect;
    if (
      position.x >= left &&
      position.x <= right &&
      position.y >= top &&
      position.y <= bottom
    ) {
      return zone;
    }
  }
  return null;
}

/** Get element rect */
export function getElementRect(element: HTMLElement): Rect {
  const domRect = element.getBoundingClientRect();
  return {
    top: domRect.top,
    left: domRect.left,
    right: domRect.right,
    bottom: domRect.bottom,
    width: domRect.width,
    height: domRect.height,
  };
}
