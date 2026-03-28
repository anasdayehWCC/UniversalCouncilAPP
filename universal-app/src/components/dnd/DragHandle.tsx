'use client';

/**
 * DragHandle Component
 * Visual handle for initiating drag operations
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, Grip, Move } from 'lucide-react';
import { motion, type HTMLMotionProps } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

export type DragHandleVariant = 'vertical' | 'horizontal' | 'move';
export type DragHandleSize = 'sm' | 'md' | 'lg';

export interface DragHandleProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  /** Visual variant */
  variant?: DragHandleVariant;
  /** Size of the handle */
  size?: DragHandleSize;
  /** Whether the handle is currently being used for dragging */
  isDragging?: boolean;
  /** Whether the handle is disabled */
  disabled?: boolean;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Show visual feedback on hover */
  showHoverEffect?: boolean;
  /** Label for accessibility */
  label?: string;
}

// ============================================================================
// Size and Style Mappings
// ============================================================================

const sizeClasses: Record<DragHandleSize, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const iconSizes: Record<DragHandleSize, number> = {
  sm: 14,
  md: 18,
  lg: 22,
};

const getIcon = (variant: DragHandleVariant, size: number) => {
  switch (variant) {
    case 'horizontal':
      return <Grip size={size} />;
    case 'move':
      return <Move size={size} />;
    case 'vertical':
    default:
      return <GripVertical size={size} />;
  }
};

// ============================================================================
// Component
// ============================================================================

export const DragHandle = forwardRef<HTMLButtonElement, DragHandleProps>(
  (
    {
      variant = 'vertical',
      size = 'md',
      isDragging = false,
      disabled = false,
      icon,
      showHoverEffect = true,
      label = 'Drag to reorder',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type="button"
        aria-label={label}
        aria-describedby="drag-handle-instructions"
        disabled={disabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'rounded-md border-0 bg-transparent',
          'text-[var(--color-text-tertiary)]',
          'touch-manipulation select-none',
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
          'transition-colors duration-150',
          // Size
          sizeClasses[size],
          // Interactive states
          showHoverEffect && !disabled && [
            'hover:bg-[var(--color-surface-active)]',
            'hover:text-[var(--color-text-secondary)]',
          ],
          // Dragging state
          isDragging && [
            'cursor-grabbing',
            'text-[var(--color-primary)]',
            'bg-[var(--color-surface-active)]',
            'scale-110',
          ],
          // Not dragging
          !isDragging && !disabled && 'cursor-grab',
          // Disabled state
          disabled && [
            'cursor-not-allowed',
            'opacity-40',
          ],
          className
        )}
        // Animation
        initial={false}
        animate={{
          scale: isDragging ? 1.1 : 1,
          opacity: disabled ? 0.4 : 1,
        }}
        whileHover={!disabled && !isDragging ? { scale: 1.05 } : undefined}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        {...props}
      >
        {icon || getIcon(variant, iconSizes[size])}
        
        {/* Screen reader instructions */}
        <span id="drag-handle-instructions" className="sr-only">
          Press space or enter to start dragging. Use arrow keys to move. Press space or enter again to drop.
        </span>
      </motion.button>
    );
  }
);

DragHandle.displayName = 'DragHandle';

// ============================================================================
// Compact Variant
// ============================================================================

export interface CompactDragHandleProps extends Omit<DragHandleProps, 'size' | 'showHoverEffect'> {
  /** Show only on hover of parent */
  showOnParentHover?: boolean;
}

export const CompactDragHandle = forwardRef<HTMLButtonElement, CompactDragHandleProps>(
  ({ showOnParentHover = true, className, ...props }, ref) => {
    return (
      <DragHandle
        ref={ref}
        size="sm"
        showHoverEffect={false}
        className={cn(
          showOnParentHover && 'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-150',
          className
        )}
        {...props}
      />
    );
  }
);

CompactDragHandle.displayName = 'CompactDragHandle';

// ============================================================================
// Drag Handle with Visual Indicator
// ============================================================================

export interface DragHandleWithIndicatorProps extends DragHandleProps {
  /** Show position indicator */
  showPosition?: boolean;
  /** Current position number */
  position?: number;
}

export const DragHandleWithIndicator = forwardRef<HTMLButtonElement, DragHandleWithIndicatorProps>(
  ({ showPosition = false, position, className, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center gap-1">
        <DragHandle ref={ref} className={className} {...props} />
        
        {showPosition && typeof position === 'number' && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'absolute -left-6 top-1/2 -translate-y-1/2',
              'text-xs font-medium text-[var(--color-text-tertiary)]',
              'tabular-nums'
            )}
          >
            {position}
          </motion.span>
        )}
      </div>
    );
  }
);

DragHandleWithIndicator.displayName = 'DragHandleWithIndicator';

export default DragHandle;
