'use client'

/**
 * Hook to filter sidebar navigation based on user permissions, roles, and modules
 *
 * This hook takes the full sidebar data and returns a filtered version
 * that only includes items the current user has permission/role/module to view.
 *
 * Supports four types of access control:
 * 1. module - Licensing-based module access (e.g., 'findings', 'scans')
 * 2. permission - Granular feature-based access (e.g., 'assets:read')
 * 3. role - Exact role match (e.g., 'owner')
 * 4. minRole - Minimum role level (e.g., 'admin' means admin and owner)
 *
 * Module Mapping:
 * - dashboard: Dashboard
 * - assets: Attack Surface, Asset Groups, Scope Config, Asset Inventory
 * - findings: Exposures, Findings, Threat Intel, Risk Analysis, Business Impact
 * - scans: Scans, Scan Profiles, Tools, Agents
 * - reports: Reports
 * - audit: Audit Log
 * - components: Components (SBOM)
 * - pentest: Penetration Testing, Attack Simulation, Control Testing
 * - credentials: Credential Leaks
 * - remediation: Remediation Tasks, Workflows
 */

import { useMemo } from 'react'
import { usePermissions } from './hooks'
import { isRoleAtLeast, type RoleString } from './constants'
import { useTenantModules } from '@/features/integrations/api/use-tenant-modules'
import type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink } from '@/components/types'

interface AccessCheckFunctions {
  can: (perm: string) => boolean
  canAny: (...perms: string[]) => boolean
  isRole: (role: string) => boolean
  isAnyRole: (...roles: string[]) => boolean
  tenantRole: string | undefined
  hasModule: (moduleId: string) => boolean
}

interface FilteredSidebarResult {
  data: SidebarData
  isLoading: boolean
  isModulesLoading: boolean
}

/**
 * Check if user has access to a nav item
 * Supports module, permission, role, and minRole checks
 */
function hasItemAccess(
  item: {
    module?: string
    permission?: string | string[]
    role?: string | string[]
    minRole?: string
  },
  checks: AccessCheckFunctions
): boolean {
  const { can, canAny, isRole, isAnyRole, tenantRole, hasModule } = checks

  // Check module access first (licensing layer)
  if (item.module) {
    if (!hasModule(item.module)) {
      return false
    }
  }

  // Check minRole (role hierarchy)
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
 * Returns filtered sidebar data along with loading states.
 * When modules are loading, returns only Dashboard to prevent flash of all content.
 *
 * @example
 * ```tsx
 * function AppSidebar() {
 *   const { data: filteredData, isLoading } = useFilteredSidebarData(sidebarData)
 *
 *   if (isLoading) return <SidebarSkeleton />
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
export function useFilteredSidebarData(sidebarData: SidebarData): FilteredSidebarResult {
  const { can, canAny, isRole, isAnyRole, tenantRole, permissions } = usePermissions()
  const { moduleIds, isLoading: modulesLoading } = useTenantModules()

  // Create hasModule function
  // If modules are loading or empty, we need special handling
  const hasModule = useMemo(() => {
    return (moduleId: string) => {
      // Owner and Admin bypass module checks (see all modules even if API fails)
      // This prevents empty sidebar when modules API returns empty/fails
      if (tenantRole === 'owner' || tenantRole === 'admin') {
        return true
      }

      // If moduleIds has data, use it
      if (moduleIds.length > 0) {
        return moduleIds.includes(moduleId)
      }

      // moduleIds is empty - API failed or loading
      if (modulesLoading) {
        return false // Hide while loading
      }

      // API failed (moduleIds empty, not loading)
      // If user has a valid tenantRole (authenticated), fail-open
      // This provides better UX than hiding all features when API has issues
      // Security note: Backend still enforces proper authorization
      return !!tenantRole
    }
  }, [moduleIds, modulesLoading, tenantRole])

  const result = useMemo(() => {
    // Check if we have permission data (user is authenticated)
    const hasPermissionData = permissions.length > 0 || tenantRole !== undefined

    // If no permission data, user is not loaded yet
    if (!hasPermissionData) {
      // Return minimal sidebar (just Dashboard) while loading
      const minimalGroups = sidebarData.navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => 'url' in item && item.url === '/'),
        }))
        .filter((group) => group.items.length > 0)

      return {
        ...sidebarData,
        navGroups: minimalGroups,
      }
    }

    // If modules are still loading, show only items without module restrictions
    // This prevents flash of all content while modules are being fetched
    // Exception: Authenticated users (have tenantRole) can see all modules during loading
    // to provide better UX - backend still enforces authorization
    if (modulesLoading) {
      // Filter out items with module restrictions while loading
      // Authenticated users can see all modules even during loading for better UX
      const isAuthenticated = !!tenantRole
      const loadingChecks: AccessCheckFunctions = {
        can,
        canAny,
        isRole,
        isAnyRole,
        tenantRole,
        // While loading: authenticated users see all, others hide module-gated items
        hasModule: isAuthenticated ? () => true : () => false,
      }

      const filteredNavGroups = sidebarData.navGroups
        .map((group) => filterNavGroup(group, loadingChecks))
        .filter((group): group is NavGroup => group !== null)

      return {
        ...sidebarData,
        navGroups: filteredNavGroups,
      }
    }

    // Normal filtering with all data available
    const checks: AccessCheckFunctions = {
      can,
      canAny,
      isRole,
      isAnyRole,
      tenantRole,
      hasModule,
    }

    const filteredNavGroups = sidebarData.navGroups
      .map((group) => filterNavGroup(group, checks))
      .filter((group): group is NavGroup => group !== null)

    return {
      ...sidebarData,
      navGroups: filteredNavGroups,
    }
  }, [sidebarData, can, canAny, isRole, isAnyRole, tenantRole, permissions, hasModule, moduleIds, modulesLoading])

  // Compute overall loading state
  const isLoading = useMemo(() => {
    const hasPermissionData = permissions.length > 0 || tenantRole !== undefined
    return !hasPermissionData
  }, [permissions, tenantRole])

  return {
    data: result,
    isLoading,
    isModulesLoading: modulesLoading,
  }
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useFilteredSidebarData and destructure { data } instead
 */
export function useFilteredSidebarDataLegacy(sidebarData: SidebarData): SidebarData {
  const { data } = useFilteredSidebarData(sidebarData)
  return data
}
