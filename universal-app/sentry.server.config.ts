/**
 * Sentry Server-Side Configuration (Node.js Runtime)
 *
 * This file configures Sentry for the Node.js server environment.
 * It's automatically loaded by @sentry/nextjs for server-side rendering.
 *
 * Features enabled:
 * - Error tracking
 * - Performance monitoring
 * - Request context
 * - Source maps
 *
 * Privacy controls:
 * - Demo mode disables all tracking
 * - PII automatically scrubbed from events
 */

import * as Sentry from '@sentry/nextjs';
import { isSentryEnabled, SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE } from './src/lib/sentry';

// Only initialize if enabled
if (isSentryEnabled() && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,

    // Performance sampling (be conservative on server)
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.05 : 0.5,
    profilesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.05 : 0.5,

    // Server-specific integrations
    integrations: [
      // HTTP request tracing
      Sentry.httpIntegration({
        // Don't trace health checks
        ignoreIncomingRequests: (url) => {
          return url.includes('/health') || url.includes('/ready') || url.includes('/live');
        },
      }),

      // OpenTelemetry integration for distributed tracing
      Sentry.prismaIntegration(),
    ],

    // Before send hooks for privacy
    beforeSend(event) {
      // Scrub PII from server events
      return scrubServerEvent(event);
    },

    beforeSendTransaction(event) {
      // Filter out health check transactions
      if (event.transaction?.includes('/health') || 
          event.transaction?.includes('/ready') || 
          event.transaction?.includes('/live')) {
        return null;
      }
      return event;
    },

    // Ignore common server errors
    ignoreErrors: [
      // Connection resets
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      // DNS errors
      'ENOTFOUND',
      // Graceful shutdown
      'SIGTERM',
      'SIGINT',
    ],

    // Include server-specific info
    includeLocalVariables: process.env.NODE_ENV !== 'production',

    // Spotlight for local development
    spotlight: process.env.NODE_ENV === 'development',
  });
}

/**
 * Scrub PII from server-side events
 */
function scrubServerEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  // Scrub user PII
  if (event.user) {
    const { email, ip_address, username, ...safeUserData } = event.user;
    event.user = safeUserData;
  }

  // Scrub request body
  if (event.request?.data) {
    event.request.data = '[Filtered]';
  }

  // Scrub cookies
  if (event.request?.cookies) {
    event.request.cookies = Object.fromEntries(
      Object.keys(event.request.cookies).map((cookieName) => [cookieName, '[Filtered]'])
    );
  }

  // Scrub authorization headers
  if (event.request?.headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token', 'x-api-key', 'x-forwarded-for'];
    for (const header of sensitiveHeaders) {
      if (event.request.headers[header]) {
        event.request.headers[header] = '[Filtered]';
      }
    }
  }

  // Scrub environment variables from extra context
  if (event.extra) {
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'auth', 'credential'];
    for (const key of Object.keys(event.extra)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        event.extra[key] = '[Filtered]';
      }
    }
  }

  return event;
}
