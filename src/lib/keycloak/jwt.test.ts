/**
 * JWT Utility Functions Tests
 *
 * Comprehensive tests for JWT decoding, validation, and user extraction
 */

import { describe, it, expect, vi } from 'vitest'
import {
  decodeJWT,
  decodeAccessToken,
  decodeRefreshToken,
  decodeIDToken,
  isTokenExpired,
  getTimeUntilExpiry,
  validateToken,
  shouldRefreshToken,
  extractUser,
  hasRole,
  hasRealmRole,
  hasClientRole,
  getTokenSubject,
  getTokenIssuer,
  getTokenExpiration,
  getTokenIssuedAt,
  getTokenInfo,
  debugToken,
} from './jwt'

// ============================================
// MOCK JWT TOKENS
// ============================================

// Helper to create JWT token
function createMockJWT(payload: Record<string, unknown>): string {
  const header = { alg: 'RS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signature = 'mock-signature'

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

const now = Math.floor(Date.now() / 1000)

const validAccessTokenPayload = {
  sub: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  preferred_username: 'testuser',
  email_verified: true,
  exp: now + 3600, // Expires in 1 hour
  iat: now,
  iss: 'http://localhost:8080/realms/test',
  realm_access: {
    roles: ['user', 'admin'],
  },
  resource_access: {
    'test-client': {
      roles: ['view', 'edit'],
    },
    'other-client': {
      roles: ['read'],
    },
  },
}

const expiredTokenPayload = {
  sub: 'user-123',
  email: 'test@example.com',
  exp: now - 3600, // Expired 1 hour ago
  iat: now - 7200,
}

const tokenWithoutExpPayload = {
  sub: 'user-123',
  email: 'test@example.com',
  iat: now,
}

// ============================================
// JWT DECODING TESTS
// ============================================

describe('JWT Decoding', () => {
  describe('decodeJWT', () => {
    it('should decode valid JWT token', () => {
      const token = createMockJWT({ foo: 'bar', num: 123 })
      const decoded = decodeJWT(token)

      expect(decoded).toEqual({ foo: 'bar', num: 123 })
    })

    it('should throw error for invalid JWT format (missing parts)', () => {
      expect(() => decodeJWT('invalid.token')).toThrow('Invalid JWT format')
    })

    it('should throw error for invalid JWT format (too many parts)', () => {
      expect(() => decodeJWT('one.two.three.four')).toThrow('Invalid JWT format')
    })

    it('should throw error for invalid base64 encoding', () => {
      expect(() => decodeJWT('header.!!invalid!!.signature')).toThrow('Failed to decode JWT')
    })

    it('should handle tokens with base64url encoding', () => {
      const payload = { test: 'with-special_chars' }
      const token = createMockJWT(payload)
      const decoded = decodeJWT(token)

      expect(decoded).toMatchObject(payload)
    })
  })

  describe('decodeAccessToken', () => {
    it('should decode access token', () => {
      const token = createMockJWT(validAccessTokenPayload)
      const decoded = decodeAccessToken(token)

      expect(decoded.sub).toBe('user-123')
      expect(decoded.email).toBe('test@example.com')
      expect(decoded.realm_access?.roles).toContain('user')
    })
  })

  describe('decodeRefreshToken', () => {
    it('should decode refresh token', () => {
      const payload = { sub: 'user-123', typ: 'Refresh', exp: now + 7200 }
      const token = createMockJWT(payload)
      const decoded = decodeRefreshToken(token)

      expect(decoded.sub).toBe('user-123')
      expect(decoded.typ).toBe('Refresh')
    })
  })

  describe('decodeIDToken', () => {
    it('should decode ID token', () => {
      const payload = { sub: 'user-123', name: 'Test User', email: 'test@example.com' }
      const token = createMockJWT(payload)
      const decoded = decodeIDToken(token)

      expect(decoded.sub).toBe('user-123')
      expect(decoded.name).toBe('Test User')
    })
  })
})

// ============================================
// TOKEN VALIDATION TESTS
// ============================================

describe('Token Validation', () => {
  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = createMockJWT({ exp: now + 3600 })
      expect(isTokenExpired(token)).toBe(false)
    })

    it('should return true for expired token', () => {
      const token = createMockJWT(expiredTokenPayload)
      expect(isTokenExpired(token)).toBe(true)
    })

    it('should return true for token without exp claim', () => {
      const token = createMockJWT(tokenWithoutExpPayload)
      expect(isTokenExpired(token)).toBe(true)
    })

    it('should respect buffer seconds', () => {
      const token = createMockJWT({ exp: now + 20 }) // Expires in 20 seconds

      expect(isTokenExpired(token, 10)).toBe(false) // 10 second buffer
      expect(isTokenExpired(token, 30)).toBe(true)  // 30 second buffer
    })

    it('should return true for invalid token string', () => {
      expect(isTokenExpired('invalid-token')).toBe(true)
    })

    it('should accept decoded token object', () => {
      const decoded = { exp: now + 3600 }
      expect(isTokenExpired(decoded)).toBe(false)
    })
  })

  describe('getTimeUntilExpiry', () => {
    it('should return positive seconds for valid token', () => {
      const token = createMockJWT({ exp: now + 3600 })
      const timeLeft = getTimeUntilExpiry(token)

      expect(timeLeft).toBeGreaterThan(3500)
      expect(timeLeft).toBeLessThanOrEqual(3600)
    })

    it('should return negative seconds for expired token', () => {
      const token = createMockJWT({ exp: now - 3600 })
      const timeLeft = getTimeUntilExpiry(token)

      expect(timeLeft).toBeLessThan(0)
    })

    it('should return -1 for token without exp', () => {
      const token = createMockJWT(tokenWithoutExpPayload)
      expect(getTimeUntilExpiry(token)).toBe(-1)
    })

    it('should return -1 for invalid token', () => {
      expect(getTimeUntilExpiry('invalid-token')).toBe(-1)
    })

    it('should accept decoded token object', () => {
      const decoded = { exp: now + 3600 }
      const timeLeft = getTimeUntilExpiry(decoded)

      expect(timeLeft).toBeGreaterThan(3500)
    })
  })

  describe('validateToken', () => {
    it('should validate valid token', () => {
      const token = createMockJWT({ exp: now + 3600 })
      const validation = validateToken(token)

      expect(validation.valid).toBe(true)
      expect(validation.expired).toBe(false)
      expect(validation.expiresIn).toBeGreaterThan(3500)
      expect(validation.error).toBeUndefined()
    })

    it('should invalidate expired token', () => {
      const token = createMockJWT(expiredTokenPayload)
      const validation = validateToken(token)

      expect(validation.valid).toBe(false)
      expect(validation.expired).toBe(true)
      expect(validation.expiresIn).toBeLessThan(0)
    })

    it('should handle invalid token with error', () => {
      const validation = validateToken('invalid-token')

      expect(validation.valid).toBe(false)
      expect(validation.expired).toBe(true)
      expect(validation.expiresIn).toBe(-1)
      expect(validation.error).toBeDefined()
    })
  })

  describe('shouldRefreshToken', () => {
    it('should return false for token with plenty of time left', () => {
      const token = createMockJWT({ exp: now + 3600 }) // 1 hour left
      expect(shouldRefreshToken(token, 300)).toBe(false) // Refresh at 5 min
    })

    it('should return true for token nearing expiry', () => {
      const token = createMockJWT({ exp: now + 200 }) // 200 seconds left
      expect(shouldRefreshToken(token, 300)).toBe(true) // Refresh at 5 min
    })

    it('should return false for already expired token', () => {
      const token = createMockJWT({ exp: now - 100 })
      expect(shouldRefreshToken(token)).toBe(false)
    })

    it('should use custom refresh threshold', () => {
      const token = createMockJWT({ exp: now + 500 })

      expect(shouldRefreshToken(token, 600)).toBe(true)
      expect(shouldRefreshToken(token, 400)).toBe(false)
    })

    it('should accept decoded token object', () => {
      const decoded = { exp: now + 200 }
      expect(shouldRefreshToken(decoded, 300)).toBe(true)
    })
  })
})

// ============================================
// USER EXTRACTION TESTS
// ============================================

describe('User Extraction', () => {
  describe('extractUser', () => {
    it('should extract complete user information', () => {
      const token = createMockJWT(validAccessTokenPayload)
      const user = extractUser(token)

      expect(user.id).toBe('user-123')
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
      expect(user.username).toBe('testuser')
      expect(user.emailVerified).toBe(true)
    })

    it('should extract realm roles', () => {
      const token = createMockJWT(validAccessTokenPayload)
      const user = extractUser(token)

      expect(user.realmRoles).toEqual(['user', 'admin'])
      expect(user.roles).toContain('user')
      expect(user.roles).toContain('admin')
    })

    it('should extract client roles', () => {
      const token = createMockJWT(validAccessTokenPayload)
      const user = extractUser(token)

      expect(user.clientRoles['test-client']).toEqual(['view', 'edit'])
      expect(user.clientRoles['other-client']).toEqual(['read'])
      expect(user.roles).toContain('view')
      expect(user.roles).toContain('edit')
      expect(user.roles).toContain('read')
    })

    it('should combine all roles without duplicates', () => {
      const payload = {
        ...validAccessTokenPayload,
        realm_access: { roles: ['user', 'admin'] },
        resource_access: {
          'client1': { roles: ['user', 'view'] }, // 'user' is duplicate
          'client2': { roles: ['admin', 'edit'] }, // 'admin' is duplicate
        },
      }
      const token = createMockJWT(payload)
      const user = extractUser(token)

      // Should have unique roles only
      const uniqueRoles = [...new Set(user.roles)]
      expect(user.roles.length).toBe(uniqueRoles.length)
    })

    it('should handle token without realm roles', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        exp: now + 3600,
      }
      const token = createMockJWT(payload)
      const user = extractUser(token)

      expect(user.realmRoles).toEqual([])
      expect(user.roles).toEqual([])
    })

    it('should handle token without resource access', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        realm_access: { roles: ['user'] },
        exp: now + 3600,
      }
      const token = createMockJWT(payload)
      const user = extractUser(token)

      expect(user.clientRoles).toEqual({})
      expect(user.roles).toEqual(['user'])
    })

    it('should use preferred_username as username fallback', () => {
      const payload = {
        sub: 'user-123',
        preferred_username: 'myusername',
        exp: now + 3600,
      }
      const token = createMockJWT(payload)
      const user = extractUser(token)

      expect(user.username).toBe('myusername')
    })

    it('should use email as username fallback', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        exp: now + 3600,
      }
      const token = createMockJWT(payload)
      const user = extractUser(token)

      expect(user.username).toBe('test@example.com')
    })

    it('should handle missing email_verified', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        exp: now + 3600,
      }
      const token = createMockJWT(payload)
      const user = extractUser(token)

      expect(user.emailVerified).toBe(false)
    })
  })
})

// ============================================
// ROLE CHECKING TESTS
// ============================================

describe('Role Checking', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    username: 'testuser',
    emailVerified: true,
    roles: ['user', 'admin', 'moderator'],
    realmRoles: ['user', 'admin'],
    clientRoles: {
      'test-client': ['view', 'edit'],
      'other-client': ['read'],
    },
    permissions: [],
  }

  describe('hasRole', () => {
    it('should check single role (positive)', () => {
      expect(hasRole(mockUser, 'admin')).toBe(true)
    })

    it('should check single role (negative)', () => {
      expect(hasRole(mockUser, 'superadmin')).toBe(false)
    })

    it('should check multiple roles with ANY logic', () => {
      expect(hasRole(mockUser, ['admin', 'superadmin'])).toBe(true)
      expect(hasRole(mockUser, ['superadmin', 'owner'])).toBe(false)
    })

    it('should check multiple roles with ALL logic', () => {
      expect(hasRole(mockUser, ['user', 'admin'], true)).toBe(true)
      expect(hasRole(mockUser, ['user', 'superadmin'], true)).toBe(false)
    })

    it('should handle string role', () => {
      expect(hasRole(mockUser, 'moderator')).toBe(true)
    })

    it('should handle array with single role', () => {
      expect(hasRole(mockUser, ['moderator'])).toBe(true)
    })
  })

  describe('hasRealmRole', () => {
    it('should check realm role (positive)', () => {
      expect(hasRealmRole(mockUser, 'user')).toBe(true)
    })

    it('should check realm role (negative)', () => {
      expect(hasRealmRole(mockUser, 'moderator')).toBe(false) // moderator is not realm role
    })

    it('should check multiple realm roles with ANY logic', () => {
      expect(hasRealmRole(mockUser, ['user', 'superadmin'])).toBe(true)
    })

    it('should check multiple realm roles with ALL logic', () => {
      expect(hasRealmRole(mockUser, ['user', 'admin'], true)).toBe(true)
      expect(hasRealmRole(mockUser, ['user', 'moderator'], true)).toBe(false)
    })
  })

  describe('hasClientRole', () => {
    it('should check client role (positive)', () => {
      expect(hasClientRole(mockUser, 'test-client', 'view')).toBe(true)
    })

    it('should check client role (negative)', () => {
      expect(hasClientRole(mockUser, 'test-client', 'delete')).toBe(false)
    })

    it('should check multiple client roles with ANY logic', () => {
      expect(hasClientRole(mockUser, 'test-client', ['view', 'delete'])).toBe(true)
    })

    it('should check multiple client roles with ALL logic', () => {
      expect(hasClientRole(mockUser, 'test-client', ['view', 'edit'], true)).toBe(true)
      expect(hasClientRole(mockUser, 'test-client', ['view', 'delete'], true)).toBe(false)
    })

    it('should handle non-existent client', () => {
      expect(hasClientRole(mockUser, 'non-existent', 'view')).toBe(false)
    })

    it('should handle empty client roles', () => {
      const userWithoutRoles = { ...mockUser, clientRoles: {} }
      expect(hasClientRole(userWithoutRoles, 'test-client', 'view')).toBe(false)
    })
  })
})

// ============================================
// TOKEN INFO EXTRACTION TESTS
// ============================================

describe('Token Info Extraction', () => {
  describe('getTokenSubject', () => {
    it('should extract subject from token', () => {
      const token = createMockJWT({ sub: 'user-123' })
      expect(getTokenSubject(token)).toBe('user-123')
    })
  })

  describe('getTokenIssuer', () => {
    it('should extract issuer from token', () => {
      const token = createMockJWT({ iss: 'http://localhost:8080/realms/test' })
      expect(getTokenIssuer(token)).toBe('http://localhost:8080/realms/test')
    })
  })

  describe('getTokenExpiration', () => {
    it('should return expiration as Date object', () => {
      const exp = now + 3600
      const token = createMockJWT({ exp })
      const expiration = getTokenExpiration(token)

      expect(expiration).toBeInstanceOf(Date)
      expect(expiration?.getTime()).toBe(exp * 1000)
    })

    it('should return null for token without exp', () => {
      const token = createMockJWT(tokenWithoutExpPayload)
      expect(getTokenExpiration(token)).toBeNull()
    })

    it('should return null for invalid token', () => {
      expect(getTokenExpiration('invalid-token')).toBeNull()
    })
  })

  describe('getTokenIssuedAt', () => {
    it('should return issued at as Date object', () => {
      const iat = now
      const token = createMockJWT({ iat })
      const issuedAt = getTokenIssuedAt(token)

      expect(issuedAt).toBeInstanceOf(Date)
      expect(issuedAt?.getTime()).toBe(iat * 1000)
    })

    it('should return null for token without iat', () => {
      const token = createMockJWT({ sub: 'user-123' })
      expect(getTokenIssuedAt(token)).toBeNull()
    })

    it('should return null for invalid token', () => {
      expect(getTokenIssuedAt('invalid-token')).toBeNull()
    })
  })

  describe('getTokenInfo', () => {
    it('should return complete token info for valid token', () => {
      const payload = {
        sub: 'user-123',
        iss: 'http://localhost:8080/realms/test',
        exp: now + 3600,
        iat: now,
      }
      const token = createMockJWT(payload)
      const info = getTokenInfo(token)

      expect(info.valid).toBe(true)
      expect(info.expired).toBe(false)
      expect(info.expiresIn).toBeGreaterThan(3500)
      expect(info.expiresAt).toBeInstanceOf(Date)
      expect(info.issuedAt).toBeInstanceOf(Date)
      expect(info.subject).toBe('user-123')
      expect(info.issuer).toBe('http://localhost:8080/realms/test')
    })

    it('should return invalid info for expired token', () => {
      const token = createMockJWT(expiredTokenPayload)
      const info = getTokenInfo(token)

      expect(info.valid).toBe(false)
      expect(info.expired).toBe(true)
      expect(info.expiresIn).toBeLessThan(0)
    })

    it('should return default values for invalid token', () => {
      const info = getTokenInfo('invalid-token')

      expect(info.valid).toBe(false)
      expect(info.expired).toBe(true)
      expect(info.expiresIn).toBe(-1)
      expect(info.expiresAt).toBeNull()
      expect(info.issuedAt).toBeNull()
      expect(info.subject).toBeNull()
      expect(info.issuer).toBeNull()
    })
  })
})

// ============================================
// DEBUGGING TESTS
// ============================================

describe('Debugging', () => {
  describe('debugToken', () => {
    it('should not log in production', () => {
      vi.stubEnv('NODE_ENV', 'production')

      const consoleSpy = vi.spyOn(console, 'group')
      const token = createMockJWT(validAccessTokenPayload)

      debugToken(token)

      expect(consoleSpy).not.toHaveBeenCalled()

      vi.unstubAllEnvs()
    })

    it('should log in development', () => {
      vi.stubEnv('NODE_ENV', 'development')

      const consoleGroupSpy = vi.spyOn(console, 'group')
      const consoleLogSpy = vi.spyOn(console, 'log')
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd')

      const token = createMockJWT(validAccessTokenPayload)
      debugToken(token, 'Test Token')

      expect(consoleGroupSpy).toHaveBeenCalledWith('🔐 Test Token Debug Info')
      expect(consoleLogSpy).toHaveBeenCalled()
      expect(consoleGroupEndSpy).toHaveBeenCalled()

      vi.unstubAllEnvs()
    })

    it('should handle invalid token gracefully', () => {
      vi.stubEnv('NODE_ENV', 'development')

      const consoleErrorSpy = vi.spyOn(console, 'error')

      debugToken('invalid-token')

      expect(consoleErrorSpy).toHaveBeenCalled()

      vi.unstubAllEnvs()
    })
  })
})
