/**
 * Auth Feature Types
 *
 * Centralized type definitions for the auth feature
 * - Re-exports commonly used Keycloak types
 * - Form input/output types from schemas
 * - Component prop types
 * - Server action types
 */

// Import types for use within this file
import type {
  KeycloakUser,
  KeycloakTokens,
  KeycloakUserInfo,
  AuthStatus,
} from '@/lib/keycloak/types'

// ============================================
// RE-EXPORTS FROM KEYCLOAK
// ============================================

/**
 * Keycloak types
 * Re-exported for convenience
 */
export type {
  KeycloakUser,
  KeycloakTokens,
  KeycloakUserInfo,
  TokenPayload,
  AuthState,
  AuthStatus,
} from '@/lib/keycloak/types'

// ============================================
// RE-EXPORTS FROM SCHEMAS
// ============================================

/**
 * Form input/output types
 * Inferred from Zod schemas
 */
export type {
  // Login types
  LoginInput,
  LoginOutput,

  // Register types
  RegisterInput,
  RegisterOutput,

  // Password reset types
  ForgotPasswordInput,
  ResetPasswordInput,
  ResetPasswordOutput,

  // Change password types
  ChangePasswordInput,
  ChangePasswordOutput,

  // OAuth callback types
  OAuthCallbackParams,

  // Server action response types
  AuthSuccessResponse,
  AuthErrorResponse,
  AuthResponse,
} from '../schemas/auth.schema'

// ============================================
// RE-EXPORTS FROM ACTIONS
// ============================================

/**
 * Server action types
 */
export type {
  HandleCallbackInput,
  RefreshTokenResult,
} from '../actions/auth-actions'

// ============================================
// COMPONENT PROP TYPES
// ============================================

/**
 * Login form component props
 */
export interface LoginFormProps extends React.HTMLAttributes<HTMLFormElement> {
  /**
   * URL to redirect to after successful login
   * @default '/dashboard'
   */
  redirectTo?: string

  /**
   * Whether to show social login buttons
   * @default true
   */
  showSocialLogin?: boolean
}

/**
 * Register form component props
 */
export interface RegisterFormProps extends React.HTMLAttributes<HTMLFormElement> {
  /**
   * URL to redirect to after successful registration
   * @default '/dashboard'
   */
  redirectTo?: string

  /**
   * Whether to show social registration buttons
   * @default true
   */
  showSocialRegister?: boolean
}

/**
 * Sign out dialog component props
 */
export interface SignOutDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean

  /**
   * Callback when dialog open state changes
   */
  onOpenChange: (open: boolean) => void

  /**
   * Optional custom redirect URL after logout
   * If not provided, redirects to home page
   */
  redirectTo?: string
}

/**
 * Sign out button component props
 */
export interface SignOutButtonProps {
  /**
   * Button content
   */
  children?: React.ReactNode

  /**
   * CSS class name
   */
  className?: string

  /**
   * Optional custom redirect URL after logout
   */
  redirectTo?: string
}

// ============================================
// AUTH HOOK TYPES
// ============================================

/**
 * useAuth hook return type
 * For future custom auth hook
 */
export interface UseAuthReturn {
  /**
   * Current authentication status
   */
  status: AuthStatus

  /**
   * Current user (null if not authenticated)
   */
  user: KeycloakUser | null

  /**
   * Whether user is authenticated
   */
  isAuthenticated: boolean

  /**
   * Whether authentication is being checked
   */
  isLoading: boolean

  /**
   * Login function
   */
  login: (redirectTo?: string) => void

  /**
   * Logout function
   */
  logout: (postLogoutRedirectUri?: string) => void

  /**
   * Refresh token function
   */
  refreshToken: () => Promise<boolean>

  /**
   * Check if user has a specific role
   */
  hasRole: (role: string) => boolean

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole: (roles: string[]) => boolean

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles: (roles: string[]) => boolean
}

// ============================================
// ROUTE PROTECTION TYPES
// ============================================

/**
 * Route protection options
 */
export interface RouteProtectionOptions {
  /**
   * Required roles to access the route
   */
  roles?: string[]

  /**
   * Require all roles (true) or any role (false)
   * @default false
   */
  requireAll?: boolean

  /**
   * Redirect URL if not authenticated
   * @default '/login'
   */
  redirectTo?: string

  /**
   * Custom authorization check function
   */
  authorize?: (user: KeycloakUser) => boolean | Promise<boolean>
}

/**
 * Protected route component props
 */
export interface ProtectedRouteProps {
  /**
   * Child components to render if authorized
   */
  children: React.ReactNode

  /**
   * Route protection options
   */
  options?: RouteProtectionOptions

  /**
   * Loading component to show while checking auth
   */
  loadingComponent?: React.ReactNode

  /**
   * Fallback component to show if not authorized
   */
  fallbackComponent?: React.ReactNode
}

// ============================================
// SOCIAL AUTH TYPES
// ============================================

/**
 * Supported social auth providers
 */
export type SocialProvider = 'github' | 'facebook' | 'google' | 'microsoft'

/**
 * Social auth button props
 */
export interface SocialAuthButtonProps {
  /**
   * Social provider
   */
  provider: SocialProvider

  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'ghost'

  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg'

  /**
   * Whether button is disabled
   */
  disabled?: boolean

  /**
   * Custom click handler
   */
  onClick?: () => void

  /**
   * CSS class name
   */
  className?: string
}

// ============================================
// SESSION TYPES
// ============================================

/**
 * Session information
 */
export interface SessionInfo {
  /**
   * User information
   */
  user: KeycloakUser

  /**
   * Session ID
   */
  sessionId: string

  /**
   * Session expiry timestamp (Unix timestamp)
   */
  expiresAt: number

  /**
   * Whether session is active
   */
  isActive: boolean

  /**
   * Last activity timestamp (Unix timestamp)
   */
  lastActivity: number
}

/**
 * Session storage interface
 */
export interface SessionStorage {
  /**
   * Get current session
   */
  getSession: () => Promise<SessionInfo | null>

  /**
   * Set session
   */
  setSession: (session: SessionInfo) => Promise<void>

  /**
   * Clear session
   */
  clearSession: () => Promise<void>

  /**
   * Check if session is valid
   */
  isValid: () => Promise<boolean>

  /**
   * Update last activity
   */
  updateActivity: () => Promise<void>
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * Auth error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  REFRESH_FAILED = 'REFRESH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_STATE = 'INVALID_STATE',
  OAUTH_ERROR = 'OAUTH_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Auth error with code
 */
export interface AuthError extends Error {
  /**
   * Error code
   */
  code: AuthErrorCode

  /**
   * HTTP status code (if applicable)
   */
  statusCode?: number

  /**
   * Additional error details
   */
  details?: Record<string, unknown>
}

// ============================================
// MIDDLEWARE TYPES
// ============================================

/**
 * Auth middleware options
 */
export interface AuthMiddlewareOptions {
  /**
   * Public routes that don't require authentication
   */
  publicRoutes?: string[]

  /**
   * Protected route prefixes
   */
  protectedRoutePrefixes?: string[]

  /**
   * Login page path
   * @default '/login'
   */
  loginPath?: string

  /**
   * Callback page path
   * @default '/auth/callback'
   */
  callbackPath?: string

  /**
   * Whether to refresh token automatically
   * @default true
   */
  autoRefresh?: boolean

  /**
   * Custom authorization check
   */
  authorize?: (user: KeycloakUser, path: string) => boolean | Promise<boolean>
}

// ============================================
// API CLIENT TYPES
// ============================================

/**
 * Auth API client interface
 */
export interface AuthApiClient {
  /**
   * Login user
   */
  login: (email: string, password: string) => Promise<KeycloakTokens>

  /**
   * Register user
   */
  register: (email: string, password: string) => Promise<KeycloakUser>

  /**
   * Logout user
   */
  logout: (accessToken?: string) => Promise<void>

  /**
   * Refresh access token
   */
  refreshToken: (refreshToken: string) => Promise<KeycloakTokens>

  /**
   * Get user info
   */
  getUserInfo: (accessToken: string) => Promise<KeycloakUserInfo>

  /**
   * Reset password
   */
  resetPassword: (email: string) => Promise<void>

  /**
   * Change password
   */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}
