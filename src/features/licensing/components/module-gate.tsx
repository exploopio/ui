/**
 * ModuleGate Component
 *
 * Conditionally renders children based on tenant's subscription plan modules.
 * Shows UpgradePrompt when tenant doesn't have access to the required module.
 *
 * @example
 * ```tsx
 * // Basic usage - shows UpgradePrompt if module not available
 * <ModuleGate module="findings">
 *   <FindingsPage />
 * </ModuleGate>
 *
 * // With custom fallback
 * <ModuleGate module="compliance" fallback={<ComingSoon />}>
 *   <ComplianceDashboard />
 * </ModuleGate>
 *
 * // Show loading skeleton while checking
 * <ModuleGate module="scans">
 *   <ScansList />
 * </ModuleGate>
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

interface ModuleGateProps {
  /**
   * Module ID to check (e.g., 'findings', 'scans', 'compliance')
   */
  module: string

  /**
   * Content to render when tenant has access to the module
   */
  children: ReactNode

  /**
   * Custom fallback content when module is not available.
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
 * ModuleGate - Gate content based on tenant's subscription plan modules
 */
export function ModuleGate({
  module,
  children,
  fallback,
  promptVariant = 'card',
  showLoading = true,
}: ModuleGateProps): ReactNode {
  const { moduleIds, modules, isLoading } = useTenantModules()

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

  // Check if tenant has access to the module
  const hasModule = moduleIds.includes(module)

  if (hasModule) {
    return children
  }

  // Show custom fallback if provided
  if (fallback !== undefined) {
    return fallback
  }

  // Find module info for UpgradePrompt
  const moduleInfo = modules.find((m) => m.id === module || m.slug === module)

  // Show UpgradePrompt
  return <UpgradePrompt module={module} moduleName={moduleInfo?.name} variant={promptVariant} />
}

// ============================================
// HOOK FOR PROGRAMMATIC ACCESS
// ============================================

/**
 * useModuleAccess - Check if tenant has access to a specific module
 *
 * @example
 * ```tsx
 * const { hasModule, isLoading } = useModuleAccess('findings');
 * if (hasModule) {
 *   // Show findings feature
 * }
 * ```
 */
export function useModuleAccess(moduleId: string) {
  const { moduleIds, isLoading } = useTenantModules()

  return {
    hasModule: moduleIds.includes(moduleId),
    isLoading,
  }
}

// ============================================
// EXPORTS
// ============================================

export type { ModuleGateProps }
export default ModuleGate
