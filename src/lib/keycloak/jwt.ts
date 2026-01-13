/**
 * JWT Utility Functions
 *
 * Functions for decoding, validating, and extracting data from JWTs
 * Works on both client and server side
 */

import type {
  KeycloakAccessToken,
  KeycloakRefreshToken,
  KeycloakIDToken,
  AuthUser,
  TokenValidation,
} from './types'

// ============================================
// JWT DECODING
// ============================================

/**
 * Decode a JWT token without verification
 * ⚠️ WARNING: This does NOT verify the signature!
 * Use only for reading claims. Verify signature server-side.
 *
 * @param token - JWT string
 * @returns Decoded token payload
 */
export function decodeJWT<T = Record<string, unknown>>(token: string): T {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    // Decode base64url
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))

    return JSON.parse(decoded) as T
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decode Keycloak access token
 */
export function decodeAccessToken(token: string): KeycloakAccessToken {
  return decodeJWT<KeycloakAccessToken>(token)
}

/**
 * Decode Keycloak refresh token
 */
export function decodeRefreshToken(token: string): KeycloakRefreshToken {
  return decodeJWT<KeycloakRefreshToken>(token)
}

/**
 * Decode Keycloak ID token
 */
export function decodeIDToken(token: string): KeycloakIDToken {
  return decodeJWT<KeycloakIDToken>(token)
}

// ============================================
// TOKEN VALIDATION
// ============================================

/**
 * Check if a JWT token is expired
 *
 * @param token - JWT string or decoded token
 * @param bufferSeconds - Consider expired N seconds before actual expiry (default: 30)
 * @returns true if token is expired
 */
export function isTokenExpired(
  token: string | { exp: number },
  bufferSeconds: number = 30
): boolean {
  try {
    const decoded = typeof token === 'string' ? decodeJWT<{ exp: number }>(token) : token

    if (!decoded.exp) {
      return true // No expiry = treat as expired
    }

    const now = Math.floor(Date.now() / 1000)
    return decoded.exp - bufferSeconds <= now
  } catch {
    return true // Invalid token = expired
  }
}

/**
 * Get seconds until token expiry
 *
 * @param token - JWT string or decoded token
 * @returns Seconds until expiry (negative if expired)
 */
export function getTimeUntilExpiry(token: string | { exp: number }): number {
  try {
    const decoded = typeof token === 'string' ? decodeJWT<{ exp: number }>(token) : token

    if (!decoded.exp) {
      return -1
    }

    const now = Math.floor(Date.now() / 1000)
    return decoded.exp - now
  } catch {
    return -1
  }
}

/**
 * Validate token structure and expiry
 *
 * @param token - JWT string
 * @returns Validation result with details
 */
export function validateToken(token: string): TokenValidation {
  try {
    const decoded = decodeJWT<{ exp: number }>(token)

    const expired = isTokenExpired(token)
    const expiresIn = getTimeUntilExpiry(decoded)

    return {
      valid: !expired,
      expired,
      expiresIn,
    }
  } catch (error) {
    return {
      valid: false,
      expired: true,
      expiresIn: -1,
      error: error instanceof Error ? error.message : 'Invalid token',
    }
  }
}

/**
 * Check if token needs refresh
 *
 * @param token - JWT string or decoded token
 * @param refreshBeforeSeconds - Refresh when less than N seconds left (default: 300 = 5 min)
 * @returns true if token should be refreshed
 */
export function shouldRefreshToken(
  token: string | { exp: number },
  refreshBeforeSeconds: number = 300
): boolean {
  const expiresIn = getTimeUntilExpiry(token)
  return expiresIn > 0 && expiresIn < refreshBeforeSeconds
}

// ============================================
// USER EXTRACTION
// ============================================

/**
 * Extended token payload for local auth tokens
 * Includes tenant-specific claims
 */
interface LocalAuthToken extends KeycloakAccessToken {
  // Local auth specific claims
  id?: string // User ID (local auth uses 'id' instead of 'sub')
  tenant?: string // Tenant ID
  role?: string // Tenant role
  permissions?: string[] // Granular permissions
  tenants?: Array<{
    tenant_id: string
    tenant_slug?: string
    role: string
  }>
}

/**
 * Extract user information from access token
 * Supports both Keycloak and local auth tokens
 *
 * @param accessToken - JWT access token string
 * @returns AuthUser object
 */
export function extractUser(accessToken: string): AuthUser {
  const decoded = decodeJWT<LocalAuthToken>(accessToken)

  // Extract realm roles (Keycloak)
  const realmRoles = decoded.realm_access?.roles || []

  // Extract all client roles (Keycloak)
  const clientRoles: Record<string, string[]> = {}
  let allClientRoles: string[] = []

  if (decoded.resource_access) {
    Object.entries(decoded.resource_access).forEach(([clientId, access]) => {
      clientRoles[clientId] = access.roles || []
      allClientRoles = [...allClientRoles, ...clientRoles[clientId]]
    })
  }

  // Combine all roles
  const allRoles = [...new Set([...realmRoles, ...allClientRoles])]

  // Extract permissions (from local auth tokens)
  const permissions = decoded.permissions || []

  // Get user ID (local auth uses 'id', Keycloak uses 'sub')
  const userId = decoded.id || decoded.sub

  return {
    id: userId,
    email: decoded.email || '',
    name: decoded.name || decoded.preferred_username || '',
    username: decoded.preferred_username || decoded.email || '',
    emailVerified: decoded.email_verified || false,
    roles: allRoles,
    realmRoles,
    clientRoles,
    permissions,
    tenantId: decoded.tenant,
    tenantRole: decoded.role,
  }
}

// ============================================
// ROLE CHECKING
// ============================================

/**
 * Check if user has specific role(s)
 *
 * @param user - AuthUser object
 * @param roles - Role or array of roles to check
 * @param requireAll - If true, user must have ALL roles. If false, ANY role is sufficient
 * @returns true if user has required role(s)
 *
 * @example
 * // Check single role
 * hasRole(user, 'admin')
 *
 * // Check multiple roles (ANY)
 * hasRole(user, ['admin', 'moderator'])
 *
 * // Check multiple roles (ALL)
 * hasRole(user, ['admin', 'superuser'], true)
 */
export function hasRole(
  user: AuthUser,
  roles: string | string[],
  requireAll: boolean = false
): boolean {
  const rolesToCheck = Array.isArray(roles) ? roles : [roles]

  if (requireAll) {
    return rolesToCheck.every(role => user.roles.includes(role))
  }

  return rolesToCheck.some(role => user.roles.includes(role))
}

/**
 * Check if user has specific realm role(s)
 */
export function hasRealmRole(
  user: AuthUser,
  roles: string | string[],
  requireAll: boolean = false
): boolean {
  const rolesToCheck = Array.isArray(roles) ? roles : [roles]

  if (requireAll) {
    return rolesToCheck.every(role => user.realmRoles.includes(role))
  }

  return rolesToCheck.some(role => user.realmRoles.includes(role))
}

/**
 * Check if user has specific client role(s)
 */
export function hasClientRole(
  user: AuthUser,
  clientId: string,
  roles: string | string[],
  requireAll: boolean = false
): boolean {
  const clientRoles = user.clientRoles[clientId] || []
  const rolesToCheck = Array.isArray(roles) ? roles : [roles]

  if (requireAll) {
    return rolesToCheck.every(role => clientRoles.includes(role))
  }

  return rolesToCheck.some(role => clientRoles.includes(role))
}

// ============================================
// TOKEN INFO EXTRACTION
// ============================================

/**
 * Get token subject (user ID)
 */
export function getTokenSubject(token: string): string {
  const decoded = decodeJWT<{ sub: string }>(token)
  return decoded.sub
}

/**
 * Get token issuer
 */
export function getTokenIssuer(token: string): string {
  const decoded = decodeJWT<{ iss: string }>(token)
  return decoded.iss
}

/**
 * Get token expiration as Date object
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = decodeJWT<{ exp: number }>(token)
    if (!decoded.exp) return null
    return new Date(decoded.exp * 1000)
  } catch {
    return null
  }
}

/**
 * Get token issuance time as Date object
 */
export function getTokenIssuedAt(token: string): Date | null {
  try {
    const decoded = decodeJWT<{ iat: number }>(token)
    if (!decoded.iat) return null
    return new Date(decoded.iat * 1000)
  } catch {
    return null
  }
}

// ============================================
// DEBUGGING
// ============================================

/**
 * Get human-readable token info (for debugging)
 */
export function getTokenInfo(token: string): {
  valid: boolean
  expired: boolean
  expiresIn: number
  expiresAt: Date | null
  issuedAt: Date | null
  subject: string | null
  issuer: string | null
} {
  try {
    const validation = validateToken(token)
    const expiresAt = getTokenExpiration(token)
    const issuedAt = getTokenIssuedAt(token)
    const subject = getTokenSubject(token)
    const issuer = getTokenIssuer(token)

    return {
      valid: validation.valid,
      expired: validation.expired,
      expiresIn: validation.expiresIn,
      expiresAt,
      issuedAt,
      subject,
      issuer,
    }
  } catch {
    return {
      valid: false,
      expired: true,
      expiresIn: -1,
      expiresAt: null,
      issuedAt: null,
      subject: null,
      issuer: null,
    }
  }
}

/**
 * Pretty print token info to console (development only)
 */
export function debugToken(token: string, label: string = 'Token'): void {
  if (process.env.NODE_ENV !== 'development') return

  console.group(`🔐 ${label} Debug Info`)

  try {
    const decoded = decodeJWT(token)
    const info = getTokenInfo(token)

    console.log('Valid:', info.valid)
    console.log('Expired:', info.expired)
    console.log('Expires in:', `${info.expiresIn}s (${Math.floor(info.expiresIn / 60)}m)`)
    console.log('Expires at:', info.expiresAt?.toLocaleString())
    console.log('Issued at:', info.issuedAt?.toLocaleString())
    console.log('Subject:', info.subject)
    console.log('Issuer:', info.issuer)
    console.log('\nFull payload:', decoded)
  } catch (error) {
    console.error('Failed to decode token:', error)
  }

  console.groupEnd()
}
