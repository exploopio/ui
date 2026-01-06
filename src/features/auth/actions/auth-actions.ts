/**
 * Auth Server Actions
 *
 * Server-side actions for authentication with Keycloak
 * - Handles OAuth2 callback and token exchange
 * - Manages HttpOnly cookie storage
 * - Token refresh and validation
 * - Logout and session cleanup
 */

'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { env } from '@/lib/env'
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchUserInfo,
  buildLogoutUrl,
} from '@/lib/keycloak/client'
import { isTokenExpired, extractUser } from '@/lib/keycloak/jwt'
import { setServerCookie, removeServerCookie } from '@/lib/cookies-server'
import { validateRedirectUrl } from '@/lib/redirect'

import type {
  AuthSuccessResponse,
  AuthErrorResponse,
} from '../schemas/auth.schema'
import type { KeycloakUser, KeycloakTokens } from '@/lib/keycloak/types'

// ============================================
// TYPES
// ============================================

/**
 * OAuth callback action input
 */
export interface HandleCallbackInput {
  code?: string
  state?: string
  error?: string
  error_description?: string
  session_state?: string
  redirectTo?: string
}

/**
 * Refresh token action result
 */
export interface RefreshTokenResult {
  success: boolean
  accessToken?: string
  user?: KeycloakUser
  error?: string
}

// ============================================
// OAUTH CALLBACK HANDLER
// ============================================

/**
 * Handle OAuth2 callback from Keycloak
 *
 * This action:
 * 1. Validates state parameter (CSRF protection)
 * 2. Exchanges authorization code for tokens
 * 3. Stores tokens in HttpOnly cookies
 * 4. Extracts user from access token
 * 5. Redirects to success URL
 *
 * @param input - OAuth callback parameters
 * @returns Success response with user data or error response
 */
export async function handleOAuthCallback(
  input: HandleCallbackInput
): Promise<AuthSuccessResponse<KeycloakUser> | AuthErrorResponse> {
  try {
    // Check for OAuth errors from Keycloak
    if (input.error) {
      console.error('OAuth error:', input.error, input.error_description)
      return {
        success: false,
        error: input.error_description || input.error || 'Authentication failed',
      }
    }

    // Validate required parameters
    if (!input.code || !input.state) {
      return {
        success: false,
        error: 'Missing authorization code or state parameter',
      }
    }

    // Validate state parameter (CSRF protection)
    const cookieStore = await cookies()
    const savedState = cookieStore.get('oauth_state')?.value

    if (!savedState || !input.state || savedState !== input.state) {
      return {
        success: false,
        error: 'Invalid state parameter. Possible CSRF attack.',
      }
    }

    // Exchange authorization code for tokens
    let tokens: KeycloakTokens
    try {
      tokens = await exchangeCodeForTokens(input.code)
    } catch (error) {
      console.error('Token exchange error:', error)
      return {
        success: false,
        error: 'Failed to exchange authorization code for tokens',
      }
    }

    // Extract user from access token
    const user = extractUser(tokens.access_token)
    if (!user) {
      return {
        success: false,
        error: 'Failed to extract user from token',
      }
    }

    // Store tokens in HttpOnly cookies (server-side only)
    await setServerCookie(env.auth.cookieName, tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 300, // Default 5 minutes
    })

    if (tokens.refresh_token) {
      await setServerCookie(env.auth.refreshCookieName, tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.refresh_expires_in || 1800, // Default 30 minutes
      })
    }

    // Clean up OAuth state cookie
    await removeServerCookie('oauth_state')

    // Validate redirect URL (validation side-effect, result used client-side)
    validateRedirectUrl(input.redirectTo || '/dashboard')

    return {
      success: true,
      data: user,
      message: 'Authentication successful',
    }
  } catch (error) {
    console.error('OAuth callback error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    }
  }
}

// ============================================
// TOKEN REFRESH
// ============================================

/**
 * Refresh access token using refresh token
 *
 * This action:
 * 1. Gets refresh token from HttpOnly cookie
 * 2. Calls Keycloak token refresh endpoint
 * 3. Updates cookies with new tokens
 * 4. Returns new access token and user
 *
 * @returns Refresh token result with new token or error
 */
export async function refreshTokenAction(): Promise<RefreshTokenResult> {
  try {
    // Get refresh token from cookie
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(env.auth.refreshCookieName)?.value

    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
      }
    }

    // Check if refresh token is expired
    if (isTokenExpired(refreshToken)) {
      // Clean up expired cookies
      await removeServerCookie(env.auth.cookieName)
      await removeServerCookie(env.auth.refreshCookieName)

      return {
        success: false,
        error: 'Refresh token expired',
      }
    }

    // Refresh the access token
    let tokens: KeycloakTokens
    try {
      tokens = await refreshAccessToken(refreshToken)
    } catch (error) {
      console.error('Token refresh error:', error)

      // Clean up cookies on refresh failure
      await removeServerCookie(env.auth.cookieName)
      await removeServerCookie(env.auth.refreshCookieName)

      return {
        success: false,
        error: 'Failed to refresh token',
      }
    }

    // Extract user from new access token
    const user = extractUser(tokens.access_token)
    if (!user) {
      return {
        success: false,
        error: 'Failed to extract user from new token',
      }
    }

    // Update cookies with new tokens
    await setServerCookie(env.auth.cookieName, tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 300,
    })

    if (tokens.refresh_token) {
      await setServerCookie(env.auth.refreshCookieName, tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.refresh_expires_in || 1800,
      })
    }

    return {
      success: true,
      accessToken: tokens.access_token,
      user,
    }
  } catch (error) {
    console.error('Refresh token action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    }
  }
}

// ============================================
// GET CURRENT USER
// ============================================

/**
 * Get current authenticated user from access token
 *
 * This action:
 * 1. Gets access token from HttpOnly cookie
 * 2. Validates token expiry
 * 3. Extracts user from token
 * 4. Optionally fetches full user info from Keycloak
 *
 * @param fetchFull - Whether to fetch full user info from Keycloak API
 * @returns Success response with user or error response
 */
export async function getCurrentUser(
  fetchFull = false
): Promise<AuthSuccessResponse<KeycloakUser> | AuthErrorResponse> {
  try {
    // Get access token from cookie
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(env.auth.cookieName)?.value

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Check if token is expired
    if (isTokenExpired(accessToken)) {
      // Try to refresh
      const refreshResult = await refreshTokenAction()

      if (!refreshResult.success || !refreshResult.accessToken) {
        return {
          success: false,
          error: 'Session expired',
        }
      }

      // Use refreshed token
      const user = refreshResult.user!
      return {
        success: true,
        data: user,
      }
    }

    // Extract user from token
    let user = extractUser(accessToken)
    if (!user) {
      return {
        success: false,
        error: 'Failed to extract user from token',
      }
    }

    // Optionally fetch full user info from Keycloak
    if (fetchFull) {
      try {
        const fullUserInfo = await fetchUserInfo(accessToken)
        user = { ...user, ...fullUserInfo }
      } catch (error) {
        console.warn('Failed to fetch full user info:', error)
        // Continue with token-based user info
      }
    }

    return {
      success: true,
      data: user,
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user',
    }
  }
}

// ============================================
// LOGOUT
// ============================================

/**
 * Logout user and clean up session
 *
 * This action:
 * 1. Clears HttpOnly cookies
 * 2. Redirects to Keycloak logout endpoint
 * 3. Keycloak will redirect back to post_logout_redirect_uri
 *
 * @param postLogoutRedirectUri - URL to redirect to after logout
 */
export async function logoutAction(
  postLogoutRedirectUri?: string
): Promise<never> {
  try {
    // Get current access token for Keycloak logout
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(env.auth.cookieName)?.value

    // Clear all auth cookies
    await removeServerCookie(env.auth.cookieName)
    await removeServerCookie(env.auth.refreshCookieName)
    await removeServerCookie('oauth_state')

    // Build Keycloak logout URL
    const logoutUrl = buildLogoutUrl(
      accessToken,
      postLogoutRedirectUri || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`
    )

    // Redirect to Keycloak logout
    redirect(logoutUrl)
  } catch (error) {
    console.error('Logout action error:', error)
    // Fallback: redirect to home even if Keycloak logout fails
    redirect('/')
  }
}

// ============================================
// TOKEN VALIDATION
// ============================================

/**
 * Validate if user has valid authentication
 *
 * @returns true if user is authenticated with valid token
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(env.auth.cookieName)?.value

    if (!accessToken) {
      return false
    }

    // Check if token is expired
    if (isTokenExpired(accessToken)) {
      // Try to refresh
      const refreshResult = await refreshTokenAction()
      return refreshResult.success
    }

    return true
  } catch (error) {
    console.error('Authentication check error:', error)
    return false
  }
}

// ============================================
// GET ACCESS TOKEN (for API calls)
// ============================================

/**
 * Get valid access token for API calls
 * Automatically refreshes if token is expired
 *
 * @returns Access token or null if not authenticated
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get(env.auth.cookieName)?.value

    if (!accessToken) {
      return null
    }

    // Check if token is expired
    if (isTokenExpired(accessToken)) {
      // Try to refresh
      const refreshResult = await refreshTokenAction()

      if (!refreshResult.success || !refreshResult.accessToken) {
        return null
      }

      accessToken = refreshResult.accessToken
    }

    return accessToken
  } catch (error) {
    console.error('Get access token error:', error)
    return null
  }
}
