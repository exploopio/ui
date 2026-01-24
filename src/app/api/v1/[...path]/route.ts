/**
 * API Proxy Route
 *
 * Proxies all requests to the backend API with authentication headers.
 * This allows the frontend to make requests without CORS issues.
 *
 * Authentication flow:
 * - Reads access token from httpOnly cookie (set by login action)
 * - If access token is missing but refresh token exists, auto-refresh first
 * - Forwards as Authorization header to backend
 * - Also forwards X-CSRF-Token and X-Tenant-ID headers
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/lib/env'

// Use 127.0.0.1 instead of localhost to avoid IPv6 resolution issues in Node.js
const BACKEND_URL =
  process.env.BACKEND_API_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:8080'
const ACCESS_TOKEN_COOKIE = env.auth.cookieName
const REFRESH_TOKEN_COOKIE = env.auth.refreshCookieName
const TENANT_COOKIE = env.cookies.tenant

/**
 * Attempt to refresh the access token using refresh token
 * Returns the new access token if successful, null otherwise
 */
async function tryRefreshAccessToken(
  refreshToken: string,
  tenantId: string | undefined
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number } | null> {
  if (!tenantId) {
    console.log('[Proxy] Cannot refresh - no tenant ID')
    return null
  }

  try {
    console.log('[Proxy] Attempting to refresh access token...')
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        tenant_id: tenantId,
      }),
    })

    if (!response.ok) {
      console.log('[Proxy] Token refresh failed:', response.status)
      return null
    }

    const data = await response.json()
    console.log('[Proxy] Token refresh successful, new token length:', data.access_token?.length)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 900,
    }
  } catch (error) {
    console.error('[Proxy] Token refresh error:', error)
    return null
  }
}

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] }
): Promise<NextResponse> {
  const path = params.path.join('/')
  const url = new URL(request.url)
  // Route is /api/v1/[...path], so we need to add /api/v1/ prefix for backend
  const backendUrl = `${BACKEND_URL}/api/v1/${path}${url.search}`

  // Get access token from httpOnly cookie
  const cookieStore = await cookies()
  let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

  // Debug: Log cookie status and all auth-related cookies
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(
    (c) => c.name.includes('rediver') || c.name.includes('auth') || c.name.includes('token')
  )
  console.log('[Proxy]', request.method, path)
  console.log(
    '[Proxy] Access token cookie (' + ACCESS_TOKEN_COOKIE + '):',
    accessToken ? `present (${accessToken.substring(0, 20)}...)` : 'MISSING'
  )
  console.log('[Proxy] All auth cookies:', authCookies.map((c) => c.name).join(', ') || 'none')

  // Track if we refreshed the token (to set cookie in response)
  let refreshedTokenData: { accessToken: string; refreshToken?: string; expiresIn: number } | null =
    null

  // If access token is missing but refresh token exists, try to refresh
  if (!accessToken && refreshToken) {
    console.log('[Proxy] Access token missing, attempting refresh...')

    // Get tenant ID from cookie
    const tenantCookie = cookieStore.get(TENANT_COOKIE)?.value
    let tenantId: string | undefined
    if (tenantCookie) {
      try {
        const tenantInfo = JSON.parse(tenantCookie)
        tenantId = tenantInfo.id
      } catch {
        console.error('[Proxy] Failed to parse tenant cookie')
      }
    }

    refreshedTokenData = await tryRefreshAccessToken(refreshToken, tenantId)
    if (refreshedTokenData) {
      accessToken = refreshedTokenData.accessToken
      console.log('[Proxy] Token refreshed successfully, continuing with request')
    } else {
      console.warn('[Proxy] Token refresh failed, request will likely fail with 401')
    }
  }

  // Build headers
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  // Set Authorization header from cookie (or refreshed token)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
    console.log('[Proxy] Authorization header SET with token length:', accessToken.length)
  } else {
    console.warn('[Proxy] No access token - request will likely fail with 401')
  }

  // Forward refresh token cookie for endpoints that need it
  // (e.g., accept-with-refresh, create-first-team)
  if (refreshToken) {
    headers.set('Cookie', `${REFRESH_TOKEN_COOKIE}=${refreshToken}`)
    console.log('[Proxy] Refresh token cookie forwarded')
  }

  console.log('[Proxy] Backend URL:', backendUrl)

  // Forward other relevant headers from client
  const forwardHeaders = ['accept', 'accept-language', 'x-tenant-id', 'x-csrf-token']
  forwardHeaders.forEach((header) => {
    const value = request.headers.get(header)
    if (value) {
      headers.set(header, value)
    }
  })

  try {
    // Make request to backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body:
        request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
    })

    // Handle 204 No Content - must return response without body
    if (response.status === 204) {
      console.log('[Proxy] Backend response: 204 No Content')
      return new NextResponse(null, {
        status: 204,
        statusText: 'No Content',
      })
    }

    // Get response body
    const responseText = await response.text()
    console.log(
      '[Proxy] Backend response:',
      response.status,
      response.statusText,
      'Body length:',
      responseText.length
    )
    console.log('[Proxy] Response body preview:', responseText.substring(0, 300))
    if (response.status >= 400) {
      console.log('[Proxy] Backend error body:', responseText.substring(0, 500))
    }

    // Create response with same status and headers
    const proxyResponse = new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
    })

    // Copy relevant response headers
    const copyHeaders = ['content-type', 'x-request-id', 'x-total-count', 'x-permission-stale']
    copyHeaders.forEach((header) => {
      const value = response.headers.get(header)
      if (value) {
        proxyResponse.headers.set(header, value)
      }
    })

    // Forward Set-Cookie headers from backend (important for auth endpoints)
    // Use getSetCookie() to get all Set-Cookie headers (there can be multiple)
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      console.log('[Proxy] Forwarding', setCookieHeaders.length, 'Set-Cookie headers')
      setCookieHeaders.forEach((cookie) => {
        proxyResponse.headers.append('Set-Cookie', cookie)
      })
    }

    // If we refreshed the token, set the new cookies in response
    if (refreshedTokenData) {
      const isProd = process.env.NODE_ENV === 'production'
      console.log('[Proxy] Setting refreshed token cookies')

      // Set new access token cookie
      proxyResponse.cookies.set(ACCESS_TOKEN_COOKIE, refreshedTokenData.accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: refreshedTokenData.expiresIn,
        path: '/',
      })

      // Set new refresh token cookie if rotated
      if (refreshedTokenData.refreshToken) {
        proxyResponse.cookies.set(REFRESH_TOKEN_COOKIE, refreshedTokenData.refreshToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        })
      }
    }

    return proxyResponse
  } catch (error) {
    console.error('[Proxy] Connection error:', error)
    console.error('[Proxy] Backend URL was:', backendUrl)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'PROXY_ERROR', message: `Failed to connect to backend: ${errorMessage}` },
      { status: 502 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params)
}
