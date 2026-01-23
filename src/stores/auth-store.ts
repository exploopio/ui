/**
 * Authentication State Store (Zustand)
 *
 * Manages authentication state for Keycloak integration
 *
 * Security Best Practices:
 * - Access tokens stored in MEMORY ONLY (this store), never in cookies
 * - Refresh tokens stored in HttpOnly cookies (server-side only)
 * - User info extracted from access token JWT
 * - Token expiration checked automatically
 *
 * @example
 * const { user, accessToken, login, logout, isAuthenticated } = useAuthStore()
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  extractUser,
  isTokenExpired,
  getTimeUntilExpiry,
  redirectToLogin,
  redirectToLogout,
  type AuthUser,
  type AuthStatus,
} from '@/lib/keycloak'
import { clearAllStoredPermissions } from '@/lib/permission-storage'
import { clearAllLogoCaches } from '@/lib/logo-storage'

// ============================================
// TYPES
// ============================================

interface AuthState {
  // State
  status: AuthStatus
  user: AuthUser | null
  accessToken: string | null
  expiresAt: number | null // Unix timestamp
  error: string | null

  // Actions
  login: (accessToken: string) => void
  logout: (postLogoutRedirectUri?: string) => void
  updateToken: (accessToken: string) => void
  clearAuth: () => void
  setError: (error: string) => void
  clearError: () => void

  // Computed
  isAuthenticated: () => boolean
  isTokenExpiring: () => boolean
  getTimeUntilExpiry: () => number
}

// ============================================
// STORE
// ============================================

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // ============================================
      // INITIAL STATE
      // ============================================

      status: 'unauthenticated',
      user: null,
      accessToken: null,
      expiresAt: null,
      error: null,

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Login with Keycloak access token
       * Automatically extracts user info from token
       *
       * @param accessToken - JWT access token from Keycloak
       */
      login: (accessToken: string) => {
        try {
          // Validate token is not expired
          if (isTokenExpired(accessToken)) {
            throw new Error('Token is expired')
          }

          // Extract user info from token
          const user = extractUser(accessToken)

          // Calculate expiration timestamp
          const expiresIn = getTimeUntilExpiry(accessToken)
          const expiresAt = Date.now() + expiresIn * 1000

          // Reset auth failure flag on successful login
          authPermanentlyFailed = false

          set({
            status: 'authenticated',
            user,
            accessToken,
            expiresAt,
            error: null,
          })

          // Setup auto-refresh check (optional)
          // You can implement token refresh logic here
          setupTokenRefresh(expiresIn)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to process token'

          set({
            status: 'error',
            user: null,
            accessToken: null,
            expiresAt: null,
            error: errorMessage,
          })

          console.error('Login failed:', errorMessage)
        }
      },

      /**
       * Logout and redirect to Keycloak logout
       * Clears all auth state and redirects to Keycloak
       *
       * @param postLogoutRedirectUri - Optional URL to redirect after logout
       */
      logout: (postLogoutRedirectUri?: string) => {
        // Clear local state
        set({
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          expiresAt: null,
          error: null,
        })

        // Clear stored permissions and logo caches from localStorage
        clearAllStoredPermissions()
        clearAllLogoCaches()

        // Redirect to Keycloak logout
        // This will also clear the HttpOnly refresh token cookie
        redirectToLogout({
          post_logout_redirect_uri: postLogoutRedirectUri,
        })
      },

      /**
       * Update access token (for token refresh)
       *
       * @param accessToken - New JWT access token
       */
      updateToken: (accessToken: string) => {
        try {
          if (isTokenExpired(accessToken)) {
            throw new Error('New token is expired')
          }

          const user = extractUser(accessToken)
          const expiresIn = getTimeUntilExpiry(accessToken)
          const expiresAt = Date.now() + expiresIn * 1000

          set({
            status: 'authenticated',
            user,
            accessToken,
            expiresAt,
            error: null,
          })

          setupTokenRefresh(expiresIn)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update token'

          set({
            status: 'error',
            error: errorMessage,
          })

          console.error('Token update failed:', errorMessage)
        }
      },

      /**
       * Clear auth state without redirecting
       * Use this when you need to clear state without logout redirect
       */
      clearAuth: () => {
        set({
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          expiresAt: null,
          error: null,
        })

        // Clear stored permissions and logo caches from localStorage
        clearAllStoredPermissions()
        clearAllLogoCaches()
      },

      /**
       * Set error message
       */
      setError: (error: string) => {
        set({ status: 'error', error })
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null })
      },

      // ============================================
      // COMPUTED / GETTERS
      // ============================================

      /**
       * Check if user is authenticated
       */
      isAuthenticated: () => {
        const state = get()
        return (
          state.status === 'authenticated' &&
          state.accessToken !== null &&
          state.user !== null &&
          !isTokenExpired(state.accessToken)
        )
      },

      /**
       * Check if token is expiring soon (within 5 minutes)
       */
      isTokenExpiring: () => {
        const state = get()
        if (!state.accessToken) return false

        const expiresIn = getTimeUntilExpiry(state.accessToken)
        return expiresIn > 0 && expiresIn < 300 // 5 minutes
      },

      /**
       * Get seconds until token expiry
       */
      getTimeUntilExpiry: () => {
        const state = get()
        if (!state.accessToken) return 0
        return getTimeUntilExpiry(state.accessToken)
      },
    }),
    {
      name: 'auth-store', // Redux DevTools name
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// ============================================
// HELPER FUNCTIONS
// ============================================

// Store refresh timeout ID at module level for type safety
let authRefreshTimeout: ReturnType<typeof setTimeout> | null = null

// Token refresh mutex - shared with API client via module-level state
let isRefreshingToken = false

// Flag to completely stop auto-refresh when auth has permanently failed
let authPermanentlyFailed = false

/**
 * Setup automatic token refresh before expiry
 * Automatically refreshes the access token 5 minutes before expiry.
 *
 * @param expiresIn - Seconds until token expires
 */
function setupTokenRefresh(expiresIn: number): void {
  // Clear any existing timeout
  if (authRefreshTimeout) {
    clearTimeout(authRefreshTimeout)
    authRefreshTimeout = null
  }

  // Don't setup refresh if auth has permanently failed
  if (authPermanentlyFailed) {
    console.log('[Auth] Auth permanently failed, not setting up auto-refresh')
    return
  }

  // Only setup refresh if token has reasonable expiry
  if (expiresIn < 60 || expiresIn > 86400) return // 1 min to 24 hours

  // Refresh 5 minutes before expiry (or immediately if less than 5 min left)
  const refreshIn = Math.max(0, (expiresIn - 300) * 1000)

  if (typeof window !== 'undefined') {
    authRefreshTimeout = setTimeout(async () => {
      // Skip if auth has permanently failed
      if (authPermanentlyFailed) {
        console.log('[Auth] Auth permanently failed, skipping scheduled refresh')
        return
      }

      // Skip if already refreshing (prevents race with API client refresh)
      if (isRefreshingToken) {
        console.log('[Auth] Token refresh already in progress, skipping scheduled refresh')
        return
      }

      console.log('[Auth] Token expiring soon, refreshing...')
      isRefreshingToken = true

      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // Include httpOnly cookies
        })

        const data = await response.json()

        if (response.ok && data.success && data.data?.access_token) {
          console.log('[Auth] Token refreshed successfully')
          useAuthStore.getState().updateToken(data.data.access_token)
        } else {
          // Refresh failed permanently - set flag and redirect
          console.warn(
            '[Auth] Token refresh failed permanently:',
            data.error?.message || 'Unknown error'
          )
          authPermanentlyFailed = true
          useAuthStore.getState().clearAuth()
          redirectToLogin()
        }
      } catch (error) {
        console.error('[Auth] Token refresh error:', error)
        // Network error - don't set permanently failed, just clear auth
        useAuthStore.getState().clearAuth()
        redirectToLogin()
      } finally {
        // Clear the mutex after a delay to prevent rapid re-attempts
        setTimeout(() => {
          isRefreshingToken = false
        }, 1000)
      }
    }, refreshIn)
  }
}

/**
 * Reset auth failure flag (call on successful login)
 */
export function resetAuthFailureFlag(): void {
  authPermanentlyFailed = false
}

// ============================================
// SELECTORS (for performance)
// ============================================

/**
 * Select only user from store
 * Use this in components that only need user data
 */
export const useUser = () => useAuthStore((state) => state.user)

/**
 * Select only authentication status
 */
export const useAuthStatus = () => useAuthStore((state) => state.status)

/**
 * Select only if authenticated (computed)
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated())

/**
 * Select user roles
 */
export const useUserRoles = () => useAuthStore((state) => state.user?.roles || [])

/**
 * Check if user has specific role
 */
export const useHasRole = (role: string) =>
  useAuthStore((state) => state.user?.roles.includes(role) || false)

// ============================================
// ACTIONS (outside component)
// ============================================

/**
 * Login action - call from anywhere
 */
export const loginWithToken = (accessToken: string) => {
  useAuthStore.getState().login(accessToken)
}

/**
 * Logout action - call from anywhere
 */
export const logoutUser = (postLogoutRedirectUri?: string) => {
  useAuthStore.getState().logout(postLogoutRedirectUri)
}

/**
 * Force redirect to Keycloak login
 */
export const forceLogin = (returnUrl?: string) => {
  useAuthStore.getState().clearAuth()
  redirectToLogin(returnUrl)
}
