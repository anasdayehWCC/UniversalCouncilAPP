/**
 * Next.js 16 Instrumentation
 *
 * This file is automatically loaded by Next.js and runs before the app starts.
 * It initializes Sentry for server-side error tracking and performance monitoring,
 * and sets up Web Vitals collection on the client side.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only initialize Sentry on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import to avoid bundling server code in client
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime initialization
    await import('../sentry.edge.config');
  }
}

/**
 * Initialize Web Vitals collection on the client side.
 *
 * Call this function in your app's entry point (e.g., layout.tsx)
 * to start collecting Core Web Vitals metrics.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { setupWebVitals } from '@/instrumentation';
 *
 * // Initialize in a client component
 * useEffect(() => {
 *   setupWebVitals({ debug: process.env.NODE_ENV === 'development' });
 * }, []);
 * ```
 */
export { setupWebVitals } from '@/lib/vitals/reporter';

/**
 * onRequestError hook for capturing unhandled errors in Next.js
 *
 * This is called by Next.js when an unhandled error occurs during request handling.
 * We use it to capture errors in Sentry with full request context.
 */
export async function onRequestError(
  error: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: Headers;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource?: 'react-server-components' | 'react-server-components-payload' | 'server-rendering';
    revalidateReason?: 'on-demand' | 'stale' | undefined;
    renderType?: 'dynamic' | 'dynamic-resume';
  }
) {
  // Import Sentry dynamically to handle both node and edge runtimes
  const Sentry = await import('@sentry/nextjs');

  Sentry.withScope((scope) => {
    scope.setTag('routerKind', context.routerKind);
    scope.setTag('routePath', context.routePath);
    scope.setTag('routeType', context.routeType);

    if (context.renderSource) {
      scope.setTag('renderSource', context.renderSource);
    }

    scope.setExtra('method', request.method);
    scope.setExtra('path', request.path);
    scope.setExtra('revalidateReason', context.revalidateReason);
    scope.setExtra('renderType', context.renderType);
    scope.setExtra('digest', error.digest);

    Sentry.captureException(error, {
      mechanism: {
        type: 'nextjs-instrumentation',
        handled: false,
      },
    });
  });
}
