'use client';

import { useCallback, useEffect } from 'react';
import { usePostHog, useFeatureFlag, useFeatureEnabled } from '@/providers/PostHogProvider';
import {
  identifyUserInSentry,
  clearSentryUser,
  setSentryContext,
  addSentryBreadcrumb,
  captureException,
  captureMessage,
  isSentryEnabled,
  startSpan,
} from '@/lib/sentry';
import type { SeverityLevel } from '@sentry/nextjs';

/**
 * User traits for identification across analytics services
 */
interface UserTraits {
  role?: string;
  tenantId?: string;
  domain?: string;
}

/**
 * Event properties type
 */
type EventProperties = Record<string, unknown>;

/**
 * Unified analytics hook for both Sentry and PostHog
 *
 * Provides a single interface for:
 * - User identification across both services
 * - Event tracking (PostHog)
 * - Error tracking (Sentry)
 * - Feature flags (PostHog)
 * - Performance monitoring (Sentry)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     identify,
 *     track,
 *     captureError,
 *     isFlagEnabled,
 *     setContext,
 *   } = useAnalytics();
 *
 *   useEffect(() => {
 *     if (user) {
 *       identify(user.id, { role: user.role, tenantId: user.tenantId });
 *     }
 *   }, [user, identify]);
 *
 *   const handleSubmit = async () => {
 *     track('form_submitted', { formType: 'contact' });
 *     try {
 *       await submitForm();
 *     } catch (error) {
 *       captureError(error, { context: { formType: 'contact' } });
 *     }
 *   };
 *
 *   if (isFlagEnabled('new-form')) {
 *     return <NewForm onSubmit={handleSubmit} />;
 *   }
 *
 *   return <LegacyForm onSubmit={handleSubmit} />;
 * }
 * ```
 */
export function useAnalytics() {
  const posthog = usePostHog();

  /**
   * Identify user across all analytics services
   */
  const identify = useCallback((userId: string, traits?: UserTraits) => {
    // Identify in PostHog
    posthog.identify(userId, traits);

    // Identify in Sentry
    identifyUserInSentry(userId, traits);
  }, [posthog]);

  /**
   * Clear user from all analytics services (logout)
   */
  const reset = useCallback(() => {
    posthog.reset();
    clearSentryUser();
  }, [posthog]);

  /**
   * Track an event in PostHog
   */
  const track = useCallback((event: string, properties?: EventProperties) => {
    posthog.track(event, properties);

    // Also add as Sentry breadcrumb for context in errors
    addSentryBreadcrumb({
      category: 'analytics',
      message: event,
      data: properties,
      level: 'info',
    });
  }, [posthog]);

  /**
   * Capture an error in Sentry
   */
  const captureError = useCallback((
    error: unknown,
    options?: {
      tags?: Record<string, string>;
      context?: Record<string, unknown>;
      level?: SeverityLevel;
    }
  ): string | undefined => {
    return captureException(error, {
      tags: options?.tags,
      extra: options?.context,
      level: options?.level,
    });
  }, []);

  /**
   * Capture a message in Sentry
   */
  const captureLog = useCallback((
    message: string,
    level: SeverityLevel = 'info',
    context?: Record<string, unknown>
  ): string | undefined => {
    return captureMessage(message, level, context);
  }, []);

  /**
   * Set context for Sentry errors
   */
  const setContext = useCallback((name: string, context: Record<string, unknown>) => {
    setSentryContext(name, context);
  }, []);

  /**
   * Add a breadcrumb for debugging
   */
  const addBreadcrumb = useCallback((
    message: string,
    category: string = 'app',
    data?: Record<string, unknown>,
    level: SeverityLevel = 'info'
  ) => {
    addSentryBreadcrumb({
      message,
      category,
      data,
      level,
    });
  }, []);

  /**
   * Check if a feature flag is enabled
   */
  const isFlagEnabled = useCallback((flagKey: string): boolean => {
    return posthog.isFlagEnabled(flagKey);
  }, [posthog]);

  /**
   * Get a feature flag value
   */
  const getFlag = useCallback((flagKey: string): boolean | string | undefined => {
    return posthog.getFlag(flagKey);
  }, [posthog]);

  /**
   * Get feature flag payload
   */
  const getFlagPayload = useCallback((flagKey: string): unknown => {
    return posthog.getFlagPayload(flagKey);
  }, [posthog]);

  /**
   * Set analytics group (for B2B analytics)
   */
  const setGroup = useCallback((groupType: string, groupKey: string, properties?: EventProperties) => {
    posthog.setAnalyticsGroup(groupType, groupKey, properties);
    setSentryContext(groupType, { [groupType]: groupKey, ...properties });
  }, [posthog]);

  /**
   * Track a timed operation with performance monitoring
   */
  const trackTimed = useCallback(async <T>(
    name: string,
    operation: string,
    callback: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();

    try {
      const result = await startSpan(name, operation, callback);
      const duration = Date.now() - startTime;

      // Track success in PostHog
      track(`${name}_completed`, {
        operation,
        duration_ms: duration,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Track failure in PostHog
      track(`${name}_failed`, {
        operation,
        duration_ms: duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Capture error in Sentry
      captureError(error, {
        context: { operation, name, duration_ms: duration },
      });

      throw error;
    }
  }, [track, captureError]);

  /**
   * GDPR: Opt out of tracking
   */
  const optOut = useCallback(() => {
    posthog.optOut();
  }, [posthog]);

  /**
   * GDPR: Opt in to tracking
   */
  const optIn = useCallback(() => {
    posthog.optIn();
  }, [posthog]);

  return {
    // User identification
    identify,
    reset,

    // Event tracking (PostHog)
    track,

    // Error tracking (Sentry)
    captureError,
    captureLog,
    setContext,
    addBreadcrumb,

    // Feature flags (PostHog)
    isFlagEnabled,
    getFlag,
    getFlagPayload,

    // Group analytics
    setGroup,

    // Performance monitoring
    trackTimed,

    // GDPR compliance
    optOut,
    optIn,
    isOptedOut: posthog.isOptedOut,

    // Status
    isPostHogEnabled: posthog.isEnabled,
    isSentryEnabled: isSentryEnabled(),
  };
}

/**
 * Hook to track page loads with performance metrics
 *
 * Automatically tracks:
 * - Page load time
 * - Time to first byte
 * - DOM content loaded time
 * - Full page load time
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   usePageLoadTracking('dashboard');
 *   return <Dashboard />;
 * }
 * ```
 */
export function usePageLoadTracking(pageName: string) {
  const { track, addBreadcrumb } = useAnalytics();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    addBreadcrumb(`Page loaded: ${pageName}`, 'navigation');

    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
      trackPerformance();
    } else {
      window.addEventListener('load', trackPerformance);
      return () => window.removeEventListener('load', trackPerformance);
    }

    function trackPerformance() {
      // Use Performance API to get timing metrics
      const perfEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (perfEntries.length > 0) {
        const navEntry = perfEntries[0];

        track('page_performance', {
          page: pageName,
          ttfb_ms: Math.round(navEntry.responseStart - navEntry.requestStart),
          dom_content_loaded_ms: Math.round(navEntry.domContentLoadedEventEnd - navEntry.requestStart),
          page_load_ms: Math.round(navEntry.loadEventEnd - navEntry.requestStart),
          dom_interactive_ms: Math.round(navEntry.domInteractive - navEntry.requestStart),
        });
      }
    }
  }, [pageName, track, addBreadcrumb]);
}

/**
 * Hook to track user interactions
 *
 * @example
 * ```tsx
 * function MyButton() {
 *   const trackClick = useInteractionTracking('submit_button', 'click');
 *
 *   return (
 *     <button onClick={() => trackClick({ formId: 'contact' })}>
 *       Submit
 *     </button>
 *   );
 * }
 * ```
 */
export function useInteractionTracking(
  elementName: string,
  interactionType: 'click' | 'hover' | 'focus' | 'change' = 'click'
) {
  const { track } = useAnalytics();

  return useCallback((properties?: EventProperties) => {
    track('user_interaction', {
      element: elementName,
      type: interactionType,
      ...properties,
    });
  }, [track, elementName, interactionType]);
}

/**
 * Hook to track form submissions
 *
 * @example
 * ```tsx
 * function ContactForm() {
 *   const { trackSubmit, trackError, trackSuccess } = useFormTracking('contact_form');
 *
 *   const handleSubmit = async (data) => {
 *     trackSubmit();
 *     try {
 *       await submitForm(data);
 *       trackSuccess();
 *     } catch (error) {
 *       trackError(error);
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useFormTracking(formName: string) {
  const { track, captureError, addBreadcrumb } = useAnalytics();

  const trackSubmit = useCallback((properties?: EventProperties) => {
    addBreadcrumb(`Form submitted: ${formName}`, 'form');
    track('form_submitted', {
      form: formName,
      ...properties,
    });
  }, [track, addBreadcrumb, formName]);

  const trackError = useCallback((error: unknown, properties?: EventProperties) => {
    track('form_error', {
      form: formName,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...properties,
    });
    captureError(error, {
      context: { form: formName, ...properties },
    });
  }, [track, captureError, formName]);

  const trackSuccess = useCallback((properties?: EventProperties) => {
    track('form_success', {
      form: formName,
      ...properties,
    });
  }, [track, formName]);

  const trackValidation = useCallback((field: string, valid: boolean, message?: string) => {
    track('form_validation', {
      form: formName,
      field,
      valid,
      message,
    });
  }, [track, formName]);

  return {
    trackSubmit,
    trackError,
    trackSuccess,
    trackValidation,
  };
}

// Re-export feature flag hooks from PostHogProvider
export { useFeatureFlag, useFeatureEnabled };
