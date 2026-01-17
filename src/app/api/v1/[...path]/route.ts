/**
 * API Proxy Route
 *
 * Proxies all requests to the backend API with authentication headers.
 * This allows the frontend to make requests without CORS issues.
 *
 * Authentication flow:
 * - Reads access token from httpOnly cookie (set by login action)
 * - Forwards as Authorization header to backend
 * - Also forwards X-CSRF-Token and X-Tenant-ID headers
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/lib/env'

// Use 127.0.0.1 instead of localhost to avoid IPv6 resolution issues in Node.js
const BACKEND_URL = process.env.BACKEND_API_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:8080'
const ACCESS_TOKEN_COOKIE = env.auth.cookieName

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
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  // Debug: Log cookie status and all auth-related cookies
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(c =>
    c.name.includes('rediver') || c.name.includes('auth') || c.name.includes('token')
  )
  console.log('[Proxy]', request.method, path)
  console.log('[Proxy] Access token cookie (' + ACCESS_TOKEN_COOKIE + '):', accessToken ? `present (${accessToken.substring(0, 20)}...)` : 'MISSING')
  console.log('[Proxy] All auth cookies:', authCookies.map(c => c.name).join(', ') || 'none')

  // Build headers
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  // Set Authorization header from cookie
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
    console.log('[Proxy] Authorization header SET with token length:', accessToken.length)
  } else {
    console.warn('[Proxy] No access token - request will likely fail with 401')
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
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined,
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
    console.log('[Proxy] Backend response:', response.status, response.statusText, 'Body length:', responseText.length)
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
    const copyHeaders = ['content-type', 'x-request-id', 'x-total-count']
    copyHeaders.forEach((header) => {
      const value = response.headers.get(header)
      if (value) {
        proxyResponse.headers.set(header, value)
      }
    })

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
