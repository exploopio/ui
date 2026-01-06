/**
 * Error Reporting Utility
 *
 * Centralized error reporting that can be integrated with services like:
 * - Sentry
 * - LogRocket
 * - Custom logging service
 *
 * Usage:
 * ```typescript
 * import { reportError } from '@/lib/error-reporting'
 *
 * try {
 *   // ... code
 * } catch (error) {
 *   reportError(error, { context: 'User action' })
 * }
 * ```
 */

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
 * Report error to monitoring service
 *
 * In development: Logs to console
 * In production: Can be integrated with Sentry, LogRocket, etc.
 *
 * @param error - The error to report
 * @param context - Additional context about the error
 */
export function reportError(error: Error | unknown, context?: ErrorContext): void {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const level = context?.level || 'error'

  // Format error message
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  // In development, just log to console
  if (isDevelopment) {
    console.group(`[${level.toUpperCase()}] Error Report`)
    console.error('Message:', errorMessage)
    if (errorStack) console.error('Stack:', errorStack)
    if (context?.context) console.info('Context:', context.context)
    if (context?.user) console.info('User:', context.user)
    if (context?.metadata) console.info('Metadata:', context.metadata)
    console.groupEnd()
    return
  }

  // In production, integrate with Sentry
  // TODO: Uncomment after installing @sentry/nextjs package
  /*
  try {
    // Dynamically import Sentry (only if configured)
    if (typeof window !== 'undefined') {
      // Client-side
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          level: level === 'fatal' ? 'fatal' : level,
          contexts: {
            custom: {
              context: context?.context,
              metadata: context?.metadata,
            },
          },
          user: context?.user,
        })
      }).catch(() => {
        // Sentry not installed, fallback to console
        console.error('[Error Report - Sentry unavailable]', {
          message: errorMessage,
          context: context?.context,
        })
      })
    } else {
      // Server-side
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          level: level === 'fatal' ? 'fatal' : level,
          contexts: {
            custom: {
              context: context?.context,
              metadata: context?.metadata,
            },
          },
          user: context?.user,
        })
      }).catch(() => {
        // Sentry not installed, fallback to console
        console.error('[Error Report - Sentry unavailable]', {
          message: errorMessage,
          context: context?.context,
        })
      })
    }
  } catch (err) {
    // Error reporting failed, fallback to console
  }
  */

  // Also log to console in production for backup
  console.error('[Error Report]', {
    message: errorMessage,
    stack: errorStack,
    context: context?.context,
    level,
    timestamp: new Date().toISOString(),
    metadata: context?.metadata,
  })
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
 * Initialize error reporting service
 *
 * Call this in your root layout or _app file
 */
export function initErrorReporting(): void {
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  if (!sentryDsn) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Error Reporting] Sentry DSN not configured. Errors will only be logged to console.')
    }
    return
  }

  // TODO: Uncomment when ready to use Sentry
  /*
  if (typeof window !== 'undefined') {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request?.headers) {
          delete event.request.headers['Authorization']
          delete event.request.headers['Cookie']
        }
        return event
      },
    })
  }
  */
}

// Export type for use in components
export type { ErrorContext }
