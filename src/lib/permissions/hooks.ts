'use client'

/**
 * Permission & Role Hooks
 *
 * React hooks for checking user permissions and roles in components.
 * Permissions and roles are extracted from the user's JWT token.
 *
 * Use permissions for granular feature access (e.g., "can write assets")
 * Use roles for high-level access checks (e.g., "is owner or admin")
 */

import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTenant } from '@/context/tenant-provider'
import { getCookie } from '@/lib/cookies'
import { type PermissionString, type RoleString, Role, isRoleAtLeast, RolePermissions } from './constants'

/**
 * Read permissions from cookie (set during token refresh)
 * This is used as fallback when auth store doesn't have permissions yet
 */
function getPermissionsFromCookie(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const permissionsCookie = getCookie('app_permissions')
    if (permissionsCookie) {
      const parsed = JSON.parse(permissionsCookie)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (error) {
    console.error('[usePermissions] Failed to parse permissions cookie:', error)
  }
  return []
}

/**
 * Hook to access permissions, roles, and check functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { can, canAny, isRole, isAtLeast, permissions } = usePermissions()
 *
 *   return (
 *     <div>
 *       {can('assets:read') && <AssetList />}
 *       {can('assets:write') && <CreateAssetButton />}
 *       {isRole('owner') && <DeleteTenantButton />}
 *       {isAtLeast('admin') && <AdminPanel />}
 *     </div>
 *   )
 * }
 * ```
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user)
  const { currentTenant } = useTenant()

  // Get tenant role from auth store first, then fall back to tenant context
  // This is needed because the auth store may be empty when the page first loads
  // (access token is in httpOnly cookie, not directly accessible by JS)
  const tenantRole = user?.tenantRole || currentTenant?.role

  // Get permissions - priority order:
  // 1. From JWT token (user.permissions) - most accurate, includes RBAC permissions
  // 2. From permissions cookie (set during token refresh) - for initial page load
  // 3. Derive from predefined role (owner/admin/member/viewer) - fallback for old tokens
  // 4. Empty array - will filter normally, may show nothing if no permissions
  const permissions = useMemo(() => {
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[usePermissions] user:', user ? {
        permissions: user.permissions,
        tenantRole: user.tenantRole
      } : 'null')
      console.log('[usePermissions] currentTenant?.role:', currentTenant?.role)
    }

    // Priority 1: Use permissions from JWT token (auth store)
    // This is the source of truth for RBAC - includes all permissions from assigned roles
    if (user?.permissions && user.permissions.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[usePermissions] Using auth store permissions:', user.permissions)
      }
      return user.permissions
    }

    // Priority 2: Read from permissions cookie (set during token refresh)
    // This handles the case where page loads before auth store is populated
    const cookiePermissions = getPermissionsFromCookie()
    if (cookiePermissions.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[usePermissions] Using cookie permissions:', cookiePermissions)
      }
      return cookiePermissions
    }

    // Priority 3: Derive from predefined membership role (owner/admin/member/viewer)
    // This is a fallback for backward compatibility with old tokens without permissions array
    // Note: tenantRole from JWT might be a custom RBAC role name (e.g., "test"),
    // which won't be in RolePermissions - that's OK, we'll return empty array
    if (tenantRole && RolePermissions[tenantRole as RoleString]) {
      const derivedPermissions = RolePermissions[tenantRole as RoleString]
      if (process.env.NODE_ENV === 'development') {
        console.log('[usePermissions] Deriving from predefined role:', tenantRole, derivedPermissions.length, 'permissions')
      }
      return derivedPermissions
    }

    // Priority 4: No permissions available
    // This happens when user hasn't logged in yet or cookie hasn't been set
    if (process.env.NODE_ENV === 'development') {
      console.log('[usePermissions] No permissions available - tenantRole:', tenantRole, '(not in RolePermissions)')
    }
    return []
  }, [user, tenantRole, currentTenant?.role])

  // ============================================
  // PERMISSION CHECKS
  // ============================================

  /**
   * Check if user has a specific permission
   */
  const can = (permission: PermissionString | string): boolean => {
    return permissions.includes(permission)
  }

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = (...perms: (PermissionString | string)[]): boolean => {
    return perms.some((p) => permissions.includes(p))
  }

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = (...perms: (PermissionString | string)[]): boolean => {
    return perms.every((p) => permissions.includes(p))
  }

  /**
   * Check if user cannot perform an action (inverse of can)
   */
  const cannot = (permission: PermissionString | string): boolean => {
    return !can(permission)
  }

  // ============================================
  // ROLE CHECKS
  // ============================================

  /**
   * Check if user has a specific role
   * Use this for owner-only or admin-only operations
   *
   * @example
   * ```tsx
   * {isRole('owner') && <DeleteTenantButton />}
   * {isRole(Role.Owner) && <DeleteTenantButton />}
   * ```
   */
  const isRole = (role: RoleString | string): boolean => {
    return tenantRole === role
  }

  /**
   * Check if user has any of the specified roles
   *
   * @example
   * ```tsx
   * {isAnyRole('owner', 'admin') && <ManageMembers />}
   * ```
   */
  const isAnyRole = (...roles: (RoleString | string)[]): boolean => {
    return tenantRole ? roles.includes(tenantRole) : false
  }

  /**
   * Check if user's role is at least the specified level
   * Based on role hierarchy: viewer < member < admin < owner
   *
   * @example
   * ```tsx
   * {isAtLeast('admin') && <AdminPanel />}
   * {isAtLeast(Role.Member) && <WriteFeatures />}
   * ```
   */
  const isAtLeast = (role: RoleString): boolean => {
    return tenantRole ? isRoleAtLeast(tenantRole, role) : false
  }

  /**
   * Check if user is owner
   * Shortcut for isRole('owner')
   */
  const isOwner = (): boolean => {
    return tenantRole === Role.Owner
  }

  /**
   * Check if user is admin or higher (owner)
   * Shortcut for isAtLeast('admin')
   */
  const isAdmin = (): boolean => {
    return isAtLeast(Role.Admin)
  }

  return {
    // User info
    permissions,
    tenantId: user?.tenantId || currentTenant?.id,
    tenantRole,

    // Permission checks
    can,
    canAny,
    canAll,
    cannot,

    // Role checks
    isRole,
    isAnyRole,
    isAtLeast,
    isOwner,
    isAdmin,
  }
}

/**
 * Hook to check a single permission
 * Optimized for components that only need one permission check
 *
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const canDelete = useHasPermission('assets:delete')
 *   if (!canDelete) return null
 *   return <Button>Delete</Button>
 * }
 * ```
 */
export function useHasPermission(permission: PermissionString | string): boolean {
  const { can } = usePermissions()
  return can(permission)
}

/**
 * Hook to check if user has any of the specified permissions
 *
 * @example
 * ```tsx
 * function WriteActions() {
 *   const canWrite = useHasAnyPermission('assets:write', 'projects:write')
 *   if (!canWrite) return null
 *   return <WriteToolbar />
 * }
 * ```
 */
export function useHasAnyPermission(...perms: (PermissionString | string)[]): boolean {
  const { canAny } = usePermissions()
  return canAny(...perms)
}

/**
 * Hook to check if user has all of the specified permissions
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const isAdmin = useHasAllPermissions('members:manage', 'team:update')
 *   if (!isAdmin) return null
 *   return <AdminTools />
 * }
 * ```
 */
export function useHasAllPermissions(...perms: (PermissionString | string)[]): boolean {
  const { canAll } = usePermissions()
  return canAll(...perms)
}
