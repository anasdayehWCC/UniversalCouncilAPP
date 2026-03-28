import { withSentryConfig } from '@sentry/nextjs'
import withPWAInit from 'next-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
})

let nextConfig = {
  output: 'standalone',
  transpilePackages: ['@careminutes/ui', '@careminutes/core'],
  experimental: {
    viewTransition: true,
    externalDir: true,
  },
  // Silence dual-lockfile root inference and anchor tracing to monorepo root
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  
  // Image optimization (Phase 41B)
  images: {
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Allowed remote image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: '*.azureedge.net',
      },
    ],
    // Device breakpoints for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image widths for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum cache TTL in seconds (1 hour)
    minimumCacheTTL: 3600,
    // Blur placeholder generation for local images
    dangerouslyAllowSVG: false,
    contentDispositionType: 'inline',
  },
}

const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: 'incubator-for-ai',
  project: 'minute',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobshttps://docs.sentry.io/product/sentry-basics/integrate-backend/configuration-options/
  automaticVercelMonitors: true,
}

// Apply PWA first, then Sentry
nextConfig = withPWA(nextConfig)
nextConfig = withSentryConfig(nextConfig, sentryConfig)

// Wrap with bundle analyzer if ANALYZE env is set
if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = (await import('@next/bundle-analyzer')).default({
    enabled: true,
    openAnalyzer: true,
  })
  nextConfig = withBundleAnalyzer(nextConfig)
}

export default nextConfig
