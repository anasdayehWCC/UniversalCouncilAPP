'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SelectableItemProps } from '@/lib/batch/types';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * Wrapper component for selectable items with checkbox UI
 * and visual selected state.
 * 
 * @example
 * ```tsx
 * {items.map(item => (
 *   <SelectableItem
 *     key={item.id}
 *     id={item.id}
 *     isSelected={isSelected(item.id)}
 *     onToggle={toggle}
 *   >
 *     <MeetingCard meeting={item} />
 *   </SelectableItem>
 * ))}
 * ```
 */
export function SelectableItem({
  id,
  isSelected,
  onToggle,
  disabled = false,
  children,
  className,
  showCheckbox = true,
  checkboxPosition = 'left',
}: SelectableItemProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (disabled) return;
      
      // Don't toggle if clicking on interactive elements inside
      const target = event.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('[role="button"]') ||
        target.closest('[data-no-select]')
      ) {
        return;
      }

      onToggle(id, event);
    },
    [id, onToggle, disabled]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        onToggle(id);
      }
    },
    [id, onToggle, disabled]
  );

  const handleCheckboxClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (disabled) return;
      onToggle(id, event);
    },
    [id, onToggle, disabled]
  );

  const checkbox = showCheckbox && (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      aria-label={isSelected ? 'Deselect item' : 'Select item'}
      disabled={disabled}
      onClick={handleCheckboxClick}
      className={cn(
        'relative flex-shrink-0',
        'h-5 w-5 rounded',
        'border-2 transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
        isSelected
          ? 'bg-primary border-primary'
          : 'bg-white dark:bg-background border-border',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-primary cursor-pointer'
      )}
    >
      {isSelected && (
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          initial={prefersReducedMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        </motion.span>
      )}
    </button>
  );

  return (
    <div
      role="listitem"
      tabIndex={disabled ? -1 : 0}
      aria-selected={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative',
        'transition-all duration-150',
        'rounded-lg',
        'cursor-pointer',
        // Selection ring
        isSelected && [
          'ring-2 ring-primary ring-offset-2',
          'dark:ring-offset-background',
        ],
        // Hover state
        !isSelected && !disabled && [
          'hover:ring-1 hover:ring-slate-200 hover:ring-offset-1',
          'dark:hover:ring-slate-700',
        ],
        // Selected background tint
        isSelected && [
          'bg-primary/5',
          'dark:bg-primary/10',
        ],
        // Disabled state
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      {/* Content wrapper */}
      <div
        className={cn(
          'flex items-start gap-3',
          checkboxPosition === 'right' && 'flex-row-reverse'
        )}
      >
        {/* Checkbox */}
        {checkbox && (
          <div
            className={cn(
              'pt-4',
              checkboxPosition === 'left' ? 'pl-3' : 'pr-3'
            )}
          >
            {checkbox}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>

      {/* Selection indicator line */}
      {isSelected && (
        <motion.div
          className={cn(
            'absolute top-0 bottom-0 w-1 rounded-full',
            'bg-primary',
            checkboxPosition === 'left' ? 'left-0' : 'right-0'
          )}
          layoutId={`selection-indicator-${id}`}
          initial={prefersReducedMotion ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          exit={{ scaleY: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

interface SelectAllCheckboxProps {
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Select all / deselect all checkbox with indeterminate state
 */
export function SelectAllCheckbox({
  isAllSelected,
  isIndeterminate,
  onToggle,
  disabled = false,
  label = 'Select all',
  className,
}: SelectAllCheckboxProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 cursor-pointer',
        'text-sm text-muted-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isIndeterminate ? 'mixed' : isAllSelected}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          'relative flex-shrink-0',
          'h-5 w-5 rounded',
          'border-2 transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isAllSelected || isIndeterminate
            ? 'bg-primary border-primary'
            : 'bg-white dark:bg-background border-border',
          disabled
            ? 'cursor-not-allowed'
            : 'hover:border-primary cursor-pointer'
        )}
      >
        {(isAllSelected || isIndeterminate) && (
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            initial={prefersReducedMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {isIndeterminate ? (
              <span className="h-0.5 w-2.5 bg-white rounded" />
            ) : (
              <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            )}
          </motion.span>
        )}
      </button>
      <span>{label}</span>
    </label>
  );
}

export default SelectableItem;
