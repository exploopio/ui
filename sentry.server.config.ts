/**
 * Sentry Server-Side Configuration
 *
 * This file configures Sentry for the Node.js/server side.
 * Errors that occur in API routes, server components, middleware, etc. will be caught here.
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
    // Lower rate on server to reduce overhead
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    // Integrations
    integrations: [
      // HTTP integration for tracing HTTP requests
      Sentry.httpIntegration(),
    ],

    // Before sending events, filter sensitive data
    beforeSend(event, _hint) {
      // Remove sensitive environment variables
      if (event.contexts?.runtime?.name === 'node') {
        // Filter out sensitive env vars
        const sensitiveKeys = [
          'KEYCLOAK_CLIENT_SECRET',
          'CSRF_SECRET',
          'DATABASE_URL',
          'API_KEY',
          'SECRET',
          'PASSWORD',
          'TOKEN',
        ]

        if (event.extra) {
          for (const key of Object.keys(event.extra)) {
            if (sensitiveKeys.some(sensitive => key.toUpperCase().includes(sensitive))) {
              event.extra[key] = '[REDACTED]'
            }
          }
        }
      }

      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
        delete event.request.headers['Set-Cookie']
      }

      // Remove sensitive data from context
      if (event.contexts?.user) {
        // Keep only non-sensitive user info
        const { email, id } = event.contexts.user
        event.contexts.user = { id, email }
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      // Network errors
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      // Validation errors (expected)
      'ValidationError',
      // Authentication errors (expected)
      'UnauthorizedError',
      'AuthenticationError',
    ],

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Server name (useful for multi-server setups)
    serverName: process.env.HOSTNAME || 'unknown',

    // Release version (set from package.json or CI/CD)
    release: process.env.npm_package_version,
  })
} else {
  // Sentry not configured
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Sentry] NEXT_PUBLIC_SENTRY_DSN not configured. Sentry disabled.')
  }
}
