/**
 * Sentry configuration utilities for Universal Council App
 *
 * Provides centralized Sentry configuration with privacy compliance,
 * demo mode awareness, and user identification integration.
 */

import * as Sentry from '@sentry/nextjs';
import { isDemoMode } from '@/lib/auth/msal-config';

/**
 * Environment configuration for Sentry
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
export const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
export const SENTRY_RELEASE = process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA;

/**
 * Check if Sentry should be enabled
 * - Disabled in demo mode for privacy
 * - Disabled if no DSN is configured
 * - Disabled if user has Do Not Track enabled (client-side only)
 */
export function isSentryEnabled(): boolean {
  // Never enable in demo mode
  if (isDemoMode) {
    return false;
  }

  // Require DSN to be configured
  if (!SENTRY_DSN) {
    return false;
  }

  // Respect Do Not Track on client side
  if (typeof window !== 'undefined') {
    const dnt = navigator.doNotTrack || (window as { doNotTrack?: string }).doNotTrack;
    if (dnt === '1' || dnt === 'yes') {
      return false;
    }
  }

  return true;
}

/**
 * Base Sentry configuration shared across all runtimes
 */
export const baseSentryConfig: Sentry.BrowserOptions = {
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  release: SENTRY_RELEASE,

  // Sampling rates
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  profilesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Session replay for debugging (production only, sampled)
  replaysSessionSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 0,
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors

  // Privacy controls
  beforeSend(event: Sentry.ErrorEvent, _hint: Sentry.EventHint): Sentry.ErrorEvent | null {
    // Don't send events in demo mode
    if (isDemoMode) {
      return null;
    }

    // Scrub PII from events
    return scrubPIIFromEvent(event);
  },

  beforeSendTransaction(event) {
    // Don't send transactions in demo mode
    if (isDemoMode) {
      return null;
    }
    return event;
  },

  // Ignore common non-actionable errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.teletrax.com',
    'atomicFindClose',
    // Network errors that aren't actionable
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'NetworkError',
    // Cancelled requests
    'AbortError',
    'The operation was aborted',
    // Auth-related that are handled elsewhere
    'InteractionRequiredAuthError',
    'BrowserAuthError',
  ],

  // Deny URLs that are not relevant
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    // Third-party scripts
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
    /connect\.facebook\.net/i,
  ],
};

/**
 * Scrub PII from Sentry events
 * Removes sensitive user data before sending to Sentry
 */
function scrubPIIFromEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  // Scrub user PII - keep only anonymous identifiers
  if (event.user) {
    const { email, username, ...safeUserData } = event.user;
    event.user = safeUserData;
  }

  // Scrub request body data
  if (event.request?.data) {
    event.request.data = '[Filtered]';
  }

  // Scrub cookies
  if (event.request?.cookies) {
    event.request.cookies = Object.fromEntries(
      Object.keys(event.request.cookies).map((cookieName) => [cookieName, '[Filtered]'])
    );
  }

  // Scrub headers that might contain sensitive info
  if (event.request?.headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token', 'x-api-key'];
    for (const header of sensitiveHeaders) {
      if (event.request.headers[header]) {
        event.request.headers[header] = '[Filtered]';
      }
    }
  }

  return event;
}

/**
 * Identify user in Sentry with privacy-safe data
 * Only sets anonymous identifiers, never PII
 */
export function identifyUserInSentry(userId: string, traits?: {
  role?: string;
  tenantId?: string;
  domain?: string;
}): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setUser({
    id: userId,
    // Only include non-PII traits
    ...(traits?.role && { role: traits.role }),
    ...(traits?.tenantId && { tenant_id: traits.tenantId }),
    ...(traits?.domain && { domain: traits.domain }),
  });
}

/**
 * Clear user from Sentry (on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Set context for Sentry events
 */
export function setSentryContext(name: string, context: Record<string, unknown>): void {
  if (!isSentryEnabled()) {
    return;
  }

  // Filter out any potential PII
  const safeContext: Record<string, unknown> = {};
  const piiKeys = ['email', 'name', 'phone', 'address', 'ssn', 'nationalInsurance', 'nino'];
  
  for (const [key, value] of Object.entries(context)) {
    if (!piiKeys.includes(key.toLowerCase())) {
      safeContext[key] = value;
    }
  }

  Sentry.setContext(name, safeContext);
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Capture exception with context
 */
export function captureException(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): string | undefined {
  if (!isSentryEnabled()) {
    console.error('[Sentry disabled] Error:', error);
    return undefined;
  }

  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level,
  });
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): string | undefined {
  if (!isSentryEnabled()) {
    return undefined;
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Start a performance transaction
 */
export function startSpan<T>(
  name: string,
  op: string,
  callback: () => T | Promise<T>
): T | Promise<T> {
  if (!isSentryEnabled()) {
    return callback();
  }

  return Sentry.startSpan({ name, op }, callback);
}

export { Sentry };
