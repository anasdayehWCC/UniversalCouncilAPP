/**
 * Drag and Drop Types
 * Core type definitions for the DnD system
 */

/** Unique identifier for drag items */
export type DragId = string | number;

/** Supported drag item types */
export type DragItemType = 
  | 'default' 
  | 'file' 
  | 'sortable' 
  | 'custom'
  // Entity types from dnd-kit-adapter
  | 'meeting'
  | 'template'
  | 'segment'
  | 'minute-section'
  | 'review-item'
  | 'sidebar-item';

/** Position coordinates */
export interface Position {
  x: number;
  y: number;
}

/** Bounding rectangle */
export interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** Drag item representation */
export interface DragItem<T = unknown> {
  /** Unique identifier */
  id: DragId;
  /** Item type for filtering */
  type: DragItemType;
  /** Custom data payload */
  data: T;
  /** Source index (for sortable lists) */
  index?: number;
  /** Source container ID */
  sourceId?: DragId;
}

/** Drop zone configuration */
export interface DropZone {
  /** Unique identifier */
  id: DragId;
  /** Accepted item types */
  acceptTypes: DragItemType[];
  /** Whether the zone is disabled */
  disabled?: boolean;
  /** Bounding rect (updated on mount/resize) */
  rect?: Rect;
}

/** Current drag state */
export interface DragState<T = unknown> {
  /** Whether a drag is in progress */
  isDragging: boolean;
  /** Currently dragged item */
  item: DragItem<T> | null;
  /** Current pointer position */
  position: Position | null;
  /** Initial pointer position */
  startPosition: Position | null;
  /** Offset from drag handle to pointer */
  offset: Position | null;
  /** Currently hovered drop zone */
  overId: DragId | null;
  /** Hover position within drop zone */
  overPosition: Position | null;
}

/** Drag event handlers */
export interface DragHandlers {
  onDragStart?: (item: DragItem) => void;
  onDragMove?: (item: DragItem, position: Position) => void;
  onDragEnd?: (item: DragItem, dropZoneId: DragId | null) => void;
  onDragCancel?: (item: DragItem) => void;
}

/** Drop event handlers */
export interface DropHandlers<T = unknown> {
  onDragEnter?: (item: DragItem<T>) => void;
  onDragOver?: (item: DragItem<T>, position: Position) => void;
  onDragLeave?: (item: DragItem<T>) => void;
  onDrop?: (item: DragItem<T>, position: Position) => void;
}

/** File drop data */
export interface FileDropData {
  files: File[];
  items: DataTransferItem[];
}

/** Sortable item */
export interface SortableItem<T = unknown> {
  id: DragId;
  data: T;
}

/** Sortable list state */
export interface SortableState<T = unknown> {
  items: SortableItem<T>[];
  activeId: DragId | null;
  overId: DragId | null;
  isDragging: boolean;
}

/** Reorder result */
export interface ReorderResult<T = unknown> {
  items: SortableItem<T>[];
  fromIndex: number;
  toIndex: number;
}

/** Touch gesture state */
export interface TouchGestureState {
  isTouching: boolean;
  startTime: number | null;
  startPosition: Position | null;
  currentPosition: Position | null;
  velocity: Position | null;
  isLongPress: boolean;
}

/** Collision detection algorithm */
export type CollisionAlgorithm = 'rect' | 'center' | 'pointer' | 'closest';

/** DnD context value */
export interface DndContextValue {
  state: DragState;
  dropZones: Map<DragId, DropZone>;
  registerDropZone: (zone: DropZone) => void;
  unregisterDropZone: (id: DragId) => void;
  updateDropZoneRect: (id: DragId, rect: Rect) => void;
  startDrag: (item: DragItem, position: Position, offset: Position) => void;
  updateDrag: (position: Position) => void;
  endDrag: () => void;
  cancelDrag: () => void;
  setOverId: (id: DragId | null) => void;
}

/** Draggable props */
export interface DraggableProps<T = unknown> {
  id: DragId;
  type?: DragItemType;
  data?: T;
  disabled?: boolean;
  handle?: boolean;
  children: React.ReactNode | ((state: { isDragging: boolean }) => React.ReactNode);
  onDragStart?: () => void;
  onDragEnd?: (dropZoneId: DragId | null) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Droppable props */
export interface DroppableProps<T = unknown> {
  id: DragId;
  acceptTypes?: DragItemType[];
  disabled?: boolean;
  children: React.ReactNode | ((state: { isOver: boolean; canDrop: boolean }) => React.ReactNode);
  onDrop?: (item: DragItem<T>) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Sortable list props */
export interface SortableListProps<T> {
  items: SortableItem<T>[];
  onReorder: (result: ReorderResult<T>) => void;
  renderItem: (item: SortableItem<T>, index: number, isDragging: boolean) => React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  gap?: number;
}

/** File drop zone props */
export interface FileDropZoneProps {
  onFileDrop: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  children: React.ReactNode | ((state: { isOver: boolean; isDragActive: boolean }) => React.ReactNode);
  className?: string;
}
