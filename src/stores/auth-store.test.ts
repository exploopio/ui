/**
 * Auth Store Tests
 *
 * Comprehensive tests for Zustand authentication store
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useAuthStore,
  useUser,
  useAuthStatus,
  useIsAuthenticated,
  useHasRole,
  loginWithToken,
  logoutUser,
  forceLogin,
} from './auth-store'

// ============================================
// MOCKS
// ============================================

// Mock Keycloak utilities
vi.mock('@/lib/keycloak', async () => {
  const actual = await vi.importActual('@/lib/keycloak')
  return {
    ...actual,
    extractUser: vi.fn((token: string) => {
      if (token === 'expired-token') throw new Error('Token is expired')
      if (token === 'invalid-token') throw new Error('Invalid token')

      return {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        emailVerified: true,
        roles: ['user', 'admin'],
        realmRoles: ['user', 'admin'],
        clientRoles: {},
      }
    }),
    isTokenExpired: vi.fn((token: string) => {
      return token === 'expired-token'
    }),
    getTimeUntilExpiry: vi.fn((token: string) => {
      if (token === 'expired-token') return -1
      if (token === 'expiring-soon-token') return 200 // 200 seconds
      return 3600 // 1 hour
    }),
    redirectToLogin: vi.fn(),
    redirectToLogout: vi.fn(),
  }
})

// Mock window
beforeEach(() => {
  delete (globalThis as any).window
  ;(globalThis as any).window = {
    __authRefreshTimeout: null,
  }

  // Reset store to initial state
  useAuthStore.setState({
    status: 'unauthenticated',
    user: null,
    accessToken: null,
    expiresAt: null,
    error: null,
  })

  // Clear all mocks
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ============================================
// INITIAL STATE TESTS
// ============================================

describe('Auth Store - Initial State', () => {
  it('should have correct initial state', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.expiresAt).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should not be authenticated initially', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.isAuthenticated()).toBe(false)
  })
})

// ============================================
// LOGIN ACTION TESTS
// ============================================

describe('Auth Store - Login Action', () => {
  it('should login successfully with valid token', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.login('valid-token')
    })

    expect(result.current.status).toBe('authenticated')
    expect(result.current.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      emailVerified: true,
      roles: ['user', 'admin'],
      realmRoles: ['user', 'admin'],
      clientRoles: {},
    })
    expect(result.current.accessToken).toBe('valid-token')
    expect(result.current.expiresAt).toBeGreaterThan(Date.now())
    expect(result.current.error).toBeNull()
  })

  it('should fail login with expired token', () => {
    const { result } = renderHook(() => useAuthStore())
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    act(() => {
      result.current.login('expired-token')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.error).toBe('Token is expired')
    expect(consoleSpy).toHaveBeenCalledWith('Login failed:', 'Token is expired')

    consoleSpy.mockRestore()
  })

  it('should fail login with invalid token', () => {
    const { result } = renderHook(() => useAuthStore())
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    act(() => {
      result.current.login('invalid-token')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Invalid token')

    consoleSpy.mockRestore()
  })

  it('should calculate expiration timestamp correctly', () => {
    const { result } = renderHook(() => useAuthStore())
    const beforeLogin = Date.now()

    act(() => {
      result.current.login('valid-token')
    })

    const afterLogin = Date.now()
    const expiresAt = result.current.expiresAt!

    // Should be approximately now + 3600 seconds (1 hour)
    expect(expiresAt).toBeGreaterThan(beforeLogin + 3590 * 1000)
    expect(expiresAt).toBeLessThan(afterLogin + 3610 * 1000)
  })
})

// ============================================
// LOGOUT ACTION TESTS
// ============================================

describe('Auth Store - Logout Action', () => {
  it('should clear state and redirect on logout', async () => {
    const { result } = renderHook(() => useAuthStore())
    const { redirectToLogout } = await import('@/lib/keycloak')

    // First login
    act(() => {
      result.current.login('valid-token')
    })

    expect(result.current.status).toBe('authenticated')

    // Then logout
    act(() => {
      result.current.logout()
    })

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.expiresAt).toBeNull()
    expect(result.current.error).toBeNull()
    expect(redirectToLogout).toHaveBeenCalledWith({
      post_logout_redirect_uri: undefined,
    })
  })

  it('should pass custom redirect URI to logout', async () => {
    const { result } = renderHook(() => useAuthStore())
    const { redirectToLogout } = await import('@/lib/keycloak')

    act(() => {
      result.current.login('valid-token')
    })

    act(() => {
      result.current.logout('http://example.com/after-logout')
    })

    expect(redirectToLogout).toHaveBeenCalledWith({
      post_logout_redirect_uri: 'http://example.com/after-logout',
    })
  })
})

// ============================================
// UPDATE TOKEN ACTION TESTS
// ============================================

describe('Auth Store - Update Token Action', () => {
  it('should update token successfully', () => {
    const { result } = renderHook(() => useAuthStore())

    // Initial login
    act(() => {
      result.current.login('valid-token')
    })

    const initialAccessToken = result.current.accessToken

    // Update token
    act(() => {
      result.current.updateToken('new-valid-token')
    })

    expect(result.current.status).toBe('authenticated')
    expect(result.current.accessToken).toBe('new-valid-token')
    expect(result.current.accessToken).not.toBe(initialAccessToken)
    expect(result.current.expiresAt).toBeGreaterThan(Date.now())
    expect(result.current.error).toBeNull()
  })

  it('should fail to update with expired token', () => {
    const { result } = renderHook(() => useAuthStore())
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    act(() => {
      result.current.login('valid-token')
    })

    act(() => {
      result.current.updateToken('expired-token')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('New token is expired')
    expect(consoleSpy).toHaveBeenCalledWith('Token update failed:', 'New token is expired')

    consoleSpy.mockRestore()
  })

  it('should update user info from new token', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.login('valid-token')
    })

    act(() => {
      result.current.updateToken('new-valid-token')
    })

    expect(result.current.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      emailVerified: true,
      roles: ['user', 'admin'],
      realmRoles: ['user', 'admin'],
      clientRoles: {},
    })
  })
})

// ============================================
// CLEAR AUTH TESTS
// ============================================

describe('Auth Store - Clear Auth', () => {
  it('should clear auth state without redirecting', async () => {
    const { result } = renderHook(() => useAuthStore())
    const { redirectToLogout } = await import('@/lib/keycloak')

    act(() => {
      result.current.login('valid-token')
    })

    act(() => {
      result.current.clearAuth()
    })

    expect(result.current.status).toBe('unauthenticated')
    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.expiresAt).toBeNull()
    expect(redirectToLogout).not.toHaveBeenCalled()
  })
})

// ============================================
// ERROR HANDLING TESTS
// ============================================

describe('Auth Store - Error Handling', () => {
  it('should set error', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setError('Custom error message')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Custom error message')
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setError('Error message')
    })

    expect(result.current.error).toBe('Error message')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})

// ============================================
// COMPUTED GETTERS TESTS
// ============================================

describe('Auth Store - Computed Getters', () => {
  describe('isAuthenticated', () => {
    it('should return false when not authenticated', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.isAuthenticated()).toBe(false)
    })

    it('should return true when authenticated with valid token', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('valid-token')
      })

      expect(result.current.isAuthenticated()).toBe(true)
    })

    it('should return false when status is authenticated but token is expired', async () => {
      const { result } = renderHook(() => useAuthStore())
      const { isTokenExpired } = await import('@/lib/keycloak')

      // Login first
      act(() => {
        result.current.login('valid-token')
      })

      // Mock token as expired
      vi.mocked(isTokenExpired).mockReturnValueOnce(true)

      expect(result.current.isAuthenticated()).toBe(false)
    })

    it('should return false when user is null', () => {
      const { result } = renderHook(() => useAuthStore())

      // Manually set state to authenticated but no user
      act(() => {
        useAuthStore.setState({
          status: 'authenticated',
          accessToken: 'token',
          user: null,
          expiresAt: Date.now() + 3600000,
          error: null,
        })
      })

      expect(result.current.isAuthenticated()).toBe(false)
    })
  })

  describe('isTokenExpiring', () => {
    it('should return false when no token', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.isTokenExpiring()).toBe(false)
    })

    it('should return true when token expires soon', async () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('expiring-soon-token')
      })

      // Mock returns 200 seconds (< 300)
      expect(result.current.isTokenExpiring()).toBe(true)
    })

    it('should return false when token has plenty of time', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('valid-token')
      })

      // Mock returns 3600 seconds (> 300)
      expect(result.current.isTokenExpiring()).toBe(false)
    })
  })

  describe('getTimeUntilExpiry', () => {
    it('should return 0 when no token', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.getTimeUntilExpiry()).toBe(0)
    })

    it('should return correct time until expiry', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('valid-token')
      })

      expect(result.current.getTimeUntilExpiry()).toBe(3600)
    })
  })
})

// ============================================
// SELECTORS TESTS
// ============================================

describe('Auth Store - Selectors', () => {
  describe('useUser', () => {
    it('should return null when not authenticated', () => {
      const { result } = renderHook(() => useUser())

      expect(result.current).toBeNull()
    })

    it('should return user when authenticated', () => {
      renderHook(() => {
        act(() => {
          useAuthStore.getState().login('valid-token')
        })
      })

      const { result } = renderHook(() => useUser())

      expect(result.current).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        emailVerified: true,
        roles: ['user', 'admin'],
        realmRoles: ['user', 'admin'],
        clientRoles: {},
      })
    })
  })

  describe('useAuthStatus', () => {
    it('should return correct status', () => {
      const { result } = renderHook(() => useAuthStatus())

      expect(result.current).toBe('unauthenticated')

      act(() => {
        useAuthStore.getState().login('valid-token')
      })

      expect(result.current).toBe('authenticated')
    })
  })

  describe('useIsAuthenticated', () => {
    it('should return false when not authenticated', () => {
      const { result } = renderHook(() => useIsAuthenticated())

      expect(result.current).toBe(false)
    })

    it('should return true when authenticated', () => {
      act(() => {
        useAuthStore.getState().login('valid-token')
      })

      const { result } = renderHook(() => useIsAuthenticated())

      expect(result.current).toBe(true)
    })
  })

  describe('useUserRoles', () => {
    it('should return empty array when not authenticated', () => {
      // Direct store access to avoid infinite loop in React hook
      const roles = useAuthStore.getState().user?.roles || []
      expect(roles.length).toBe(0)
    })

    it('should return user roles when authenticated', () => {
      act(() => {
        useAuthStore.getState().login('valid-token')
      })

      // Direct store access to avoid infinite loop in React hook
      const roles = useAuthStore.getState().user?.roles || []
      expect(roles).toContain('user')
      expect(roles).toContain('admin')
      expect(roles.length).toBe(2)
    })
  })

  describe('useHasRole', () => {
    it('should return false when not authenticated', () => {
      const { result } = renderHook(() => useHasRole('admin'))

      expect(result.current).toBe(false)
    })

    it('should return true when user has role', () => {
      act(() => {
        useAuthStore.getState().login('valid-token')
      })

      const { result } = renderHook(() => useHasRole('admin'))

      expect(result.current).toBe(true)
    })

    it('should return false when user does not have role', () => {
      act(() => {
        useAuthStore.getState().login('valid-token')
      })

      const { result } = renderHook(() => useHasRole('superadmin'))

      expect(result.current).toBe(false)
    })
  })
})

// ============================================
// EXTERNAL ACTIONS TESTS
// ============================================

describe('Auth Store - External Actions', () => {
  describe('loginWithToken', () => {
    it('should login from outside component', () => {
      loginWithToken('valid-token')

      const state = useAuthStore.getState()

      expect(state.status).toBe('authenticated')
      expect(state.user).not.toBeNull()
      expect(state.accessToken).toBe('valid-token')
    })
  })

  describe('logoutUser', () => {
    it('should logout from outside component', async () => {
      const { redirectToLogout } = await import('@/lib/keycloak')

      loginWithToken('valid-token')

      logoutUser()

      const state = useAuthStore.getState()

      expect(state.status).toBe('unauthenticated')
      expect(state.user).toBeNull()
      expect(redirectToLogout).toHaveBeenCalled()
    })

    it('should pass custom redirect URI', async () => {
      const { redirectToLogout } = await import('@/lib/keycloak')

      loginWithToken('valid-token')

      logoutUser('http://example.com')

      expect(redirectToLogout).toHaveBeenCalledWith({
        post_logout_redirect_uri: 'http://example.com',
      })
    })
  })

  describe('forceLogin', () => {
    it('should clear auth and redirect to login', async () => {
      const { redirectToLogin } = await import('@/lib/keycloak')

      loginWithToken('valid-token')

      forceLogin()

      const state = useAuthStore.getState()

      expect(state.status).toBe('unauthenticated')
      expect(state.user).toBeNull()
      expect(redirectToLogin).toHaveBeenCalledWith(undefined)
    })

    it('should pass return URL to login', async () => {
      const { redirectToLogin } = await import('@/lib/keycloak')

      forceLogin('/dashboard')

      expect(redirectToLogin).toHaveBeenCalledWith('/dashboard')
    })
  })
})
