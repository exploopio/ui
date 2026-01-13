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
import { type PermissionString, type RoleString, Role, isRoleAtLeast, RolePermissions } from './constants'

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

  // Get permissions from auth store first, then derive from role if not available
  // This ensures permissions work even when auth store hasn't been populated yet
  const permissions = useMemo(() => {
    // If auth store has permissions, use them
    if (user?.permissions && user.permissions.length > 0) {
      return user.permissions
    }
    // Otherwise, derive permissions from role
    if (tenantRole && RolePermissions[tenantRole as RoleString]) {
      return RolePermissions[tenantRole as RoleString]
    }
    return []
  }, [user?.permissions, tenantRole])

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
