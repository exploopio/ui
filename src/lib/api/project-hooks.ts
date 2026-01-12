/**
 * Project API Hooks
 *
 * Custom React hooks for project data fetching using SWR
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'
import { get, post, put, del } from './client'
import { handleApiError } from './error-handler'
import { projectEndpoints } from './project-endpoints'
import type {
  Project,
  ProjectListResponse,
  ProjectFilters,
  CreateProjectRequest,
  UpdateProjectRequest,
} from './project-types'

// ============================================
// SWR CONFIGURATION
// ============================================

/**
 * Default SWR configuration for projects
 */
export const defaultProjectSwrConfig: SWRConfiguration = {
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
// PROJECT HOOKS
// ============================================

/**
 * Fetch projects list with pagination and filters
 *
 * @example
 * ```typescript
 * const { data, error, isLoading, mutate } = useProjects('tenant-123', {
 *   page: 1,
 *   per_page: 20,
 *   providers: ['github'],
 * })
 * ```
 */
export function useProjects(
  tenantId: string | null,
  filters?: ProjectFilters,
  config?: SWRConfiguration
) {
  return useSWR<ProjectListResponse>(
    tenantId ? projectEndpoints.list(tenantId, filters) : null,
    get,
    { ...defaultProjectSwrConfig, ...config }
  )
}

/**
 * Fetch single project by ID
 *
 * @example
 * ```typescript
 * const { data: project } = useProject('tenant-123', 'project-456')
 * ```
 */
export function useProject(
  tenantId: string | null,
  projectId: string | null,
  config?: SWRConfiguration
) {
  return useSWR<Project>(
    tenantId && projectId ? projectEndpoints.get(tenantId, projectId) : null,
    get,
    { ...defaultProjectSwrConfig, ...config }
  )
}

/**
 * Create project mutation
 *
 * @example
 * ```typescript
 * const { trigger, isMutating } = useCreateProject('tenant-123')
 *
 * const handleSubmit = async (data) => {
 *   try {
 *     const newProject = await trigger(data)
 *     toast.success('Project created!')
 *   } catch (error) {
 *     // Error handled by SWR
 *   }
 * }
 * ```
 */
export function useCreateProject(tenantId: string) {
  return useSWRMutation(
    projectEndpoints.create(tenantId),
    (url, { arg }: { arg: CreateProjectRequest }) => post<Project>(url, arg)
  )
}

/**
 * Update project mutation
 */
export function useUpdateProject(tenantId: string, projectId: string) {
  return useSWRMutation(
    projectEndpoints.update(tenantId, projectId),
    (url, { arg }: { arg: UpdateProjectRequest }) => put<Project>(url, arg)
  )
}

/**
 * Delete project mutation
 */
export function useDeleteProject(tenantId: string, projectId: string) {
  return useSWRMutation(
    projectEndpoints.delete(tenantId, projectId),
    (url) => del(url)
  )
}

// ============================================
// UTILITIES
// ============================================

/**
 * Build cache key for projects list
 * Useful for manual cache invalidation
 */
export function getProjectsListKey(tenantId: string, filters?: ProjectFilters) {
  return projectEndpoints.list(tenantId, filters)
}

/**
 * Build cache key for single project
 */
export function getProjectKey(tenantId: string, projectId: string) {
  return projectEndpoints.get(tenantId, projectId)
}

/**
 * Mutate (revalidate) projects cache after mutation
 */
export async function invalidateProjectsCache(tenantId: string) {
  const { mutate } = await import('swr')
  // Mutate all keys matching the project list pattern
  await mutate(
    (key: string) => typeof key === 'string' && key.includes(`/tenants/${tenantId}/projects`),
    undefined,
    { revalidate: true }
  )
}
