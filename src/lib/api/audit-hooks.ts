/**
 * Audit Log API Hooks
 *
 * SWR hooks for Audit Log functionality
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import { get } from './client'
import { handleApiError } from './error-handler'
import { useTenant } from '@/context/tenant-provider'
import { auditLogEndpoints } from './endpoints'
import type {
  AuditLog,
  AuditLogListResponse,
  AuditLogListFilters,
  AuditLogStats,
  AuditResourceType,
} from './audit-types'

// ============================================
// SWR CONFIGURATION
// ============================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  // Don't retry on client errors (4xx) - only retry on server/network errors
  shouldRetryOnError: (error) => {
    // Don't retry on 4xx errors (client errors like 403, 404, etc.)
    if (error?.statusCode >= 400 && error?.statusCode < 500) {
      return false
    }
    // Retry on 5xx or network errors
    return true
  },
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  dedupingInterval: 2000,
  onError: (error) => {
    handleApiError(error, {
      showToast: false, // Don't show toast for audit logs errors
      logError: true,
    })
  },
}

// ============================================
// CACHE KEYS
// ============================================

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (filters?: AuditLogListFilters) => [...auditLogKeys.lists(), filters] as const,
  details: () => [...auditLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...auditLogKeys.details(), id] as const,
  stats: () => [...auditLogKeys.all, 'stats'] as const,
  resourceHistory: (resourceType: string, resourceId: string) =>
    [...auditLogKeys.all, 'resource', resourceType, resourceId] as const,
  userActivity: (userId: string) => [...auditLogKeys.all, 'user', userId] as const,
}

// ============================================
// FETCHER FUNCTIONS
// ============================================

async function fetchAuditLogs(url: string): Promise<AuditLogListResponse> {
  return get<AuditLogListResponse>(url)
}

async function fetchAuditLog(url: string): Promise<AuditLog> {
  return get<AuditLog>(url)
}

async function fetchAuditLogStats(url: string): Promise<AuditLogStats> {
  return get<AuditLogStats>(url)
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetch audit logs list with optional filters
 */
export function useAuditLogs(filters?: AuditLogListFilters, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant ? auditLogEndpoints.list(filters) : null

  return useSWR<AuditLogListResponse>(key, fetchAuditLogs, {
    ...defaultConfig,
    ...config,
  })
}

/**
 * Fetch a single audit log by ID
 */
export function useAuditLog(logId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant && logId ? auditLogEndpoints.get(logId) : null

  return useSWR<AuditLog>(key, fetchAuditLog, {
    ...defaultConfig,
    ...config,
  })
}

/**
 * Fetch audit log statistics
 */
export function useAuditLogStats(config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant ? auditLogEndpoints.stats() : null

  return useSWR<AuditLogStats>(key, fetchAuditLogStats, {
    ...defaultConfig,
    ...config,
  })
}

/**
 * Fetch audit history for a specific resource
 */
export function useResourceAuditHistory(
  resourceType: AuditResourceType | null,
  resourceId: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key =
    currentTenant && resourceType && resourceId
      ? auditLogEndpoints.resourceHistory(resourceType, resourceId)
      : null

  return useSWR<AuditLogListResponse>(key, fetchAuditLogs, {
    ...defaultConfig,
    ...config,
  })
}

/**
 * Fetch audit activity for a specific user
 */
export function useUserAuditActivity(userId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant && userId ? auditLogEndpoints.userActivity(userId) : null

  return useSWR<AuditLogListResponse>(key, fetchAuditLogs, {
    ...defaultConfig,
    ...config,
  })
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Invalidate audit logs cache
 */
export async function invalidateAuditLogsCache() {
  const { mutate } = await import('swr')
  await mutate((key) => typeof key === 'string' && key.includes('/api/v1/audit-logs'), undefined, {
    revalidate: true,
  })
}
