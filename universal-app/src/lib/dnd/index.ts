/**
 * DnD Library - Main Export
 * 
 * Unified drag and drop system supporting both native implementation
 * and @dnd-kit when available.
 * 
 * Install @dnd-kit packages if not present:
 * npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
 */

// Re-export types
export * from './types';

// Re-export context and utilities
export {
  DndContext,
  useDndContext,
  initialDragState,
  createDragState,
  updateDragPosition,
  setOverDropZone,
  resetDragState,
  canDropInZone,
  findDropZoneAtPosition,
  getElementRect,
} from './context';

// Re-export utilities
export {
  // Position utilities
  getMousePosition,
  getTouchPosition,
  getPointerPosition,
  distance,
  calculateOffset,
  addPositions,
  subtractPositions,
  getRectCenter,
  clampPosition,
  // Collision detection
  isPointInRect,
  rectsIntersect,
  intersectionArea,
  intersectionRatio,
  detectCollision,
  // Sorting utilities
  reorderArray,
  getInsertionIndex,
  // Touch utilities
  exceedsDragThreshold,
  // File utilities
  hasFiles,
  getFiles,
  filterFilesByType,
  filterFilesBySize,
  // Constants
  DRAG_THRESHOLD,
  LONG_PRESS_THRESHOLD,
} from './utils';

// Re-export dnd-kit adapters
export * from './dnd-kit-adapter';
