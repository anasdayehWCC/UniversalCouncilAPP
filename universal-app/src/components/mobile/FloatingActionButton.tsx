'use client';

/**
 * FloatingActionButton (FAB) Component
 * 
 * Material Design-style floating action button with speed dial.
 * Perfect for quick actions like starting a new recording or creating a note.
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion, useScrollDirection, useSafeAreaInsets } from '@/hooks/useResponsive';
import type { FABPosition, FABAction } from '@/lib/responsive/types';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionButtonProps {
  /** Primary action icon */
  icon: React.ReactNode;
  /** Primary action label (for accessibility) */
  label: string;
  /** Primary action callback */
  onPress: () => void;
  /** Position on screen */
  position?: FABPosition;
  /** Extended FAB (shows label) */
  extended?: boolean;
  /** Speed dial actions */
  actions?: FABAction[];
  /** Hide on scroll down */
  hideOnScroll?: boolean;
  /** Custom background color */
  color?: string;
  /** Additional class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: 'default' | 'small' | 'large';
}

const positionClasses: Record<FABPosition, string> = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
};

const sizeClasses = {
  small: 'w-12 h-12',
  default: 'w-14 h-14',
  large: 'w-16 h-16',
};

const iconSizeClasses = {
  small: 'w-5 h-5',
  default: 'w-6 h-6',
  large: 'w-7 h-7',
};

export function FloatingActionButton({
  icon,
  label,
  onPress,
  position = 'bottom-right',
  extended = false,
  actions = [],
  hideOnScroll = false,
  color,
  className,
  disabled = false,
  size = 'default',
}: FloatingActionButtonProps) {
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const scrollDirection = useScrollDirection();
  const prefersReducedMotion = usePrefersReducedMotion();
  const safeAreaInsets = useSafeAreaInsets();

  // Determine if FAB should be hidden
  const shouldHide = hideOnScroll && scrollDirection === 'down';

  const handleMainPress = useCallback(() => {
    if (actions.length > 0) {
      setIsSpeedDialOpen(!isSpeedDialOpen);
    } else {
      onPress();
    }
  }, [actions.length, isSpeedDialOpen, onPress]);

  const handleActionPress = useCallback(
    (action: FABAction) => {
      action.onPress();
      setIsSpeedDialOpen(false);
    },
    []
  );

  const handleBackdropClick = useCallback(() => {
    setIsSpeedDialOpen(false);
  }, []);

  // Adjust position for safe area
  const safeAreaStyle = {
    paddingBottom: safeAreaInsets.bottom,
    paddingRight: safeAreaInsets.right,
    paddingLeft: safeAreaInsets.left,
  };

  return (
    <>
      {/* Backdrop when speed dial is open */}
      <AnimatePresence>
        {isSpeedDialOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <motion.div
        className={cn(
          'fixed z-50',
          positionClasses[position],
          className
        )}
        style={safeAreaStyle}
        animate={{
          y: shouldHide ? 100 : 0,
          opacity: shouldHide ? 0 : 1,
        }}
        transition={{
          type: prefersReducedMotion ? 'tween' : 'spring',
          damping: 20,
          stiffness: 300,
        }}
      >
        {/* Speed Dial Actions */}
        <AnimatePresence>
          {isSpeedDialOpen && actions.length > 0 && (
            <motion.div
              className="absolute bottom-full mb-3 flex flex-col-reverse gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {actions.map((action, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{
                    delay: prefersReducedMotion ? 0 : index * 0.05,
                  }}
                >
                  {/* Action label */}
                  <span className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                    {action.label}
                  </span>
                  
                  {/* Action button */}
                  <button
                    onClick={() => handleActionPress(action)}
                    className={cn(
                      'w-12 h-12 rounded-full shadow-lg',
                      'flex items-center justify-center',
                      'bg-white text-slate-700',
                      'hover:bg-slate-50 active:scale-95',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                    )}
                    aria-label={action.label}
                  >
                    {action.icon}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={handleMainPress}
          disabled={disabled}
          className={cn(
            'rounded-full shadow-lg',
            'flex items-center justify-center gap-2',
            'bg-primary text-white',
            'hover:bg-primary/90 active:scale-95',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            extended ? 'px-6 h-14' : sizeClasses[size]
          )}
          style={{ backgroundColor: color }}
          animate={{
            rotate: isSpeedDialOpen ? 45 : 0,
          }}
          transition={{
            type: prefersReducedMotion ? 'tween' : 'spring',
            damping: 20,
            stiffness: 300,
          }}
          aria-label={label}
          aria-expanded={actions.length > 0 ? isSpeedDialOpen : undefined}
        >
          <span className={iconSizeClasses[size]}>{icon}</span>
          {extended && (
            <span className="font-medium">{label}</span>
          )}
        </motion.button>
      </motion.div>
    </>
  );
}

/**
 * FABGroup Component
 * 
 * Group multiple FABs together
 */
interface FABGroupProps {
  children: React.ReactNode;
  /** Position on screen */
  position?: FABPosition;
  /** Gap between FABs */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export function FABGroup({
  children,
  position = 'bottom-right',
  gap = 'md',
  className,
}: FABGroupProps) {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col',
        positionClasses[position],
        gapClasses[gap],
        className
      )}
      style={{
        paddingBottom: safeAreaInsets.bottom,
        paddingRight: safeAreaInsets.right,
        paddingLeft: safeAreaInsets.left,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Common FAB icons as React components
 */
export const FABIcons = {
  Plus: () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Microphone: () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Camera: () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
};
