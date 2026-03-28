import type { NextConfig } from "next";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const configDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(configDir, "..");

type TerserMinimizer = {
  options?: {
    terserOptions?: {
      compress?: Record<string, unknown>;
    };
  };
};

// Bundle analyzer configuration
// ANALYZE=true for full analysis, BUNDLE_ANALYZE=server|client for specific
const analyzeEnabled = process.env.ANALYZE === 'true' || !!process.env.BUNDLE_ANALYZE;
const analyzeTarget = process.env.BUNDLE_ANALYZE as 'server' | 'client' | 'both' | undefined;

const withBundleAnalyzer = analyzeEnabled
  ? require('@next/bundle-analyzer')({
      enabled: true,
      analyzerMode: 'static',
      reportFilename: analyzeTarget 
        ? `../bundle-analysis-${analyzeTarget}.html`
        : '../bundle-analysis.html',
      openAnalyzer: process.env.CI !== 'true',
    })
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment with file tracing
  output: 'standalone',
  
  // Output file tracing configuration - must match turbopack.root for monorepo
  outputFileTracingRoot: workspaceRoot,
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
      'node_modules/sharp/vendor',
      // Test files should not be in production bundle
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/__tests__/**',
      '**/__mocks__/**',
      // Documentation
      '**/README.md',
      '**/CHANGELOG.md',
      // TypeScript source maps
      '**/*.d.ts.map',
    ],
  },

  // Experimental optimizations
  experimental: {
    // Optimize imports for heavy packages (auto tree-shaking)
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-slider',
      '@tanstack/react-query',
      'docx',
      'jspdf',
      'dexie',
      'zod',
      'posthog-js',
      '@sentry/nextjs',
      'web-vitals',
      '@azure/msal-browser',
      '@azure/msal-react',
      'immer',
      'uuid',
      'zustand',
    ],
    // Granular chunking for better caching
    webpackBuildWorker: true,
  },

  // Note: modularizeImports removed - Turbopack + optimizePackageImports handles tree-shaking

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Tree-shake unused modules (usedExports handled by Next.js internally)
    config.optimization = {
      ...config.optimization,
      sideEffects: true,
      // Minimize in production
      minimize: !dev,
      // Module concatenation for smaller bundles
      concatenateModules: !dev,
    };

    // Production-only optimizations
    if (!dev) {
      // Remove console.log in production (keep errors/warnings)
      config.optimization.minimizer = config.optimization.minimizer?.map(
        (minimizer: unknown) => {
          const typedMinimizer = minimizer as TerserMinimizer;
          if (
            minimizer &&
            typeof minimizer === 'object' &&
            typedMinimizer.options?.terserOptions
          ) {
            typedMinimizer.options.terserOptions.compress = {
              ...typedMinimizer.options.terserOptions.compress,
              drop_console: false, // Keep console.error/warn
              pure_funcs: ['console.log', 'console.debug', 'console.info'],
            };
          }
          return minimizer;
        }
      );
    }

    // Split chunks for better caching
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000, // ~238KB chunks for HTTP/2
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Vendor chunk for framework (highest priority)
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 50,
            chunks: 'all',
            enforce: true,
          },
          // Radix UI components
          radix: {
            name: 'radix',
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            priority: 40,
            chunks: 'all',
          },
          // Animation libraries
          animation: {
            name: 'animation',
            test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
            priority: 35,
            chunks: 'all',
          },
          // Heavy export libraries (load on demand)
          export: {
            name: 'export',
            test: /[\\/]node_modules[\\/](docx|jspdf)[\\/]/,
            priority: 30,
            chunks: 'async',
          },
          // Icons (all Lucide icons)
          icons: {
            name: 'icons',
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            priority: 25,
            chunks: 'all',
          },
          // Analytics and monitoring
          monitoring: {
            name: 'monitoring',
            test: /[\\/]node_modules[\\/](@sentry|posthog-js)[\\/]/,
            priority: 20,
            chunks: 'all',
          },
          // Offline/storage
          storage: {
            name: 'storage',
            test: /[\\/]node_modules[\\/](dexie|dexie-react-hooks)[\\/]/,
            priority: 15,
            chunks: 'all',
          },
          // Auth libraries
          auth: {
            name: 'auth',
            test: /[\\/]node_modules[\\/]@azure[\\/]msal/,
            priority: 15,
            chunks: 'all',
          },
          // Common shared code
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 10,
            chunks: 'all',
            reuseExistingChunk: true,
          },
          // Default vendor chunk for remaining node_modules
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 5,
            chunks: 'all',
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Resolve aliases for better tree shaking
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        // Ensure single React instance
        'react$': require.resolve('react'),
        'react-dom$': require.resolve('react-dom'),
      },
    };

    return config;
  },

  // Image optimization with modern formats
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // PWA and security headers
  async headers() {
    return [
      {
        // Service Worker
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Manifest
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        // Static assets - long cache
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // All pages - security headers
        // Note: CSP is applied via middleware for nonce support
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            // Allow microphone and camera for recording, restrict geolocation
            value: 'microphone=(self), camera=(self), geolocation=(), payment=(), usb=(), bluetooth=()',
          },
          {
            key: 'Strict-Transport-Security',
            // HSTS: 1 year, include subdomains, preload-ready
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Download-Options',
            value: 'noopen',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Origin-Agent-Cluster',
            value: '?1',
          },
        ],
      },
    ];
  },

  // Turbopack configuration (Next.js 16 default)
  // Set the monorepo root so Turbopack can resolve workspace modules.
  turbopack: {
    root: workspaceRoot,
  },
};

export default withBundleAnalyzer(nextConfig);
