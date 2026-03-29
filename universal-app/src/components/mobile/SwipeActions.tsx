'use client';

/**
 * SwipeActions Component
 * 
 * Swipe-to-reveal actions pattern for list items.
 * Perfect for social workers managing case lists and quick actions.
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/useResponsive';
import type { SwipeActionConfig } from '@/lib/responsive/types';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';

interface SwipeActionsProps {
  children: React.ReactNode;
  /** Actions to show on left swipe */
  leftActions?: SwipeActionConfig[];
  /** Actions to show on right swipe */
  rightActions?: SwipeActionConfig[];
  /** Threshold to trigger action */
  threshold?: number;
  /** Additional class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  className,
  disabled = false,
}: SwipeActionsProps) {
  const [openDirection, setOpenDirection] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const x = useMotionValue(0);
  
  // Calculate action button widths
  const leftWidth = leftActions.length * threshold;
  const rightWidth = rightActions.length * threshold;

  // Opacity transforms for action buttons
  const leftOpacity = useTransform(x, [0, leftWidth], [0, 1]);
  const rightOpacity = useTransform(x, [-rightWidth, 0], [1, 0]);

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled) return;
      
      const offset = info.offset.x;
      const velocity = info.velocity.x;
      
      // Determine if we should open or close
      if (offset > threshold || velocity > 500) {
        // Open left actions
        if (leftActions.length > 0) {
          setOpenDirection('left');
          x.set(leftWidth);
        }
      } else if (offset < -threshold || velocity < -500) {
        // Open right actions
        if (rightActions.length > 0) {
          setOpenDirection('right');
          x.set(-rightWidth);
        }
      } else {
        // Close
        setOpenDirection(null);
        x.set(0);
      }
    },
    [disabled, threshold, leftActions.length, rightActions.length, leftWidth, rightWidth, x]
  );

  const handleActionClick = useCallback(
    (action: SwipeActionConfig) => {
      action.onAction();
      // Close after action
      setOpenDirection(null);
      x.set(0);
    },
    [x]
  );

  const close = useCallback(() => {
    setOpenDirection(null);
    x.set(0);
  }, [x]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Left Actions (revealed on right swipe) */}
      {leftActions.length > 0 && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 flex"
          style={{ opacity: leftOpacity }}
        >
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                'flex flex-col items-center justify-center px-4',
                'min-w-[80px] min-h-[44px]',
                'text-white text-xs font-medium',
                'transition-transform active:scale-95',
                action.destructive ? 'bg-destructive' : ''
              )}
              style={{ backgroundColor: action.color }}
            >
              <span className="mb-1">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Right Actions (revealed on left swipe) */}
      {rightActions.length > 0 && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 flex"
          style={{ opacity: rightOpacity }}
        >
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                'flex flex-col items-center justify-center px-4',
                'min-w-[80px] min-h-[44px]',
                'text-white text-xs font-medium',
                'transition-transform active:scale-95',
                action.destructive ? 'bg-destructive' : ''
              )}
              style={{ backgroundColor: action.color }}
            >
              <span className="mb-1">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: -rightWidth, right: leftWidth }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        transition={{
          type: prefersReducedMotion ? 'tween' : 'spring',
          damping: 30,
          stiffness: 300,
        }}
        className="relative bg-white touch-pan-y"
        onClick={openDirection ? close : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * SwipeableListItem Component
 * 
 * Pre-configured swipe actions for list items with common actions
 */
interface SwipeableListItemProps {
  children: React.ReactNode;
  /** Called when edit action is triggered */
  onEdit?: () => void;
  /** Called when delete action is triggered */
  onDelete?: () => void;
  /** Called when archive action is triggered */
  onArchive?: () => void;
  /** Called when mark as read action is triggered */
  onMarkRead?: () => void;
  /** Additional class names */
  className?: string;
}

export function SwipeableListItem({
  children,
  onEdit,
  onDelete,
  onArchive,
  onMarkRead,
  className,
}: SwipeableListItemProps) {
  const leftActions: SwipeActionConfig[] = [];
  const rightActions: SwipeActionConfig[] = [];

  // Edit action (left swipe reveals on right)
  if (onEdit) {
    rightActions.push({
      color: '#3b82f6', // blue-500
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      label: 'Edit',
      onAction: onEdit,
    });
  }

  // Archive action
  if (onArchive) {
    rightActions.push({
      color: '#f59e0b', // amber-500
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      label: 'Archive',
      onAction: onArchive,
    });
  }

  // Delete action (destructive)
  if (onDelete) {
    rightActions.push({
      color: '#ef4444', // red-500
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      label: 'Delete',
      onAction: onDelete,
      destructive: true,
    });
  }

  // Mark as read action (right swipe reveals on left)
  if (onMarkRead) {
    leftActions.push({
      color: '#22c55e', // green-500
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: 'Read',
      onAction: onMarkRead,
    });
  }

  return (
    <SwipeActions
      leftActions={leftActions}
      rightActions={rightActions}
      className={className}
    >
      {children}
    </SwipeActions>
  );
}
