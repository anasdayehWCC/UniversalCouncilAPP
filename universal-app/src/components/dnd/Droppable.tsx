'use client';

/**
 * Droppable Component
 * Drop zone wrapper for receiving dragged items
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useDndContext, getElementRect, canDropInZone } from '@/lib/dnd/context';
import { isPointInRect, hasFiles, getFiles, filterFilesByType } from '@/lib/dnd/utils';
import type { DroppableProps, DropZone, FileDropZoneProps } from '@/lib/dnd/types';

export function Droppable<T = unknown>({
  id,
  acceptTypes = ['default'],
  disabled = false,
  children,
  onDrop,
  onDragEnter,
  onDragLeave,
  className,
  style,
}: DroppableProps<T>) {
  const { state, dropZones, registerDropZone, unregisterDropZone, updateDropZoneRect, setOverId } = useDndContext();
  const elementRef = useRef<HTMLDivElement>(null);
  const wasOverRef = useRef(false);

  // Register drop zone on mount
  useEffect(() => {
    const zone: DropZone = {
      id,
      acceptTypes,
      disabled,
    };
    registerDropZone(zone);

    // Update rect
    if (elementRef.current) {
      updateDropZoneRect(id, getElementRect(elementRef.current));
    }

    return () => {
      unregisterDropZone(id);
    };
  }, [id, acceptTypes, disabled, registerDropZone, unregisterDropZone, updateDropZoneRect]);

  // Update rect on resize
  useEffect(() => {
    if (!elementRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (elementRef.current) {
        updateDropZoneRect(id, getElementRect(elementRef.current));
      }
    });

    resizeObserver.observe(elementRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [id, updateDropZoneRect]);

  // Check if item is over this zone
  const isOver = state.isDragging && state.overId === id;
  
  // Check if item can be dropped
  const canDrop = state.isDragging && state.item
    ? !disabled && acceptTypes.includes(state.item.type)
    : false;

  // Handle drag enter/leave callbacks
  useEffect(() => {
    if (isOver && !wasOverRef.current) {
      onDragEnter?.();
    } else if (!isOver && wasOverRef.current) {
      onDragLeave?.();
    }
    wasOverRef.current = isOver;
  }, [isOver, onDragEnter, onDragLeave]);

  // Handle drop via context state changes
  useEffect(() => {
    // When drag ends and this was the target
    if (!state.isDragging && wasOverRef.current && state.item) {
      onDrop?.(state.item as any);
    }
  }, [state.isDragging, state.item, onDrop]);

  // Track pointer position for collision detection
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!state.isDragging || disabled) return;
    
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    const position = { x: event.clientX, y: event.clientY };
    const isInside = isPointInRect(position, {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });

    if (isInside && state.item && acceptTypes.includes(state.item.type)) {
      setOverId(id);
    } else if (state.overId === id) {
      setOverId(null);
    }
  }, [state.isDragging, state.item, state.overId, disabled, acceptTypes, id, setOverId]);

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative transition-colors duration-150',
        isOver && canDrop && 'ring-2 ring-primary bg-primary/5',
        isOver && !canDrop && 'ring-2 ring-destructive bg-destructive/5',
        disabled && 'opacity-50',
        className
      )}
      style={style}
      onPointerMove={handlePointerMove}
      data-droppable-id={id}
      data-over={isOver}
      data-can-drop={canDrop}
    >
      {typeof children === 'function' ? children({ isOver, canDrop }) : children}
    </div>
  );
}

/** File drop zone for native file drops */
export function FileDropZone({
  onFileDrop,
  accept = [],
  multiple = true,
  maxSize,
  disabled = false,
  children,
  className,
}: FileDropZoneProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = React.useState(false);
  const [isDragActive, setIsDragActive] = React.useState(false);
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
    
    // Filter by accepted types
    if (accept.length > 0) {
      files = filterFilesByType(files, accept);
    }
    
    // Filter by size
    if (maxSize) {
      files = files.filter(f => f.size <= maxSize);
    }
    
    // Limit to single file if not multiple
    if (!multiple && files.length > 1) {
      files = [files[0]];
    }

    if (files.length > 0) {
      onFileDrop(files);
    }
  }, [disabled, accept, maxSize, multiple, onFileDrop]);

  // Handle click to open file picker
  const handleClick = useCallback(() => {
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
        files = files.filter(f => f.size <= maxSize);
      }
      
      if (files.length > 0) {
        onFileDrop(files);
      }
    };
    
    input.click();
  }, [disabled, multiple, accept, maxSize, onFileDrop]);

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative cursor-pointer transition-colors duration-150',
        'border-2 border-dashed rounded-lg',
        isOver && 'border-primary bg-primary/5',
        !isOver && 'border-muted-foreground/25 hover:border-muted-foreground/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {typeof children === 'function' ? children({ isOver, isDragActive }) : children}
    </div>
  );
}

export default Droppable;
