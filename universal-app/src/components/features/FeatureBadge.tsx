/**
 * FeatureBadge Component
 *
 * Display badges for feature flags (Beta, New, Coming Soon, etc.)
 * Integrates with the feature flag system for automatic display.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useFeatureFlag, useFeatureFlagContext } from '@/lib/features/provider';
import { getFlag } from '@/lib/features/flags';
import type { FeatureFlagId, FeatureFlag } from '@/lib/features/types';
import { Sparkles, Beaker, AlertTriangle, Star, Clock, Zap } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type BadgeVariant = 'beta' | 'new' | 'experimental' | 'coming_soon' | 'deprecated' | 'premium';

interface FeatureBadgeProps {
  /** Feature flag ID to check */
  flag?: FeatureFlagId;
  /** Manual variant (overrides auto-detection) */
  variant?: BadgeVariant;
  /** Custom label text */
  label?: string;
  /** Badge size */
  size?: 'xs' | 'sm' | 'md';
  /** Show animation */
  animate?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Show only if flag is enabled */
  showWhenEnabled?: boolean;
  /** Pulse animation */
  pulse?: boolean;
}

interface AutoFeatureBadgeProps {
  /** Feature flag ID */
  flag: FeatureFlagId;
  /** Badge size */
  size?: 'xs' | 'sm' | 'md';
  /** Additional CSS class */
  className?: string;
}

// ============================================================================
// Badge Variants Configuration
// ============================================================================

const BADGE_VARIANTS: Record<
  BadgeVariant,
  {
    label: string;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  beta: {
    label: 'Beta',
    icon: <Beaker className="w-3 h-3" />,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  new: {
    label: 'New',
    icon: <Sparkles className="w-3 h-3" />,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  experimental: {
    label: 'Experimental',
    icon: <Zap className="w-3 h-3" />,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  coming_soon: {
    label: 'Coming Soon',
    icon: <Clock className="w-3 h-3" />,
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
  deprecated: {
    label: 'Deprecated',
    icon: <AlertTriangle className="w-3 h-3" />,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  premium: {
    label: 'Premium',
    icon: <Star className="w-3 h-3" />,
    bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
};

// ============================================================================
// Size Configuration
// ============================================================================

const SIZE_CLASSES = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Determine badge variant from flag status
 */
function getVariantFromStatus(status: FeatureFlag['status']): BadgeVariant {
  switch (status) {
    case 'beta':
      return 'beta';
    case 'development':
      return 'experimental';
    case 'deprecated':
      return 'deprecated';
    case 'released':
      return 'new'; // Show "New" for recently released features
    default:
      return 'beta';
  }
}

// ============================================================================
// FeatureBadge Component
// ============================================================================

/**
 * Displays a badge for a feature
 *
 * @example
 * ```tsx
 * // Auto-detect from flag status
 * <FeatureBadge flag="ai_insights" />
 *
 * // Manual variant
 * <FeatureBadge variant="premium" />
 *
 * // With custom label
 * <FeatureBadge variant="new" label="Just Added!" />
 *
 * // Different sizes
 * <FeatureBadge flag="ai_insights" size="xs" />
 * ```
 */
export function FeatureBadge({
  flag,
  variant,
  label,
  size = 'sm',
  animate = true,
  className = '',
  showWhenEnabled = false,
  pulse = false,
}: FeatureBadgeProps) {
  // Get flag data if flag ID provided
  const flagData = flag ? getFlag(flag) : undefined;
  const isEnabled = useFeatureFlag(flag || '');

  // Auto-detect variant from flag status
  const effectiveVariant = variant || (flagData ? getVariantFromStatus(flagData.status) : 'new');
  const config = BADGE_VARIANTS[effectiveVariant];

  // Determine if badge should be shown
  if (showWhenEnabled && !isEnabled) {
    return null;
  }

  // Determine label text
  const labelText = label || config.label;

  return (
    <motion.span
      initial={animate ? { scale: 0.9, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : false}
      className={`
        inline-flex items-center rounded-full font-medium border
        ${SIZE_CLASSES[size]}
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        ${className}
      `}
    >
      {/* Optional pulse indicator */}
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`
              animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
              ${config.textColor.replace('text-', 'bg-')}
            `}
          />
          <span
            className={`
              relative inline-flex rounded-full h-2 w-2
              ${config.textColor.replace('text-', 'bg-')}
            `}
          />
        </span>
      )}

      {/* Icon */}
      {config.icon}

      {/* Label */}
      <span>{labelText}</span>
    </motion.span>
  );
}

// ============================================================================
// AutoFeatureBadge Component
// ============================================================================

/**
 * Automatically shows appropriate badge based on flag status
 * Only shows badge if the feature is in beta, experimental, or development
 *
 * @example
 * ```tsx
 * <AutoFeatureBadge flag="ai_insights" />
 * ```
 */
export function AutoFeatureBadge({ flag, size = 'sm', className = '' }: AutoFeatureBadgeProps) {
  const flagData = getFlag(flag);
  const isEnabled = useFeatureFlag(flag);

  // Don't show badge for released/deprecated features or disabled features
  if (!flagData || !isEnabled) {
    return null;
  }

  // Only show badge for beta and development status
  if (flagData.status !== 'beta' && flagData.status !== 'development') {
    return null;
  }

  return (
    <FeatureBadge
      flag={flag}
      size={size}
      className={className}
    />
  );
}

// ============================================================================
// Inline Badge Component
// ============================================================================

interface InlineBadgeProps {
  children: React.ReactNode;
  flag: FeatureFlagId;
  badgePosition?: 'before' | 'after';
  size?: 'xs' | 'sm' | 'md';
}

/**
 * Wraps content and adds a badge inline
 *
 * @example
 * ```tsx
 * <InlineBadge flag="ai_insights">
 *   AI Insights
 * </InlineBadge>
 * ```
 */
export function InlineBadge({
  children,
  flag,
  badgePosition = 'after',
  size = 'xs',
}: InlineBadgeProps) {
  const badge = <AutoFeatureBadge flag={flag} size={size} />;

  return (
    <span className="inline-flex items-center gap-2">
      {badgePosition === 'before' && badge}
      {children}
      {badgePosition === 'after' && badge}
    </span>
  );
}

// ============================================================================
// Status Indicator Component
// ============================================================================

interface FeatureStatusIndicatorProps {
  flag: FeatureFlagId;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Simple status indicator dot for a feature
 *
 * @example
 * ```tsx
 * <FeatureStatusIndicator flag="ai_insights" />
 * ```
 */
export function FeatureStatusIndicator({
  flag,
  showLabel = false,
  size = 'md',
}: FeatureStatusIndicatorProps) {
  const isEnabled = useFeatureFlag(flag);
  const flagData = getFlag(flag);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const colorClass = isEnabled
    ? 'bg-green-500'
    : flagData?.status === 'development'
    ? 'bg-yellow-500'
    : 'bg-gray-400';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`
          ${sizeClasses[size]} rounded-full ${colorClass}
          ${isEnabled ? 'animate-pulse' : ''}
        `}
      />
      {showLabel && (
        <span className="text-xs text-gray-500">
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      )}
    </span>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default FeatureBadge;
