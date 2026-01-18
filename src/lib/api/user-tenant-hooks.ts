/**
 * User Tenant Hooks
 *
 * Custom React hooks for fetching user's tenant memberships
 */

'use client'

import * as React from 'react'
import useSWR, { type SWRConfiguration } from 'swr'
import { get } from './client'
import { handleApiError } from './error-handler'
import type { TenantMembership } from './user-tenant-types'

// ============================================
// SWR CONFIGURATION
// ============================================

/**
 * Optimized SWR config for tenant list
 *
 * Rationale:
 * - Team list rarely changes (user joins/leaves teams infrequently)
 * - Eager loading is required for auth validation and TenantGate
 * - Long cache duration reduces unnecessary API calls
 * - keepPreviousData provides instant UI while revalidating
 */
const defaultConfig: SWRConfiguration = {
  // Cache & Revalidation
  dedupingInterval: 60000, // 60s - team list rarely changes
  revalidateOnFocus: false, // Don't refetch on window focus
  revalidateOnReconnect: true, // Refetch when network reconnects
  revalidateIfStale: true, // Background revalidate if data is stale
  keepPreviousData: true, // Show stale data while fetching (no loading flash)

  // Error handling
  shouldRetryOnError: (error) => {
    const statusCode = (error as { statusCode?: number }).statusCode
    // Don't retry on auth errors (401, 403)
    if (statusCode === 401 || statusCode === 403) {
      return false
    }
    return true
  },
  errorRetryCount: 2,
  errorRetryInterval: 3000, // 3s between retries

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
 * IMPORTANT: This hook ALWAYS makes an API call to:
 * 1. Validate the user's auth token (returns 401 if invalid)
 * 2. Fetch the user's tenants (returns empty array if new user)
 *
 * The API call is essential for auth validation, even if user has no tenant cookie.
 * TenantGate relies on this to properly redirect:
 * - 401 error → redirect to /login
 * - Empty tenants → redirect to /onboarding
 * - Has tenants → show dashboard
 *
 * NOTE: We cannot check for refresh_token cookies because they are HttpOnly.
 * We must always make the API call and let the server validate auth.
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
  // Track if component has mounted on client
  // This prevents SSR/hydration issues with SWR
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // ALWAYS make the API call to validate auth
  // We cannot check HttpOnly cookies from client-side JavaScript
  // The API will return 401 if user is not authenticated
  const swrKey = isMounted ? userTenantEndpoints.myTenants() : null

  const result = useSWR<TenantMembership[]>(
    swrKey,
    (url: string) => get<TenantMembership[]>(url),
    { ...defaultConfig, ...config }
  )

  // Return with custom isLoading that includes mount check
  // With keepPreviousData, we only show loading on initial fetch (no data yet)
  return {
    ...result,
    isLoading: !isMounted || (result.isLoading && !result.data),
  }
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
