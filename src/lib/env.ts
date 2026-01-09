/**
 * Environment Variables Configuration
 *
 * This file provides type-safe access to environment variables.
 * All env vars are validated at build time.
 *
 * Architecture: Frontend-only with Keycloak authentication
 */

/**
 * Check if we're in Docker build mode (no validation needed)
 * Docker builds pass env vars differently, so we allow empty values during build
 */
const isDockerBuild = process.env.DOCKER_BUILD === 'true' || process.env.CI === 'true'

/**
 * Gets an environment variable with validation
 * @param key - Environment variable name
 * @param defaultValue - Optional default value
 * @param isPublic - Whether this is a public (browser-accessible) variable
 */
function getEnvVar(
  key: string,
  defaultValue?: string,
  _isPublic: boolean = false // Reserved for future client-side validation
): string {
  const value = process.env[key]

  // During Docker build or CI, don't throw errors - return default or empty
  if (isDockerBuild) {
    return value || defaultValue || ''
  }

  if (!value && !defaultValue) {
    // On client side, return empty string
    if (typeof window !== 'undefined') {
      return ''
    }
    // On server side during development, warn but don't throw
    console.warn(`Warning: Missing environment variable: ${key}`)
    return ''
  }

  return value || defaultValue || ''
}

// ============================================
// PUBLIC ENVIRONMENT VARIABLES
// (Accessible from browser via NEXT_PUBLIC_ prefix)
// ============================================

export const env = {
  // Keycloak Configuration
  keycloak: {
    url: getEnvVar('NEXT_PUBLIC_KEYCLOAK_URL', '', true),
    realm: getEnvVar('NEXT_PUBLIC_KEYCLOAK_REALM', '', true),
    clientId: getEnvVar('NEXT_PUBLIC_KEYCLOAK_CLIENT_ID', '', true),
    redirectUri: getEnvVar('NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI', '', true),
  },

  // Token Storage
  auth: {
    cookieName: getEnvVar('NEXT_PUBLIC_AUTH_COOKIE_NAME', 'kc_auth_token', true),
    refreshCookieName: getEnvVar('NEXT_PUBLIC_REFRESH_COOKIE_NAME', 'kc_refresh_token', true),
  },

  // API Configuration
  api: {
    url: getEnvVar('NEXT_PUBLIC_API_URL', '', true),
    timeout: parseInt(getEnvVar('API_TIMEOUT', '30000', true), 10),
  },

  // Application
  app: {
    url: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000', true),
    env: getEnvVar('NODE_ENV', 'development', true) as 'development' | 'production' | 'test',
  },
} as const

// ============================================
// SERVER-ONLY ENVIRONMENT VARIABLES
// (Only accessible on server side)
// ============================================

export const serverEnv = {
  // Keycloak secrets
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

  // API
  api: {
    url: getEnvVar('API_URL', ''),
  },
} as const

// ============================================
// VALIDATION
// ============================================

/**
 * Validates all required environment variables at build time
 * Call this in next.config.ts to fail fast on missing vars
 * Skips validation during Docker build (DOCKER_BUILD=true)
 */
export function validateEnv() {
  // Skip validation during Docker build or CI
  if (isDockerBuild) {
    console.log('⏭️  Skipping env validation (Docker/CI build)')
    return
  }

  const errors: string[] = []

  // Check required Keycloak vars
  const requiredKeycloakVars = [
    'NEXT_PUBLIC_KEYCLOAK_URL',
    'NEXT_PUBLIC_KEYCLOAK_REALM',
    'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
  ]

  const missingKeycloak = requiredKeycloakVars.filter(key => !process.env[key])
  if (missingKeycloak.length > 0) {
    errors.push(
      `Missing Keycloak configuration:\n${missingKeycloak.map(k => `   - ${k}`).join('\n')}`
    )
  }

  // Check API URL
  if (!process.env.NEXT_PUBLIC_API_URL) {
    errors.push(`Missing NEXT_PUBLIC_API_URL`)
  }

  // Check CSRF secret
  if (!process.env.CSRF_SECRET) {
    errors.push(`Missing CSRF_SECRET`)
  } else if (process.env.CSRF_SECRET.length < 32) {
    errors.push(
      `CSRF_SECRET must be at least 32 characters long\n` +
      `   Current length: ${process.env.CSRF_SECRET.length}\n` +
      `   Generate with: openssl rand -base64 32`
    )
  }

  // Log warnings but don't throw (allow development without all vars)
  if (errors.length > 0) {
    console.warn(
      `\n${'='.repeat(60)}\n` +
      `Environment Variables Warning\n` +
      `${'='.repeat(60)}\n\n` +
      errors.map(e => `⚠️  ${e}`).join('\n\n') +
      `\n\nPlease check your .env.local file and compare with .env.example\n` +
      `${'='.repeat(60)}\n`
    )
  } else {
    console.log('Environment variables validated successfully')
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if running in production
 */
export const isProduction = () => env.app.env === 'production'

/**
 * Check if running in development
 */
export const isDevelopment = () => env.app.env === 'development'

/**
 * Check if running on server side
 */
export const isServer = () => typeof window === 'undefined'

/**
 * Check if running on client side
 */
export const isClient = () => typeof window !== 'undefined'

// ============================================
// TYPE EXPORTS
// ============================================

export type Env = typeof env
export type ServerEnv = typeof serverEnv
