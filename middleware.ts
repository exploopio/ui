/**
 * Next.js Middleware
 *
 * Handles:
 * - Route protection (redirect unauthenticated users to login)
 * - Locale detection and injection
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleAuth } from '@/lib/middleware/auth'

export function middleware(request: NextRequest) {
  // Handle authentication
  const authResponse = handleAuth(request)
  if (authResponse) {
    return authResponse
  }

  // Continue with the request
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match root path explicitly
    '/',
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
