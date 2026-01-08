/**
 * Authentication Middleware Helpers
 *
 * Functions for handling authentication in middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { PUBLIC_ROUTES, API_PREFIX } from './config'

// ============================================
// ROUTE CHECKING
// ============================================

/**
 * Check if route is public (doesn't require auth)
 */
export function isPublicRoute(pathname: string): boolean {
  // Exact match for public routes
  if (PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number])) {
    return true
  }

  // Check if pathname starts with any public route
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Check if route is an API route
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith(API_PREFIX)
}

/**
 * Check if route requires authentication
 * Default: ALL routes require auth except PUBLIC_ROUTES
 */
export function requiresAuth(pathname: string): boolean {
  // API routes handle their own auth
  if (isApiRoute(pathname)) {
    return false
  }

  // Public routes don't require auth (whitelist)
  if (isPublicRoute(pathname)) {
    return false
  }

  // Everything else requires authentication
  return true
}

// ============================================
// AUTHENTICATION CHECK
// ============================================

/**
 * Check if user is authenticated
 * Looks for refresh token in HttpOnly cookie
 * In dev mode, also checks for dev auth cookie
 */
export function isAuthenticated(req: NextRequest): boolean {
  // Check for Keycloak refresh token (production)
  const cookieName =
    process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'kc_refresh_token'
  const refreshToken = req.cookies.get(cookieName)

  if (refreshToken?.value) {
    return true
  }

  // Check for dev auth cookie (development only)
  if (process.env.NODE_ENV === 'development') {
    const devAuthToken = req.cookies.get('dev_auth_token')
    if (devAuthToken?.value) {
      return true
    }
  }

  return false
}

// ============================================
// REDIRECT VALIDATION
// ============================================

/**
 * Validate redirect URL to prevent open redirect attacks
 * Only allows internal redirects
 */
export function validateRedirectUrl(url: string): string {
  try {
    // If it starts with /, it's internal - safe
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url
    }

    // Try to parse as URL
    const parsed = new URL(url)

    // Only allow same origin
    if (parsed.origin === process.env.NEXT_PUBLIC_APP_URL) {
      return parsed.pathname + parsed.search
    }

    // Invalid - return default
    return '/dashboard'
  } catch {
    // Invalid URL - return default
    return '/dashboard'
  }
}

// ============================================
// AUTH HANDLER
// ============================================

/**
 * Handle authentication check in middleware
 *
 * @param req - Next.js request object
 * @returns Redirect response if not authenticated, null otherwise
 *
 * @example
 * ```typescript
 * const authResponse = handleAuth(req)
 * if (authResponse) return authResponse
 * ```
 */
export function handleAuth(req: NextRequest): NextResponse | null {
  const { pathname, search } = req.nextUrl

  // Check if route requires auth and user is not authenticated
  if (requiresAuth(pathname) && !isAuthenticated(req)) {
    const loginUrl = new URL('/login', req.url)

    // Add return URL as query parameter (validated)
    const returnUrl = pathname + search
    const safeReturnUrl = validateRedirectUrl(returnUrl)
    loginUrl.searchParams.set('redirect', safeReturnUrl)

    return NextResponse.redirect(loginUrl)
  }

  return null
}
