/**
 * Security Headers Configuration
 *
 * Comprehensive security headers for protection against common web vulnerabilities.
 * These headers are applied via Next.js middleware for dynamic CSP with nonces.
 *
 * @see https://owasp.org/www-project-secure-headers/
 * @see https://securityheaders.com/
 */

/**
 * Configuration options for security headers.
 */
export interface SecurityHeadersConfig {
  /** Enable HSTS (HTTP Strict Transport Security) */
  enableHSTS: boolean;
  /** HSTS max-age in seconds (default: 1 year) */
  hstsMaxAge: number;
  /** Include subdomains in HSTS */
  hstsIncludeSubdomains: boolean;
  /** Enable HSTS preload list submission */
  hstsPreload: boolean;
  /** CSP nonce for inline scripts */
  nonce: string;
  /** Use report-only mode for CSP */
  cspReportOnly: boolean;
  /** Allow microphone access (for recording) */
  allowMicrophone: boolean;
  /** Allow camera access (for recording) */
  allowCamera: boolean;
}

/**
 * Default security headers configuration.
 */
const DEFAULT_CONFIG: SecurityHeadersConfig = {
  enableHSTS: process.env.NODE_ENV === 'production',
  hstsMaxAge: 31536000, // 1 year
  hstsIncludeSubdomains: true,
  hstsPreload: true,
  nonce: '',
  cspReportOnly: process.env.CSP_REPORT_ONLY === 'true',
  allowMicrophone: true, // Required for recording functionality
  allowCamera: true, // Required for video recording
};

/**
 * Static security headers that don't require per-request configuration.
 * These are also set in next.config.ts for non-middleware routes.
 */
export const SECURITY_HEADERS = {
  /**
   * X-Content-Type-Options
   * Prevents MIME type sniffing attacks.
   */
  'X-Content-Type-Options': 'nosniff',

  /**
   * X-Frame-Options
   * Prevents clickjacking by disabling iframe embedding.
   * Note: frame-ancestors in CSP is the modern replacement.
   */
  'X-Frame-Options': 'DENY',

  /**
   * X-XSS-Protection
   * Legacy XSS filter. Modern browsers use CSP instead,
   * but this provides defense in depth for older browsers.
   */
  'X-XSS-Protection': '1; mode=block',

  /**
   * Referrer-Policy
   * Controls how much referrer information is sent.
   * strict-origin-when-cross-origin: Send full URL for same-origin,
   * only origin for cross-origin HTTPS, nothing for HTTP downgrade.
   */
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  /**
   * X-DNS-Prefetch-Control
   * Controls DNS prefetching to prevent information leakage.
   */
  'X-DNS-Prefetch-Control': 'on',

  /**
   * X-Download-Options
   * Prevents IE from executing downloads in site's context.
   */
  'X-Download-Options': 'noopen',

  /**
   * X-Permitted-Cross-Domain-Policies
   * Restricts Adobe Flash/Acrobat cross-domain data loading.
   */
  'X-Permitted-Cross-Domain-Policies': 'none',

  /**
   * Cross-Origin-Opener-Policy
   * Isolates browsing context to prevent Spectre-style attacks.
   */
  'Cross-Origin-Opener-Policy': 'same-origin',

  /**
   * Cross-Origin-Resource-Policy
   * Restricts which origins can load this resource.
   */
  'Cross-Origin-Resource-Policy': 'same-origin',

  /**
   * Cross-Origin-Embedder-Policy
   * Prevents loading cross-origin resources without explicit permission.
   * Note: Set to 'unsafe-none' to allow MSAL popup authentication.
   */
  'Cross-Origin-Embedder-Policy': 'unsafe-none',

  /**
   * Origin-Agent-Cluster
   * Requests the browser to isolate the origin in its own agent cluster.
   */
  'Origin-Agent-Cluster': '?1',
} as const;

/**
 * Build HSTS (HTTP Strict Transport Security) header value.
 *
 * @param config - Security headers configuration
 * @returns HSTS header value
 */
function buildHSTSHeader(config: SecurityHeadersConfig): string {
  const parts = [`max-age=${config.hstsMaxAge}`];

  if (config.hstsIncludeSubdomains) {
    parts.push('includeSubDomains');
  }

  if (config.hstsPreload) {
    parts.push('preload');
  }

  return parts.join('; ');
}

/**
 * Build Permissions-Policy header value.
 * Controls access to browser features and APIs.
 *
 * @param config - Security headers configuration
 * @returns Permissions-Policy header value
 */
export function getPermissionsPolicy(config: Partial<SecurityHeadersConfig> = {}): string {
  const { allowMicrophone = true, allowCamera = true } = config;

  // Build permission directives
  // Format: feature=(allowlist)
  // 'self' = same origin, () = disabled, * = all
  const permissions: string[] = [
    // Recording features - allow for same origin (recording functionality)
    `microphone=(${allowMicrophone ? 'self' : ''})`,
    `camera=(${allowCamera ? 'self' : ''})`,

    // Disable features not needed for this app
    'geolocation=()', // Disabled - not needed
    'payment=()', // Disabled - not a payment app
    'usb=()', // Disabled - not needed
    'bluetooth=()', // Disabled - not needed
    'serial=()', // Disabled - not needed
    'midi=()', // Disabled - not needed
    'magnetometer=()', // Disabled - not needed
    'gyroscope=()', // Disabled - not needed
    'accelerometer=()', // Disabled - not needed

    // Display features
    'fullscreen=(self)', // Allow fullscreen for video playback
    'picture-in-picture=(self)', // Allow PiP for video

    // Allow encrypted media for potential DRM content
    'encrypted-media=(self)',

    // Display capture for screen sharing (if needed)
    'display-capture=(self)',

    // Autoplay - allow with muted for UX
    'autoplay=(self)',

    // Interest cohort - disable FLoC/Topics
    'interest-cohort=()',

    // Identity credentials - allow for authentication
    'identity-credentials-get=(self)',

    // Clipboard - allow for copy/paste functionality
    'clipboard-read=(self)',
    'clipboard-write=(self)',

  ];

  return permissions.join(', ');
}

/**
 * Build all security headers for a request.
 *
 * @param config - Partial configuration (merged with defaults)
 * @returns Object with all security headers
 */
export function buildSecurityHeaders(
  config: Partial<SecurityHeadersConfig> = {}
): Record<string, string> {
  const mergedConfig: SecurityHeadersConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const headers: Record<string, string> = {
    ...SECURITY_HEADERS,
    'Permissions-Policy': getPermissionsPolicy(mergedConfig),
  };

  // Add HSTS in production
  if (mergedConfig.enableHSTS) {
    headers['Strict-Transport-Security'] = buildHSTSHeader(mergedConfig);
  }

  return headers;
}

/**
 * Security headers for API routes.
 * More restrictive than page headers.
 */
export const API_SECURITY_HEADERS: Record<string, string> = {
  ...SECURITY_HEADERS,
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Content-Type': 'application/json',
};
