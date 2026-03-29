/**
 * FeatureGate Component
 *
 * Conditionally renders content based on feature flag state.
 * Supports loading states, fallbacks, and inversion.
 */

'use client';

import React, { type ReactNode } from 'react';
import { useFeatureFlag, useFeatureFlagContext } from '@/lib/features/provider';
import type { FeatureFlagId } from '@/lib/features/types';

// ============================================================================
// Types
// ============================================================================

interface FeatureGateProps {
  /** Feature flag ID to check */
  flag: FeatureFlagId;
  /** Content to render when flag is enabled */
  children: ReactNode;
  /** Content to render when flag is disabled */
  fallback?: ReactNode;
  /** Invert the check (render when disabled) */
  invert?: boolean;
  /** Show loading state while flags are being evaluated */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Track usage when rendered */
  trackUsage?: boolean;
}

interface MultiFeatureGateProps {
  /** Feature flag IDs to check */
  flags: FeatureFlagId[];
  /** Logic for combining flags: 'all' = AND, 'any' = OR */
  logic?: 'all' | 'any';
  /** Content to render when condition is met */
  children: ReactNode;
  /** Content to render when condition is not met */
  fallback?: ReactNode;
  /** Show loading state while flags are being evaluated */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
}

// ============================================================================
// Loading Component
// ============================================================================

function DefaultLoading() {
  return (
    <div className="animate-pulse motion-reduce:animate-none h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
  );
}

// ============================================================================
// FeatureGate Component
// ============================================================================

/**
 * Renders children only if the specified feature flag is enabled
 *
 * @example
 * ```tsx
 * <FeatureGate flag="ai_insights">
 *   <AIInsightsPanel />
 * </FeatureGate>
 *
 * <FeatureGate flag="bulk_upload" fallback={<UpgradeBanner />}>
 *   <BulkUploadButton />
 * </FeatureGate>
 *
 * <FeatureGate flag="legacy_mode" invert>
 *   <NewUIComponent />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  flag,
  children,
  fallback = null,
  invert = false,
  showLoading = false,
  loadingComponent,
  trackUsage = false,
}: FeatureGateProps) {
  const { isEnabled, trackUsage: track, isLoading } = useFeatureFlagContext();
  const enabled = isEnabled(flag);

  // Show loading state
  if (showLoading && isLoading) {
    return <>{loadingComponent ?? <DefaultLoading />}</>;
  }

  // Track usage if enabled and tracking is requested
  if (trackUsage && enabled && !invert) {
    track(flag);
  }

  // Determine if we should render children
  const shouldRender = invert ? !enabled : enabled;

  return <>{shouldRender ? children : fallback}</>;
}

// ============================================================================
// MultiFeatureGate Component
// ============================================================================

/**
 * Renders children based on multiple feature flags
 *
 * @example
 * ```tsx
 * <MultiFeatureGate flags={['ai_insights', 'ai_quality_scoring']} logic="all">
 *   <AdvancedAIPanel />
 * </MultiFeatureGate>
 *
 * <MultiFeatureGate flags={['bulk_upload', 'offline_mode']} logic="any">
 *   <ProFeaturesBanner />
 * </MultiFeatureGate>
 * ```
 */
export function MultiFeatureGate({
  flags,
  logic = 'all',
  children,
  fallback = null,
  showLoading = false,
  loadingComponent,
}: MultiFeatureGateProps) {
  const { allEnabled, anyEnabled, isLoading } = useFeatureFlagContext();

  // Show loading state
  if (showLoading && isLoading) {
    return <>{loadingComponent ?? <DefaultLoading />}</>;
  }

  // Evaluate based on logic
  const shouldRender = logic === 'all'
    ? allEnabled(...flags)
    : anyEnabled(...flags);

  return <>{shouldRender ? children : fallback}</>;
}

// ============================================================================
// FeatureSwitch Component
// ============================================================================

interface FeatureSwitchCaseProps {
  flag: FeatureFlagId;
  children: ReactNode;
}

interface FeatureSwitchDefaultProps {
  children: ReactNode;
}

interface FeatureSwitchProps {
  children: ReactNode;
}

/**
 * Switch-style component for feature flag branching
 *
 * @example
 * ```tsx
 * <FeatureSwitch>
 *   <FeatureSwitch.Case flag="ai_insights">
 *     <AIInsightsV2 />
 *   </FeatureSwitch.Case>
 *   <FeatureSwitch.Case flag="legacy_insights">
 *     <LegacyInsights />
 *   </FeatureSwitch.Case>
 *   <FeatureSwitch.Default>
 *     <BasicInsights />
 *   </FeatureSwitch.Default>
 * </FeatureSwitch>
 * ```
 */
export function FeatureSwitch({ children }: FeatureSwitchProps) {
  const { isEnabled } = useFeatureFlagContext();

  const childArray = React.Children.toArray(children);

  // Find first enabled case
  for (const child of childArray) {
    if (!React.isValidElement(child)) continue;

    // Check if it's a Case
    if (child.type === FeatureSwitchCase) {
      const caseProps = child.props as FeatureSwitchCaseProps;
      if (isEnabled(caseProps.flag)) {
        return <>{caseProps.children}</>;
      }
    }
  }

  // Find and render default
  for (const child of childArray) {
    if (!React.isValidElement(child)) continue;

    if (child.type === FeatureSwitchDefault) {
      const defaultProps = child.props as FeatureSwitchDefaultProps;
      return <>{defaultProps.children}</>;
    }
  }

  return null;
}

function FeatureSwitchCase({ children }: FeatureSwitchCaseProps) {
  return <>{children}</>;
}

function FeatureSwitchDefault({ children }: FeatureSwitchDefaultProps) {
  return <>{children}</>;
}

FeatureSwitch.Case = FeatureSwitchCase;
FeatureSwitch.Default = FeatureSwitchDefault;

// ============================================================================
// Exports
// ============================================================================

export default FeatureGate;
