/**
 * Content Security Policy (CSP) Configuration
 *
 * Provides CSP nonce generation, directive configuration, and violation reporting.
 * Nonces are cryptographically random and generated per-request for inline scripts.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 * @see https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 */

import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { getThemeInitScript } from '@/lib/themes/theme-init';

const THEME_INIT_SCRIPT_HASH = createHash('sha256')
  .update(getThemeInitScript())
  .digest('base64');

/**
 * Generate a cryptographically secure nonce for CSP.
 * Each request should have a unique nonce.
 */
export function generateNonce(): string {
  // Use crypto.randomUUID for unique, unpredictable values
  // The nonce should be base64-encoded and at least 128 bits
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Trusted external sources for CSP directives.
 * Add domains here when integrating third-party services.
 */
export const TRUSTED_SOURCES = {
  /** Script sources - external JavaScript */
  scripts: [
    // Sentry for error tracking
    "'self'",
    // PostHog analytics (if using CDN)
    'https://*.posthog.com',
    // Azure MSAL authentication
    'https://*.microsoftonline.com',
    'https://*.microsoft.com',
  ],

  /** Style sources - external CSS */
  styles: [
    "'self'",
    // Allow inline styles for Radix UI and Tailwind
    "'unsafe-inline'",
    // Google Fonts (if used)
    'https://fonts.googleapis.com',
  ],

  /** Font sources */
  fonts: [
    "'self'",
    'https://fonts.gstatic.com',
    'data:', // For embedded fonts
  ],

  /** Image sources */
  images: [
    "'self'",
    'data:',
    'blob:',
    // Gravatar/avatar services
    'https://i.pravatar.cc',
    'https://www.gravatar.com',
    // Azure Blob Storage (for uploaded files)
    'https://*.blob.core.windows.net',
  ],

  /** Media sources - audio/video */
  media: [
    "'self'",
    'blob:', // For recorded audio
    'https://*.blob.core.windows.net',
  ],

  /** Connect sources - XHR, WebSocket, fetch */
  connect: [
    "'self'",
    // Backend API
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    // Sentry
    'https://*.ingest.sentry.io',
    'https://*.sentry.io',
    // PostHog
    'https://*.posthog.com',
    'https://app.posthog.com',
    // Azure services
    'https://*.microsoftonline.com',
    'https://*.microsoft.com',
    'https://login.windows.net',
    // SharePoint/Graph API
    'https://graph.microsoft.com',
    'https://*.sharepoint.com',
  ],

  /** Worker sources - service workers, web workers */
  workers: [
    "'self'",
    'blob:', // For offline/PWA workers
  ],

  /** Frame ancestors - who can embed this site */
  frameAncestors: [
    "'none'", // Prevent clickjacking - same as X-Frame-Options: DENY
  ],

  /** Form action targets */
  formAction: [
    "'self'",
  ],

  /** Base URI for relative URLs */
  baseUri: [
    "'self'",
  ],

  /** Object sources - plugins, embeds */
  objects: [
    "'none'", // Disable Flash, Java, etc.
  ],

  /** Frame sources - iframes */
  frames: [
    "'self'",
    // Microsoft authentication popup
    'https://*.microsoftonline.com',
  ],

  /** Manifest sources - PWA manifest */
  manifest: [
    "'self'",
  ],
} as const;

/**
 * CSP Report-only mode configuration.
 * Set to true during testing to collect violations without blocking.
 */
const CSP_REPORT_ONLY = process.env.CSP_REPORT_ONLY === 'true';

/**
 * CSP violation reporting endpoint.
 * Violations are sent here for monitoring.
 */
const CSP_REPORT_URI = process.env.CSP_REPORT_URI || '/api/security/csp-report';

/**
 * Build the Content-Security-Policy header value.
 *
 * @param nonce - Unique nonce for this request (for inline scripts)
 * @returns The complete CSP header value
 */
export function buildCSPHeader(nonce: string): string {
  const directives: string[] = [
    // Default fallback - restrict everything by default
    `default-src 'self'`,

    // Scripts - require nonce for inline, allow trusted sources
    `script-src ${TRUSTED_SOURCES.scripts.join(' ')} 'nonce-${nonce}' 'sha256-${THEME_INIT_SCRIPT_HASH}' 'strict-dynamic'`,

    // Styles - allow inline for component libraries
    `style-src ${TRUSTED_SOURCES.styles.join(' ')}`,

    // Fonts
    `font-src ${TRUSTED_SOURCES.fonts.join(' ')}`,

    // Images
    `img-src ${TRUSTED_SOURCES.images.join(' ')}`,

    // Media (audio/video for recording)
    `media-src ${TRUSTED_SOURCES.media.join(' ')}`,

    // XHR, WebSocket, fetch
    `connect-src ${TRUSTED_SOURCES.connect.join(' ')}`,

    // Workers
    `worker-src ${TRUSTED_SOURCES.workers.join(' ')}`,

    // Frame ancestors (clickjacking protection)
    `frame-ancestors ${TRUSTED_SOURCES.frameAncestors.join(' ')}`,

    // Form submissions
    `form-action ${TRUSTED_SOURCES.formAction.join(' ')}`,

    // Base URI
    `base-uri ${TRUSTED_SOURCES.baseUri.join(' ')}`,

    // Objects (disable plugins)
    `object-src ${TRUSTED_SOURCES.objects.join(' ')}`,

    // Frames
    `frame-src ${TRUSTED_SOURCES.frames.join(' ')}`,

    // PWA manifest
    `manifest-src ${TRUSTED_SOURCES.manifest.join(' ')}`,

    // Upgrade insecure requests in production
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),

    // Report violations
    `report-uri ${CSP_REPORT_URI}`,
    `report-to csp-endpoint`,
  ];

  return directives.join('; ');
}

/**
 * Get the CSP header name based on mode.
 * Use Content-Security-Policy-Report-Only for testing.
 */
export function getCSPHeaderName(): string {
  return CSP_REPORT_ONLY
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}

/**
 * Build Report-To header for CSP violation reporting.
 * Modern browsers use this instead of report-uri.
 */
export function buildReportToHeader(): string {
  return JSON.stringify({
    group: 'csp-endpoint',
    max_age: 10886400, // ~126 days
    endpoints: [{ url: CSP_REPORT_URI }],
  });
}

/**
 * Retrieve the CSP nonce from response headers.
 * Use this in Server Components to get the nonce for inline scripts.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { getNonce } from '@/lib/security/csp';
 *
 * export default function Layout({ children }) {
 *   const nonce = getNonce();
 *   return <script nonce={nonce}>...</script>;
 * }
 * ```
 */
export async function getNonce(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    return headersList.get('x-nonce') || undefined;
  } catch {
    // Headers not available (e.g., during static generation)
    return undefined;
  }
}

/**
 * Type for CSP violation reports.
 */
export interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    'referrer': string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'disposition': 'enforce' | 'report';
    'blocked-uri': string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code': number;
    'script-sample'?: string;
  };
}

/**
 * Parse and validate a CSP violation report.
 *
 * @param body - Raw JSON body from the report request
 * @returns Parsed report or null if invalid
 */
export function parseCSPViolation(body: unknown): CSPViolationReport | null {
  if (
    typeof body === 'object' &&
    body !== null &&
    'csp-report' in body
  ) {
    return body as CSPViolationReport;
  }
  return null;
}

/**
 * Add a trusted source to a CSP directive.
 * Use this when dynamically adding trusted domains.
 *
 * @param directive - The directive key (e.g., 'scripts', 'images')
 * @param source - The source to add (e.g., 'https://cdn.example.com')
 */
export function addTrustedSource(
  directive: keyof typeof TRUSTED_SOURCES,
  source: string
): string[] {
  // Create a new array to avoid mutating the constant
  return [...TRUSTED_SOURCES[directive], source];
}

/**
 * Development-only CSP that's more permissive.
 * Only used when NODE_ENV is 'development'.
 */
export function buildDevCSPHeader(nonce: string): string {
  const directives: string[] = [
    `default-src 'self'`,
    // More permissive for hot reload and dev tools
    `script-src 'self' 'unsafe-eval' 'nonce-${nonce}' 'sha256-${THEME_INIT_SCRIPT_HASH}'`,
    `style-src 'self' 'unsafe-inline'`,
    `font-src 'self' data:`,
    `img-src 'self' data: blob: https:`,
    `media-src 'self' blob:`,
    `connect-src 'self' ws: wss: http://localhost:* https:`,
    `worker-src 'self' blob:`,
    `frame-ancestors 'self'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-src 'self' https:`,
    `manifest-src 'self'`,
  ];

  return directives.join('; ');
}

/**
 * Get the appropriate CSP header based on environment.
 */
export function getCSPHeaderValue(nonce: string): string {
  return process.env.NODE_ENV === 'development'
    ? buildDevCSPHeader(nonce)
    : buildCSPHeader(nonce);
}
