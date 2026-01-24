/**
 * SubModuleGate Component
 *
 * Conditionally renders children based on tenant's subscription plan sub-modules.
 * Shows UpgradePrompt when tenant doesn't have access to the required sub-module.
 *
 * Sub-modules are children of a parent module (e.g., "cloud" is a sub-module of "assets").
 * The API returns sub-modules organized by parent module ID.
 *
 * @example
 * ```tsx
 * // Check if tenant has "cloud" sub-module under "assets"
 * <SubModuleGate parentModule="assets" subModule="cloud">
 *   <CloudAssetsPage />
 * </SubModuleGate>
 * ```
 */

'use client'

import { type ReactNode } from 'react'
import { useTenantModules } from '@/features/integrations/api/use-tenant-modules'
import { UpgradePrompt } from './upgrade-prompt'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================
// TYPES
// ============================================

interface SubModuleGateProps {
  /**
   * Parent module ID (e.g., 'assets', 'findings')
   */
  parentModule: string

  /**
   * Sub-module slug to check (e.g., 'cloud', 'domains', 'certificates')
   */
  subModule: string

  /**
   * Content to render when tenant has access to the sub-module
   */
  children: ReactNode

  /**
   * Custom fallback content when sub-module is not available.
   * If not provided, shows UpgradePrompt component.
   */
  fallback?: ReactNode

  /**
   * Variant of the UpgradePrompt (when using default fallback)
   * @default 'card'
   */
  promptVariant?: 'card' | 'banner' | 'inline'

  /**
   * Show loading skeleton while checking module access
   * @default true
   */
  showLoading?: boolean
}

// ============================================
// COMPONENT
// ============================================

/**
 * SubModuleGate - Gate content based on tenant's subscription plan sub-modules
 */
export function SubModuleGate({
  parentModule,
  subModule,
  children,
  fallback,
  promptVariant = 'card',
  showLoading = true,
}: SubModuleGateProps): ReactNode {
  const { subModules, isLoading } = useTenantModules()

  // Show loading skeleton
  if (isLoading && showLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  // Get sub-modules for the parent module
  const parentSubModules = subModules[parentModule] || []

  // Find the specific sub-module
  const subModuleInfo = parentSubModules.find((m) => m.slug === subModule)

  // Check if sub-module exists and is active
  const hasSubModule =
    subModuleInfo && subModuleInfo.is_active && subModuleInfo.release_status !== 'disabled'

  if (hasSubModule) {
    return children
  }

  // Show custom fallback if provided
  if (fallback !== undefined) {
    return fallback
  }

  // Show UpgradePrompt with sub-module info
  const moduleName = subModuleInfo?.name || `${parentModule}.${subModule}`
  return (
    <UpgradePrompt
      module={`${parentModule}.${subModule}`}
      moduleName={moduleName}
      variant={promptVariant}
    />
  )
}

// ============================================
// HOOK FOR PROGRAMMATIC ACCESS
// ============================================

/**
 * useSubModuleAccess - Check if tenant has access to a specific sub-module
 *
 * @example
 * ```tsx
 * const { hasSubModule, isLoading } = useSubModuleAccess('assets', 'cloud');
 * if (hasSubModule) {
 *   // Show cloud assets feature
 * }
 * ```
 */
export function useSubModuleAccess(parentModule: string, subModule: string) {
  const { subModules, isLoading } = useTenantModules()

  const parentSubModules = subModules[parentModule] || []
  const subModuleInfo = parentSubModules.find((m) => m.slug === subModule)

  const hasSubModule =
    subModuleInfo && subModuleInfo.is_active && subModuleInfo.release_status !== 'disabled'

  return {
    hasSubModule: !!hasSubModule,
    subModuleInfo,
    isLoading,
  }
}

// ============================================
// EXPORTS
// ============================================

export type { SubModuleGateProps }
export default SubModuleGate
