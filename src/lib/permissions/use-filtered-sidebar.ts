'use client'

/**
 * Hook to filter sidebar navigation based on user permissions and roles
 *
 * This hook takes the full sidebar data and returns a filtered version
 * that only includes items the current user has permission/role to view.
 *
 * Supports three types of access control:
 * 1. permission - Granular feature-based access (e.g., 'assets:read')
 * 2. role - Exact role match (e.g., 'owner')
 * 3. minRole - Minimum role level (e.g., 'admin' means admin and owner)
 */

import { useMemo } from 'react'
import { usePermissions } from './hooks'
import { isRoleAtLeast, type RoleString } from './constants'
import type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink } from '@/components/types'

interface AccessCheckFunctions {
  can: (perm: string) => boolean
  canAny: (...perms: string[]) => boolean
  isRole: (role: string) => boolean
  isAnyRole: (...roles: string[]) => boolean
  tenantRole: string | undefined
}

/**
 * Check if user has access to a nav item
 * Supports permission, role, and minRole checks
 */
function hasItemAccess(
  item: {
    permission?: string | string[]
    role?: string | string[]
    minRole?: string
  },
  checks: AccessCheckFunctions
): boolean {
  const { can, canAny, isRole, isAnyRole, tenantRole } = checks

  // Check minRole first (role hierarchy)
  if (item.minRole && tenantRole) {
    if (!isRoleAtLeast(tenantRole, item.minRole as RoleString)) {
      return false
    }
  } else if (item.minRole && !tenantRole) {
    return false
  }

  // Check exact role match
  if (item.role) {
    if (Array.isArray(item.role)) {
      if (!isAnyRole(...item.role)) {
        return false
      }
    } else {
      if (!isRole(item.role)) {
        return false
      }
    }
  }

  // Check permission
  if (item.permission) {
    if (Array.isArray(item.permission)) {
      if (!canAny(...item.permission)) {
        return false
      }
    } else {
      if (!can(item.permission)) {
        return false
      }
    }
  }

  // All checks passed (or no checks required)
  return true
}

/**
 * Filter a single nav item based on access rules
 * Returns null if item should be hidden
 */
function filterNavItem(item: NavItem, checks: AccessCheckFunctions): NavItem | null {
  // Check if user has access to this item
  if (!hasItemAccess(item, checks)) {
    return null
  }

  // If it's a collapsible item with sub-items, filter those too
  if ('items' in item) {
    const filteredSubItems = item.items.filter((subItem) => hasItemAccess(subItem, checks))

    // If no sub-items remain after filtering, hide the parent
    if (filteredSubItems.length === 0) {
      return null
    }

    return {
      ...item,
      items: filteredSubItems,
    } as NavCollapsible
  }

  // It's a regular link item
  return item as NavLink
}

/**
 * Filter a nav group based on access rules
 * Returns null if group should be hidden (no visible items)
 */
function filterNavGroup(group: NavGroup, checks: AccessCheckFunctions): NavGroup | null {
  const filteredItems = group.items
    .map((item) => filterNavItem(item, checks))
    .filter((item): item is NavItem => item !== null)

  // If no items remain after filtering, hide the group
  if (filteredItems.length === 0) {
    return null
  }

  return {
    ...group,
    items: filteredItems,
  }
}

/**
 * Hook to get sidebar data filtered by user permissions and roles
 *
 * NOTE: If user has no permissions (empty array), all items are shown
 * for backward compatibility. This allows the system to work before
 * JWT tokens include permissions.
 *
 * @example
 * ```tsx
 * function AppSidebar() {
 *   const filteredData = useFilteredSidebarData(sidebarData)
 *
 *   return (
 *     <Sidebar>
 *       {filteredData.navGroups.map((group) => (
 *         <NavGroup key={group.title} {...group} />
 *       ))}
 *     </Sidebar>
 *   )
 * }
 * ```
 */
export function useFilteredSidebarData(sidebarData: SidebarData): SidebarData {
  const { can, canAny, isRole, isAnyRole, tenantRole, permissions } = usePermissions()

  return useMemo(() => {
    // If user has no permissions yet (e.g., old token without permissions),
    // show all items for backward compatibility
    const hasPermissionData = permissions.length > 0 || tenantRole !== undefined

    if (!hasPermissionData) {
      // No permission data available - show everything
      return sidebarData
    }

    const checks: AccessCheckFunctions = {
      can,
      canAny,
      isRole,
      isAnyRole,
      tenantRole,
    }

    const filteredNavGroups = sidebarData.navGroups
      .map((group) => filterNavGroup(group, checks))
      .filter((group): group is NavGroup => group !== null)

    return {
      ...sidebarData,
      navGroups: filteredNavGroups,
    }
  }, [sidebarData, can, canAny, isRole, isAnyRole, tenantRole, permissions])
}
