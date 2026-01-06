/**
 * Keycloak Authentication Library
 *
 * Complete Keycloak integration for Next.js with TypeScript
 *
 * @example
 * // Client-side login
 * import { redirectToLogin } from '@/lib/keycloak'
 * redirectToLogin('/dashboard')
 *
 * @example
 * // Decode and validate token
 * import { decodeAccessToken, isTokenExpired } from '@/lib/keycloak'
 * const user = decodeAccessToken(token)
 * if (isTokenExpired(token)) { / * refresh * / }
 *
 * @example
 * // Check user roles
 * import { extractUser, hasRole } from '@/lib/keycloak'
 * const user = extractUser(token)
 * if (hasRole(user, 'admin')) { / * show admin panel * / }
 */

// ============================================
// TYPE EXPORTS
// ============================================

export type {
  // Token types
  KeycloakTokenResponse,
  KeycloakAccessToken,
  KeycloakRefreshToken,
  KeycloakIDToken,
  // User types
  AuthUser,
  KeycloakUserInfo,
  // State types
  AuthStatus,
  AuthState,
  // API types
  KeycloakAuthParams,
  KeycloakTokenRequest,
  KeycloakLogoutParams,
  // Error types
  KeycloakError,
  AuthError,
  // Utility types
  TokenValidation,
  RoleCheckOptions,
} from './types'

// ============================================
// CLIENT FUNCTIONS
// ============================================

export {
  // URL builders
  getKeycloakUrls,
  buildAuthorizationUrl,
  // Authentication flow
  redirectToLogin,
  redirectToRegister,
  redirectToLogout,
  // Token operations
  exchangeCodeForTokens,
  fetchUserInfo,
  // State validation
  validateState,
  getReturnUrl,
  generateState,
  generateNonce,
  // Callback handling
  isOAuthCallback,
  getCallbackParams,
  clearCallbackParams,
  // Error handling
  isKeycloakError,
  formatKeycloakError,
} from './client'

// ============================================
// JWT FUNCTIONS
// ============================================

export {
  // Decoding
  decodeJWT,
  decodeAccessToken,
  decodeRefreshToken,
  decodeIDToken,
  // Validation
  isTokenExpired,
  getTimeUntilExpiry,
  validateToken,
  shouldRefreshToken,
  // User extraction
  extractUser,
  // Role checking
  hasRole,
  hasRealmRole,
  hasClientRole,
  // Token info
  getTokenSubject,
  getTokenIssuer,
  getTokenExpiration,
  getTokenIssuedAt,
  getTokenInfo,
  debugToken,
} from './jwt'
