/**
 * Web Vitals Reporting
 *
 * Reports Core Web Vitals metrics to Sentry for performance monitoring.
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - INP (Interaction to Next Paint) - Responsiveness (replaced FID in 2024)
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - FCP (First Contentful Paint) - Perceived load speed
 * - TTFB (Time to First Byte) - Server response time
 *
 * @see https://web.dev/vitals/
 */

import * as Sentry from '@sentry/nextjs'

type MetricName = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB'

interface WebVitalMetric {
  id: string
  name: MetricName
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: string
}

/**
 * Report a Web Vital metric to Sentry
 */
export function reportWebVital(metric: WebVitalMetric): void {
  const { name, value, rating, id } = metric

  // Send to Sentry as a custom measurement
  Sentry.addBreadcrumb({
    category: 'web-vital',
    message: `${name}: ${value.toFixed(2)}ms (${rating})`,
    level: rating === 'poor' ? 'warning' : 'info',
    data: {
      metric: name,
      value,
      rating,
      id,
    },
  })

  // For poor ratings, create a performance issue
  if (rating === 'poor') {
    Sentry.captureMessage(`Poor Web Vital: ${name}`, {
      level: 'warning',
      tags: {
        'web-vital': name,
        rating,
      },
      contexts: {
        webVital: {
          name,
          value,
          rating,
          id,
          threshold: getThreshold(name),
        },
      },
    })
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    const color = rating === 'good' ? '\x1b[32m' : rating === 'needs-improvement' ? '\x1b[33m' : '\x1b[31m'
    console.log(`${color}[Web Vital] ${name}: ${value.toFixed(2)}ms (${rating})\x1b[0m`)
  }
}

/**
 * Get threshold values for each metric
 */
function getThreshold(name: MetricName): { good: number; poor: number } {
  const thresholds: Record<MetricName, { good: number; poor: number }> = {
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    INP: { good: 200, poor: 500 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  }
  return thresholds[name]
}

/**
 * Initialize Web Vitals reporting
 *
 * Call this in your root layout or _app file
 *
 * Note: FID was removed in web-vitals v4+ in favor of INP
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals')

    onCLS(reportWebVital)
    onFCP(reportWebVital)
    onINP(reportWebVital)
    onLCP(reportWebVital)
    onTTFB(reportWebVital)
  } catch {
    // web-vitals not installed, skip
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Web Vitals] Library not available. Install with: npm install web-vitals')
    }
  }
}
