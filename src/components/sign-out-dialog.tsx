/**
 * Sign Out Dialog Component
 *
 * Confirmation dialog for user logout
 * - Shows confirmation before logging out
 * - Clears auth state and redirects to Keycloak logout
 * - Preserves return URL for re-login
 */

'use client'

import { useAuthStore } from '@/stores/auth-store'
import { ConfirmDialog } from '@/components/confirm-dialog'

// ============================================
// TYPES
// ============================================

interface SignOutDialogProps {
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

// ============================================
// COMPONENT
// ============================================

export function SignOutDialog({
  open,
  onOpenChange,
  redirectTo,
}: SignOutDialogProps) {
  const logout = useAuthStore((state) => state.logout)

  /**
   * Handle sign out confirmation
   * - Clears authentication state
   * - Redirects to Keycloak logout
   * - Keycloak will then redirect back to the app
   */
  const handleSignOut = () => {
    // Close dialog first
    onOpenChange(false)

    // Determine post-logout redirect URL
    const postLogoutUrl = redirectTo || window.location.origin

    // Logout via Keycloak
    // This will:
    // 1. Clear Zustand auth state
    // 2. Clear HttpOnly refresh token cookie
    // 3. Redirect to Keycloak logout endpoint
    // 4. Keycloak redirects back to postLogoutUrl
    logout(postLogoutUrl)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      cancelBtnText='Cancel'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}

// ============================================
// SIMPLE SIGN OUT BUTTON (No Dialog)
// ============================================

/**
 * Simple sign out button without confirmation dialog
 * Use this when you want immediate logout without confirmation
 */
export function SignOutButton({
  children,
  className,
  redirectTo,
}: {
  children?: React.ReactNode
  className?: string
  redirectTo?: string
}) {
  const logout = useAuthStore((state) => state.logout)

  const handleClick = () => {
    const postLogoutUrl = redirectTo || window.location.origin
    logout(postLogoutUrl)
  }

  return (
    <button onClick={handleClick} className={className}>
      {children || 'Sign out'}
    </button>
  )
}
