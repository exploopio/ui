/**
 * User Tenant Hooks
 *
 * Custom React hooks for fetching user's tenant memberships
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import { get } from './client'
import { handleApiError } from './error-handler'
import type { TenantMembership } from './user-tenant-types'

// ============================================
// SWR CONFIGURATION
// ============================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  // Don't retry on auth errors (401)
  shouldRetryOnError: (error) => {
    const statusCode = (error as { statusCode?: number }).statusCode
    // Don't retry on 401, 403
    if (statusCode === 401 || statusCode === 403) {
      return false
    }
    return true
  },
  errorRetryCount: 2, // Reduced retry count to prevent hammering backend
  errorRetryInterval: 2000, // Increased interval between retries
  dedupingInterval: 5000, // Increased deduping interval to prevent duplicate requests
  onError: (error) => {
    // Don't show toast for auth errors - TenantGate will handle redirect
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 401) {
      console.log('[useMyTenants] Auth error, will redirect to login')
      return
    }
    handleApiError(error, {
      showToast: true,
      logError: true,
    })
  },
}

// ============================================
// ENDPOINTS
// ============================================

const userTenantEndpoints = {
  /**
   * Get current user's tenants
   */
  myTenants: () => '/api/v1/users/me/tenants',
} as const

// ============================================
// HOOKS
// ============================================

/**
 * Fetch current user's tenants with their roles
 *
 * NOTE: Only fetches when user has a tenant cookie (meaning they have access token).
 * New users without tenants won't have this cookie, so we skip the API call.
 *
 * @example
 * ```typescript
 * function TeamSwitcher() {
 *   const { data: tenants, error, isLoading } = useMyTenants()
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error error={error} />
 *
 *   return (
 *     <Select>
 *       {tenants?.map(tenant => (
 *         <Option key={tenant.id} value={tenant.id}>
 *           {tenant.name} ({tenant.role})
 *         </Option>
 *       ))}
 *     </Select>
 *   )
 * }
 * ```
 */
export function useMyTenants(config?: SWRConfiguration) {
  // Check if user has tenant cookie - if not, skip API call
  // This prevents 401 errors for new users who just logged in but have no tenants
  const hasTenantCookie = typeof window !== 'undefined'
    ? document.cookie.includes('rediver_tenant=')
    : false

  return useSWR<TenantMembership[]>(
    // Only fetch if user has tenant cookie (has access token)
    hasTenantCookie ? userTenantEndpoints.myTenants() : null,
    async (url: string) => {
      console.log('[useMyTenants] Fetching tenants from:', url)
      try {
        const result = await get<TenantMembership[]>(url)
        console.log('[useMyTenants] Got tenants:', result)
        return result
      } catch (error) {
        console.error('[useMyTenants] Error fetching tenants:', error)
        throw error
      }
    },
    { ...defaultConfig, ...config }
  )
}

/**
 * Get cache key for user's tenants
 */
export function getMyTenantsKey() {
  return userTenantEndpoints.myTenants()
}

/**
 * Invalidate user's tenants cache
 */
export async function invalidateMyTenantsCache() {
  const { mutate } = await import('swr')
  await mutate(userTenantEndpoints.myTenants())
}
