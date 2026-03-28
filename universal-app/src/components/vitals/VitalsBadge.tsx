'use client';

/**
 * VitalsBadge - Performance Score Badge
 *
 * Compact badge showing overall performance score with color coding.
 * Useful for dashboards and status indicators.
 *
 * @example
 * ```tsx
 * <VitalsBadge size="sm" />
 * <VitalsBadge showLabel variant="detailed" />
 * ```
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWebVitals } from '@/hooks/useWebVitals';
import { getRatingColor, getRatingColorClass, getRatingIcon } from '@/lib/vitals/utils';

interface VitalsBadgeProps {
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Show text label */
  showLabel?: boolean;
  /** Badge variant */
  variant?: 'minimal' | 'compact' | 'detailed';
  /** Custom className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export function VitalsBadge({
  size = 'md',
  showLabel = false,
  variant = 'compact',
  className = '',
  onClick,
}: VitalsBadgeProps) {
  const { score, scoreRating, metricsArray, isActive } = useWebVitals({
    refreshInterval: 2000,
  });

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  // Count metrics by rating
  const ratingCounts = useMemo(() => {
    const counts = { good: 0, 'needs-improvement': 0, poor: 0 };
    metricsArray.forEach((m) => {
      counts[m.rating]++;
    });
    return counts;
  }, [metricsArray]);

  if (variant === 'minimal') {
    return (
      <motion.span
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClasses[size]} ${getRatingColorClass(scoreRating)} ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        title={`Performance Score: ${score}`}
      >
        {score}
      </motion.span>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`inline-flex items-center gap-1.5 rounded-full font-mono ${sizeClasses[size]} bg-gray-100 dark:bg-gray-800 ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <span
          className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${getRatingColorClass(scoreRating)}`}
        >
          {getRatingIcon(scoreRating)}
        </span>
        <span className="font-bold" style={{ color: getRatingColor(scoreRating) }}>
          {score}
        </span>
        {showLabel && (
          <span className="text-gray-500 dark:text-gray-400">
            {scoreRating === 'good' ? 'Good' : scoreRating === 'needs-improvement' ? 'Fair' : 'Poor'}
          </span>
        )}
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        )}
      </motion.div>
    );
  }

  // Detailed variant
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex flex-col items-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Score circle */}
      <div
        className="relative w-16 h-16 flex items-center justify-center rounded-full border-4"
        style={{ borderColor: getRatingColor(scoreRating) }}
      >
        <span className="text-2xl font-bold" style={{ color: getRatingColor(scoreRating) }}>
          {score}
        </span>
        {isActive && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          Performance
        </span>
      )}

      {/* Rating counts */}
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="flex items-center gap-0.5 text-green-500">
          <span>✓</span>
          <span>{ratingCounts.good}</span>
        </span>
        <span className="flex items-center gap-0.5 text-amber-500">
          <span>⚠</span>
          <span>{ratingCounts['needs-improvement']}</span>
        </span>
        <span className="flex items-center gap-0.5 text-red-500">
          <span>✗</span>
          <span>{ratingCounts.poor}</span>
        </span>
      </div>
    </motion.div>
  );
}

export default VitalsBadge;
