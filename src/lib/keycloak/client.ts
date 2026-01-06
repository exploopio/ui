/**
 * Keycloak Client Utilities
 *
 * Client-side functions for Keycloak OAuth2/OIDC flow
 * Browser-safe operations only (no secrets)
 */

import { env } from '../env'
import type {
  KeycloakAuthParams,
  KeycloakLogoutParams,
  KeycloakTokenResponse,
  KeycloakUserInfo,
  KeycloakError,
} from './types'

// ============================================
// KEYCLOAK URLS
// ============================================

/**
 * Build Keycloak endpoint URLs
 */
export const getKeycloakUrls = () => {
  const baseUrl = `${env.keycloak.url}/realms/${env.keycloak.realm}/protocol/openid-connect`

  return {
    authorization: `${baseUrl}/auth`,
    token: `${baseUrl}/token`,
    userInfo: `${baseUrl}/userinfo`,
    logout: `${baseUrl}/logout`,
    endSession: `${baseUrl}/logout`,
    jwks: `${baseUrl}/certs`,
    introspection: `${baseUrl}/token/introspect`,
    revocation: `${baseUrl}/revoke`,
  }
}

// ============================================
// AUTHORIZATION CODE FLOW
// ============================================

/**
 * Generate a UUID v4 with fallback for environments without crypto.randomUUID
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers, Node 19+)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback using crypto.getRandomValues (broader support)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
      (
        Number(c) ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
      ).toString(16)
    )
  }

  // Last resort fallback (not cryptographically secure, but functional)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  return generateUUID()
}

/**
 * Generate a random nonce for replay protection
 */
export function generateNonce(): string {
  return generateUUID()
}

/**
 * Build Keycloak authorization URL for OAuth2 Code Flow
 *
 * @param options - Additional OAuth2 parameters
 * @returns Full authorization URL to redirect to
 *
 * @example
 * const authUrl = buildAuthorizationUrl({
 *   scope: 'openid profile email',
 *   state: 'random-state',
 * })
 * window.location.href = authUrl
 */
export function buildAuthorizationUrl(
  options: Partial<KeycloakAuthParams> = {}
): string {
  const urls = getKeycloakUrls()

  const params: KeycloakAuthParams = {
    response_type: 'code',
    client_id: env.keycloak.clientId,
    redirect_uri: env.keycloak.redirectUri,
    scope: 'openid profile email',
    state: generateState(),
    nonce: generateNonce(),
    ...options,
  }

  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = String(value)
      }
      return acc
    }, {} as Record<string, string>)
  ).toString()

  return `${urls.authorization}?${queryString}`
}

/**
 * Redirect to Keycloak login page
 *
 * @param returnUrl - URL to return to after login
 *
 * @example
 * redirectToLogin('/dashboard')
 */
export function redirectToLogin(returnUrl?: string): void {
  const state = generateState()

  // Store state and return URL in sessionStorage for verification after redirect
  sessionStorage.setItem('keycloak_state', state)
  if (returnUrl) {
    sessionStorage.setItem('keycloak_return_url', returnUrl)
  }

  const authUrl = buildAuthorizationUrl({ state })
  window.location.href = authUrl
}

/**
 * Redirect to Keycloak registration page
 *
 * @example
 * redirectToRegister()
 */
export function redirectToRegister(): void {
  const state = generateState()

  sessionStorage.setItem('keycloak_state', state)

  // Keycloak-specific: append kc_action=REGISTER
  const authUrl = buildAuthorizationUrl({
    state,
    prompt: 'login',
  })

  // Add kc_action parameter for registration
  window.location.href = `${authUrl}&kc_action=REGISTER`
}

/**
 * Build Keycloak logout URL
 *
 * @param accessToken - Optional access token for Keycloak logout (id_token_hint)
 * @param postLogoutRedirectUri - Where to redirect after logout
 * @returns Logout URL
 */
export function buildLogoutUrl(
  accessToken?: string,
  postLogoutRedirectUri?: string
): string {
  const urls = getKeycloakUrls()

  const params: Record<string, string> = {}

  if (postLogoutRedirectUri) {
    params.post_logout_redirect_uri = postLogoutRedirectUri
  } else {
    params.post_logout_redirect_uri = env.app.url
  }

  if (accessToken) {
    params.id_token_hint = accessToken
  }

  const searchParams = new URLSearchParams(params)
  return `${urls.logout}?${searchParams.toString()}`
}

/**
 * Redirect to Keycloak logout endpoint
 *
 * @param options - Logout parameters
 *
 * @example
 * redirectToLogout({ post_logout_redirect_uri: window.location.origin })
 */
export function redirectToLogout(options: KeycloakLogoutParams = {}): void {
  const urls = getKeycloakUrls()

  const params = new URLSearchParams(
    Object.entries({
      post_logout_redirect_uri: env.app.url,
      ...options,
    }).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = String(value)
      }
      return acc
    }, {} as Record<string, string>)
  )

  // Clear session storage
  sessionStorage.removeItem('keycloak_state')
  sessionStorage.removeItem('keycloak_return_url')

  window.location.href = `${urls.logout}?${params.toString()}`
}

// ============================================
// TOKEN MANAGEMENT (Client-side)
// ============================================

/**
 * Exchange authorization code for tokens
 * ⚠️ Note: In production, this should be done server-side to protect client_secret
 *
 * @param code - Authorization code from callback
 * @returns Token response
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<KeycloakTokenResponse> {
  const urls = getKeycloakUrls()

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.keycloak.redirectUri,
    client_id: env.keycloak.clientId,
  })

  const response = await fetch(urls.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error: KeycloakError = await response.json()
    throw new Error(error.error_description || error.error || 'Token exchange failed')
  }

  return response.json()
}

/**
 * Refresh access token using refresh token
 *
 * @param refreshToken - Refresh token
 * @returns New token response
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<KeycloakTokenResponse> {
  const urls = getKeycloakUrls()

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: env.keycloak.clientId,
  })

  const response = await fetch(urls.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error: KeycloakError = await response.json()
    throw new Error(error.error_description || error.error || 'Token refresh failed')
  }

  return response.json()
}

/**
 * Fetch user info from Keycloak UserInfo endpoint
 *
 * @param accessToken - Valid access token
 * @returns User information
 */
export async function fetchUserInfo(
  accessToken: string
): Promise<KeycloakUserInfo> {
  const urls = getKeycloakUrls()

  const response = await fetch(urls.userInfo, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error: KeycloakError = await response.json()
    throw new Error(error.error_description || error.error || 'Failed to fetch user info')
  }

  return response.json()
}

// ============================================
// STATE VALIDATION
// ============================================

/**
 * Validate OAuth2 state parameter to prevent CSRF
 *
 * @param receivedState - State received in callback
 * @returns true if state is valid
 */
export function validateState(receivedState: string | null): boolean {
  if (!receivedState) return false

  const storedState = sessionStorage.getItem('keycloak_state')
  if (!storedState) return false

  // Compare and clear
  const isValid = receivedState === storedState
  if (isValid) {
    sessionStorage.removeItem('keycloak_state')
  }

  return isValid
}

/**
 * Get stored return URL and clear from storage
 *
 * @returns Return URL or null
 */
export function getReturnUrl(): string | null {
  const returnUrl = sessionStorage.getItem('keycloak_return_url')
  if (returnUrl) {
    sessionStorage.removeItem('keycloak_return_url')
  }
  return returnUrl
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Check if error is a Keycloak error
 */
export function isKeycloakError(error: unknown): error is KeycloakError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as KeycloakError).error === 'string'
  )
}

/**
 * Format Keycloak error for display
 */
export function formatKeycloakError(error: unknown): string {
  if (isKeycloakError(error)) {
    return error.error_description || error.error
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unknown error occurred'
}

// ============================================
// HELPERS
// ============================================

/**
 * Check if we're in the OAuth callback (code in URL)
 */
export function isOAuthCallback(): boolean {
  if (typeof window === 'undefined') return false

  const params = new URLSearchParams(window.location.search)
  return params.has('code') || params.has('error')
}

/**
 * Get OAuth callback parameters from URL
 */
export function getCallbackParams(): {
  code: string | null
  state: string | null
  error: string | null
  error_description: string | null
} {
  if (typeof window === 'undefined') {
    return { code: null, state: null, error: null, error_description: null }
  }

  const params = new URLSearchParams(window.location.search)

  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    error_description: params.get('error_description'),
  }
}

/**
 * Clear OAuth parameters from URL without reloading page
 */
export function clearCallbackParams(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')
  url.searchParams.delete('session_state')

  window.history.replaceState({}, document.title, url.toString())
}
