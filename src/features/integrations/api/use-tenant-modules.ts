/**
 * Tenant Modules API Hook
 *
 * SWR hook for fetching tenant's enabled modules based on their subscription plan.
 * Used for filtering available event types in notification channels and other
 * module-gated features.
 *
 * The endpoint returns modules enabled for the current tenant, including
 * the event types that map to each module.
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import { get } from '@/lib/api/client'
import { handleApiError } from '@/lib/api/error-handler'
import type { NotificationEventType } from '../types/integration.types'

// ============================================
// TYPES
// ============================================

/**
 * Release status for a module
 */
export type ReleaseStatus = 'released' | 'coming_soon' | 'beta' | 'deprecated'

/**
 * Licensing module from backend
 */
export interface LicensingModule {
  id: string
  slug: string
  name: string
  description?: string
  icon?: string
  category: string
  display_order: number
  is_active: boolean
  release_status: ReleaseStatus
  event_types?: string[]
}

/**
 * Response from tenant modules endpoint
 */
export interface TenantModulesResponse {
  module_ids: string[]
  modules: LicensingModule[]
  event_types?: NotificationEventType[]
  coming_soon_module_ids?: string[]
  beta_module_ids?: string[]
}

// ============================================
// CONFIGURATION
// ============================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // Cache for 1 minute
  onError: (error) => {
    handleApiError(error, {
      showToast: false, // Silently fail - modules will default to empty
      logError: true,
    })
  },
}

// ============================================
// HOOK
// ============================================

/**
 * Fetch tenant's enabled modules based on their subscription plan
 *
 * @returns Object with module IDs, module details, and available event types
 *
 * @example
 * ```tsx
 * const { moduleIds, modules, eventTypes, isLoading } = useTenantModules();
 *
 * // Filter event types based on enabled modules
 * const availableEventTypes = getAvailableEventTypes(moduleIds);
 * ```
 */
export function useTenantModules() {
  const { data, error, isLoading, mutate } = useSWR<TenantModulesResponse>(
    '/api/v1/me/modules',
    async (url: string) => {
      try {
        return await get<TenantModulesResponse>(url)
      } catch {
        // Return empty data if endpoint not available
        // This allows the UI to gracefully degrade
        return {
          module_ids: [],
          modules: [],
          event_types: [],
        }
      }
    },
    defaultConfig
  )

  return {
    /** Array of enabled module IDs (e.g., ['dashboard', 'assets', 'findings']) */
    moduleIds: data?.module_ids || [],
    /** Full module objects with details */
    modules: data?.modules || [],
    /** Pre-computed available event types for this tenant */
    eventTypes: data?.event_types || [],
    /** Module IDs that are coming soon */
    comingSoonModuleIds: data?.coming_soon_module_ids || [],
    /** Module IDs that are in beta */
    betaModuleIds: data?.beta_module_ids || [],
    /** Loading state */
    isLoading,
    /** Error object if request failed */
    error,
    /** Refetch function */
    mutate,
  }
}

/**
 * Check if a specific module is enabled for the current tenant
 *
 * @param moduleId - The module ID to check (e.g., 'findings', 'scans')
 * @returns Object with hasModule boolean and loading state
 *
 * @example
 * ```tsx
 * const { hasModule, isLoading } = useHasModule('findings');
 * if (hasModule) {
 *   // Show findings-related features
 * }
 * ```
 */
export function useHasModule(moduleId: string) {
  const { moduleIds, isLoading } = useTenantModules()

  return {
    hasModule: moduleIds.includes(moduleId),
    isLoading,
  }
}
