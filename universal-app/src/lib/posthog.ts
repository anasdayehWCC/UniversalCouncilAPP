/**
 * PostHog configuration utilities for Universal Council App
 *
 * Provides centralized PostHog configuration with privacy compliance,
 * demo mode awareness, feature flags, and user identification.
 */

import posthog, { PostHog } from 'posthog-js';
import { isDemoMode } from '@/lib/auth/msal-config';

/**
 * Environment configuration for PostHog
 */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com';

/**
 * Check if PostHog should be enabled
 * - Disabled in demo mode for privacy
 * - Disabled if no API key is configured
 * - Disabled if user has Do Not Track enabled
 */
export function isPostHogEnabled(): boolean {
  // Never enable in demo mode
  if (isDemoMode) {
    return false;
  }

  // Require API key to be configured
  if (!POSTHOG_KEY) {
    return false;
  }

  // Respect Do Not Track
  if (typeof window !== 'undefined') {
    const dnt = navigator.doNotTrack || (window as { doNotTrack?: string }).doNotTrack;
    if (dnt === '1' || dnt === 'yes') {
      return false;
    }
  }

  return true;
}

/**
 * PostHog initialization state
 */
let isInitialized = false;

/**
 * Initialize PostHog with privacy-compliant configuration
 */
export function initPostHog(): PostHog | null {
  if (!isPostHogEnabled()) {
    return null;
  }

  if (isInitialized) {
    return posthog;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,

    // Privacy settings
    persistence: 'localStorage+cookie',
    secure_cookie: process.env.NODE_ENV === 'production',
    respect_dnt: true,

    // Autocapture configuration
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,

    // Session recording (sampled)
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-sensitive]',
      blockSelector: '[data-no-record]',
    },

    // Feature flags
    bootstrap: {
      featureFlags: {},
    },

    // Performance
    loaded: (ph) => {
      // Disable some automatic capture in development
      if (process.env.NODE_ENV === 'development') {
        ph.opt_out_capturing();
        console.log('[PostHog] Disabled in development - call posthog.opt_in_capturing() to enable');
      }
    },

    // Don't capture certain elements
    mask_all_text: false,
    mask_all_element_attributes: false,

    // Property filtering - never capture PII
    sanitize_properties: (properties) => {
      const piiKeys = [
        'email',
        'name',
        'firstName',
        'lastName',
        'phone',
        'address',
        'ssn',
        'nationalInsurance',
        'nino',
        'dateOfBirth',
        'dob',
      ];

      const sanitized = { ...properties };
      for (const key of piiKeys) {
        if (key in sanitized) {
          delete sanitized[key];
        }
      }
      return sanitized;
    },
  });

  isInitialized = true;
  return posthog;
}

/**
 * Identify user in PostHog with privacy-safe data
 */
export function identifyUserInPostHog(
  userId: string,
  traits?: {
    role?: string;
    tenantId?: string;
    domain?: string;
  }
): void {
  if (!isPostHogEnabled() || !isInitialized) {
    return;
  }

  posthog.identify(userId, {
    // Only include non-PII traits
    ...(traits?.role && { role: traits.role }),
    ...(traits?.tenantId && { tenant_id: traits.tenantId }),
    ...(traits?.domain && { domain: traits.domain }),
  });
}

/**
 * Clear user from PostHog (on logout)
 */
export function resetPostHogUser(): void {
  if (!isPostHogEnabled() || !isInitialized) {
    return;
  }

  posthog.reset();
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!isPostHogEnabled() || !isInitialized) {
    return;
  }

  // Filter PII from properties
  const safeProperties = properties ? filterPII(properties) : undefined;
  posthog.capture(eventName, safeProperties);
}

/**
 * Track a page view
 */
export function trackPageView(url?: string, properties?: Record<string, unknown>): void {
  if (!isPostHogEnabled() || !isInitialized) {
    return;
  }

  const safeProperties = properties ? filterPII(properties) : {};
  posthog.capture('$pageview', {
    ...safeProperties,
    ...(url && { $current_url: url }),
  });
}

/**
 * Get a feature flag value
 */
export function getFeatureFlag(flagKey: string): boolean | string | undefined {
  if (!isPostHogEnabled() || !isInitialized) {
    return undefined;
  }

  return posthog.getFeatureFlag(flagKey);
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (!isPostHogEnabled() || !isInitialized) {
    return false;
  }

  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Get feature flag payload (for multivariate flags)
 */
export function getFeatureFlagPayload(flagKey: string): unknown {
  if (!isPostHogEnabled() || !isInitialized) {
    return undefined;
  }

  return posthog.getFeatureFlagPayload(flagKey);
}

/**
 * Reload feature flags (useful after user identification)
 */
export function reloadFeatureFlags(): Promise<void> {
  if (!isPostHogEnabled() || !isInitialized) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    posthog.reloadFeatureFlags();
    // Give PostHog a moment to load flags
    setTimeout(resolve, 100);
  });
}

/**
 * Set group properties for analytics
 */
export function setGroup(groupType: string, groupKey: string, groupProperties?: Record<string, unknown>): void {
  if (!isPostHogEnabled() || !isInitialized) {
    return;
  }

  posthog.group(groupType, groupKey, groupProperties ? filterPII(groupProperties) : undefined);
}

/**
 * Set user properties (safe, non-PII only)
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!isPostHogEnabled() || !isInitialized) {
    return;
  }

  posthog.setPersonProperties(filterPII(properties));
}

/**
 * Start a session recording manually
 */
export function startSessionRecording(): void {
  if (!isPostHogEnabled() || !isInitialized) {
    return;
  }

  posthog.startSessionRecording();
}

/**
 * Stop session recording
 */
export function stopSessionRecording(): void {
  if (!isPostHogEnabled() || !isInitialized) {
    return;
  }

  posthog.stopSessionRecording();
}

/**
 * Opt out of capturing (GDPR compliance)
 */
export function optOutCapturing(): void {
  if (!isInitialized) {
    return;
  }

  posthog.opt_out_capturing();
}

/**
 * Opt in to capturing
 */
export function optInCapturing(): void {
  if (!isInitialized) {
    return;
  }

  posthog.opt_in_capturing();
}

/**
 * Check if user has opted out
 */
export function hasOptedOut(): boolean {
  if (!isInitialized) {
    return true;
  }

  return posthog.has_opted_out_capturing();
}

/**
 * Filter PII from properties object
 */
function filterPII(properties: Record<string, unknown>): Record<string, unknown> {
  const piiKeys = [
    'email',
    'name',
    'firstName',
    'lastName',
    'phone',
    'address',
    'ssn',
    'nationalInsurance',
    'nino',
    'dateOfBirth',
    'dob',
    'ip',
    'ipAddress',
  ];

  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!piiKeys.includes(key.toLowerCase())) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Get the PostHog instance (for advanced usage)
 */
export function getPostHog(): PostHog | null {
  if (!isPostHogEnabled() || !isInitialized) {
    return null;
  }

  return posthog;
}

export { posthog };
