'use client';

/**
 * useDrop Hook
 * Hook for creating drop zones
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useDndContext, getElementRect, canDropInZone } from '@/lib/dnd/context';
import { isPointInRect, hasFiles, getFiles, filterFilesByType, filterFilesBySize } from '@/lib/dnd/utils';
import type { DragId, DragItemType, DragItem, DropZone, Rect, Position } from '@/lib/dnd/types';

export interface UseDropOptions<T = unknown> {
  /** Unique identifier for the drop zone */
  id: DragId;
  /** Accepted item types */
  accept?: DragItemType[];
  /** Whether the drop zone is disabled */
  disabled?: boolean;
  /** Callback when an item is dropped */
  onDrop?: (item: DragItem<T>) => void;
  /** Callback when drag enters */
  onDragEnter?: () => void;
  /** Callback when drag leaves */
  onDragLeave?: () => void;
  /** Callback during drag over */
  onDragOver?: (item: DragItem<T>, position: Position) => void;
}

export interface UseDropReturn {
  /** Whether a dragged item is over this zone */
  isOver: boolean;
  /** Whether the dragged item can be dropped */
  canDrop: boolean;
  /** The item currently being dragged over this zone */
  dragItem: DragItem | null;
  /** Props to spread on the droppable element */
  dropProps: {
    onPointerMove: (event: React.PointerEvent) => void;
    'data-droppable-id': DragId;
    'data-over': boolean;
    'data-can-drop': boolean;
    className: string;
  };
  /** Ref to attach to the droppable element */
  setNodeRef: (element: HTMLElement | null) => void;
}

export function useDrop<T = unknown>({
  id,
  accept = ['default'],
  disabled = false,
  onDrop,
  onDragEnter,
  onDragLeave,
  onDragOver,
}: UseDropOptions<T>): UseDropReturn {
  const { state, registerDropZone, unregisterDropZone, updateDropZoneRect, setOverId } = useDndContext();
  
  const nodeRef = useRef<HTMLElement | null>(null);
  const wasOverRef = useRef(false);
  const rectRef = useRef<Rect | null>(null);

  // Register drop zone
  useEffect(() => {
    const zone: DropZone = {
      id,
      acceptTypes: accept,
      disabled,
    };
    registerDropZone(zone);

    // Update rect if element exists
    if (nodeRef.current) {
      const rect = getElementRect(nodeRef.current);
      updateDropZoneRect(id, rect);
      rectRef.current = rect;
    }

    return () => {
      unregisterDropZone(id);
    };
  }, [id, accept, disabled, registerDropZone, unregisterDropZone, updateDropZoneRect]);

  // Update rect on resize
  useEffect(() => {
    if (!nodeRef.current) return;

    const observer = new ResizeObserver(() => {
      if (nodeRef.current) {
        const rect = getElementRect(nodeRef.current);
        updateDropZoneRect(id, rect);
        rectRef.current = rect;
      }
    });

    observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [id, updateDropZoneRect]);

  // Check if over this zone
  const isOver = state.isDragging && state.overId === id;
  
  // Check if item can drop
  const canDrop = state.isDragging && state.item
    ? !disabled && accept.includes(state.item.type)
    : false;

  // Get current drag item if over
  const dragItem = isOver ? state.item : null;

  // Handle enter/leave callbacks
  useEffect(() => {
    if (isOver && !wasOverRef.current) {
      onDragEnter?.();
    } else if (!isOver && wasOverRef.current) {
      onDragLeave?.();
    }
    wasOverRef.current = isOver;
  }, [isOver, onDragEnter, onDragLeave]);

  // Handle drop when drag ends
  const prevIsDraggingRef = useRef(state.isDragging);
  useEffect(() => {
    // Detect drag end while over this zone
    if (prevIsDraggingRef.current && !state.isDragging && wasOverRef.current && state.item) {
      onDrop?.(state.item as DragItem<T>);
    }
    prevIsDraggingRef.current = state.isDragging;
  }, [state.isDragging, state.item, onDrop]);

  // Handle pointer move for collision detection
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!state.isDragging || disabled || !rectRef.current) return;

    const position = { x: event.clientX, y: event.clientY };
    const isInside = isPointInRect(position, rectRef.current);

    if (isInside && state.item && accept.includes(state.item.type)) {
      if (state.overId !== id) {
        setOverId(id);
      }
      onDragOver?.(state.item as DragItem<T>, position);
    } else if (state.overId === id) {
      setOverId(null);
    }
  }, [state.isDragging, state.item, state.overId, disabled, accept, id, setOverId, onDragOver]);

  // Set node ref
  const setNodeRef = useCallback((element: HTMLElement | null) => {
    nodeRef.current = element;
    if (element) {
      const rect = getElementRect(element);
      updateDropZoneRect(id, rect);
      rectRef.current = rect;
    }
  }, [id, updateDropZoneRect]);

  return {
    isOver,
    canDrop,
    dragItem,
    dropProps: {
      onPointerMove: handlePointerMove,
      'data-droppable-id': id,
      'data-over': isOver,
      'data-can-drop': canDrop,
      className: `transition-colors duration-150 ${isOver && canDrop ? 'ring-2 ring-primary bg-primary/5' : ''} ${isOver && !canDrop ? 'ring-2 ring-destructive bg-destructive/5' : ''} ${disabled ? 'opacity-50' : ''}`,
    },
    setNodeRef,
  };
}

// ============================================================================
// File Drop Hook
// ============================================================================

export interface UseFileDropOptions {
  /** Callback when files are dropped */
  onDrop: (files: File[]) => void;
  /** Accepted file types (MIME types or extensions) */
  accept?: string[];
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Whether file drop is disabled */
  disabled?: boolean;
}

export interface UseFileDropReturn {
  /** Whether files are being dragged over */
  isOver: boolean;
  /** Whether drag is active (files in window) */
  isDragActive: boolean;
  /** Props to spread on the drop zone element */
  fileDropProps: {
    onDragEnter: (event: React.DragEvent) => void;
    onDragLeave: (event: React.DragEvent) => void;
    onDragOver: (event: React.DragEvent) => void;
    onDrop: (event: React.DragEvent) => void;
    onClick: () => void;
  };
  /** Open file picker programmatically */
  openFilePicker: () => void;
}

export function useFileDrop({
  onDrop,
  accept = [],
  multiple = true,
  maxSize,
  disabled = false,
}: UseFileDropOptions): UseFileDropReturn {
  const [isOver, setIsOver] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    dragCounterRef.current++;
    
    if (hasFiles(event.dataTransfer)) {
      setIsDragActive(true);
      setIsOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setIsOver(false);
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
  }, [disabled]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    dragCounterRef.current = 0;
    setIsOver(false);
    setIsDragActive(false);

    if (disabled) return;

    let files = getFiles(event.dataTransfer);
    
    if (accept.length > 0) {
      files = filterFilesByType(files, accept);
    }
    
    if (maxSize) {
      files = filterFilesBySize(files, maxSize);
    }
    
    if (!multiple && files.length > 1) {
      files = [files[0]];
    }

    if (files.length > 0) {
      onDrop(files);
    }
  }, [disabled, accept, maxSize, multiple, onDrop]);

  const openFilePicker = useCallback(() => {
    if (disabled) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    if (accept.length > 0) {
      input.accept = accept.join(',');
    }
    
    input.onchange = () => {
      let files = Array.from(input.files || []);
      
      if (maxSize) {
        files = filterFilesBySize(files, maxSize);
      }
      
      if (files.length > 0) {
        onDrop(files);
      }
    };
    
    input.click();
  }, [disabled, multiple, accept, maxSize, onDrop]);

  return {
    isOver,
    isDragActive,
    fileDropProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      onClick: openFilePicker,
    },
    openFilePicker,
  };
}

export default useDrop;
