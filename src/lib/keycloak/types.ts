/**
 * Keycloak Type Definitions
 *
 * Types for Keycloak authentication flow and token management
 */

// ============================================
// TOKEN TYPES
// ============================================

/**
 * Keycloak OAuth2 Token Response
 * Returned from Keycloak token endpoint
 */
export interface KeycloakTokenResponse {
  access_token: string
  expires_in: number // seconds
  refresh_expires_in: number // seconds
  refresh_token: string
  token_type: 'Bearer' | string
  id_token?: string
  'not-before-policy'?: number
  session_state?: string
  scope?: string
}

/**
 * Keycloak Tokens (Alias for KeycloakTokenResponse)
 * For backwards compatibility and clearer naming
 */
export type KeycloakTokens = KeycloakTokenResponse

/**
 * Decoded JWT Access Token from Keycloak
 * Standard claims + custom realm/resource roles
 */
export interface KeycloakAccessToken {
  // Standard JWT claims
  exp: number // Expiration time (Unix timestamp)
  iat: number // Issued at (Unix timestamp)
  jti: string // JWT ID
  iss: string // Issuer (Keycloak URL)
  aud: string | string[] // Audience
  sub: string // Subject (user ID)
  typ: 'Bearer'
  azp: string // Authorized party (client ID)

  // Session info
  session_state?: string
  scope?: string

  // User info
  email?: string
  email_verified?: boolean
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string

  // Roles
  realm_access?: {
    roles: string[]
  }
  resource_access?: {
    [clientId: string]: {
      roles: string[]
    }
  }

  // Custom claims (adjust based on your Keycloak config)
  [key: string]: unknown
}

/**
 * Decoded Refresh Token (usually similar structure to access token)
 */
export interface KeycloakRefreshToken {
  exp: number
  iat: number
  jti: string
  iss: string
  aud: string | string[]
  sub: string
  typ: 'Refresh'
  azp: string
  session_state?: string
  scope?: string
}

/**
 * Decoded ID Token (OpenID Connect)
 */
export interface KeycloakIDToken {
  exp: number
  iat: number
  aud: string | string[]
  sub: string
  iss: string
  email?: string
  email_verified?: boolean
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  [key: string]: unknown
}

/**
 * Token Payload (Alias for KeycloakAccessToken)
 * For backwards compatibility and clearer naming
 */
export type TokenPayload = KeycloakAccessToken

// ============================================
// USER TYPES
// ============================================

/**
 * Authenticated User Information
 * Extracted from Keycloak access token
 */
export interface AuthUser {
  id: string // sub claim
  email: string
  name: string
  username: string // preferred_username
  emailVerified: boolean
  roles: string[] // Combined realm + resource roles
  realmRoles: string[]
  clientRoles: Record<string, string[]>
}

/**
 * Keycloak User (Alias for AuthUser)
 * For backwards compatibility and clearer naming
 */
export type KeycloakUser = AuthUser

/**
 * User Profile from Keycloak UserInfo endpoint
 * More detailed than token claims
 */
export interface KeycloakUserInfo {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  picture?: string
  locale?: string
  updated_at?: number
  [key: string]: unknown
}

// ============================================
// AUTHENTICATION STATE
// ============================================

/**
 * Authentication status
 */
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'error'

/**
 * Complete authentication state
 */
export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null // Unix timestamp
  error: string | null
}

// ============================================
// API TYPES
// ============================================

/**
 * Keycloak OAuth2 Authorization Request Parameters
 */
export interface KeycloakAuthParams {
  response_type: 'code' | 'token' | 'id_token token' | 'code id_token' | 'code token' | 'code id_token token'
  client_id: string
  redirect_uri: string
  scope?: string
  state?: string
  nonce?: string
  prompt?: 'none' | 'login' | 'consent' | 'select_account'
  max_age?: number
  ui_locales?: string
  [key: string]: string | number | undefined
}

/**
 * Keycloak Token Request (Authorization Code Flow)
 */
export interface KeycloakTokenRequest {
  grant_type: 'authorization_code' | 'refresh_token' | 'password' | 'client_credentials'
  code?: string
  redirect_uri?: string
  refresh_token?: string
  username?: string
  password?: string
  client_id: string
  client_secret?: string
  scope?: string
}

/**
 * Keycloak Logout Parameters
 */
export interface KeycloakLogoutParams {
  id_token_hint?: string
  post_logout_redirect_uri?: string
  state?: string
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * Keycloak Error Response
 */
export interface KeycloakError {
  error: string
  error_description?: string
  error_uri?: string
}

/**
 * Authentication Error with additional context
 */
export interface AuthError extends Error {
  code: string
  statusCode?: number
  details?: unknown
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Token validation result
 */
export interface TokenValidation {
  valid: boolean
  expired: boolean
  expiresIn: number // seconds until expiration (negative if expired)
  error?: string
}

/**
 * Role check options
 */
export interface RoleCheckOptions {
  requireAll?: boolean // If true, user must have ALL roles. If false, ANY role is sufficient
  clientId?: string // Check roles for specific client
}
