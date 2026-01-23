/**
 * Permission Provider
 *
 * Provides real-time permission synchronization for the application.
 * Permissions are cached in localStorage and refreshed when:
 * 1. Version mismatch detected (X-Permission-Stale header)
 * 2. 403 Forbidden error received
 * 3. Tab/window gains focus
 * 4. Polling interval (2 minutes)
 *
 * This replaces the old useMyPermissions hook with a more efficient
 * approach that doesn't embed permissions in JWT.
 */

'use client'

import * as React from 'react'
import {
  getStoredPermissions,
  storePermissions,
  cleanupExpiredPermissions,
} from '@/lib/permission-storage'
import { useTenant } from './tenant-provider'

// ============================================
// TYPES
// ============================================

export interface PermissionContextValue {
  /** Current permissions array */
  permissions: string[]
  /** Current permission version */
  version: number
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Check if user has a specific permission */
  hasPermission: (permission: string) => boolean
  /** Check if user has any of the permissions */
  hasAnyPermission: (permissions: string[]) => boolean
  /** Check if user has all of the permissions */
  hasAllPermissions: (permissions: string[]) => boolean
  /** Force refresh permissions from server */
  refreshPermissions: () => Promise<void>
  /** Permissions are stale (version mismatch detected) */
  isStale: boolean
}

interface PermissionsResponse {
  permissions: string[]
  version: number
}

// ============================================
// CONSTANTS
// ============================================

// Polling interval (2 minutes)
const POLL_INTERVAL_MS = 2 * 60 * 1000

// API endpoint for permission sync
const PERMISSIONS_SYNC_URL = '/api/v1/me/permissions/sync'

// ============================================
// CONTEXT
// ============================================

const PermissionContext = React.createContext<PermissionContextValue | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

interface PermissionProviderProps {
  children: React.ReactNode
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { currentTenant } = useTenant()
  const tenantId = currentTenant?.id || ''

  const [permissions, setPermissions] = React.useState<string[]>([])
  const [version, setVersion] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [isStale, setIsStale] = React.useState(false)
  const [etag, setEtag] = React.useState<string | null>(null)

  // Track current tenant to detect switches
  const previousTenantIdRef = React.useRef<string | null>(null)

  // Cleanup expired permissions on mount
  React.useEffect(() => {
    cleanupExpiredPermissions()
  }, [])

  // Handle tenant switch - reset state and load from cache
  React.useEffect(() => {
    // Skip if no tenant
    if (!tenantId) {
      setPermissions([])
      setVersion(0)
      setIsLoading(false)
      return
    }

    // Skip if same tenant (not a switch)
    if (previousTenantIdRef.current === tenantId) {
      return
    }

    // Tenant changed - reset state
    previousTenantIdRef.current = tenantId
    setIsLoading(true)
    setEtag(null) // Clear ETag to force full fetch
    setError(null)
    setIsStale(false)

    // Try to load from localStorage cache first (instant UI)
    // IMPORTANT: We still keep isLoading=true until API confirms
    // This prevents showing stale permissions when admin revokes access
    const stored = getStoredPermissions(tenantId)
    if (stored) {
      setPermissions(stored.permissions)
      setVersion(stored.version)
      // NOTE: Don't set isLoading=false here - wait for API to confirm
      // This ensures we always get fresh permissions from backend
      // The sidebar will show loading state briefly but will be accurate
    } else {
      // No cache - show empty until API returns
      setPermissions([])
      setVersion(0)
    }
  }, [tenantId])

  // Fetch permissions from server
  const fetchPermissions = React.useCallback(
    async (force = false) => {
      if (!tenantId) {
        setPermissions([])
        setVersion(0)
        setIsLoading(false)
        return
      }

      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        // Use ETag for conditional request (unless forced)
        if (!force && etag) {
          headers['If-None-Match'] = etag
        }

        const response = await fetch(PERMISSIONS_SYNC_URL, {
          method: 'GET',
          headers,
          credentials: 'include',
        })

        // 304 Not Modified - permissions unchanged
        if (response.status === 304) {
          setIsStale(false)
          setIsLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch permissions: ${response.status}`)
        }

        const data: PermissionsResponse = await response.json()

        // Store in state
        setPermissions(data.permissions)
        setVersion(data.version)
        setError(null)
        setIsStale(false)

        // Update ETag
        const newEtag = response.headers.get('ETag')
        if (newEtag) {
          setEtag(newEtag)
        }

        // Store in localStorage
        storePermissions(tenantId, data.permissions, data.version)
      } catch (err) {
        console.error('[PermissionProvider] Failed to fetch permissions:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))

        // On error, use cached permissions if available
        const stored = getStoredPermissions(tenantId)
        if (stored) {
          setPermissions(stored.permissions)
          setVersion(stored.version)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [tenantId, etag]
  )

  // Force refresh (ignores ETag)
  const refreshPermissions = React.useCallback(async () => {
    setIsLoading(true)
    setEtag(null) // Clear ETag to force full fetch
    await fetchPermissions(true)
  }, [fetchPermissions])

  // Initial fetch
  React.useEffect(() => {
    if (!tenantId) return
    fetchPermissions()
  }, [tenantId, fetchPermissions])

  // Polling for updates
  React.useEffect(() => {
    if (!tenantId) return

    const intervalId = setInterval(() => {
      fetchPermissions()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [tenantId, fetchPermissions])

  // Refetch on tab focus
  React.useEffect(() => {
    const handleFocus = () => {
      if (tenantId) {
        fetchPermissions()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [tenantId, fetchPermissions])

  // Handle stale detection from API responses (via custom event)
  React.useEffect(() => {
    const handleStale = () => {
      setIsStale(true)
      refreshPermissions()
    }

    window.addEventListener('permission-stale', handleStale)
    return () => window.removeEventListener('permission-stale', handleStale)
  }, [refreshPermissions])

  // Permission check functions
  const hasPermission = React.useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions]
  )

  const hasAnyPermission = React.useCallback(
    (perms: string[]) => perms.some((p) => permissions.includes(p)),
    [permissions]
  )

  const hasAllPermissions = React.useCallback(
    (perms: string[]) => perms.every((p) => permissions.includes(p)),
    [permissions]
  )

  const value = React.useMemo<PermissionContextValue>(
    () => ({
      permissions,
      version,
      isLoading,
      error,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refreshPermissions,
      isStale,
    }),
    [
      permissions,
      version,
      isLoading,
      error,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refreshPermissions,
      isStale,
    ]
  )

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook to access permission context (throws if outside provider)
 */
export function usePermissions() {
  const context = React.useContext(PermissionContext)
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}

/**
 * Default context value for when outside PermissionProvider
 */
const defaultContextValue: PermissionContextValue = {
  permissions: [],
  version: 0,
  isLoading: false,
  error: null,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  refreshPermissions: async () => {},
  isStale: false,
}

/**
 * Safe hook that returns default value when outside provider
 * Use this in components that might be rendered outside PermissionProvider
 */
export function usePermissionsSafe(): PermissionContextValue {
  const context = React.useContext(PermissionContext)
  return context ?? defaultContextValue
}

// ============================================
// UTILITIES
// ============================================

/**
 * Dispatch a permission-stale event to trigger refresh
 * Call this from API interceptor when X-Permission-Stale header is detected
 */
export function dispatchPermissionStaleEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('permission-stale'))
  }
}

/**
 * Dispatch a permission-stale event on 403 Forbidden error
 * Call this from API interceptor when 403 error is received
 */
export function handleForbiddenError() {
  console.warn('[Permission] 403 Forbidden - triggering permission refresh')
  dispatchPermissionStaleEvent()
}
