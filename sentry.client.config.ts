/**
 * Sentry Client-Side Configuration
 *
 * This file configures Sentry for the browser/client side.
 * Errors that occur in React components, browser APIs, etc. will be caught here.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

// Only initialize Sentry if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    // Data Source Name - your Sentry project identifier
    dsn: SENTRY_DSN,

    // Environment (production, staging, development)
    environment: process.env.NODE_ENV || 'development',

    // Percentage of transactions to trace (0.0 to 1.0)
    // In production: 0.1 = 10% of transactions
    // In development: 1.0 = 100% of transactions
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Percentage of sessions to record (Session Replay)
    // Set to 0 to disable session replay
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

    // Percentage of error sessions to record
    replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      // Replay integration (session recording)
      Sentry.replayIntegration({
        // Mask all text content
        maskAllText: true,
        // Block all media (images, videos)
        blockAllMedia: true,
      }),

      // Browser tracing (performance monitoring)
      Sentry.browserTracingIntegration({
        // Track route changes in Next.js
        traceFetch: true,
        traceXHR: true,
      }),
    ],

    // Before sending events, filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
        delete event.request.headers['Set-Cookie']
      }

      // Remove sensitive query parameters
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url)
          // Remove sensitive params
          url.searchParams.delete('token')
          url.searchParams.delete('password')
          url.searchParams.delete('secret')
          event.request.url = url.toString()
        } catch (e) {
          // Invalid URL, keep original
        }
      }

      // Filter out specific errors (optional)
      const error = hint.originalException as Error
      if (error?.message) {
        // Ignore known browser extension errors
        if (error.message.match(/chrome-extension|moz-extension/i)) {
          return null
        }

        // Ignore ResizeObserver errors (browser quirk)
        if (error.message.match(/ResizeObserver loop limit exceeded/i)) {
          return null
        }
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      /chrome-extension/i,
      /moz-extension/i,
      // Network errors
      'NetworkError',
      'Failed to fetch',
      // ResizeObserver
      'ResizeObserver loop limit exceeded',
      // Common false positives
      'Non-Error promise rejection captured',
    ],

    // Deny URLs (don't send errors from these URLs)
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
  })
} else {
  // Sentry not configured
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Sentry] NEXT_PUBLIC_SENTRY_DSN not configured. Sentry disabled.')
  }
}
