/**
 * Finding Activity API Hooks
 *
 * SWR hooks for fetching finding activity/audit trail data from backend
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import { get } from '@/lib/api/client'
import { handleApiError } from '@/lib/api/error-handler'
import { useTenant } from '@/context/tenant-provider'
import type { Activity, ActivityType } from '../types'

// ============================================
// API TYPES
// ============================================

/**
 * API response for a single activity
 */
export interface ApiFindingActivity {
  id: string
  finding_id: string
  activity_type: string // maps to ActivityType
  actor_id?: string
  actor_type: string // user, system, scanner, integration, ai
  actor_name?: string
  actor_email?: string
  changes: Record<string, unknown>
  source?: string
  source_metadata?: Record<string, unknown>
  created_at: string
}

/**
 * Paginated API response for activities
 */
export interface ApiFindingActivityListResponse {
  data: ApiFindingActivity[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ============================================
// SWR CONFIGURATION
// ============================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: (error) => {
    if (error?.statusCode >= 400 && error?.statusCode < 500) {
      return false
    }
    return true
  },
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  dedupingInterval: 2000,
  onError: (error) => {
    handleApiError(error, {
      showToast: false, // Activities are not critical - don't show toast
      logError: true,
    })
  },
}

// ============================================
// DATA FETCHERS
// ============================================

async function fetchActivities(url: string): Promise<ApiFindingActivityListResponse> {
  return get<ApiFindingActivityListResponse>(url)
}

// ============================================
// MAPPERS
// ============================================

/**
 * Map API activity type to frontend ActivityType
 */
function mapActivityType(apiType: string): ActivityType {
  // Map backend activity types to frontend types
  const typeMap: Record<string, ActivityType> = {
    created: 'created',
    status_changed: 'status_changed',
    severity_changed: 'severity_changed',
    resolved: 'status_changed', // resolved is a status change
    reopened: 'reopened',
    assigned: 'assigned',
    unassigned: 'unassigned',
    triage_updated: 'status_changed',
    false_positive_marked: 'false_positive_marked',
    duplicate_marked: 'duplicate_marked',
    comment_added: 'comment',
    comment_updated: 'comment',
    comment_deleted: 'comment',
    scan_detected: 'created',
    auto_resolved: 'status_changed',
    auto_reopened: 'reopened',
    linked: 'linked',
    unlinked: 'linked',
    sla_warning: 'status_changed',
    sla_breach: 'status_changed',
    ai_triage: 'ai_triage',
  }
  return typeMap[apiType] || 'status_changed'
}

/**
 * Map API activity to frontend Activity type
 */
function mapActivity(api: ApiFindingActivity): Activity {
  const actorType = api.actor_type
  const actor =
    actorType === 'system'
      ? ('system' as const)
      : actorType === 'ai'
        ? ('ai' as const)
        : {
            id: api.actor_id || 'unknown',
            name: api.actor_name || 'Unknown User',
            email: api.actor_email || '',
            role: 'analyst' as const,
          }

  // Extract values from changes JSONB
  const changes = api.changes || {}
  const previousValue = (changes.old_status as string) || (changes.old_severity as string)
  const newValue = (changes.new_status as string) || (changes.new_severity as string)
  const reason = changes.reason as string | undefined
  const content = changes.preview as string | undefined

  return {
    id: api.id,
    type: mapActivityType(api.activity_type),
    actor,
    content,
    metadata: api.source_metadata,
    previousValue,
    newValue,
    reason,
    createdAt: api.created_at,
  }
}

// ============================================
// API HOOKS
// ============================================

interface ActivityFilters {
  page?: number
  pageSize?: number
  activityTypes?: string[]
}

/**
 * Fetch activities for a finding
 */
export function useFindingActivitiesApi(
  findingId: string | null,
  filters?: ActivityFilters,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  // Build URL with filters
  let url = findingId ? `/api/v1/findings/${findingId}/activities` : null

  if (url && filters) {
    const params = new URLSearchParams()
    if (filters.page !== undefined) params.set('page', String(filters.page))
    if (filters.pageSize !== undefined) params.set('page_size', String(filters.pageSize))
    if (filters.activityTypes?.length) params.set('activity_types', filters.activityTypes.join(','))
    const queryString = params.toString()
    if (queryString) url = `${url}?${queryString}`
  }

  const key = currentTenant && url ? url : null

  const { data, error, isLoading, mutate } = useSWR<ApiFindingActivityListResponse>(
    key,
    fetchActivities,
    { ...defaultConfig, ...config }
  )

  // Map API response to frontend Activity type
  const activities: Activity[] = data?.data?.map(mapActivity) || []

  return {
    activities,
    total: data?.total || 0,
    page: data?.page || 0,
    pageSize: data?.page_size || 20,
    totalPages: data?.total_pages || 0,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Get a single activity by ID
 */
export function useFindingActivityApi(
  findingId: string | null,
  activityId: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key =
    currentTenant && findingId && activityId
      ? `/api/v1/findings/${findingId}/activities/${activityId}`
      : null

  const { data, error, isLoading, mutate } = useSWR<ApiFindingActivity>(key, get, {
    ...defaultConfig,
    ...config,
  })

  const activity = data ? mapActivity(data) : null

  return {
    activity,
    isLoading,
    error,
    mutate,
  }
}
