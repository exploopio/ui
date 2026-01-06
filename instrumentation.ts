/**
 * Next.js Instrumentation
 *
 * This file runs when the Next.js server starts.
 * Used for initializing monitoring, logging, and other instrumentation.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Server-side instrumentation
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and initialize Sentry for Node.js
    // TODO: Uncomment after installing @sentry/nextjs package
    // await import('./sentry.server.config')
  }

  // Edge runtime instrumentation
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Import and initialize Sentry for Edge
    // TODO: Uncomment after installing @sentry/nextjs package
    // await import('./sentry.edge.config')
  }
}
