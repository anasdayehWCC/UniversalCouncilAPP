'use client';

/**
 * SwipeableViews Component
 * 
 * Mobile-optimized swipeable panel/carousel component.
 * Perfect for social workers flipping through case notes or form sections.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile, usePrefersReducedMotion } from '@/hooks/useResponsive';
import type { SwipeableConfig } from '@/lib/responsive/types';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';

interface SwipeableViewsProps {
  children: React.ReactNode[];
  /** Initial active index */
  initialIndex?: number;
  /** Called when active index changes */
  onIndexChange?: (index: number) => void;
  /** Swipeable configuration */
  config?: Partial<SwipeableConfig>;
  /** Additional class names */
  className?: string;
  /** Pagination dot styles */
  dotClassName?: string;
  /** Show navigation arrows on desktop */
  showArrows?: boolean;
}

const defaultConfig: SwipeableConfig = {
  loop: false,
  autoPlay: 0,
  showDots: true,
  showArrows: true,
  keyboard: true,
  resistance: 0.5,
};

export function SwipeableViews({
  children,
  initialIndex = 0,
  onIndexChange,
  config: customConfig,
  className,
  dotClassName,
  showArrows = true,
}: SwipeableViewsProps) {
  const config = { ...defaultConfig, ...customConfig };
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const childArray = React.Children.toArray(children);
  const totalSlides = childArray.length;
  
  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth, { passive: true });
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (config.autoPlay && config.autoPlay > 0) {
      const interval = setInterval(() => {
        goToNext();
      }, config.autoPlay);
      
      return () => clearInterval(interval);
    }
  }, [config.autoPlay, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!config.keyboard) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.keyboard, currentIndex]);

  const goToIndex = useCallback((index: number) => {
    let newIndex = index;
    
    if (config.loop) {
      if (index < 0) newIndex = totalSlides - 1;
      if (index >= totalSlides) newIndex = 0;
    } else {
      newIndex = Math.max(0, Math.min(totalSlides - 1, index));
    }
    
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
  }, [totalSlides, config.loop, onIndexChange]);

  const goToNext = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  const goToPrev = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = containerWidth * 0.2;
      const velocity = info.velocity.x;
      
      if (info.offset.x < -threshold || velocity < -500) {
        goToNext();
      } else if (info.offset.x > threshold || velocity > 500) {
        goToPrev();
      }
    },
    [containerWidth, goToNext, goToPrev]
  );

  return (
    <div className={cn('relative overflow-hidden', className)} ref={containerRef}>
      {/* Slides Container */}
      <motion.div
        className="flex touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={config.resistance}
        onDragEnd={handleDragEnd}
        animate={{ x: -currentIndex * containerWidth }}
        transition={{
          type: prefersReducedMotion ? 'tween' : 'spring',
          stiffness: 300,
          damping: 30,
        }}
        style={{ x }}
      >
        {childArray.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full"
            style={{ width: containerWidth || '100%' }}
            aria-hidden={index !== currentIndex}
          >
            {child}
          </div>
        ))}
      </motion.div>

      {/* Navigation Arrows (desktop) */}
      {showArrows && !isMobile && totalSlides > 1 && (
        <>
          <button
            onClick={goToPrev}
            disabled={!config.loop && currentIndex === 0}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg',
              'flex items-center justify-center',
              'hover:bg-white transition-colors',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            disabled={!config.loop && currentIndex === totalSlides - 1}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg',
              'flex items-center justify-center',
              'hover:bg-white transition-colors',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {config.showDots && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4" role="tablist">
          {childArray.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                index === currentIndex
                  ? 'bg-primary w-6'
                  : 'bg-slate-300 hover:bg-slate-400',
                dotClassName
              )}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SwipeableTab Component
 * 
 * Individual tab/panel within SwipeableViews
 */
interface SwipeableTabProps {
  children: React.ReactNode;
  /** Tab title (for accessibility) */
  title?: string;
  /** Additional class names */
  className?: string;
}

export function SwipeableTab({
  children,
  title,
  className,
}: SwipeableTabProps) {
  return (
    <div className={cn('p-4', className)} role="tabpanel" aria-label={title}>
      {children}
    </div>
  );
}
