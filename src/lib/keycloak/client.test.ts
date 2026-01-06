/**
 * Keycloak Client Utilities Tests
 *
 * Tests for client-side Keycloak OAuth2/OIDC functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getKeycloakUrls,
  generateState,
  generateNonce,
  buildAuthorizationUrl,
  buildLogoutUrl,
  redirectToLogin,
  redirectToRegister,
  redirectToLogout,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchUserInfo,
  validateState,
  getReturnUrl,
  isKeycloakError,
  formatKeycloakError,
  isOAuthCallback,
  getCallbackParams,
} from './client'

// ============================================
// MOCKS
// ============================================

// Mock env
vi.mock('../env', () => ({
  env: {
    keycloak: {
      url: 'http://localhost:8080',
      realm: 'test-realm',
      clientId: 'test-client',
      redirectUri: 'http://localhost:3000/auth/callback',
    },
    app: {
      url: 'http://localhost:3000',
    },
  },
}))

// Mock global objects
const mockSessionStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('sessionStorage', mockSessionStorage)
  vi.stubGlobal('fetch', mockFetch)
  vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => 'mock-uuid-123'),
  })

  // Mock window.location
  delete (globalThis as any).window
  ;(globalThis as any).window = {
    location: {
      href: 'http://localhost:3000',
      search: '',
      origin: 'http://localhost:3000',
    },
  }

  mockSessionStorage.clear()
  mockFetch.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ============================================
// KEYCLOAK URLS TESTS
// ============================================

describe('Keycloak URLs', () => {
  describe('getKeycloakUrls', () => {
    it('should build correct Keycloak endpoint URLs', () => {
      const urls = getKeycloakUrls()

      expect(urls.authorization).toBe('http://localhost:8080/realms/test-realm/protocol/openid-connect/auth')
      expect(urls.token).toBe('http://localhost:8080/realms/test-realm/protocol/openid-connect/token')
      expect(urls.userInfo).toBe('http://localhost:8080/realms/test-realm/protocol/openid-connect/userinfo')
      expect(urls.logout).toBe('http://localhost:8080/realms/test-realm/protocol/openid-connect/logout')
      expect(urls.jwks).toBe('http://localhost:8080/realms/test-realm/protocol/openid-connect/certs')
      expect(urls.introspection).toBe('http://localhost:8080/realms/test-realm/protocol/openid-connect/token/introspect')
      expect(urls.revocation).toBe('http://localhost:8080/realms/test-realm/protocol/openid-connect/revoke')
    })
  })
})

// ============================================
// STATE & NONCE GENERATION TESTS
// ============================================

describe('State and Nonce Generation', () => {
  describe('generateState', () => {
    it('should generate a state string', () => {
      const state = generateState()

      expect(state).toBe('mock-uuid-123')
      expect(crypto.randomUUID).toHaveBeenCalled()
    })
  })

  describe('generateNonce', () => {
    it('should generate a nonce string', () => {
      const nonce = generateNonce()

      expect(nonce).toBe('mock-uuid-123')
      expect(crypto.randomUUID).toHaveBeenCalled()
    })
  })
})

// ============================================
// AUTHORIZATION URL BUILDING TESTS
// ============================================

describe('Authorization URL Building', () => {
  describe('buildAuthorizationUrl', () => {
    it('should build authorization URL with default parameters', () => {
      const url = buildAuthorizationUrl()

      expect(url).toContain('http://localhost:8080/realms/test-realm/protocol/openid-connect/auth')
      expect(url).toContain('response_type=code')
      expect(url).toContain('client_id=test-client')
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback')
      expect(url).toContain('scope=openid+profile+email')
      expect(url).toContain('state=mock-uuid-123')
      expect(url).toContain('nonce=mock-uuid-123')
    })

    it('should accept custom parameters', () => {
      const url = buildAuthorizationUrl({
        scope: 'openid email',
        state: 'custom-state',
        prompt: 'login',
      })

      expect(url).toContain('scope=openid+email')
      expect(url).toContain('state=custom-state')
      expect(url).toContain('prompt=login')
    })

    it('should filter out undefined parameters', () => {
      const url = buildAuthorizationUrl({
        prompt: undefined,
      })

      expect(url).not.toContain('prompt')
    })
  })

  describe('buildLogoutUrl', () => {
    it('should build logout URL with default redirect', () => {
      const url = buildLogoutUrl()

      expect(url).toContain('http://localhost:8080/realms/test-realm/protocol/openid-connect/logout')
      expect(url).toContain('post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3000')
    })

    it('should include custom post_logout_redirect_uri', () => {
      const url = buildLogoutUrl(undefined, 'http://example.com/logout')

      expect(url).toContain('post_logout_redirect_uri=http%3A%2F%2Fexample.com%2Flogout')
    })

    it('should include id_token_hint when access token provided', () => {
      const url = buildLogoutUrl('mock-access-token')

      expect(url).toContain('id_token_hint=mock-access-token')
    })
  })
})

// ============================================
// REDIRECT FUNCTIONS TESTS
// ============================================

describe('Redirect Functions', () => {
  describe('redirectToLogin', () => {
    it('should store state in sessionStorage', () => {
      redirectToLogin()

      expect(sessionStorage.getItem('keycloak_state')).toBe('mock-uuid-123')
    })

    it('should store return URL if provided', () => {
      redirectToLogin('/dashboard')

      expect(sessionStorage.getItem('keycloak_return_url')).toBe('/dashboard')
    })

    it('should redirect to authorization URL', () => {
      redirectToLogin()

      expect(window.location.href).toContain('http://localhost:8080/realms/test-realm/protocol/openid-connect/auth')
    })
  })

  describe('redirectToRegister', () => {
    it('should store state in sessionStorage', () => {
      redirectToRegister()

      expect(sessionStorage.getItem('keycloak_state')).toBe('mock-uuid-123')
    })

    it('should redirect with kc_action=REGISTER parameter', () => {
      redirectToRegister()

      expect(window.location.href).toContain('kc_action=REGISTER')
      expect(window.location.href).toContain('prompt=login')
    })
  })

  describe('redirectToLogout', () => {
    beforeEach(() => {
      sessionStorage.setItem('keycloak_state', 'test-state')
      sessionStorage.setItem('keycloak_return_url', '/dashboard')
    })

    it('should clear sessionStorage', () => {
      redirectToLogout()

      expect(sessionStorage.getItem('keycloak_state')).toBeNull()
      expect(sessionStorage.getItem('keycloak_return_url')).toBeNull()
    })

    it('should redirect to logout URL', () => {
      redirectToLogout()

      expect(window.location.href).toContain('http://localhost:8080/realms/test-realm/protocol/openid-connect/logout')
    })

    it('should include custom redirect URI', () => {
      redirectToLogout({ post_logout_redirect_uri: 'http://example.com' })

      expect(window.location.href).toContain('post_logout_redirect_uri=http%3A%2F%2Fexample.com')
    })

    it('should use default app URL if no redirect specified', () => {
      redirectToLogout()

      expect(window.location.href).toContain('post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3000')
    })
  })
})

// ============================================
// TOKEN MANAGEMENT TESTS
// ============================================

describe('Token Management', () => {
  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens successfully', async () => {
      const mockTokenResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        id_token: 'mock-id-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })

      const result = await exchangeCodeForTokens('auth-code-123')

      expect(result).toEqual(mockTokenResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/realms/test-realm/protocol/openid-connect/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      )
    })

    it('should throw error on failed token exchange', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code',
        }),
      })

      await expect(exchangeCodeForTokens('invalid-code')).rejects.toThrow('Invalid authorization code')
    })

    it('should handle generic error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'server_error',
        }),
      })

      await expect(exchangeCodeForTokens('code')).rejects.toThrow('server_error')
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockTokenResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })

      const result = await refreshAccessToken('old-refresh-token')

      expect(result).toEqual(mockTokenResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/realms/test-realm/protocol/openid-connect/token',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should throw error on failed refresh', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Refresh token expired',
        }),
      })

      await expect(refreshAccessToken('expired-token')).rejects.toThrow('Refresh token expired')
    })
  })

  describe('fetchUserInfo', () => {
    it('should fetch user info successfully', async () => {
      const mockUserInfo = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserInfo,
      })

      const result = await fetchUserInfo('access-token')

      expect(result).toEqual(mockUserInfo)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/realms/test-realm/protocol/openid-connect/userinfo',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer access-token',
          },
        })
      )
    })

    it('should throw error on failed fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_token',
          error_description: 'Token is not active',
        }),
      })

      await expect(fetchUserInfo('invalid-token')).rejects.toThrow('Token is not active')
    })
  })
})

// ============================================
// STATE VALIDATION TESTS
// ============================================

describe('State Validation', () => {
  describe('validateState', () => {
    it('should return true for valid state', () => {
      sessionStorage.setItem('keycloak_state', 'test-state-123')

      const isValid = validateState('test-state-123')

      expect(isValid).toBe(true)
      expect(sessionStorage.getItem('keycloak_state')).toBeNull() // Should be cleared
    })

    it('should return false for invalid state', () => {
      sessionStorage.setItem('keycloak_state', 'test-state-123')

      const isValid = validateState('wrong-state')

      expect(isValid).toBe(false)
      expect(sessionStorage.getItem('keycloak_state')).toBe('test-state-123') // Should not be cleared
    })

    it('should return false if no state in storage', () => {
      const isValid = validateState('any-state')

      expect(isValid).toBe(false)
    })

    it('should return false for null state', () => {
      sessionStorage.setItem('keycloak_state', 'test-state-123')

      const isValid = validateState(null)

      expect(isValid).toBe(false)
    })
  })

  describe('getReturnUrl', () => {
    it('should return stored URL and clear it', () => {
      sessionStorage.setItem('keycloak_return_url', '/dashboard')

      const returnUrl = getReturnUrl()

      expect(returnUrl).toBe('/dashboard')
      expect(sessionStorage.getItem('keycloak_return_url')).toBeNull()
    })

    it('should return null if no URL stored', () => {
      const returnUrl = getReturnUrl()

      expect(returnUrl).toBeNull()
    })
  })
})

// ============================================
// ERROR HANDLING TESTS
// ============================================

describe('Error Handling', () => {
  describe('isKeycloakError', () => {
    it('should identify Keycloak error objects', () => {
      const keycloakError = {
        error: 'invalid_grant',
        error_description: 'Invalid credentials',
      }

      expect(isKeycloakError(keycloakError)).toBe(true)
    })

    it('should reject non-Keycloak errors', () => {
      expect(isKeycloakError(new Error('Regular error'))).toBe(false)
      expect(isKeycloakError('string error')).toBe(false)
      expect(isKeycloakError(null)).toBe(false)
      expect(isKeycloakError(undefined)).toBe(false)
      expect(isKeycloakError({})).toBe(false)
    })
  })

  describe('formatKeycloakError', () => {
    it('should format Keycloak error with description', () => {
      const error = {
        error: 'invalid_grant',
        error_description: 'Invalid credentials',
      }

      expect(formatKeycloakError(error)).toBe('Invalid credentials')
    })

    it('should format Keycloak error without description', () => {
      const error = {
        error: 'server_error',
      }

      expect(formatKeycloakError(error)).toBe('server_error')
    })

    it('should format regular Error objects', () => {
      const error = new Error('Something went wrong')

      expect(formatKeycloakError(error)).toBe('Something went wrong')
    })

    it('should handle unknown errors', () => {
      expect(formatKeycloakError('string error')).toBe('An unknown error occurred')
      expect(formatKeycloakError(null)).toBe('An unknown error occurred')
      expect(formatKeycloakError(undefined)).toBe('An unknown error occurred')
    })
  })
})

// ============================================
// HELPER FUNCTIONS TESTS
// ============================================

describe('Helper Functions', () => {
  describe('isOAuthCallback', () => {
    it('should return true if code parameter exists', () => {
      window.location.search = '?code=auth-code-123&state=state-123'

      expect(isOAuthCallback()).toBe(true)
    })

    it('should return true if error parameter exists', () => {
      window.location.search = '?error=access_denied&error_description=User+denied+access'

      expect(isOAuthCallback()).toBe(true)
    })

    it('should return false if no OAuth parameters', () => {
      window.location.search = '?foo=bar'

      expect(isOAuthCallback()).toBe(false)
    })

    it('should return false if window is undefined (SSR)', () => {
      delete (globalThis as any).window

      expect(isOAuthCallback()).toBe(false)
    })
  })

  describe('getCallbackParams', () => {
    it('should extract all callback parameters', () => {
      window.location.search = '?code=auth-code&state=state-123&session_state=session-123'

      const params = getCallbackParams()

      expect(params.code).toBe('auth-code')
      expect(params.state).toBe('state-123')
      expect(params.error).toBeNull()
      expect(params.error_description).toBeNull()
    })

    it('should extract error parameters', () => {
      window.location.search = '?error=access_denied&error_description=User+denied+access&state=state-123'

      const params = getCallbackParams()

      expect(params.code).toBeNull()
      expect(params.state).toBe('state-123')
      expect(params.error).toBe('access_denied')
      expect(params.error_description).toBe('User denied access')
    })

    it('should return null values if no parameters', () => {
      window.location.search = ''

      const params = getCallbackParams()

      expect(params.code).toBeNull()
      expect(params.state).toBeNull()
      expect(params.error).toBeNull()
      expect(params.error_description).toBeNull()
    })

    it('should return null values if window is undefined (SSR)', () => {
      delete (globalThis as any).window

      const params = getCallbackParams()

      expect(params.code).toBeNull()
      expect(params.state).toBeNull()
      expect(params.error).toBeNull()
      expect(params.error_description).toBeNull()
    })
  })
})
