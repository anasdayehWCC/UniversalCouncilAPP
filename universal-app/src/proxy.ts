/**
 * Next.js Proxy - Security Headers
 *
 * Applies comprehensive security headers to all responses.
 * CSP nonces are generated per-request for inline script security.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 * @see https://nextjs.org/docs/app/guides/content-security-policy
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  generateNonce,
  getCSPHeaderValue,
  getCSPHeaderName,
  buildReportToHeader,
} from '@/lib/security/csp';
import { buildSecurityHeaders } from '@/lib/security/headers';

/**
 * Paths that should skip proxy processing.
 * These are typically static assets or health check endpoints.
 */
const SKIP_PATHS = [
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/icons/',
  '/sw.js',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
  // Health check endpoints
  '/api/health',
  // CSP violation reporting (avoid infinite loops)
  '/api/security/csp-report',
];

/**
 * API paths that need different security treatment.
 * These get cache-control headers and no CSP (JSON responses).
 */
const API_PATHS = ['/api/'];

/**
 * Check if a path should skip proxy processing.
 */
function shouldSkipProxy(pathname: string): boolean {
  return SKIP_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Check if a path is an API route.
 */
function isApiRoute(pathname: string): boolean {
  return API_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Apply security headers to the response.
 */
function applySecurityHeaders(
  response: NextResponse,
  nonce: string,
  isApi: boolean = false
): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const securityHeaders = buildSecurityHeaders({
    nonce,
    allowMicrophone: true,
    allowCamera: true,
  });

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (!isApi && !isDevelopment) {
    const cspHeaderName = getCSPHeaderName();
    const cspHeaderValue = getCSPHeaderValue(nonce);
    response.headers.set(cspHeaderName, cspHeaderValue);
    response.headers.set('Report-To', buildReportToHeader());
  }

  if (!isDevelopment) {
    response.headers.set('x-nonce', nonce);
  }

  if (isApi) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
}

/**
 * Main proxy function.
 * Generates CSP nonces and applies security headers to all responses.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (shouldSkipProxy(pathname)) {
    return NextResponse.next();
  }

  const nonce = generateNonce();
  const isApi = isApiRoute(pathname);

  const requestHeaders = new Headers(request.headers);
  if (!isDevelopment) {
    requestHeaders.set('x-nonce', nonce);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  applySecurityHeaders(response, nonce, isApi);

  return response;
}

/**
 * Proxy configuration.
 * Defines which paths the proxy runs on.
 */
export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
