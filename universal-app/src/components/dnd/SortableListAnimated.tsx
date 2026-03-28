'use client';

/**
 * SortableListAnimated Component
 * Enhanced reorderable list with smooth Framer Motion animations
 */

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { DragHandle } from './DragHandle';
import type { DragId, SortableItem, ReorderResult } from '@/lib/dnd/types';

// ============================================================================
// Types
// ============================================================================

export interface SortableListAnimatedProps<T> {
  /** Items to sort */
  items: SortableItem<T>[];
  /** Called when items are reordered */
  onReorder: (result: ReorderResult<T>) => void;
  /** Render function for each item */
  renderItem: (item: SortableItem<T>, index: number, isDragging: boolean) => React.ReactNode;
  /** Layout direction */
  direction?: 'vertical' | 'horizontal';
  /** Whether dragging is disabled */
  disabled?: boolean;
  /** Gap between items in pixels */
  gap?: number;
  /** Container class name */
  className?: string;
  /** Item wrapper class name */
  itemClassName?: string;
  /** Whether to show drag handles */
  showDragHandle?: boolean;
  /** Drag handle position */
  handlePosition?: 'start' | 'end';
  /** Animation spring config */
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
  /** Enable keyboard navigation */
  enableKeyboard?: boolean;
  /** Accessibility label */
  'aria-label'?: string;
}

// ============================================================================
// Animation Variants
// ============================================================================

const itemVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  dragging: { 
    scale: 1.03,
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
    cursor: 'grabbing',
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function SortableListAnimated<T>({
  items,
  onReorder,
  renderItem,
  direction = 'vertical',
  disabled = false,
  gap = 8,
  className,
  itemClassName,
  showDragHandle = true,
  handlePosition = 'start',
  springConfig = { stiffness: 300, damping: 30, mass: 1 },
  enableKeyboard = true,
  'aria-label': ariaLabel = 'Sortable list',
}: SortableListAnimatedProps<T>) {
  const [localItems, setLocalItems] = useState(items);
  const [activeId, setActiveId] = useState<DragId | null>(null);
  const containerRef = useRef<HTMLUListElement>(null);

  // Sync local items with props
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Handle reorder from Framer Motion
  const handleReorder = useCallback((newOrder: SortableItem<T>[]) => {
    setLocalItems(newOrder);
  }, []);

  // Commit reorder on drag end
  const handleDragEnd = useCallback((itemId: DragId) => {
    const fromIndex = items.findIndex(item => item.id === itemId);
    const toIndex = localItems.findIndex(item => item.id === itemId);
    
    if (fromIndex !== toIndex && fromIndex !== -1 && toIndex !== -1) {
      onReorder({
        items: localItems,
        fromIndex,
        toIndex,
      });
    }
    setActiveId(null);
  }, [items, localItems, onReorder]);

  // Keyboard navigation
  const handleKeyDown = useCallback((
    event: React.KeyboardEvent,
    index: number,
    itemId: DragId
  ) => {
    if (!enableKeyboard || disabled) return;
    
    const moveUp = direction === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const moveDown = direction === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    
    let newIndex = index;
    
    if (event.key === moveUp && index > 0) {
      newIndex = index - 1;
    } else if (event.key === moveDown && index < localItems.length - 1) {
      newIndex = index + 1;
    } else {
      return;
    }
    
    event.preventDefault();
    
    const newItems = [...localItems];
    const [removed] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, removed);
    
    setLocalItems(newItems);
    onReorder({
      items: newItems,
      fromIndex: index,
      toIndex: newIndex,
    });
    
    // Focus the moved item
    requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container) {
        const itemElements = container.querySelectorAll('[data-sortable-item]');
        const targetElement = itemElements[newIndex] as HTMLElement;
        targetElement?.focus();
      }
    });
  }, [enableKeyboard, disabled, direction, localItems, onReorder]);

  const axis = direction === 'vertical' ? 'y' : 'x';

  return (
    <Reorder.Group
      ref={containerRef}
      axis={axis}
      values={localItems}
      onReorder={handleReorder}
      className={cn(
        'relative list-none p-0 m-0',
        direction === 'vertical' && 'flex flex-col',
        direction === 'horizontal' && 'flex flex-row flex-wrap',
        className
      )}
      style={{ gap }}
      role="list"
      aria-label={ariaLabel}
    >
      <AnimatePresence mode="popLayout">
        {localItems.map((item, index) => (
          <SortableItemComponent
            key={item.id}
            item={item}
            index={index}
            isActive={activeId === item.id}
            disabled={disabled}
            showDragHandle={showDragHandle}
            handlePosition={handlePosition}
            springConfig={springConfig}
            itemClassName={itemClassName}
            onDragStart={() => setActiveId(item.id)}
            onDragEnd={() => handleDragEnd(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index, item.id)}
            renderItem={renderItem}
          />
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}

// ============================================================================
// Sortable Item Component
// ============================================================================

interface SortableItemComponentProps<T> {
  item: SortableItem<T>;
  index: number;
  isActive: boolean;
  disabled: boolean;
  showDragHandle: boolean;
  handlePosition: 'start' | 'end';
  springConfig: { stiffness?: number; damping?: number; mass?: number };
  itemClassName?: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  renderItem: (item: SortableItem<T>, index: number, isDragging: boolean) => React.ReactNode;
}

function SortableItemComponent<T>({
  item,
  index,
  isActive,
  disabled,
  showDragHandle,
  handlePosition,
  springConfig,
  itemClassName,
  onDragStart,
  onDragEnd,
  onKeyDown,
  renderItem,
}: SortableItemComponentProps<T>) {
  const dragControls = useDragControls();

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled) return;
    onDragStart();
    dragControls.start(event);
  }, [disabled, onDragStart, dragControls]);

  return (
    <Reorder.Item
      value={item}
      dragListener={!showDragHandle}
      dragControls={showDragHandle ? dragControls : undefined}
      onDragEnd={onDragEnd}
      className={cn(
        'relative',
        !disabled && !showDragHandle && 'cursor-grab active:cursor-grabbing',
        isActive && 'z-10',
        itemClassName
      )}
      variants={itemVariants}
      initial="initial"
      animate={isActive ? 'dragging' : 'animate'}
      exit="exit"
      layout
      layoutId={String(item.id)}
      transition={{
        layout: {
          type: 'spring',
          ...springConfig,
        },
      }}
      whileDrag={{
        scale: 1.03,
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
        zIndex: 10,
      }}
      data-sortable-item
      data-sortable-id={item.id}
      data-active={isActive}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={onKeyDown}
      role="listitem"
      aria-grabbed={isActive}
      aria-describedby="sortable-instructions"
    >
      <div className={cn(
        'flex items-center',
        handlePosition === 'end' && 'flex-row-reverse'
      )}>
        {showDragHandle && (
          <div
            className="flex-shrink-0"
            onPointerDown={handlePointerDown}
            style={{ touchAction: 'none' }}
          >
            <DragHandle
              isDragging={isActive}
              disabled={disabled}
              label={`Drag to reorder ${item.id}`}
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {renderItem(item, index, isActive)}
        </div>
      </div>
      
      {/* Screen reader instructions */}
      <span id="sortable-instructions" className="sr-only">
        Use arrow keys to reorder. Press Escape to cancel.
      </span>
    </Reorder.Item>
  );
}

// ============================================================================
// Simple Sortable Wrapper
// ============================================================================

export interface SimpleSortableProps<T extends { id: DragId }> {
  items: T[];
  onReorder: (items: T[]) => void;
  children: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  disabled?: boolean;
  className?: string;
}

export function SimpleSortable<T extends { id: DragId }>({
  items,
  onReorder,
  children,
  direction = 'vertical',
  disabled = false,
  className,
}: SimpleSortableProps<T>) {
  const sortableItems = useMemo(() => 
    items.map(item => ({ id: item.id, data: item })),
    [items]
  );

  const handleReorder = useCallback((result: ReorderResult<T>) => {
    onReorder(result.items.map(item => item.data));
  }, [onReorder]);

  return (
    <SortableListAnimated
      items={sortableItems}
      onReorder={handleReorder}
      renderItem={(item, index, isDragging) => children(item.data, index, isDragging)}
      direction={direction}
      disabled={disabled}
      className={className}
    />
  );
}

export default SortableListAnimated;
