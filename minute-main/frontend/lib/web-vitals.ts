/**
 * Core Web Vitals Reporting
 * 
 * Tracks LCP, FID, CLS, INP, TTFB and reports to:
 * - PostHog (if available)
 * - Sentry (if available)
 * - Console (in development)
 * 
 * To enable, install web-vitals:
 * npm install web-vitals
 */

type VitalsMetric = {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType?: string
}

type Metric = {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType?: string
}

const vitalsEndpoint = process.env.NEXT_PUBLIC_VITALS_ENDPOINT || '/api/vitals'

/**
 * Convert raw metric to standard format
 */
function formatMetric(metric: Metric): VitalsMetric {
  return {
    name: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  }
}

// Extend window interface for optional analytics libraries
interface WindowWithAnalytics extends Window {
  posthog?: {
    capture: (event: string, properties: Record<string, unknown>) => void
  }
  Sentry?: {
    setMeasurement: (name: string, value: number, unit: string) => void
  }
  __webVitalsInitialized?: boolean
}

declare const window: WindowWithAnalytics

/**
 * Report metric to PostHog
 */
function reportToPostHog(metric: VitalsMetric) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('web_vital', {
      $web_vital_name: metric.name,
      $web_vital_value: metric.value,
      $web_vital_rating: metric.rating,
      $web_vital_delta: metric.delta,
      $current_url: window.location.href,
      $pathname: window.location.pathname,
    })
  }
}

/**
 * Report metric to Sentry
 */
function reportToSentry(metric: VitalsMetric) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.setMeasurement(metric.name, metric.value, 'millisecond')
  }
}

/**
 * Report metric to console (development only)
 */
function reportToConsole(metric: VitalsMetric) {
  if (process.env.NODE_ENV === 'development') {
    const styles = {
      good: 'color: green',
      'needs-improvement': 'color: orange',
      poor: 'color: red',
    }
    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value} (${metric.rating})`,
      styles[metric.rating]
    )
  }
}

/**
 * Report metric to backend analytics endpoint
 */
async function reportToBackend(metric: VitalsMetric) {
  if (process.env.NODE_ENV === 'development') return
  
  try {
    const body = JSON.stringify({
      ...metric,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    })
    
    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      navigator.sendBeacon(vitalsEndpoint, body)
    } else {
      fetch(vitalsEndpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      })
    }
  } catch {
    // Silently fail - vitals reporting is non-critical
  }
}

/**
 * Main handler for all metrics
 */
function handleMetric(metric: Metric) {
  const formatted = formatMetric(metric)
  
  reportToConsole(formatted)
  reportToPostHog(formatted)
  reportToSentry(formatted)
  reportToBackend(formatted)
}

/**
 * Initialize web vitals reporting
 * Call this in your _app or layout component
 */
export async function initWebVitals() {
  if (typeof window === 'undefined') return
  
  try {
    // Dynamically import web-vitals to avoid bundling if not installed
    const webVitals = await import('web-vitals').catch(() => null)
    if (!webVitals) {
      console.info('[Web Vitals] Package not installed. Run: npm install web-vitals')
      return
    }
    
    const { onLCP, onCLS, onFID, onINP, onTTFB } = webVitals
    
    // Core Web Vitals
    onLCP(handleMetric)  // Largest Contentful Paint
    onCLS(handleMetric)  // Cumulative Layout Shift
    onFID(handleMetric)  // First Input Delay (legacy)
    onINP(handleMetric)  // Interaction to Next Paint (replaces FID)
    onTTFB(handleMetric) // Time to First Byte
  } catch (error) {
    console.warn('Failed to initialize web vitals:', error)
  }
}

/**
 * React hook version for easy integration
 */
export function useWebVitals() {
  if (typeof window !== 'undefined') {
    // Only init once
    if (!window.__webVitalsInitialized) {
      window.__webVitalsInitialized = true
      initWebVitals()
    }
  }
}

/**
 * Get performance thresholds for each metric
 */
export const vitalsThresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
}

export default initWebVitals
