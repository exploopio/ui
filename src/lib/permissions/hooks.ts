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

import { useAuthStore } from '@/stores/auth-store'
import { type PermissionString, type RoleString, Role, isRoleAtLeast } from './constants'

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
  const permissions = user?.permissions ?? []
  const tenantRole = user?.tenantRole

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
    tenantId: user?.tenantId,
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
  const user = useAuthStore((state) => state.user)
  return user?.permissions?.includes(permission) ?? false
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
export function useHasAnyPermission(...permissions: (PermissionString | string)[]): boolean {
  const user = useAuthStore((state) => state.user)
  const userPermissions = user?.permissions ?? []
  return permissions.some((p) => userPermissions.includes(p))
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
export function useHasAllPermissions(...permissions: (PermissionString | string)[]): boolean {
  const user = useAuthStore((state) => state.user)
  const userPermissions = user?.permissions ?? []
  return permissions.every((p) => userPermissions.includes(p))
}
