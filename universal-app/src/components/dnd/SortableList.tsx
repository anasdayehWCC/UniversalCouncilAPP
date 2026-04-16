'use client';

/**
 * SortableList Component
 * Reorderable list with drag and drop support
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDndContext, getElementRect } from '@/lib/dnd/context';
import {
  getPointerPosition,
  calculateOffset,
  exceedsDragThreshold,
  getInsertionIndex,
  reorderArray,
  LONG_PRESS_THRESHOLD,
} from '@/lib/dnd/utils';
import type { SortableListProps, SortableItem, DragId, Position, Rect } from '@/lib/dnd/types';

interface SortableItemState {
  id: DragId;
  rect: Rect;
}

export function SortableList<T>({
  items,
  onReorder,
  renderItem,
  direction = 'vertical',
  disabled = false,
  className,
  itemClassName,
  gap = 8,
}: SortableListProps<T>) {
  const { state, startDrag, updateDrag, endDrag } = useDndContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<DragId, HTMLDivElement>>(new Map());
  const itemRectsRef = useRef<SortableItemState[]>([]);
  
  const [activeId, setActiveId] = useState<DragId | null>(null);
  const [overId, setOverId] = useState<DragId | null>(null);
  const [previewItems, setPreviewItems] = useState<SortableItem<T>[]>(items);
  
  const startPositionRef = useRef<Position | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const activeItemRef = useRef<SortableItem<T> | null>(null);

  // Sync preview items with actual items when not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setPreviewItems(items);
    }
  }, [items]);

  // Update item rects
  const updateItemRects = useCallback(() => {
    const rects: SortableItemState[] = [];
    items.forEach((item) => {
      const element = itemRefs.current.get(item.id);
      if (element) {
        rects.push({
          id: item.id,
          rect: getElementRect(element),
        });
      }
    });
    itemRectsRef.current = rects;
  }, [items]);

  // Handle pointer down on item
  const handleItemPointerDown = useCallback((
    event: React.PointerEvent,
    item: SortableItem<T>,
    index: number
  ) => {
    if (disabled) return;
    if (event.button !== 0) return;

    event.preventDefault();
    
    const position = getPointerPosition(event);
    startPositionRef.current = position;
    activeItemRef.current = item;

    // Update rects before drag
    updateItemRects();

    // Long press detection for touch
    if (event.pointerType === 'touch') {
      longPressTimerRef.current = setTimeout(() => {
        startDragging(item, index, startPositionRef.current!);
      }, LONG_PRESS_THRESHOLD);
    }

    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, [disabled, updateItemRects]);

  // Start dragging
  const startDragging = useCallback((
    item: SortableItem<T>,
    index: number,
    position: Position
  ) => {
    const element = itemRefs.current.get(item.id);
    if (!element) return;

    const offset = calculateOffset(element, position);
    
    isDraggingRef.current = true;
    setActiveId(item.id);
    
    startDrag(
      {
        id: item.id,
        type: 'sortable',
        data: item.data,
        index,
        sourceId: 'sortable-list',
      },
      position,
      offset
    );
  }, [startDrag]);

  // Handle pointer move
  const handleItemPointerMove = useCallback((event: React.PointerEvent) => {
    if (!startPositionRef.current || disabled) return;

    const position = getPointerPosition(event);

    if (isDraggingRef.current) {
      updateDrag(position);

      // Calculate over item
      const insertIndex = getInsertionIndex(
        position,
        itemRectsRef.current,
        direction
      );

      const targetItem = items[Math.min(insertIndex, items.length - 1)];
      if (targetItem && targetItem.id !== overId) {
        setOverId(targetItem.id);

        // Update preview
        const activeIndex = items.findIndex(i => i.id === activeId);
        if (activeIndex !== -1 && insertIndex !== activeIndex) {
          const newOrder = reorderArray(items, activeIndex, insertIndex);
          setPreviewItems(newOrder);
        }
      }
    } else {
      // Check for drag start (mouse only)
      if (event.pointerType !== 'touch' && activeItemRef.current) {
        if (exceedsDragThreshold(startPositionRef.current, position)) {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          
          const index = items.findIndex(i => i.id === activeItemRef.current?.id);
          if (index !== -1) {
            startDragging(activeItemRef.current, index, position);
          }
        }
      }
    }
  }, [disabled, direction, items, activeId, overId, updateDrag, startDragging]);

  // Handle pointer up
  const handleItemPointerUp = useCallback((event: React.PointerEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    (event.target as HTMLElement).releasePointerCapture(event.pointerId);

    if (isDraggingRef.current && activeId !== null) {
      const fromIndex = items.findIndex(i => i.id === activeId);
      const toIndex = overId !== null
        ? previewItems.findIndex(i => i.id === activeId)
        : fromIndex;

      if (fromIndex !== toIndex && fromIndex !== -1 && toIndex !== -1) {
        onReorder({
          items: previewItems,
          fromIndex,
          toIndex,
        });
      }

      endDrag();
    }

    // Reset state
    isDraggingRef.current = false;
    setActiveId(null);
    setOverId(null);
    startPositionRef.current = null;
    activeItemRef.current = null;
  }, [activeId, overId, items, previewItems, onReorder, endDrag]);

  // Handle pointer cancel
  const handleItemPointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDraggingRef.current) {
      endDrag();
    }

    isDraggingRef.current = false;
    setActiveId(null);
    setOverId(null);
    startPositionRef.current = null;
    activeItemRef.current = null;
    setPreviewItems(items);
  }, [items, endDrag]);

  // Register item ref
  const setItemRef = useCallback((id: DragId, element: HTMLDivElement | null) => {
    if (element) {
      itemRefs.current.set(id, element);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  // Render items in preview order during drag
  const displayItems = isDraggingRef.current ? previewItems : items;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative',
        direction === 'vertical' && 'flex flex-col',
        direction === 'horizontal' && 'flex flex-row',
        className
      )}
      style={{ gap }}
    >
      {displayItems.map((item, index) => {
        const isActive = item.id === activeId;
        const isOver = item.id === overId;

        return (
          <div
            key={item.id}
            ref={(el) => setItemRef(item.id, el)}
            className={cn(
              'touch-none select-none transition-transform duration-200',
              !disabled && !isActive && 'cursor-grab',
              isActive && 'cursor-grabbing opacity-50',
              isOver && !isActive && 'scale-[1.02]',
              itemClassName
            )}
            onPointerDown={(e) => handleItemPointerDown(e, item, index)}
            onPointerMove={handleItemPointerMove}
            onPointerUp={handleItemPointerUp}
            onPointerCancel={handleItemPointerCancel}
            data-sortable-id={item.id}
            data-active={isActive}
            data-over={isOver}
          >
            {renderItem(item, index, isActive)}
          </div>
        );
      })}
      
      {/* Drag preview overlay */}
      {isDraggingRef.current && activeId !== null && state.position && state.offset && (
        <DragPreview
          item={items.find(i => i.id === activeId)!}
          position={state.position}
          offset={state.offset}
          renderItem={renderItem}
          itemRef={itemRefs.current.get(activeId)}
        />
      )}
    </div>
  );
}

/** Drag preview overlay */
function DragPreview<T>({
  item,
  position,
  offset,
  renderItem,
  itemRef,
}: {
  item: SortableItem<T>;
  position: Position;
  offset: Position;
  renderItem: (item: SortableItem<T>, index: number, isDragging: boolean) => React.ReactNode;
  itemRef?: HTMLDivElement;
}) {
  const width = itemRef?.offsetWidth;
  const height = itemRef?.offsetHeight;

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{
        left: position.x - offset.x,
        top: position.y - offset.y,
        width,
        height,
        opacity: 0.9,
        transform: 'scale(1.02)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      }}
    >
      {renderItem(item, -1, true)}
    </div>
  );
}

export default SortableList;
