/**
 * CSP Violation Reporting Endpoint
 *
 * Receives Content-Security-Policy violation reports from browsers.
 * Logs violations for monitoring and analysis.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_reporting
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseCSPViolation, type CSPViolationReport } from '@/lib/security/csp';

/**
 * Known false positives to filter out.
 * Browser extensions and dev tools often trigger these.
 */
const IGNORED_VIOLATIONS = [
  // Browser extensions
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'ms-browser-extension://',
  // Dev tools
  'devtools://',
  // Inline event handlers from browser (e.g., autofill)
  'inline',
];

/**
 * Check if a violation should be ignored.
 */
function shouldIgnoreViolation(report: CSPViolationReport): boolean {
  const blockedUri = report['csp-report']['blocked-uri'];
  const sourceFile = report['csp-report']['source-file'];

  // Check blocked URI against ignored patterns
  if (IGNORED_VIOLATIONS.some((pattern) => blockedUri?.includes(pattern))) {
    return true;
  }

  // Check source file against ignored patterns
  if (sourceFile && IGNORED_VIOLATIONS.some((pattern) => sourceFile.includes(pattern))) {
    return true;
  }

  return false;
}

/**
 * Format violation for logging.
 */
function formatViolation(report: CSPViolationReport): Record<string, unknown> {
  const cspReport = report['csp-report'];

  return {
    documentUri: cspReport['document-uri'],
    violatedDirective: cspReport['violated-directive'],
    effectiveDirective: cspReport['effective-directive'],
    blockedUri: cspReport['blocked-uri'],
    disposition: cspReport['disposition'],
    sourceFile: cspReport['source-file'],
    lineNumber: cspReport['line-number'],
    columnNumber: cspReport['column-number'],
    scriptSample: cspReport['script-sample']?.substring(0, 100), // Truncate
  };
}

/**
 * Handle CSP violation reports.
 *
 * Browsers send reports as POST requests with Content-Type:
 * - application/csp-report (legacy)
 * - application/reports+json (Reporting API)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Parse the report body
    let body: unknown;

    if (contentType.includes('application/csp-report')) {
      // Legacy CSP reporting format
      body = await request.json();
    } else if (contentType.includes('application/reports+json')) {
      // Modern Reporting API format (array of reports)
      const reports = await request.json() as unknown[];
      // Process first report for now
      body = reports[0];
    } else {
      // Try to parse as JSON anyway
      body = await request.json();
    }

    // Parse and validate the report
    const report = parseCSPViolation(body);

    if (!report) {
      return NextResponse.json(
        { error: 'Invalid CSP report format' },
        { status: 400 }
      );
    }

    // Check if this is a violation we should ignore
    if (shouldIgnoreViolation(report)) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // Log the violation
    // In production, send to your logging service (Sentry, DataDog, etc.)
    const formattedViolation = formatViolation(report);

    if (process.env.NODE_ENV === 'development') {
      console.warn('[CSP Violation]', JSON.stringify(formattedViolation, null, 2));
    } else {
      // Log to server-side logging service
      // Example: Send to Sentry
      // Sentry.captureMessage('CSP Violation', {
      //   level: 'warning',
      //   extra: formattedViolation,
      // });

      // For now, just log to console
      console.warn('[CSP Violation]', JSON.stringify(formattedViolation));
    }

    // Return success (browsers expect 2xx for successful report delivery)
    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error) {
    // Log the error but don't expose details
    console.error('[CSP Report Error]', error);

    // Still return 200 to prevent browser retry loops
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}

/**
 * Handle preflight requests for CORS.
 * Some browsers may send OPTIONS before POST.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
