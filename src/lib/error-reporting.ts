/**
 * Error Reporting Utility
 *
 * Centralized error reporting integrated with Sentry.
 *
 * Usage:
 * ```typescript
 * import { reportError, reportRouteError } from '@/lib/error-reporting'
 *
 * // General error
 * reportError(error, { context: 'User action' })
 *
 * // Route-specific error (in error.tsx)
 * reportRouteError(error, '/dashboard', { digest: error.digest })
 * ```
 */

import * as Sentry from '@sentry/nextjs'

interface ErrorContext {
  /**
   * Additional context about where/why the error occurred
   */
  context?: string

  /**
   * User information (if available)
   */
  user?: {
    id?: string
    email?: string
  }

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>

  /**
   * Error severity level
   */
  level?: 'fatal' | 'error' | 'warning' | 'info'
}

/**
 * Report error to Sentry
 *
 * @param error - The error to report
 * @param context - Additional context about the error
 */
export function reportError(error: Error | unknown, context?: ErrorContext): void {
  const level = context?.level || 'error'

  // Format error message
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  // Always log to console
  if (process.env.NODE_ENV === 'development') {
    console.group(`[${level.toUpperCase()}] Error Report`)
    console.error('Message:', errorMessage)
    if (errorStack) console.error('Stack:', errorStack)
    if (context?.context) console.info('Context:', context.context)
    if (context?.metadata) console.info('Metadata:', context.metadata)
    console.groupEnd()
  }

  // Report to Sentry
  try {
    Sentry.captureException(error, {
      level: level === 'fatal' ? 'fatal' : level,
      contexts: {
        custom: {
          context: context?.context,
          ...context?.metadata,
        },
      },
      user: context?.user ? {
        id: context.user.id,
        email: context.user.email,
      } : undefined,
    })
  } catch (err) {
    // Sentry capture failed, log to console
    console.error('[Error Report - Sentry failed]', {
      message: errorMessage,
      context: context?.context,
    })
  }
}

/**
 * Report route-specific error (for use in error.tsx files)
 *
 * @param error - The error object from Next.js error boundary
 * @param route - The route where the error occurred
 * @param extra - Additional error info (digest, etc.)
 */
export function reportRouteError(
  error: Error & { digest?: string },
  route: string,
  extra?: Record<string, unknown>
): void {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      route,
      errorBoundary: 'true',
      digest: error.digest,
    },
    contexts: {
      route: {
        path: route,
        digest: error.digest,
        ...extra,
      },
    },
  })

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Route Error: ${route}]`, error)
  }
}

/**
 * Report warning (non-critical error)
 */
export function reportWarning(message: string, context?: Omit<ErrorContext, 'level'>): void {
  reportError(new Error(message), { ...context, level: 'warning' })
}

/**
 * Report info (for tracking)
 */
export function reportInfo(message: string, context?: Omit<ErrorContext, 'level'>): void {
  reportError(new Error(message), { ...context, level: 'info' })
}

/**
 * Check if Sentry is configured
 */
export function isSentryConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SENTRY_DSN
}

// Export type for use in components
export type { ErrorContext }
