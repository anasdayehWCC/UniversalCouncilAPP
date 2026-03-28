/**
 * Feature Flag System
 *
 * Central export for the feature flag system.
 */

// Types
export * from './types';

// Flag definitions
export * from './flags';

// Evaluator
export * from './evaluator';

// PostHog integration
export * from './posthog-integration';

// Provider and hooks
export {
  FeatureFlagProvider,
  useFeatureFlagContext,
  useFeatureFlag,
  useFeatureFlagEvaluation,
  useFeatureVariant,
  useFeatureFlags,
  useFeatureFlagAdmin,
  useFeatureUsageTracker,
  withFeatureFlag,
} from './provider';
