/**
 * Sentry Edge Runtime Configuration
 *
 * This file configures Sentry for Edge Runtime (middleware, edge API routes).
 * Errors that occur in middleware or edge functions will be caught here.
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
    // Lower rate on edge to reduce overhead
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    // Before sending events, filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
        delete event.request.headers['Set-Cookie']
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      'UnauthorizedError',
      'AuthenticationError',
    ],

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
  })
} else {
  // Sentry not configured
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Sentry] NEXT_PUBLIC_SENTRY_DSN not configured. Sentry Edge disabled.')
  }
}
