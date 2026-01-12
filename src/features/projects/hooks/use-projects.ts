/**
 * Project Hooks
 *
 * SWR hooks for fetching and mutating project data
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

function buildProjectsEndpoint(tenantSlug: string, filters?: ProjectFilters): string {
  const baseUrl = `/api/v1/tenants/${tenantSlug}/projects`

  if (!filters) return baseUrl

  const params = new URLSearchParams()

  if (filters.name) params.set('name', filters.name)
  if (filters.search) params.set('search', filters.search)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  if (filters.has_findings !== undefined) params.set('has_findings', String(filters.has_findings))

  if (filters.providers?.length) params.set('providers', filters.providers.join(','))
  if (filters.visibilities?.length) params.set('visibilities', filters.visibilities.join(','))
  if (filters.statuses?.length) params.set('statuses', filters.statuses.join(','))
  if (filters.languages?.length) params.set('languages', filters.languages.join(','))
  if (filters.tags?.length) params.set('tags', filters.tags.join(','))

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

function buildProjectEndpoint(tenantSlug: string, projectId: string): string {
  return `/api/v1/tenants/${tenantSlug}/projects/${projectId}`
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

// ============================================
// HOOKS
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

  const key = currentTenant?.slug
    ? buildProjectsEndpoint(currentTenant.slug, filters)
    : null

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

  const key = currentTenant?.slug && projectId
    ? buildProjectEndpoint(currentTenant.slug, projectId)
    : null

  return useSWR<Project>(
    key,
    fetchProject,
    { ...defaultConfig, ...config }
  )
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create a new project
 */
export function useCreateProject() {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant?.slug ? `/api/v1/tenants/${currentTenant.slug}/projects` : null,
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
    currentTenant?.slug && projectId
      ? buildProjectEndpoint(currentTenant.slug, projectId)
      : null,
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
    currentTenant?.slug && projectId
      ? buildProjectEndpoint(currentTenant.slug, projectId)
      : null,
    async (url: string) => {
      return del<void>(url)
    }
  )
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Get cache key for projects list
 */
export function getProjectsKey(tenantSlug: string, filters?: ProjectFilters) {
  return buildProjectsEndpoint(tenantSlug, filters)
}

/**
 * Get cache key for single project
 */
export function getProjectKey(tenantSlug: string, projectId: string) {
  return buildProjectEndpoint(tenantSlug, projectId)
}

/**
 * Invalidate projects cache
 */
export async function invalidateProjectsCache(tenantSlug: string) {
  const { mutate } = await import('swr')
  // Invalidate all project-related keys for this tenant
  await mutate(
    (key) => typeof key === 'string' && key.includes(`/tenants/${tenantSlug}/projects`),
    undefined,
    { revalidate: true }
  )
}
