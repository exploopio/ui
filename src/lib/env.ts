/**
 * Environment Variables Configuration
 *
 * This file provides type-safe access to environment variables.
 * Validation is conditional based on auth provider setting.
 *
 * Variable naming conventions:
 * - NEXT_PUBLIC_* : Accessible in both client and server code
 * - No prefix     : Server-only (API routes, Server Actions, Server Components)
 */

/**
 * Check if we're in Docker build mode (skip validation)
 */
const isDockerBuild = process.env.DOCKER_BUILD === 'true' || process.env.CI === 'true'

/**
 * Gets an environment variable with optional default
 * @param key - Environment variable name
 * @param defaultValue - Optional default value
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key]

  // During Docker build or CI, return default or empty
  if (isDockerBuild) {
    return value || defaultValue || ''
  }

  // Return value or default (no warnings for optional vars)
  return value || defaultValue || ''
}

/**
 * Gets a required environment variable (warns if missing)
 */
function _getRequiredEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key]

  if (isDockerBuild) {
    return value || defaultValue || ''
  }

  if (!value && !defaultValue) {
    // On client side, return empty string silently
    if (typeof window !== 'undefined') {
      return ''
    }
    // On server side, warn
    console.warn(`Warning: Missing environment variable: ${key}`)
    return ''
  }

  return value || defaultValue || ''
}

// ============================================
// PUBLIC ENVIRONMENT VARIABLES
// (Accessible from both client and server)
// ============================================

/**
 * Auth provider type
 * - local: Built-in email/password authentication
 * - oidc: Keycloak/OIDC authentication only
 * - hybrid: Both local and OIDC available
 */
export type AuthProvider = 'local' | 'oidc' | 'hybrid'

export const env = {
  // Auth Provider Configuration
  authProvider: getEnvVar('NEXT_PUBLIC_AUTH_PROVIDER', 'local') as AuthProvider,

  // API Configuration - Single source of truth for backend API URL
  api: {
    /** Backend API URL (e.g., http://localhost:8080) - Server-side only */
    url: getEnvVar('BACKEND_API_URL', 'http://localhost:8080'),
    /** Request timeout in milliseconds */
    timeout: parseInt(getEnvVar('API_TIMEOUT', '30000'), 10),
  },

  // Keycloak Configuration (only used when authProvider is 'oidc' or 'hybrid')
  keycloak: {
    url: getEnvVar('NEXT_PUBLIC_KEYCLOAK_URL', ''),
    realm: getEnvVar('NEXT_PUBLIC_KEYCLOAK_REALM', ''),
    clientId: getEnvVar('NEXT_PUBLIC_KEYCLOAK_CLIENT_ID', ''),
    redirectUri: getEnvVar('NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI', ''),
  },

  // Token Storage Configuration
  auth: {
    cookieName: getEnvVar('NEXT_PUBLIC_AUTH_COOKIE_NAME', 'rediver_auth_token'),
    // Must match backend RefreshTokenCookieName in cookie.go
    refreshCookieName: getEnvVar('NEXT_PUBLIC_REFRESH_COOKIE_NAME', 'refresh_token'),
  },

  // OAuth Configuration (for social login)
  oauth: {
    /** Frontend callback URL for OAuth providers */
    callbackUrl: getEnvVar('NEXT_PUBLIC_OAUTH_CALLBACK_URL', ''),
  },

  // Application
  app: {
    url: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    env: getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  },
} as const

// ============================================
// SERVER-ONLY ENVIRONMENT VARIABLES
// (Only accessible on server side)
// ============================================

export const serverEnv = {
  // Keycloak secrets (only needed for OIDC)
  keycloak: {
    clientSecret: getEnvVar('KEYCLOAK_CLIENT_SECRET', ''),
  },

  // Security
  security: {
    secureCookies: getEnvVar('SECURE_COOKIES', 'false') === 'true',
    csrfSecret: getEnvVar('CSRF_SECRET', ''),
  },

  // Token management
  token: {
    cookieMaxAge: parseInt(getEnvVar('COOKIE_MAX_AGE', '604800'), 10),
    enableRefresh: getEnvVar('ENABLE_TOKEN_REFRESH', 'true') === 'true',
    refreshBeforeExpiry: parseInt(getEnvVar('TOKEN_REFRESH_BEFORE_EXPIRY', '300'), 10),
  },
} as const

// ============================================
// VALIDATION (Conditional based on auth provider)
// ============================================

/**
 * Validates environment variables based on configured auth provider
 * Call this in next.config.ts to fail fast on missing vars
 */
export function validateEnv() {
  // Skip validation during Docker build or CI
  if (isDockerBuild) {
    console.log('⏭️  Skipping env validation (Docker/CI build)')
    return
  }

  const warnings: string[] = []
  const authProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'local'

  // Always required: Backend API URL (server-side only)
  if (!process.env.BACKEND_API_URL) {
    warnings.push('BACKEND_API_URL is not set (using default: http://localhost:8080)')
  }

  // Only validate Keycloak vars if OIDC is enabled
  if (authProvider === 'oidc' || authProvider === 'hybrid') {
    const requiredKeycloakVars = [
      'NEXT_PUBLIC_KEYCLOAK_URL',
      'NEXT_PUBLIC_KEYCLOAK_REALM',
      'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
    ]

    const missingKeycloak = requiredKeycloakVars.filter(key => !process.env[key])
    if (missingKeycloak.length > 0) {
      warnings.push(
        `Missing Keycloak configuration (required for ${authProvider} auth):\n` +
        missingKeycloak.map(k => `   - ${k}`).join('\n')
      )
    }

    // Server-side Keycloak secret
    if (!process.env.KEYCLOAK_CLIENT_SECRET) {
      warnings.push('KEYCLOAK_CLIENT_SECRET is not set (required for OIDC server-side operations)')
    }
  }

  // CSRF secret warning (recommended for production)
  const csrfSecret = process.env.CSRF_SECRET
  if (!csrfSecret) {
    warnings.push('CSRF_SECRET is not set (recommended for security)')
  } else if (csrfSecret.length < 32) {
    warnings.push(
      `CSRF_SECRET should be at least 32 characters (current: ${csrfSecret.length})\n` +
      `   Generate with: openssl rand -base64 32`
    )
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn(
      `\n${'─'.repeat(60)}\n` +
      `⚠️  Environment Configuration Warnings\n` +
      `${'─'.repeat(60)}\n\n` +
      warnings.map((w, i) => `${i + 1}. ${w}`).join('\n\n') +
      `\n\n${'─'.repeat(60)}\n`
    )
  } else {
    console.log('✅ Environment variables validated successfully')
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Check if running in production */
export const isProduction = () => env.app.env === 'production'

/** Check if running in development */
export const isDevelopment = () => env.app.env === 'development'

/** Check if running on server side */
export const isServer = () => typeof window === 'undefined'

/** Check if running on client side */
export const isClient = () => typeof window !== 'undefined'

/** Check if local auth is enabled */
export const isLocalAuthEnabled = () => env.authProvider === 'local' || env.authProvider === 'hybrid'

/** Check if OIDC (Keycloak) auth is enabled */
export const isOidcAuthEnabled = () => env.authProvider === 'oidc' || env.authProvider === 'hybrid'

/** Check if only local auth is enabled */
export const isLocalAuthOnly = () => env.authProvider === 'local'

/** Check if only OIDC auth is enabled */
export const isOidcAuthOnly = () => env.authProvider === 'oidc'

// ============================================
// TYPE EXPORTS
// ============================================

export type Env = typeof env
export type ServerEnv = typeof serverEnv
