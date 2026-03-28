/**
 * Feature Hooks
 *
 * Custom hooks for feature flag management with analytics tracking,
 * A/B testing support, and PostHog integration.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  useFeatureFlag,
  useFeatureFlagContext,
  useFeatureFlagEvaluation,
  useFeatureVariant,
} from '@/lib/features/provider';
import { getFlag, getAllFlags, FLAG_IDS, type KnownFlagId } from '@/lib/features/flags';
import type {
  FeatureFlagId,
  FeatureFlag,
  FeatureEvaluationResult,
} from '@/lib/features/types';
import posthog from 'posthog-js';

// ============================================================================
// Feature Enabled Hook
// ============================================================================

/**
 * Check if a feature is enabled with optional tracking
 *
 * @example
 * ```tsx
 * const { isEnabled, track } = useFeatureEnabled('ai_insights');
 *
 * if (isEnabled) {
 *   track(); // Track usage
 *   return <AIInsightsPanel />;
 * }
 * ```
 */
export function useFeatureEnabled(flagId: FeatureFlagId) {
  const isEnabled = useFeatureFlag(flagId);
  const { trackUsage } = useFeatureFlagContext();

  const track = useCallback(() => {
    trackUsage(flagId);
  }, [flagId, trackUsage]);

  return { isEnabled, track };
}

// ============================================================================
// All Features Hook
// ============================================================================

/**
 * Get all enabled features grouped by category
 *
 * @example
 * ```tsx
 * const { enabledFeatures, hasAIFeatures, hasIntegrations } = useAllFeatures();
 * ```
 */
export function useAllFeatures() {
  const { isEnabled, isLoading } = useFeatureFlagContext();

  const enabledFeatures = useMemo(() => {
    if (isLoading) return [];
    return getAllFlags()
      .filter((flag) => isEnabled(flag.id))
      .map((flag) => flag.id);
  }, [isEnabled, isLoading]);

  const featuresByTag = useMemo(() => {
    const groups: Record<string, FeatureFlagId[]> = {};
    for (const flag of getAllFlags()) {
      if (!isEnabled(flag.id)) continue;
      for (const tag of flag.tags || []) {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(flag.id);
      }
    }
    return groups;
  }, [isEnabled]);

  return {
    enabledFeatures,
    featuresByTag,
    hasAIFeatures: (featuresByTag['ai']?.length || 0) > 0,
    hasIntegrations: (featuresByTag['integration']?.length || 0) > 0,
    hasWorkflowFeatures: (featuresByTag['workflow']?.length || 0) > 0,
    hasAdminFeatures: (featuresByTag['admin']?.length || 0) > 0,
    isLoading,
  };
}

// ============================================================================
// Feature Analytics Hook
// ============================================================================

interface FeatureAnalyticsOptions {
  /** Track on mount */
  trackOnMount?: boolean;
  /** Track on unmount */
  trackOnUnmount?: boolean;
  /** Custom properties */
  properties?: Record<string, unknown>;
}

/**
 * Track feature usage with analytics
 *
 * @example
 * ```tsx
 * const { track, isEnabled } = useFeatureAnalytics('ai_insights', {
 *   trackOnMount: true,
 *   properties: { source: 'dashboard' }
 * });
 * ```
 */
export function useFeatureAnalytics(
  flagId: FeatureFlagId,
  options: FeatureAnalyticsOptions = {}
) {
  const { trackOnMount = false, trackOnUnmount = false, properties = {} } = options;
  const isEnabled = useFeatureFlag(flagId);
  const evaluation = useFeatureFlagEvaluation(flagId);
  const flag = useMemo(() => getFlag(flagId), [flagId]);
  const hasTrackedMount = useRef(false);

  // Track function
  const track = useCallback(
    (eventSuffix?: string, additionalProps?: Record<string, unknown>) => {
      if (!flag) return;

      const eventName = eventSuffix
        ? `feature_${flag.id}_${eventSuffix}`
        : flag.analytics?.eventName || `feature_${flag.id}_used`;

      const eventProps = {
        flagId: flag.id,
        enabled: isEnabled,
        variant: evaluation?.variant,
        source: evaluation?.source,
        ...properties,
        ...additionalProps,
      };

      // Send to PostHog
      try {
        posthog.capture(eventName, eventProps);
      } catch {
        // PostHog may not be initialized
      }
    },
    [flag, isEnabled, evaluation, properties]
  );

  // Track on mount
  useEffect(() => {
    if (trackOnMount && isEnabled && !hasTrackedMount.current) {
      track('viewed');
      hasTrackedMount.current = true;
    }
  }, [trackOnMount, isEnabled, track]);

  // Track on unmount
  useEffect(() => {
    return () => {
      if (trackOnUnmount && isEnabled) {
        track('closed');
      }
    };
  }, [trackOnUnmount, isEnabled, track]);

  return {
    isEnabled,
    evaluation,
    track,
    flag,
  };
}

// ============================================================================
// A/B Test Hook
// ============================================================================

interface ABTestOptions {
  /** Control variant key */
  controlKey?: string;
  /** Track exposure on mount */
  trackExposure?: boolean;
}

/**
 * Hook for A/B testing with variant tracking
 *
 * @example
 * ```tsx
 * const { variant, isControl, isVariant, track } = useABTest('review_workflow_v2');
 *
 * if (isVariant('enhanced')) {
 *   return <EnhancedWorkflow onAction={() => track('completed')} />;
 * }
 * return <OriginalWorkflow onAction={() => track('completed')} />;
 * ```
 */
export function useABTest(flagId: FeatureFlagId, options: ABTestOptions = {}) {
  const { controlKey = 'control', trackExposure = true } = options;
  const isEnabled = useFeatureFlag(flagId);
  const variant = useFeatureVariant(flagId);
  const flag = useMemo(() => getFlag(flagId), [flagId]);
  const hasTrackedExposure = useRef(false);

  const isControl = variant === controlKey;
  const isVariant = useCallback((key: string) => variant === key, [variant]);

  // Track exposure
  useEffect(() => {
    if (trackExposure && isEnabled && variant && !hasTrackedExposure.current) {
      try {
        posthog.capture('$experiment_exposure', {
          flagId,
          variant,
          experiment_id: flagId,
          experiment_variant: variant,
        });
      } catch {
        // PostHog may not be initialized
      }
      hasTrackedExposure.current = true;
    }
  }, [trackExposure, isEnabled, variant, flagId]);

  // Track conversion
  const track = useCallback(
    (conversionEvent: string, properties?: Record<string, unknown>) => {
      if (!variant) return;

      try {
        posthog.capture(`experiment_${flagId}_${conversionEvent}`, {
          flagId,
          variant,
          ...properties,
        });
      } catch {
        // PostHog may not be initialized
      }
    },
    [flagId, variant]
  );

  return {
    isEnabled,
    variant,
    isControl,
    isVariant,
    track,
    flag,
  };
}

// ============================================================================
// Feature Dependencies Hook
// ============================================================================

/**
 * Check if all dependencies for a feature are enabled
 *
 * @example
 * ```tsx
 * const { allDependenciesEnabled, missingDependencies } = useFeatureDependencies('microsoft_365_integration');
 * ```
 */
export function useFeatureDependencies(flagId: FeatureFlagId) {
  const { isEnabled } = useFeatureFlagContext();
  const flag = useMemo(() => getFlag(flagId), [flagId]);

  const dependencies = useMemo(() => {
    return (flag?.dependencies || []).map((depId) => ({
      id: depId,
      flag: getFlag(depId),
      enabled: isEnabled(depId),
    }));
  }, [flag, isEnabled]);

  const allDependenciesEnabled = dependencies.every((dep) => dep.enabled);
  const missingDependencies = dependencies.filter((dep) => !dep.enabled);

  return {
    dependencies,
    allDependenciesEnabled,
    missingDependencies,
  };
}

// ============================================================================
// Feature State Hook
// ============================================================================

/**
 * Get detailed state for a feature flag
 *
 * @example
 * ```tsx
 * const state = useFeatureState('ai_insights');
 * console.log(state.source); // 'override' | 'posthog' | 'condition' | 'default'
 * ```
 */
export function useFeatureState(flagId: FeatureFlagId) {
  const { isEnabled, state, getEvaluation } = useFeatureFlagContext();
  const flag = useMemo(() => getFlag(flagId), [flagId]);
  const evaluation = getEvaluation(flagId);

  return {
    flag,
    enabled: isEnabled(flagId),
    variant: evaluation?.variant,
    payload: evaluation?.payload,
    source: evaluation?.source,
    hasOverride: state.overrides.has(flagId),
    hasPosthogFlag: state.posthogFlags.has(flagId),
    evaluatedAt: evaluation?.evaluatedAt,
    matchedConditions: evaluation?.matchedConditions,
  };
}

// ============================================================================
// Bulk Feature Check Hook
// ============================================================================

/**
 * Check multiple features at once
 *
 * @example
 * ```tsx
 * const features = useFeatureFlags(['ai_insights', 'bulk_upload', 'offline_mode']);
 * features['ai_insights'] // boolean
 * ```
 */
export function useFeatureChecks(flagIds: FeatureFlagId[]): Record<string, boolean> {
  const { isEnabled, isLoading } = useFeatureFlagContext();

  return useMemo(() => {
    if (isLoading) {
      return flagIds.reduce((acc, id) => ({ ...acc, [id]: false }), {});
    }
    return flagIds.reduce((acc, id) => ({ ...acc, [id]: isEnabled(id) }), {});
  }, [flagIds, isEnabled, isLoading]);
}

// ============================================================================
// Feature Rollout Progress Hook
// ============================================================================

/**
 * Get rollout progress for percentage-based features
 *
 * @example
 * ```tsx
 * const { percentage, isInRollout } = useFeatureRollout('smart_capture_v2');
 * ```
 */
export function useFeatureRollout(flagId: FeatureFlagId) {
  const flag = useMemo(() => getFlag(flagId), [flagId]);
  const isEnabled = useFeatureFlag(flagId);

  const percentageCondition = useMemo(() => {
    return flag?.conditions?.find((c) => c.type === 'percentage');
  }, [flag]);

  return {
    flag,
    isEnabled,
    percentage: percentageCondition?.type === 'percentage' ? percentageCondition.percentage : null,
    isInRollout: isEnabled && percentageCondition !== undefined,
    isFullRollout: percentageCondition?.type === 'percentage' && percentageCondition.percentage >= 100,
  };
}

// ============================================================================
// Typed Feature Flags Hook
// ============================================================================

/**
 * Type-safe access to known feature flags
 *
 * @example
 * ```tsx
 * const flags = useTypedFeatureFlags();
 * if (flags.ai_insights) {
 *   // TypeScript knows this is a boolean
 * }
 * ```
 */
export function useTypedFeatureFlags(): Record<KnownFlagId, boolean> {
  const { isEnabled, isLoading } = useFeatureFlagContext();

  return useMemo(() => {
    const result = {} as Record<KnownFlagId, boolean>;
    for (const id of Object.values(FLAG_IDS)) {
      result[id] = isLoading ? false : isEnabled(id);
    }
    return result;
  }, [isEnabled, isLoading]);
}

// ============================================================================
// Export All
// ============================================================================

export {
  useFeatureFlag,
  useFeatureFlagContext,
  useFeatureFlagEvaluation,
  useFeatureVariant,
  useFeatureFlags,
  useFeatureFlagAdmin,
  useFeatureUsageTracker,
} from '@/lib/features/provider';
