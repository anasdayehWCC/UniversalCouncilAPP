/**
 * DnD Utilities
 * Position, collision detection, and helper utilities
 */

import type {
  Position,
  Rect,
  DragId,
  DropZone,
  DragItem,
  SortableItem,
  CollisionAlgorithm,
} from './types';

// ============================================================================
// Position Utilities
// ============================================================================

/** Get position from mouse event */
export function getMousePosition(event: MouseEvent | React.MouseEvent): Position {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

/** Get position from touch event */
export function getTouchPosition(event: TouchEvent | React.TouchEvent): Position | null {
  const touch = event.touches[0] || event.changedTouches[0];
  if (!touch) return null;
  return {
    x: touch.clientX,
    y: touch.clientY,
  };
}

/** Get position from pointer event */
export function getPointerPosition(event: PointerEvent | React.PointerEvent): Position {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

/** Calculate distance between two positions */
export function distance(a: Position, b: Position): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/** Calculate offset from element to position */
export function calculateOffset(element: HTMLElement, position: Position): Position {
  const rect = element.getBoundingClientRect();
  return {
    x: position.x - rect.left,
    y: position.y - rect.top,
  };
}

/** Add two positions */
export function addPositions(a: Position, b: Position): Position {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

/** Subtract positions (a - b) */
export function subtractPositions(a: Position, b: Position): Position {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

/** Get center of rect */
export function getRectCenter(rect: Rect): Position {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/** Clamp position within bounds */
export function clampPosition(
  position: Position,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): Position {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y)),
  };
}

// ============================================================================
// Collision Detection
// ============================================================================

/** Check if point is inside rect */
export function isPointInRect(point: Position, rect: Rect): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

/** Check if two rects intersect */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

/** Calculate intersection area of two rects */
export function intersectionArea(a: Rect, b: Rect): number {
  const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return xOverlap * yOverlap;
}

/** Calculate intersection ratio (0-1) */
export function intersectionRatio(target: Rect, source: Rect): number {
  const area = intersectionArea(target, source);
  const sourceArea = source.width * source.height;
  return sourceArea > 0 ? area / sourceArea : 0;
}

/** Find drop zone using collision algorithm */
export function detectCollision(
  position: Position,
  dragRect: Rect | null,
  dropZones: Map<DragId, DropZone>,
  algorithm: CollisionAlgorithm = 'pointer'
): DropZone | null {
  let bestMatch: DropZone | null = null;
  let bestScore = -Infinity;

  for (const zone of dropZones.values()) {
    if (!zone.rect || zone.disabled) continue;

    let score: number;
    
    switch (algorithm) {
      case 'pointer':
        if (isPointInRect(position, zone.rect)) {
          score = 1;
        } else {
          score = -1;
        }
        break;

      case 'center':
        if (dragRect) {
          const dragCenter = getRectCenter(dragRect);
          if (isPointInRect(dragCenter, zone.rect)) {
            score = 1;
          } else {
            score = -distance(dragCenter, getRectCenter(zone.rect));
          }
        } else {
          score = isPointInRect(position, zone.rect) ? 1 : -1;
        }
        break;

      case 'rect':
        if (dragRect) {
          score = intersectionArea(dragRect, zone.rect);
        } else {
          score = isPointInRect(position, zone.rect) ? 1 : -1;
        }
        break;

      case 'closest':
        const zoneCenter = getRectCenter(zone.rect);
        score = -distance(position, zoneCenter);
        break;

      default:
        score = isPointInRect(position, zone.rect) ? 1 : -1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = zone;
    }
  }

  // Only return match if it has a positive score (or is the closest for 'closest' algorithm)
  if (algorithm === 'closest') {
    return bestMatch;
  }
  return bestScore > 0 ? bestMatch : null;
}

// ============================================================================
// Array Reordering
// ============================================================================

/** Reorder array by moving item from one index to another */
export function reorderArray<T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/** Move item between arrays */
export function moveItemBetweenArrays<T>(
  sourceArray: T[],
  destinationArray: T[],
  sourceIndex: number,
  destinationIndex: number
): { source: T[]; destination: T[] } {
  const source = [...sourceArray];
  const destination = [...destinationArray];
  const [removed] = source.splice(sourceIndex, 1);
  destination.splice(destinationIndex, 0, removed);
  return { source, destination };
}

/** Calculate insertion index based on position */
export function getInsertionIndex(
  position: Position,
  items: Array<{ rect: Rect }>,
  direction: 'vertical' | 'horizontal'
): number {
  const axis = direction === 'vertical' ? 'y' : 'x';
  const rectProp = direction === 'vertical' ? 'top' : 'left';
  const sizeProp = direction === 'vertical' ? 'height' : 'width';

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemCenter = item.rect[rectProp] + item.rect[sizeProp] / 2;
    
    if (position[axis] < itemCenter) {
      return i;
    }
  }
  
  return items.length;
}

// ============================================================================
// Touch Gesture Utilities
// ============================================================================

/** Long press threshold in ms */
export const LONG_PRESS_THRESHOLD = 500;

/** Drag threshold in pixels */
export const DRAG_THRESHOLD = 10;

/** Check if movement exceeds drag threshold */
export function exceedsDragThreshold(start: Position, current: Position): boolean {
  return distance(start, current) > DRAG_THRESHOLD;
}

/** Calculate velocity from positions and time */
export function calculateVelocity(
  positions: Position[],
  timestamps: number[]
): Position {
  if (positions.length < 2 || timestamps.length < 2) {
    return { x: 0, y: 0 };
  }

  const lastIndex = positions.length - 1;
  const timeDelta = timestamps[lastIndex] - timestamps[lastIndex - 1];
  
  if (timeDelta === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: (positions[lastIndex].x - positions[lastIndex - 1].x) / timeDelta,
    y: (positions[lastIndex].y - positions[lastIndex - 1].y) / timeDelta,
  };
}

// ============================================================================
// File Drop Utilities
// ============================================================================

/** Check if data transfer contains files */
export function hasFiles(dataTransfer: DataTransfer): boolean {
  if (dataTransfer.types.includes('Files')) return true;
  return Array.from(dataTransfer.items).some(item => item.kind === 'file');
}

/** Get files from data transfer */
export function getFiles(dataTransfer: DataTransfer): File[] {
  return Array.from(dataTransfer.files);
}

/** Filter files by accepted types */
export function filterFilesByType(files: File[], accept: string[]): File[] {
  if (accept.length === 0) return files;
  
  return files.filter(file => {
    const mimeType = file.type.toLowerCase();
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    return accept.some(accepted => {
      const normalized = accepted.toLowerCase().trim();
      
      // Check extension
      if (normalized.startsWith('.')) {
        return extension === normalized;
      }
      
      // Check mime type (with wildcard support)
      if (normalized.endsWith('/*')) {
        const prefix = normalized.slice(0, -1);
        return mimeType.startsWith(prefix);
      }
      
      return mimeType === normalized;
    });
  });
}

/** Filter files by size */
export function filterFilesBySize(files: File[], maxSize: number): File[] {
  return files.filter(file => file.size <= maxSize);
}

// ============================================================================
// DOM Utilities
// ============================================================================

/** Get scrollable parent */
export function getScrollableParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  
  while (parent) {
    const { overflow, overflowY, overflowX } = getComputedStyle(parent);
    if (/(auto|scroll)/.test(overflow + overflowY + overflowX)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  
  return null;
}

/** Check if element is scrollable */
export function isScrollable(element: HTMLElement): boolean {
  const { overflow, overflowY, overflowX } = getComputedStyle(element);
  return /(auto|scroll)/.test(overflow + overflowY + overflowX);
}

/** Scroll element into view if needed */
export function scrollIntoViewIfNeeded(
  element: HTMLElement,
  scrollParent: HTMLElement,
  options?: { margin?: number }
): void {
  const margin = options?.margin ?? 20;
  const elementRect = element.getBoundingClientRect();
  const parentRect = scrollParent.getBoundingClientRect();

  if (elementRect.top < parentRect.top + margin) {
    scrollParent.scrollTop -= parentRect.top + margin - elementRect.top;
  } else if (elementRect.bottom > parentRect.bottom - margin) {
    scrollParent.scrollTop += elementRect.bottom - parentRect.bottom + margin;
  }

  if (elementRect.left < parentRect.left + margin) {
    scrollParent.scrollLeft -= parentRect.left + margin - elementRect.left;
  } else if (elementRect.right > parentRect.right - margin) {
    scrollParent.scrollLeft += elementRect.right - parentRect.right + margin;
  }
}

// ============================================================================
// ID Generation
// ============================================================================

/** Generate unique drag ID */
export function generateDragId(prefix = 'drag'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Sortable Utilities
// ============================================================================

/** Find item index by ID */
export function findItemIndex<T>(items: SortableItem<T>[], id: DragId): number {
  return items.findIndex(item => item.id === id);
}

/** Get items between indices (inclusive) */
export function getItemsBetween<T>(
  items: SortableItem<T>[],
  startIndex: number,
  endIndex: number
): SortableItem<T>[] {
  const [min, max] = startIndex < endIndex 
    ? [startIndex, endIndex] 
    : [endIndex, startIndex];
  return items.slice(min, max + 1);
}

/** Create preview order for sortable list */
export function createPreviewOrder<T>(
  items: SortableItem<T>[],
  activeId: DragId,
  overId: DragId
): SortableItem<T>[] {
  const activeIndex = findItemIndex(items, activeId);
  const overIndex = findItemIndex(items, overId);
  
  if (activeIndex === -1 || overIndex === -1) {
    return items;
  }
  
  return reorderArray(items, activeIndex, overIndex);
}
