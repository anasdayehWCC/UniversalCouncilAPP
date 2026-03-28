/**
 * Sentry Edge Runtime Configuration
 *
 * This file configures Sentry for the Edge runtime (middleware, edge functions).
 * It's automatically loaded by @sentry/nextjs for edge runtime code.
 *
 * Features enabled:
 * - Error tracking
 * - Minimal performance monitoring (edge has limited APIs)
 *
 * Privacy controls:
 * - Demo mode disables all tracking
 * - PII automatically scrubbed
 */

import * as Sentry from '@sentry/nextjs';
import { isSentryEnabled, SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE } from './src/lib/sentry';

// Only initialize if enabled
if (isSentryEnabled() && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,

    // Lower sampling for edge functions (they can be high volume)
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.01 : 0.1,

    // Before send hooks for privacy
    beforeSend(event) {
      // Scrub user PII
      if (event.user) {
        const { email, ip_address, username, ...safeUserData } = event.user;
        event.user = safeUserData;
      }

      // Scrub request data
      if (event.request?.data) {
        event.request.data = '[Filtered]';
      }

      // Scrub cookies
      if (event.request?.cookies) {
        event.request.cookies = Object.fromEntries(
          Object.keys(event.request.cookies).map((cookieName) => [cookieName, '[Filtered]'])
        );
      }

      // Scrub sensitive headers
      if (event.request?.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token', 'x-api-key', 'x-forwarded-for'];
        for (const header of sensitiveHeaders) {
          if (event.request.headers[header]) {
            event.request.headers[header] = '[Filtered]';
          }
        }
      }

      return event;
    },

    // Ignore common edge errors
    ignoreErrors: [
      // Network errors
      'Network request failed',
      'Failed to fetch',
      // Edge-specific
      'Script execution timeout',
    ],
  });
}
