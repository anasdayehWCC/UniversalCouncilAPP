/**
 * Sentry Client-Side Configuration
 *
 * This file configures Sentry for the browser/client environment.
 * It's automatically loaded by @sentry/nextjs.
 *
 * Features enabled:
 * - Error tracking
 * - Session replay (sampled)
 * - Performance monitoring
 * - User feedback
 *
 * Privacy controls:
 * - Demo mode disables all tracking
 * - Do Not Track respected
 * - PII automatically scrubbed
 */

import * as Sentry from '@sentry/nextjs';
import { baseSentryConfig, isSentryEnabled, SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE } from './src/lib/sentry';

// Only initialize if enabled
if (isSentryEnabled() && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,

    // Inherit base configuration
    ...baseSentryConfig,

    // Client-specific integrations
    integrations: [
      // Session replay for debugging user issues
      Sentry.replayIntegration({
        // Only record inputs that are not marked as sensitive
        maskAllInputs: true,
        // Block elements with data-sentry-no-record attribute
        blockAllMedia: false,
        // Don't record console logs (can contain PII)
        networkDetailAllowUrls: [],
      }),

      // Feedback widget for user reports
      Sentry.feedbackIntegration({
        colorScheme: 'system',
        isNameRequired: false,
        isEmailRequired: false,
        showBranding: false,
        formTitle: 'Report an Issue',
        submitButtonLabel: 'Submit Report',
        messagePlaceholder: 'Describe what happened...',
        successMessageText: 'Thank you for your feedback!',
      }),

      // Browser tracing for performance
      Sentry.browserTracingIntegration({
        // Trace all requests to our API
        traceFetch: true,
        traceXHR: true,
        // Enable interaction tracing
        enableLongTask: true,
        // Don't trace these URLs (third-party)
        shouldCreateSpanForRequest: (url) => {
          return !url.includes('posthog.com') && 
                 !url.includes('google-analytics') && 
                 !url.includes('sentry.io');
        },
      }),
    ],

    // Session replay sampling
    replaysSessionSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,

    // Performance sampling
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Enable debugging in development
    debug: process.env.NODE_ENV === 'development',

    // Attach React component info to errors
    attachStacktrace: true,
  });
}
