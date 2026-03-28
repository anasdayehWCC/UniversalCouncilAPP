/**
 * DnD Kit Adapter
 * 
 * Integration layer for @dnd-kit/core and @dnd-kit/sortable.
 * Provides drag handlers for meetings, templates, and segments.
 * 
 * @requires @dnd-kit/core
 * @requires @dnd-kit/sortable
 * @requires @dnd-kit/utilities
 */

import type {
  DragId,
  DragItemType,
  Position,
  SortableItem,
  ReorderResult,
} from './types';

// ============================================================================
// Types for DnD Kit Integration
// ============================================================================

/** Supported draggable entity types in the application */
export type DraggableEntityType = 
  | 'meeting'
  | 'template'
  | 'segment'
  | 'minute-section'
  | 'review-item'
  | 'sidebar-item';

/** Drag data payload for meetings */
export interface MeetingDragData {
  type: 'meeting';
  meetingId: string;
  title: string;
  date?: string;
  status?: string;
}

/** Drag data payload for templates */
export interface TemplateDragData {
  type: 'template';
  templateId: string;
  name: string;
  category?: string;
}

/** Drag data payload for transcript segments */
export interface SegmentDragData {
  type: 'segment';
  segmentId: string;
  speakerId?: string;
  timestamp?: number;
  text?: string;
}

/** Drag data payload for minute sections */
export interface MinuteSectionDragData {
  type: 'minute-section';
  sectionId: string;
  title: string;
  order: number;
}

/** Union of all drag data types */
export type DragData = 
  | MeetingDragData 
  | TemplateDragData 
  | SegmentDragData 
  | MinuteSectionDragData
  | { type: DraggableEntityType; [key: string]: unknown };

// ============================================================================
// Drag Handlers
// ============================================================================

/** Create a drag handler configuration for meetings */
export function createMeetingDragHandler(meetingData: Omit<MeetingDragData, 'type'>) {
  return {
    id: `meeting-${meetingData.meetingId}`,
    data: { type: 'meeting' as const, ...meetingData },
  };
}

/** Create a drag handler configuration for templates */
export function createTemplateDragHandler(templateData: Omit<TemplateDragData, 'type'>) {
  return {
    id: `template-${templateData.templateId}`,
    data: { type: 'template' as const, ...templateData },
  };
}

/** Create a drag handler configuration for segments */
export function createSegmentDragHandler(segmentData: Omit<SegmentDragData, 'type'>) {
  return {
    id: `segment-${segmentData.segmentId}`,
    data: { type: 'segment' as const, ...segmentData },
  };
}

/** Create a drag handler configuration for minute sections */
export function createMinuteSectionDragHandler(sectionData: Omit<MinuteSectionDragData, 'type'>) {
  return {
    id: `section-${sectionData.sectionId}`,
    data: { type: 'minute-section' as const, ...sectionData },
  };
}

// ============================================================================
// Drop Zone Utilities
// ============================================================================

/** Drop zone configuration */
export interface DropZoneConfig {
  id: string;
  accepts: DraggableEntityType[];
  onDrop?: (data: DragData) => void;
}

/** Create a drop zone that accepts specific entity types */
export function createDropZone(config: DropZoneConfig) {
  return {
    id: config.id,
    data: {
      accepts: config.accepts,
      onDrop: config.onDrop,
    },
  };
}

/** Check if a drop zone accepts a dragged item */
export function canAcceptDrop(
  dropZoneAccepts: DraggableEntityType[],
  dragType: DraggableEntityType
): boolean {
  return dropZoneAccepts.includes(dragType);
}

// ============================================================================
// Reorder Utilities
// ============================================================================

/** Reorder items in a list */
export function reorderItems<T extends { id: DragId }>(
  items: T[],
  activeId: DragId,
  overId: DragId
): T[] {
  const oldIndex = items.findIndex((item) => item.id === activeId);
  const newIndex = items.findIndex((item) => item.id === overId);
  
  if (oldIndex === -1 || newIndex === -1) {
    return items;
  }
  
  const newItems = [...items];
  const [removed] = newItems.splice(oldIndex, 1);
  newItems.splice(newIndex, 0, removed);
  
  return newItems;
}

/** Move item between lists */
export function moveItemBetweenLists<T extends { id: DragId }>(
  sourceList: T[],
  targetList: T[],
  activeId: DragId,
  overId: DragId | null
): { source: T[]; target: T[] } {
  const itemIndex = sourceList.findIndex((item) => item.id === activeId);
  
  if (itemIndex === -1) {
    return { source: sourceList, target: targetList };
  }
  
  const [item] = sourceList.splice(itemIndex, 1);
  const newSource = [...sourceList];
  
  let targetIndex = targetList.length;
  if (overId !== null) {
    const overIndex = targetList.findIndex((item) => item.id === overId);
    if (overIndex !== -1) {
      targetIndex = overIndex;
    }
  }
  
  const newTarget = [...targetList];
  newTarget.splice(targetIndex, 0, item);
  
  return { source: newSource, target: newTarget };
}

// ============================================================================
// Animation Configurations
// ============================================================================

/** Default drag overlay animation */
export const defaultDragOverlayAnimation = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { duration: 0.2 },
};

/** Default sort animation duration in ms */
export const SORT_ANIMATION_DURATION = 250;

/** Spring animation config for sorting */
export const sortSpringConfig = {
  stiffness: 300,
  damping: 30,
};

// ============================================================================
// Accessibility Announcements
// ============================================================================

/** Generate accessibility announcement for drag start */
export function announceDragStart(item: DragData, index: number): string {
  const itemType = item.type;
  const itemName = 'title' in item ? item.title : 'name' in item ? item.name : 'Item';
  return `Picked up ${itemType} "${itemName}" at position ${index + 1}`;
}

/** Generate accessibility announcement for drag over */
export function announceDragOver(
  item: DragData, 
  fromIndex: number, 
  toIndex: number
): string {
  const itemType = item.type;
  return `${itemType} moved from position ${fromIndex + 1} to position ${toIndex + 1}`;
}

/** Generate accessibility announcement for drag end */
export function announceDragEnd(
  item: DragData, 
  fromIndex: number, 
  toIndex: number
): string {
  const itemType = item.type;
  const itemName = 'title' in item ? item.title : 'name' in item ? item.name : 'Item';
  
  if (fromIndex === toIndex) {
    return `${itemType} "${itemName}" returned to original position ${fromIndex + 1}`;
  }
  
  return `${itemType} "${itemName}" dropped at position ${toIndex + 1}`;
}

/** Generate accessibility announcement for drag cancel */
export function announceDragCancel(item: DragData, index: number): string {
  const itemType = item.type;
  const itemName = 'title' in item ? item.title : 'name' in item ? item.name : 'Item';
  return `Dragging ${itemType} "${itemName}" was cancelled. Item returned to position ${index + 1}`;
}

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

/** Keyboard codes for drag and drop */
export const DND_KEYS = {
  start: ['Space', 'Enter'],
  cancel: ['Escape'],
  drop: ['Space', 'Enter'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
} as const;

/** Check if a keyboard event should initiate a drag */
export function isDragStartKey(event: KeyboardEvent): boolean {
  return DND_KEYS.start.includes(event.code as any);
}

/** Check if a keyboard event should cancel a drag */
export function isDragCancelKey(event: KeyboardEvent): boolean {
  return DND_KEYS.cancel.includes(event.code as any);
}
