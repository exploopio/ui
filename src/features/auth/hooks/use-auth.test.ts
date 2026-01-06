/**
 * useAuth Hook Tests
 *
 * Tests for the main authentication hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from './use-auth'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock('@/lib/keycloak/client', () => ({
  redirectToLogin: vi.fn(),
  redirectToLogout: vi.fn(),
}))

// ============================================
// SETUP
// ============================================

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['user', 'admin'],
  emailVerified: true,
}

const mockAccessToken = 'mock-access-token'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // STATE TESTS
  // ============================================

  describe('state', () => {
    it('should return authenticated state when user is logged in', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: mockUser,
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.status).toBe('authenticated')
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should return unauthenticated state when user is not logged in', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.status).toBe('unauthenticated')
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should return loading state during authentication', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'loading',
          user: null,
          accessToken: null,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.status).toBe('loading')
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  // ============================================
  // ROLE CHECK TESTS
  // ============================================

  describe('role checks', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: mockUser,
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })
    })

    it('should check if user has a specific role', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.hasRole('user')).toBe(true)
      expect(result.current.hasRole('admin')).toBe(true)
      expect(result.current.hasRole('moderator')).toBe(false)
    })

    it('should check if user has any of the specified roles', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.hasAnyRole(['user', 'moderator'])).toBe(true)
      expect(result.current.hasAnyRole(['admin', 'moderator'])).toBe(true)
      expect(result.current.hasAnyRole(['moderator', 'superadmin'])).toBe(false)
    })

    it('should check if user has all of the specified roles', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.hasAllRoles(['user', 'admin'])).toBe(true)
      expect(result.current.hasAllRoles(['user'])).toBe(true)
      expect(result.current.hasAllRoles(['user', 'admin', 'moderator'])).toBe(false)
    })

    it('should return false for role checks when not authenticated', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.hasRole('user')).toBe(false)
      expect(result.current.hasAnyRole(['user', 'admin'])).toBe(false)
      expect(result.current.hasAllRoles(['user'])).toBe(false)
    })
  })

  // ============================================
  // ACTION TESTS
  // ============================================

  describe('actions', () => {
    it('should provide login function', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.login).toBeDefined()
      expect(typeof result.current.login).toBe('function')
    })

    it('should provide logout function', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: mockUser,
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.logout).toBeDefined()
      expect(typeof result.current.logout).toBe('function')
    })

    it('should provide refreshToken function', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: mockUser,
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.refreshToken).toBeDefined()
      expect(typeof result.current.refreshToken).toBe('function')
    })
  })

  // ============================================
  // LOGIN FUNCTION TESTS
  // ============================================

  describe('login function', () => {
    it('should show loading toast and redirect to login', async () => {
      const { redirectToLogin } = await import('@/lib/keycloak/client')

      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.login()
      })

      expect(toast.loading).toHaveBeenCalled()
      expect(redirectToLogin).toHaveBeenCalledWith('/')
    })

    it('should redirect to custom URL when provided', async () => {
      const { redirectToLogin } = await import('@/lib/keycloak/client')

      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.login('/custom-page')
      })

      expect(redirectToLogin).toHaveBeenCalledWith('/custom-page')
    })

    it('should handle login redirect errors gracefully', async () => {
      const { redirectToLogin } = await import('@/lib/keycloak/client')
      vi.mocked(redirectToLogin).mockImplementationOnce(() => {
        throw new Error('Redirect failed')
      })

      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.login()
      })

      expect(toast.dismiss).toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('Failed to initiate login. Please try again.')
    })
  })

  // ============================================
  // LOGOUT FUNCTION TESTS
  // ============================================

  describe('logout function', () => {
    it('should show loading toast, call store logout, and show success', () => {
      const mockStoreLogout = vi.fn()

      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: mockUser,
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: mockStoreLogout,
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.logout()
      })

      expect(toast.loading).toHaveBeenCalled()
      expect(mockStoreLogout).toHaveBeenCalledWith('/login')
      expect(toast.dismiss).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalled()
    })

    it('should pass custom redirect URI to store logout', () => {
      const mockStoreLogout = vi.fn()

      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: mockUser,
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: mockStoreLogout,
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.logout('http://example.com')
      })

      expect(mockStoreLogout).toHaveBeenCalledWith('http://example.com')
    })

    it('should handle logout errors gracefully', () => {
      const mockStoreLogout = vi.fn(() => {
        throw new Error('Logout failed')
      })

      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: mockUser,
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: mockStoreLogout,
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.logout()
      })

      expect(toast.dismiss).toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('Failed to logout. Please try again.')
    })
  })

  // ============================================
  // REFRESH TOKEN FUNCTION TESTS
  // ============================================

  describe('refreshToken function', () => {
    it('should return false (not implemented yet)', async () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: mockUser,
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      const refreshResult = await result.current.refreshToken()

      expect(refreshResult).toBe(false)
    })

    it('should handle refresh errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: mockUser,
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      const refreshResult = await result.current.refreshToken()

      expect(refreshResult).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  // ============================================
  // EDGE CASES
  // ============================================

  describe('edge cases', () => {
    it('should handle user without roles array', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: { ...mockUser, roles: [] },
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.hasRole('user')).toBe(false)
      expect(result.current.hasAnyRole(['user'])).toBe(false)
      expect(result.current.hasAllRoles(['user'])).toBe(false)
    })

    it('should handle empty role arrays in checks', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const state = {
          status: 'authenticated',
          user: mockUser,
          accessToken: mockAccessToken,
          login: vi.fn(),
          logout: vi.fn(),
        }
        return selector(state)
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.hasAnyRole([])).toBe(false)
      expect(result.current.hasAllRoles([])).toBe(true) // Empty array = all conditions met
    })
  })
})
