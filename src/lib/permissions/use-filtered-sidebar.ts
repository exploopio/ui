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
import { useBootstrapModules } from '@/context/bootstrap-provider'
import type {
  SidebarData,
  NavGroup,
  NavItem,
  NavCollapsible,
  NavLink,
  ReleaseStatus,
} from '@/components/types'

interface AccessCheckFunctions {
  can: (perm: string) => boolean
  canAny: (...perms: string[]) => boolean
  isRole: (role: string) => boolean
  isAnyRole: (...roles: string[]) => boolean
  tenantRole: string | undefined
  hasModule: (moduleId: string) => boolean
  getModuleReleaseStatus: (moduleId: string) => ReleaseStatus | undefined
  isModuleActive: (moduleId: string) => boolean
}

interface FilteredSidebarResult {
  data: SidebarData
  isLoading: boolean
  isModulesLoading: boolean
}

/**
 * Check if user has access to a nav item
 * Supports module, permission, role, and minRole checks
 *
 * Note: Coming soon modules are NOT filtered out - they're shown with releaseStatus
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
  const {
    can,
    canAny,
    isRole,
    isAnyRole,
    tenantRole,
    hasModule,
    getModuleReleaseStatus,
    isModuleActive,
  } = checks

  // Check module access (licensing layer)
  if (item.module) {
    const releaseStatus = getModuleReleaseStatus(item.module)

    // If module is coming_soon or beta, always show it (will be marked in UI)
    if (releaseStatus === 'coming_soon' || releaseStatus === 'beta') {
      return true
    }

    // If module is not active (admin disabled), hide it
    if (!isModuleActive(item.module)) {
      return false
    }

    // If module is not in tenant's plan, hide it
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
 * Sets releaseStatus based on module status from backend
 */
function filterNavItem(item: NavItem, checks: AccessCheckFunctions): NavItem | null {
  // Check if user has access to this item
  if (!hasItemAccess(item, checks)) {
    return null
  }

  // Get release status for this item's module
  const releaseStatus = item.module ? checks.getModuleReleaseStatus(item.module) : undefined

  // If it's a collapsible item with sub-items, filter those too
  if ('items' in item) {
    const filteredSubItems = item.items
      .filter((subItem) => hasItemAccess(subItem, checks))
      .map((subItem) => ({
        ...subItem,
        // Inherit parent's releaseStatus if sub-item doesn't have its own module
        releaseStatus: subItem.module
          ? checks.getModuleReleaseStatus(subItem.module)
          : releaseStatus,
      }))

    // If no sub-items remain after filtering, hide the parent
    if (filteredSubItems.length === 0) {
      return null
    }

    return {
      ...item,
      releaseStatus,
      items: filteredSubItems,
    } as NavCollapsible
  }

  // It's a regular link item
  return {
    ...item,
    releaseStatus,
  } as NavLink
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
  const {
    can,
    canAny,
    isRole,
    isAnyRole,
    tenantRole,
    permissions,
    isLoading: permissionsLoading,
  } = usePermissions()
  const { moduleIds, modules, isLoading: modulesLoading } = useBootstrapModules()

  // Create helper functions for module access
  const moduleHelpers = useMemo(() => {
    // Get module by ID from the modules array
    const getModule = (moduleId: string) =>
      modules.find((m) => m.id === moduleId || m.slug === moduleId)

    // Get release status for a module
    const getModuleReleaseStatus = (moduleId: string): ReleaseStatus | undefined => {
      const mod = getModule(moduleId)
      return mod?.release_status
    }

    // Check if module is active (admin toggle)
    const isModuleActive = (moduleId: string): boolean => {
      const mod = getModule(moduleId)
      // If module not found, assume active (fail-open)
      return mod?.is_active ?? true
    }

    // Check if tenant has access to module (based on plan)
    const hasModule = (moduleId: string): boolean => {
      // If moduleIds has data, use it (this is the source of truth from API)
      if (moduleIds.length > 0) {
        return moduleIds.includes(moduleId)
      }

      // moduleIds is empty - API failed or still loading
      if (modulesLoading) {
        return false // Hide while loading
      }

      // API returned empty - fail-closed for security
      // No more Owner/Admin bypass - permissions from API are source of truth
      return false
    }

    return { hasModule, getModuleReleaseStatus, isModuleActive }
  }, [modules, moduleIds, modulesLoading])

  const result = useMemo(() => {
    // Check if we have permission data (user is authenticated)
    // No more Owner/Admin bypass - permissions from API are source of truth
    const _hasPermissionData = permissions.length > 0 || tenantRole !== undefined

    // If permissions are still loading, show loading state
    if (permissionsLoading && permissions.length === 0) {
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
      // Hide module-gated items for all users during loading (no bypass)
      const loadingChecks: AccessCheckFunctions = {
        can,
        canAny,
        isRole,
        isAnyRole,
        tenantRole,
        // While loading: hide module-gated items for everyone
        hasModule: () => false,
        // During loading, assume all modules are active and released
        getModuleReleaseStatus: () => undefined,
        isModuleActive: () => true,
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
      hasModule: moduleHelpers.hasModule,
      getModuleReleaseStatus: moduleHelpers.getModuleReleaseStatus,
      isModuleActive: moduleHelpers.isModuleActive,
    }

    const filteredNavGroups = sidebarData.navGroups
      .map((group) => filterNavGroup(group, checks))
      .filter((group): group is NavGroup => group !== null)

    return {
      ...sidebarData,
      navGroups: filteredNavGroups,
    }
  }, [
    sidebarData,
    can,
    canAny,
    isRole,
    isAnyRole,
    tenantRole,
    permissions,
    permissionsLoading,
    moduleHelpers,
    modulesLoading,
  ])

  // Compute overall loading state
  // No more Owner/Admin bypass - everyone waits for permissions to load
  const isLoading = useMemo(() => {
    // Still loading if permissions are being fetched and we have no data
    if (permissionsLoading && permissions.length === 0) return true

    // Also loading if no tenant role yet (user not authenticated)
    return tenantRole === undefined
  }, [permissions, tenantRole, permissionsLoading])

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
