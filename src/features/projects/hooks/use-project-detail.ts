/**
 * Project Detail Hooks
 *
 * SWR hooks for project detail features:
 * - Findings management with triage workflow
 * - Activity/audit log
 * - SLA policy management
 * - Branch comparison
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'
import { get, post, put, patch } from '@/lib/api/client'
import { handleApiError } from '@/lib/api/error-handler'
import { useTenant } from '@/context/tenant-provider'
import type {
  FindingDetail,
  FindingFilters,
  FindingStatus,
  TriageStatus,
  ActivityLog,
  ActivityFilters,
  SLAPolicy,
  BranchDetail,
  BranchComparison,
  FindingComment,
} from '../types/project.types'

// ============================================
// SWR CONFIGURATION
// ============================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  dedupingInterval: 2000,
  onError: (error) => {
    handleApiError(error, {
      showToast: true,
      logError: true,
    })
  },
}

// ============================================
// RESPONSE TYPES
// ============================================

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ============================================
// ENDPOINT BUILDERS
// ============================================

function buildProjectFindingsEndpoint(projectId: string, filters?: FindingFilters): string {
  const baseUrl = `/api/v1/projects/${projectId}/findings`

  if (!filters) return baseUrl

  const params = new URLSearchParams()

  // Text search
  if (filters.search) params.set('search', filters.search)

  // Location filters
  if (filters.branches?.length) params.set('branches', filters.branches.join(','))
  if (filters.file_paths?.length) params.set('file_paths', filters.file_paths.join(','))

  // Classification filters
  if (filters.scanner_types?.length) params.set('scanner_types', filters.scanner_types.join(','))
  if (filters.severities?.length) params.set('severities', filters.severities.join(','))
  if (filters.rule_ids?.length) params.set('rule_ids', filters.rule_ids.join(','))
  if (filters.cwe_ids?.length) params.set('cwe_ids', filters.cwe_ids.join(','))

  // Status filters
  if (filters.statuses?.length) params.set('statuses', filters.statuses.join(','))
  if (filters.triage_statuses?.length) params.set('triage_statuses', filters.triage_statuses.join(','))
  if (filters.sla_statuses?.length) params.set('sla_statuses', filters.sla_statuses.join(','))

  // Ownership filters
  if (filters.assigned_to?.length) params.set('assigned_to', filters.assigned_to.join(','))
  if (filters.unassigned !== undefined) params.set('unassigned', String(filters.unassigned))

  // Date filters
  if (filters.first_detected_after) params.set('first_detected_after', filters.first_detected_after)
  if (filters.first_detected_before) params.set('first_detected_before', filters.first_detected_before)

  // Pagination & sorting
  if (filters.sort_by) params.set('sort_by', filters.sort_by)
  if (filters.sort_order) params.set('sort_order', filters.sort_order)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

function buildProjectActivitiesEndpoint(projectId: string, filters?: ActivityFilters): string {
  const baseUrl = `/api/v1/projects/${projectId}/activities`

  if (!filters) return baseUrl

  const params = new URLSearchParams()

  // Action filters
  if (filters.actions?.length) params.set('actions', filters.actions.join(','))
  if (filters.entity_types?.length) params.set('entity_types', filters.entity_types.join(','))
  if (filters.actor_ids?.length) params.set('actor_ids', filters.actor_ids.join(','))
  if (filters.actor_types?.length) params.set('actor_types', filters.actor_types.join(','))

  // Date filters
  if (filters.from_date) params.set('from_date', filters.from_date)
  if (filters.to_date) params.set('to_date', filters.to_date)

  // Pagination
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// ============================================
// FINDINGS HOOKS
// ============================================

/**
 * Fetch findings for a project with filters
 *
 * @example
 * ```typescript
 * function FindingsList({ projectId }: { projectId: string }) {
 *   const { findings, total, isLoading } = useProjectFindings(projectId, {
 *     severities: ['critical', 'high'],
 *     statuses: ['open'],
 *   })
 *
 *   if (isLoading) return <Loading />
 *   return <FindingsTable findings={findings} />
 * }
 * ```
 */
export function useProjectFindings(
  projectId: string | null,
  filters?: FindingFilters,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key = currentTenant && projectId
    ? buildProjectFindingsEndpoint(projectId, filters)
    : null

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<FindingDetail>>(
    key,
    (url: string) => get<PaginatedResponse<FindingDetail>>(url),
    { ...defaultConfig, ...config }
  )

  return {
    findings: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    perPage: data?.per_page ?? 20,
    totalPages: data?.total_pages ?? 0,
    error,
    isLoading,
    mutate,
  }
}

/**
 * Fetch a single finding by ID
 */
export function useFinding(
  projectId: string | null,
  findingId: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key = currentTenant && projectId && findingId
    ? `/api/v1/projects/${projectId}/findings/${findingId}`
    : null

  return useSWR<FindingDetail>(
    key,
    (url: string) => get<FindingDetail>(url),
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch comments for a finding
 */
export function useFindingComments(
  projectId: string | null,
  findingId: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key = currentTenant && projectId && findingId
    ? `/api/v1/projects/${projectId}/findings/${findingId}/comments`
    : null

  return useSWR<FindingComment[]>(
    key,
    (url: string) => get<FindingComment[]>(url),
    { ...defaultConfig, ...config }
  )
}

// ============================================
// FINDING MUTATION HOOKS
// ============================================

interface UpdateFindingStatusInput {
  status: FindingStatus
  comment?: string
}

interface UpdateFindingTriageInput {
  triage_status: TriageStatus
  triage_reason?: string
  comment?: string
}

interface AssignFindingInput {
  assigned_to: string
  comment?: string
}

interface AddFindingCommentInput {
  content: string
}

interface BulkUpdateFindingsInput {
  finding_ids: string[]
  status?: FindingStatus
  triage_status?: TriageStatus
  assigned_to?: string
  comment?: string
}

/**
 * Update finding status
 */
export function useUpdateFindingStatus(projectId: string, findingId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId && findingId
      ? `/api/v1/projects/${projectId}/findings/${findingId}/status`
      : null,
    async (url: string, { arg }: { arg: UpdateFindingStatusInput }) => {
      return patch<FindingDetail>(url, arg)
    }
  )
}

/**
 * Update finding triage status
 */
export function useUpdateFindingTriage(projectId: string, findingId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId && findingId
      ? `/api/v1/projects/${projectId}/findings/${findingId}/triage`
      : null,
    async (url: string, { arg }: { arg: UpdateFindingTriageInput }) => {
      return patch<FindingDetail>(url, arg)
    }
  )
}

/**
 * Assign finding to user
 */
export function useAssignFinding(projectId: string, findingId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId && findingId
      ? `/api/v1/projects/${projectId}/findings/${findingId}/assign`
      : null,
    async (url: string, { arg }: { arg: AssignFindingInput }) => {
      return patch<FindingDetail>(url, arg)
    }
  )
}

/**
 * Add comment to finding
 */
export function useAddFindingComment(projectId: string, findingId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId && findingId
      ? `/api/v1/projects/${projectId}/findings/${findingId}/comments`
      : null,
    async (url: string, { arg }: { arg: AddFindingCommentInput }) => {
      return post<FindingComment>(url, arg)
    }
  )
}

/**
 * Bulk update findings
 */
export function useBulkUpdateFindings(projectId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId
      ? `/api/v1/projects/${projectId}/findings/bulk-update`
      : null,
    async (url: string, { arg }: { arg: BulkUpdateFindingsInput }) => {
      return post<{ updated: number }>(url, arg)
    }
  )
}

// ============================================
// ACTIVITY HOOKS
// ============================================

/**
 * Fetch activity logs for a project
 *
 * @example
 * ```typescript
 * function ActivityTimeline({ projectId }: { projectId: string }) {
 *   const { activities, isLoading } = useProjectActivities(projectId, {
 *     actions: ['scan_completed', 'finding_resolved'],
 *   })
 *
 *   return <Timeline activities={activities} />
 * }
 * ```
 */
export function useProjectActivities(
  projectId: string | null,
  filters?: ActivityFilters,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key = currentTenant && projectId
    ? buildProjectActivitiesEndpoint(projectId, filters)
    : null

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<ActivityLog>>(
    key,
    (url: string) => get<PaginatedResponse<ActivityLog>>(url),
    { ...defaultConfig, ...config }
  )

  return {
    activities: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    perPage: data?.per_page ?? 20,
    totalPages: data?.total_pages ?? 0,
    error,
    isLoading,
    mutate,
  }
}

// ============================================
// BRANCH HOOKS
// ============================================

/**
 * Fetch detailed branch information for a project
 */
export function useProjectBranchesDetail(
  projectId: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key = currentTenant && projectId
    ? `/api/v1/projects/${projectId}/branches?detail=true`
    : null

  return useSWR<BranchDetail[]>(
    key,
    (url: string) => get<BranchDetail[]>(url),
    { ...defaultConfig, ...config }
  )
}

/**
 * Compare two branches for findings differences
 */
export function useBranchComparison(
  projectId: string | null,
  fromBranch: string | null,
  toBranch: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key = currentTenant && projectId && fromBranch && toBranch
    ? `/api/v1/projects/${projectId}/branches/compare?from=${encodeURIComponent(fromBranch)}&to=${encodeURIComponent(toBranch)}`
    : null

  return useSWR<BranchComparison>(
    key,
    (url: string) => get<BranchComparison>(url),
    { ...defaultConfig, ...config }
  )
}

// ============================================
// SLA POLICY HOOKS
// ============================================

/**
 * Fetch SLA policy for a project
 */
export function useProjectSLAPolicy(
  projectId: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key = currentTenant && projectId
    ? `/api/v1/projects/${projectId}/sla-policy`
    : null

  return useSWR<SLAPolicy>(
    key,
    (url: string) => get<SLAPolicy>(url),
    { ...defaultConfig, ...config }
  )
}

/**
 * Update SLA policy for a project
 */
export function useUpdateProjectSLAPolicy(projectId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId
      ? `/api/v1/projects/${projectId}/sla-policy`
      : null,
    async (url: string, { arg }: { arg: Partial<SLAPolicy> }) => {
      return put<SLAPolicy>(url, arg)
    }
  )
}

// ============================================
// PROJECT DETAIL COMPOSITE HOOK
// ============================================

interface ProjectDetailOptions {
  findingsLimit?: number
  activitiesLimit?: number
}

/**
 * Composite hook for project detail page
 * Fetches all data needed for the project detail view
 *
 * @example
 * ```typescript
 * function ProjectDetailPage({ id }: { id: string }) {
 *   const {
 *     project,
 *     branches,
 *     recentFindings,
 *     recentActivities,
 *     slaPolicy,
 *     isLoading,
 *   } = useProjectDetail(id)
 *
 *   if (isLoading) return <Loading />
 *   return <ProjectDetailView data={...} />
 * }
 * ```
 */
export function useProjectDetail(
  projectId: string | null,
  options: ProjectDetailOptions = {},
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()
  const { findingsLimit = 10, activitiesLimit = 15 } = options

  // Fetch project
  const projectKey = currentTenant && projectId
    ? `/api/v1/projects/${projectId}?expand=findings_summary`
    : null

  const { data: project, error: projectError, isLoading: projectLoading } = useSWR(
    projectKey,
    (url: string) => get(url),
    { ...defaultConfig, ...config }
  )

  // Fetch branches
  const { data: branches, isLoading: branchesLoading } = useProjectBranchesDetail(
    projectId,
    config
  )

  // Fetch recent findings
  const { findings: recentFindings, isLoading: findingsLoading } = useProjectFindings(
    projectId,
    { per_page: findingsLimit, sort_by: 'first_detected_at', sort_order: 'desc' },
    config
  )

  // Fetch recent activities
  const { activities: recentActivities, isLoading: activitiesLoading } = useProjectActivities(
    projectId,
    { per_page: activitiesLimit },
    config
  )

  // Fetch SLA policy
  const { data: slaPolicy, isLoading: slaLoading } = useProjectSLAPolicy(projectId, config)

  return {
    project,
    branches: branches ?? [],
    recentFindings,
    recentActivities,
    slaPolicy,
    error: projectError,
    isLoading: projectLoading || branchesLoading || findingsLoading || activitiesLoading || slaLoading,
  }
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Get cache key for project findings
 */
export function getProjectFindingsKey(projectId: string, filters?: FindingFilters) {
  return buildProjectFindingsEndpoint(projectId, filters)
}

/**
 * Get cache key for project activities
 */
export function getProjectActivitiesKey(projectId: string, filters?: ActivityFilters) {
  return buildProjectActivitiesEndpoint(projectId, filters)
}

/**
 * Invalidate project findings cache
 */
export async function invalidateProjectFindingsCache(projectId: string) {
  const { mutate } = await import('swr')
  await mutate(
    (key) => typeof key === 'string' && key.includes(`/api/v1/projects/${projectId}/findings`),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate project activities cache
 */
export async function invalidateProjectActivitiesCache(projectId: string) {
  const { mutate } = await import('swr')
  await mutate(
    (key) => typeof key === 'string' && key.includes(`/api/v1/projects/${projectId}/activities`),
    undefined,
    { revalidate: true }
  )
}
