'use client';

/**
 * BottomSheet Component
 * 
 * Mobile-friendly bottom sheet with snap points and gestures.
 * Essential for social workers accessing forms and details on mobile devices.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion, useSafeAreaInsets } from '@/hooks/useResponsive';
import type { BottomSheetConfig } from '@/lib/responsive/types';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';

interface BottomSheetProps {
  children: React.ReactNode;
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Called when sheet should close */
  onClose: () => void;
  /** Sheet configuration */
  config?: Partial<BottomSheetConfig>;
  /** Sheet title */
  title?: string;
  /** Additional class names */
  className?: string;
}

const defaultConfig: BottomSheetConfig = {
  snapPoints: [0.4, 0.9], // 40% and 90% of screen height
  initialSnap: 0,
  dismissible: true,
  showHandle: true,
  modal: true,
  blurBackdrop: true,
};

export function BottomSheet({
  children,
  isOpen,
  onClose,
  config: customConfig,
  title,
  className,
}: BottomSheetProps) {
  const config = { ...defaultConfig, ...customConfig };
  const [currentSnap, setCurrentSnap] = useState(config.initialSnap || 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const safeAreaInsets = useSafeAreaInsets();
  
  const y = useMotionValue(0);
  const [windowHeight, setWindowHeight] = useState(0);
  
  useEffect(() => {
    setWindowHeight(window.innerHeight);
    
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when sheet is open and modal
  useEffect(() => {
    if (isOpen && config.modal) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, config.modal]);

  // Calculate snap heights
  const snapHeights = config.snapPoints.map(point => windowHeight * point);
  const currentHeight = snapHeights[currentSnap] || snapHeights[0];
  
  // Background opacity based on sheet position
  const backdropOpacity = useTransform(
    y,
    [0, currentHeight],
    [0.5, 0]
  );

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const velocity = info.velocity.y;
      const offset = info.offset.y;
      
      // If swiped down quickly or far, close or snap to lower point
      if (velocity > 500 || offset > 100) {
        if (currentSnap > 0) {
          // Snap to lower point
          setCurrentSnap(currentSnap - 1);
        } else if (config.dismissible) {
          onClose();
        }
      } else if (velocity < -500 || offset < -100) {
        // Snap to higher point
        if (currentSnap < config.snapPoints.length - 1) {
          setCurrentSnap(currentSnap + 1);
        }
      }
    },
    [currentSnap, config.snapPoints.length, config.dismissible, onClose]
  );

  const handleBackdropClick = useCallback(() => {
    if (config.dismissible) {
      onClose();
    }
  }, [config.dismissible, onClose]);

  // Snap to a specific point
  const snapTo = useCallback((index: number) => {
    if (index >= 0 && index < config.snapPoints.length) {
      setCurrentSnap(index);
    }
  }, [config.snapPoints.length]);

  if (!windowHeight) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {config.modal && (
            <motion.div
              className={cn(
                'fixed inset-0 z-40',
                config.blurBackdrop ? 'backdrop-blur-sm' : '',
                'bg-black/50'
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBackdropClick}
              aria-hidden="true"
            />
          )}

          {/* Sheet */}
          <motion.div
            ref={containerRef}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-white rounded-t-3xl shadow-2xl',
              'touch-none',
              className
            )}
            style={{
              height: currentHeight,
              paddingBottom: safeAreaInsets.bottom,
            }}
            initial={{ y: windowHeight }}
            animate={{ y: windowHeight - currentHeight }}
            exit={{ y: windowHeight }}
            transition={{
              type: prefersReducedMotion ? 'tween' : 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal={config.modal}
            aria-labelledby={title ? 'bottom-sheet-title' : undefined}
          >
            {/* Handle */}
            {config.showHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-slate-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="px-4 pb-2 border-b border-slate-100">
                <h2
                  id="bottom-sheet-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  {title}
                </h2>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto overscroll-contain flex-1 p-4">
              {children}
            </div>

            {/* Snap point indicators */}
            {config.snapPoints.length > 1 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {config.snapPoints.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => snapTo(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      index === currentSnap
                        ? 'bg-primary'
                        : 'bg-slate-300 hover:bg-slate-400'
                    )}
                    aria-label={`Snap to ${Math.round(config.snapPoints[index] * 100)}%`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * BottomSheetTrigger Component
 * 
 * Button that opens a bottom sheet
 */
interface BottomSheetTriggerProps {
  children: React.ReactNode;
  /** Called when trigger is activated */
  onOpen: () => void;
  /** Additional class names */
  className?: string;
}

export function BottomSheetTrigger({
  children,
  onOpen,
  className,
}: BottomSheetTriggerProps) {
  return (
    <button
      onClick={onOpen}
      className={cn('min-h-[44px] min-w-[44px]', className)}
    >
      {children}
    </button>
  );
}

/**
 * useBottomSheet Hook
 * 
 * Convenience hook for managing bottom sheet state
 */
export function useBottomSheet() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
