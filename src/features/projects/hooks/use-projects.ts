/**
 * Project Hooks
 *
 * SWR hooks for fetching and mutating project data
 * Supports SCM connections, project import, and comprehensive project management
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'
import { get, post, put, del } from '@/lib/api/client'
import { handleApiError } from '@/lib/api/error-handler'
import { useTenant } from '@/context/tenant-provider'
import type {
  Project,
  ProjectListResponse,
  ProjectFilters,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStats,
  ProjectScan,
  TriggerScanInput,
  SCMConnection,
  CreateSCMConnectionInput,
  ImportJob,
  ImportPreview,
  ProjectImportConfig,
  Branch,
  BranchConfig,
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
// ENDPOINT BUILDERS
// ============================================

// Note: Tenant is now determined from JWT token (token-based tenant)
// No need to include tenant in URL path

function buildProjectsEndpoint(filters?: ProjectFilters): string {
  const baseUrl = '/api/v1/projects'

  if (!filters) return baseUrl

  const params = new URLSearchParams()

  // Text search
  if (filters.name) params.set('name', filters.name)
  if (filters.search) params.set('search', filters.search)

  // SCM filters
  if (filters.scm_providers?.length) params.set('scm_providers', filters.scm_providers.join(','))
  if (filters.scm_connection_ids?.length) params.set('scm_connection_ids', filters.scm_connection_ids.join(','))
  if (filters.scm_organizations?.length) params.set('scm_organizations', filters.scm_organizations.join(','))

  // Status filters
  if (filters.visibilities?.length) params.set('visibilities', filters.visibilities.join(','))
  if (filters.statuses?.length) params.set('statuses', filters.statuses.join(','))
  if (filters.sync_statuses?.length) params.set('sync_statuses', filters.sync_statuses.join(','))
  if (filters.compliance_statuses?.length) params.set('compliance_statuses', filters.compliance_statuses.join(','))
  if (filters.quality_gate_statuses?.length) params.set('quality_gate_statuses', filters.quality_gate_statuses.join(','))

  // Classification filters
  if (filters.criticalities?.length) params.set('criticalities', filters.criticalities.join(','))
  if (filters.scopes?.length) params.set('scopes', filters.scopes.join(','))
  if (filters.exposures?.length) params.set('exposures', filters.exposures.join(','))

  // Other filters
  if (filters.languages?.length) params.set('languages', filters.languages.join(','))
  if (filters.tags?.length) params.set('tags', filters.tags.join(','))
  if (filters.group_ids?.length) params.set('group_ids', filters.group_ids.join(','))
  if (filters.team_ids?.length) params.set('team_ids', filters.team_ids.join(','))
  if (filters.policy_ids?.length) params.set('policy_ids', filters.policy_ids.join(','))

  // Finding filters
  if (filters.has_findings !== undefined) params.set('has_findings', String(filters.has_findings))
  if (filters.has_critical_findings !== undefined) params.set('has_critical_findings', String(filters.has_critical_findings))
  if (filters.min_risk_score !== undefined) params.set('min_risk_score', String(filters.min_risk_score))
  if (filters.max_risk_score !== undefined) params.set('max_risk_score', String(filters.max_risk_score))

  // Date filters
  if (filters.last_scanned_after) params.set('last_scanned_after', filters.last_scanned_after)
  if (filters.last_scanned_before) params.set('last_scanned_before', filters.last_scanned_before)
  if (filters.created_after) params.set('created_after', filters.created_after)
  if (filters.created_before) params.set('created_before', filters.created_before)

  // Pagination & sorting
  if (filters.sort_by) params.set('sort_by', filters.sort_by)
  if (filters.sort_order) params.set('sort_order', filters.sort_order)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

function buildProjectEndpoint(projectId: string): string {
  return `/api/v1/projects/${projectId}`
}

function buildSCMConnectionsEndpoint(): string {
  return '/api/v1/scm-connections'
}

function buildSCMConnectionEndpoint(connectionId: string): string {
  return `/api/v1/scm-connections/${connectionId}`
}

function buildImportEndpoint(): string {
  return '/api/v1/projects/import'
}

function buildImportPreviewEndpoint(): string {
  return '/api/v1/projects/import/preview'
}

function buildImportJobEndpoint(jobId: string): string {
  return `/api/v1/projects/import/${jobId}`
}

// ============================================
// FETCHER FUNCTIONS
// ============================================

async function fetchProjects(url: string): Promise<ProjectListResponse> {
  return get<ProjectListResponse>(url)
}

async function fetchProject(url: string): Promise<Project> {
  return get<Project>(url)
}

async function fetchProjectStats(url: string): Promise<ProjectStats> {
  return get<ProjectStats>(url)
}

async function fetchSCMConnections(url: string): Promise<SCMConnection[]> {
  return get<SCMConnection[]>(url)
}

async function fetchSCMConnection(url: string): Promise<SCMConnection> {
  return get<SCMConnection>(url)
}

async function fetchProjectScans(url: string): Promise<ProjectScan[]> {
  return get<ProjectScan[]>(url)
}

async function fetchProjectBranches(url: string): Promise<Branch[]> {
  return get<Branch[]>(url)
}

async function fetchImportJob(url: string): Promise<ImportJob> {
  return get<ImportJob>(url)
}

// ============================================
// PROJECT HOOKS
// ============================================

/**
 * Fetch projects list for current tenant
 *
 * @example
 * ```typescript
 * function ProjectList() {
 *   const { data, error, isLoading } = useProjects({ page: 1, per_page: 20 })
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error error={error} />
 *
 *   return (
 *     <ul>
 *       {data?.data.map(project => (
 *         <li key={project.id}>{project.name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useProjects(filters?: ProjectFilters, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  // Only fetch if user has a current tenant (token will contain tenant_id)
  const key = currentTenant ? buildProjectsEndpoint(filters) : null

  return useSWR<ProjectListResponse>(
    key,
    fetchProjects,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch a single project by ID
 *
 * @example
 * ```typescript
 * function ProjectDetail({ id }: { id: string }) {
 *   const { data: project, error, isLoading } = useProject(id)
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error error={error} />
 *
 *   return <h1>{project?.name}</h1>
 * }
 * ```
 */
export function useProject(projectId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant && projectId ? buildProjectEndpoint(projectId) : null

  return useSWR<Project>(
    key,
    fetchProject,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch project statistics
 */
export function useProjectStats(config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant ? '/api/v1/projects/stats' : null

  return useSWR<ProjectStats>(
    key,
    fetchProjectStats,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch scans for a project
 */
export function useProjectScans(projectId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant && projectId ? `${buildProjectEndpoint(projectId)}/scans` : null

  return useSWR<ProjectScan[]>(
    key,
    fetchProjectScans,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch branches for a project
 */
export function useProjectBranches(projectId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant && projectId ? `${buildProjectEndpoint(projectId)}/branches` : null

  return useSWR<Branch[]>(
    key,
    fetchProjectBranches,
    { ...defaultConfig, ...config }
  )
}

// ============================================
// PROJECT MUTATION HOOKS
// ============================================

/**
 * Create a new project
 */
export function useCreateProject() {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant ? '/api/v1/projects' : null,
    async (url: string, { arg }: { arg: CreateProjectInput }) => {
      return post<Project>(url, arg)
    }
  )
}

/**
 * Update an existing project
 */
export function useUpdateProject(projectId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId ? buildProjectEndpoint(projectId) : null,
    async (url: string, { arg }: { arg: UpdateProjectInput }) => {
      return put<Project>(url, arg)
    }
  )
}

/**
 * Delete a project
 */
export function useDeleteProject(projectId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId ? buildProjectEndpoint(projectId) : null,
    async (url: string) => {
      return del<void>(url)
    }
  )
}

/**
 * Trigger a scan for a project
 */
export function useTriggerProjectScan(projectId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId ? `${buildProjectEndpoint(projectId)}/scan` : null,
    async (url: string, { arg }: { arg: TriggerScanInput }) => {
      return post<ProjectScan>(url, arg)
    }
  )
}

/**
 * Sync a project with SCM
 */
export function useSyncProject(projectId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId ? `${buildProjectEndpoint(projectId)}/sync` : null,
    async (url: string) => {
      return post<Project>(url, {})
    }
  )
}

/**
 * Update branch configuration
 */
export function useUpdateBranchConfig(projectId: string, branchName: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && projectId && branchName
      ? `${buildProjectEndpoint(projectId)}/branches/${encodeURIComponent(branchName)}`
      : null,
    async (url: string, { arg }: { arg: BranchConfig }) => {
      return put<Branch>(url, arg)
    }
  )
}

// ============================================
// SCM CONNECTION HOOKS
// ============================================

/**
 * Fetch all SCM connections
 */
export function useSCMConnections(config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant ? buildSCMConnectionsEndpoint() : null

  return useSWR<SCMConnection[]>(
    key,
    fetchSCMConnections,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch a single SCM connection
 */
export function useSCMConnection(connectionId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant && connectionId ? buildSCMConnectionEndpoint(connectionId) : null

  return useSWR<SCMConnection>(
    key,
    fetchSCMConnection,
    { ...defaultConfig, ...config }
  )
}

/**
 * Create a new SCM connection
 */
export function useCreateSCMConnection() {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant ? buildSCMConnectionsEndpoint() : null,
    async (url: string, { arg }: { arg: CreateSCMConnectionInput }) => {
      return post<SCMConnection>(url, arg)
    }
  )
}

/**
 * Delete an SCM connection
 */
export function useDeleteSCMConnection(connectionId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && connectionId ? buildSCMConnectionEndpoint(connectionId) : null,
    async (url: string) => {
      return del<void>(url)
    }
  )
}

/**
 * Validate an SCM connection
 */
export function useValidateSCMConnection(connectionId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && connectionId ? `${buildSCMConnectionEndpoint(connectionId)}/validate` : null,
    async (url: string) => {
      return post<SCMConnection>(url, {})
    }
  )
}

// ============================================
// IMPORT HOOKS
// ============================================

/**
 * Preview import results before actually importing
 */
export function useImportPreview() {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant ? buildImportPreviewEndpoint() : null,
    async (url: string, { arg }: { arg: ProjectImportConfig }) => {
      return post<ImportPreview>(url, arg)
    }
  )
}

/**
 * Start project import
 */
export function useStartImport() {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant ? buildImportEndpoint() : null,
    async (url: string, { arg }: { arg: ProjectImportConfig }) => {
      return post<ImportJob>(url, arg)
    }
  )
}

/**
 * Fetch import job status
 */
export function useImportJob(jobId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant && jobId ? buildImportJobEndpoint(jobId) : null

  return useSWR<ImportJob>(
    key,
    fetchImportJob,
    {
      ...defaultConfig,
      // Poll more frequently for running jobs
      refreshInterval: 5000,
      ...config,
    }
  )
}

/**
 * Cancel an import job
 */
export function useCancelImport(jobId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant && jobId ? `${buildImportJobEndpoint(jobId)}/cancel` : null,
    async (url: string) => {
      return post<ImportJob>(url, {})
    }
  )
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Get cache key for projects list
 */
export function getProjectsKey(filters?: ProjectFilters) {
  return buildProjectsEndpoint(filters)
}

/**
 * Get cache key for single project
 */
export function getProjectKey(projectId: string) {
  return buildProjectEndpoint(projectId)
}

/**
 * Get cache key for SCM connections
 */
export function getSCMConnectionsKey() {
  return buildSCMConnectionsEndpoint()
}

/**
 * Invalidate projects cache
 */
export async function invalidateProjectsCache() {
  const { mutate } = await import('swr')
  // Invalidate all project-related keys
  await mutate(
    (key) => typeof key === 'string' && key.includes('/api/v1/projects'),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate SCM connections cache
 */
export async function invalidateSCMConnectionsCache() {
  const { mutate } = await import('swr')
  await mutate(
    (key) => typeof key === 'string' && key.includes('/api/v1/scm-connections'),
    undefined,
    { revalidate: true }
  )
}
