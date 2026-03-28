/**
 * PostHog Feature Flag Integration
 *
 * Utilities for syncing feature flags with PostHog and
 * handling feature flag events.
 */

import posthog from 'posthog-js';
import type { FeatureFlagId, PostHogFeatureFlag, FeatureContext } from './types';

// ============================================================================
// Types
// ============================================================================

export interface PostHogSyncResult {
  /** Successfully synced flags */
  synced: Map<FeatureFlagId, PostHogFeatureFlag>;
  /** Flags that failed to sync */
  errors: string[];
  /** Sync timestamp */
  timestamp: string;
}

// ============================================================================
// PostHog Sync Functions
// ============================================================================

/**
 * Sync all feature flags from PostHog
 */
export async function syncFeatureFlagsFromPostHog(): Promise<PostHogSyncResult> {
  const synced = new Map<FeatureFlagId, PostHogFeatureFlag>();
  const errors: string[] = [];
  const timestamp = new Date().toISOString();

  try {
    // Ensure PostHog is loaded
    if (!posthog.__loaded) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('PostHog load timeout'));
        }, 5000);

        posthog.onFeatureFlags(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    // Get all flags
    const allFlags = posthog.featureFlags.getFlags();

    for (const key of allFlags) {
      try {
        const value = posthog.getFeatureFlag(key);
        const payload = posthog.getFeatureFlagPayload(key);

        if (typeof value === 'boolean') {
          synced.set(key, {
            key,
            enabled: value,
            payload: payload ? (payload as Record<string, unknown>) : undefined,
          });
        } else if (typeof value === 'string') {
          synced.set(key, {
            key,
            enabled: true,
            variantKey: value,
            payload: payload ? (payload as Record<string, unknown>) : undefined,
          });
        }
      } catch (err) {
        errors.push(`Failed to sync flag ${key}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  } catch (err) {
    errors.push(`PostHog sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  return { synced, errors, timestamp };
}

/**
 * Refresh feature flags from PostHog
 */
export async function refreshPostHogFlags(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!posthog.__loaded) {
      reject(new Error('PostHog not initialized'));
      return;
    }

    posthog.reloadFeatureFlags();

    // Wait for flags to reload
    const timeout = setTimeout(() => {
      reject(new Error('PostHog reload timeout'));
    }, 5000);

    posthog.onFeatureFlags(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

// ============================================================================
// Feature Flag Tracking
// ============================================================================

/**
 * Track feature flag evaluation in PostHog
 */
export function trackFlagEvaluationInPostHog(
  flagId: FeatureFlagId,
  enabled: boolean,
  variant?: string,
  source?: string
): void {
  if (!posthog.__loaded) return;

  posthog.capture('$feature_flag_called', {
    $feature_flag: flagId,
    $feature_flag_response: variant || enabled,
    feature_flag_source: source,
  });
}

/**
 * Track feature usage in PostHog
 */
export function trackFeatureUsageInPostHog(
  flagId: FeatureFlagId,
  action: string = 'used',
  properties?: Record<string, unknown>
): void {
  if (!posthog.__loaded) return;

  posthog.capture(`feature_${flagId}_${action}`, {
    flagId,
    ...properties,
  });
}

/**
 * Track A/B test exposure in PostHog
 */
export function trackExperimentExposure(
  experimentId: FeatureFlagId,
  variant: string,
  properties?: Record<string, unknown>
): void {
  if (!posthog.__loaded) return;

  posthog.capture('$experiment_exposure', {
    experiment_id: experimentId,
    experiment_variant: variant,
    $feature_flag: experimentId,
    $feature_flag_response: variant,
    ...properties,
  });
}

/**
 * Track A/B test conversion in PostHog
 */
export function trackExperimentConversion(
  experimentId: FeatureFlagId,
  variant: string,
  conversionEvent: string,
  properties?: Record<string, unknown>
): void {
  if (!posthog.__loaded) return;

  posthog.capture(conversionEvent, {
    experiment_id: experimentId,
    experiment_variant: variant,
    $feature_flag: experimentId,
    ...properties,
  });
}

// ============================================================================
// User Identification
// ============================================================================

/**
 * Update PostHog user properties for feature flag targeting
 */
export function updatePostHogUserProperties(context: FeatureContext): void {
  if (!posthog.__loaded) return;

  const properties: Record<string, unknown> = {};

  if (context.tenantId) {
    properties.tenant_id = context.tenantId;
  }
  if (context.role) {
    properties.role = context.role;
  }
  if (context.domain) {
    properties.service_domain = context.domain;
  }
  if (context.environment) {
    properties.environment = context.environment;
  }
  if (context.properties) {
    Object.assign(properties, context.properties);
  }

  // Update person properties
  posthog.setPersonProperties(properties);

  // Reload feature flags with new properties
  posthog.reloadFeatureFlags();
}

/**
 * Set PostHog group for tenant-level feature flags
 */
export function setPostHogTenantGroup(tenantId: string, tenantName?: string): void {
  if (!posthog.__loaded) return;

  posthog.group('tenant', tenantId, {
    name: tenantName || tenantId,
  });
}

// ============================================================================
// Override Management
// ============================================================================

/**
 * Set a local override that PostHog will respect
 */
export function setPostHogOverride(flagId: FeatureFlagId, value: boolean | string): void {
  if (!posthog.__loaded) return;

  posthog.featureFlags.override({ [flagId]: value });
}

/**
 * Clear PostHog overrides
 */
export function clearPostHogOverrides(): void {
  if (!posthog.__loaded) return;

  posthog.featureFlags.override(false);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if PostHog is available
 */
export function isPostHogAvailable(): boolean {
  return typeof posthog !== 'undefined' && posthog.__loaded === true;
}

/**
 * Get PostHog distinct ID (user ID)
 */
export function getPostHogDistinctId(): string | undefined {
  if (!posthog.__loaded) return undefined;
  return posthog.get_distinct_id();
}

/**
 * Get current PostHog session ID
 */
export function getPostHogSessionId(): string | undefined {
  if (!posthog.__loaded) return undefined;
  return posthog.get_session_id();
}
