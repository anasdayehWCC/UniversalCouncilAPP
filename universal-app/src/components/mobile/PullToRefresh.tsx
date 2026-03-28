'use client';

/**
 * PullToRefresh Component
 * 
 * Mobile pull-to-refresh pattern for refreshing content.
 * Common pattern for social workers checking for updates while in the field.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion, useIsTouchDevice } from '@/hooks/useResponsive';
import type { PullToRefreshConfig } from '@/lib/responsive/types';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface PullToRefreshProps {
  children: React.ReactNode;
  /** Called when refresh is triggered */
  onRefresh: () => Promise<void>;
  /** Configuration */
  config?: Partial<PullToRefreshConfig>;
  /** Whether refresh is currently in progress */
  isRefreshing?: boolean;
  /** Additional class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

const defaultConfig: PullToRefreshConfig = {
  threshold: 80,
  resistance: 0.5,
  maxPull: 150,
  indicatorStyle: 'spinner',
};

type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing';

export function PullToRefresh({
  children,
  onRefresh,
  config: customConfig,
  isRefreshing = false,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const config = { ...defaultConfig, ...customConfig };
  const [pullState, setPullState] = useState<PullState>('idle');
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isTouchDevice = useIsTouchDevice();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Update state when external isRefreshing changes
  useEffect(() => {
    if (isRefreshing) {
      setPullState('refreshing');
    } else if (pullState === 'refreshing') {
      setPullState('idle');
      setPullDistance(0);
    }
  }, [isRefreshing, pullState]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;
      
      const container = containerRef.current;
      if (!container) return;
      
      // Only activate if scrolled to top
      if (container.scrollTop > 0) return;
      
      startY.current = e.touches[0].clientY;
      setPullState('pulling');
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (pullState !== 'pulling' && pullState !== 'ready') return;
      if (disabled || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      
      // Only allow pulling down
      if (diff < 0) {
        setPullDistance(0);
        return;
      }
      
      // Apply resistance
      const resistedDistance = Math.min(
        diff * config.resistance,
        config.maxPull
      );
      
      setPullDistance(resistedDistance);
      
      // Update state based on distance
      if (resistedDistance >= config.threshold) {
        setPullState('ready');
      } else {
        setPullState('pulling');
      }
      
      // Prevent default scrolling while pulling
      if (diff > 0) {
        e.preventDefault();
      }
    },
    [pullState, disabled, isRefreshing, config]
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    if (pullState === 'ready') {
      setPullState('refreshing');
      setPullDistance(config.threshold);
      
      try {
        await onRefresh();
      } finally {
        setPullState('idle');
        setPullDistance(0);
      }
    } else {
      setPullState('idle');
      setPullDistance(0);
    }
  }, [pullState, disabled, isRefreshing, config.threshold, onRefresh]);

  // Calculate indicator progress
  const progress = Math.min(pullDistance / config.threshold, 1);
  
  // Indicator rotation based on pull distance
  const rotation = progress * 360;
  
  // Scale for bounce effect when ready
  const scale = pullState === 'ready' ? 1.2 : 1;

  if (!isTouchDevice) {
    // On non-touch devices, just render children
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-10',
          'flex items-center justify-center',
          'pointer-events-none'
        )}
        style={{
          top: -50,
          height: 50,
        }}
        animate={{
          y: pullDistance,
          scale,
          opacity: progress,
        }}
        transition={{
          type: prefersReducedMotion ? 'tween' : 'spring',
          damping: 20,
          stiffness: 200,
        }}
      >
        {config.indicatorStyle === 'spinner' && (
          <div
            className={cn(
              'w-8 h-8 rounded-full border-2 border-slate-200',
              pullState === 'refreshing'
                ? 'border-t-primary animate-spin'
                : 'border-t-primary'
            )}
            style={{
              transform: pullState !== 'refreshing' ? `rotate(${rotation}deg)` : undefined,
            }}
          />
        )}
        
        {config.indicatorStyle === 'dots' && (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary rounded-full"
                animate={
                  pullState === 'refreshing'
                    ? {
                        y: [0, -8, 0],
                        transition: {
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.1,
                        },
                      }
                    : { opacity: progress }
                }
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Content with pull offset */}
      <motion.div
        animate={{ y: pullState !== 'idle' ? pullDistance : 0 }}
        transition={{
          type: prefersReducedMotion ? 'tween' : 'spring',
          damping: 30,
          stiffness: 300,
        }}
      >
        {children}
      </motion.div>

      {/* Status text */}
      {pullDistance > 0 && (
        <motion.div
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {pullState === 'ready' && 'Release to refresh'}
          {pullState === 'pulling' && 'Pull to refresh'}
          {pullState === 'refreshing' && 'Refreshing...'}
        </motion.div>
      )}
    </div>
  );
}

/**
 * usePullToRefresh Hook
 * 
 * Convenience hook for pull-to-refresh state management
 */
export function usePullToRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refresh = useCallback(async (callback: () => Promise<void>) => {
    setIsRefreshing(true);
    try {
      await callback();
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  
  return {
    isRefreshing,
    setIsRefreshing,
    refresh,
  };
}
