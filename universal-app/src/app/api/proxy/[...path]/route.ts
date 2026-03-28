/**
 * API Proxy Route
 * 
 * Forwards requests to the minute-main backend, handling:
 * - Auth token forwarding
 * - CORS
 * - Request/response transformation
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

// Methods that can have a body
const BODY_METHODS = ['POST', 'PUT', 'PATCH'];

// Route context type for Next.js 16
interface RouteContext {
  params: Promise<{ path: string[] }>;
}

async function proxyRequest(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  const targetPath = path.join('/');
  const targetUrl = new URL(targetPath, BACKEND_URL);
  
  // Forward query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  // Build headers
  const headers = new Headers();
  
  // Forward relevant headers
  const forwardHeaders = [
    'content-type',
    'accept',
    'authorization',
    'x-request-id',
    'x-correlation-id',
  ];
  
  forwardHeaders.forEach(header => {
    const value = request.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  });

  // Add custom headers for tracing
  const forwardedFor = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  headers.set('x-forwarded-for', forwardedFor);
  headers.set('x-forwarded-host', request.headers.get('host') ?? 'localhost');
  headers.set('x-forwarded-proto', 'https');

  try {
    // Build fetch options
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      // Don't follow redirects - let the client handle them
      redirect: 'manual',
    };

    // Forward body for applicable methods
    if (BODY_METHODS.includes(request.method)) {
      const contentType = request.headers.get('content-type') ?? '';
      
      if (contentType.includes('application/json')) {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } else if (contentType.includes('multipart/form-data')) {
        // For file uploads, forward the raw body
        fetchOptions.body = await request.blob();
        // Let the browser set the correct content-type with boundary
        headers.delete('content-type');
      } else {
        fetchOptions.body = await request.text();
      }
    }

    // Make the request to the backend
    const response = await fetch(targetUrl.toString(), fetchOptions);

    // Build response headers
    const responseHeaders = new Headers();
    
    // Forward response headers
    const returnHeaders = [
      'content-type',
      'x-request-id',
      'x-correlation-id',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
    ];
    
    returnHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        responseHeaders.set('location', location);
      }
    }

    // Return the proxied response
    const body = response.status === 204 ? null : await response.arrayBuffer();
    
    return new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API Proxy] Request failed:', error);
    
    // Determine error type
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: 'Backend unavailable',
          message: 'Unable to connect to the backend service. Please try again later.',
          code: 'BACKEND_UNAVAILABLE',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Proxy error',
        message: 'An unexpected error occurred while processing your request.',
        code: 'PROXY_ERROR',
      },
      { status: 500 }
    );
  }
}

// Export handlers for all HTTP methods
export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
