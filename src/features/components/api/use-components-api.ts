/**
 * Component API Hooks
 *
 * SWR hooks for fetching and mutating component data from backend
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'
import { get, post, put, del } from '@/lib/api/client'
import { handleApiError } from '@/lib/api/error-handler'
import { useTenant } from '@/context/tenant-provider'
import type {
  ApiComponent,
  ApiComponentListResponse,
  ComponentApiFilters,
  CreateComponentInput,
  UpdateComponentInput,
} from './component-api.types'

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

function buildComponentsEndpoint(tenantSlug: string, filters?: ComponentApiFilters): string {
  const baseUrl = `/api/v1/tenants/${tenantSlug}/components`

  if (!filters) return baseUrl

  const params = new URLSearchParams()

  if (filters.project_id) params.set('project_id', filters.project_id)
  if (filters.name) params.set('name', filters.name)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  if (filters.has_vulnerabilities !== undefined) {
    params.set('has_vulnerabilities', String(filters.has_vulnerabilities))
  }

  if (filters.ecosystems?.length) params.set('ecosystems', filters.ecosystems.join(','))
  if (filters.statuses?.length) params.set('statuses', filters.statuses.join(','))
  if (filters.dependency_types?.length) params.set('dependency_types', filters.dependency_types.join(','))
  if (filters.licenses?.length) params.set('licenses', filters.licenses.join(','))

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

function buildComponentEndpoint(tenantSlug: string, componentId: string): string {
  return `/api/v1/tenants/${tenantSlug}/components/${componentId}`
}

function buildProjectComponentsEndpoint(
  tenantSlug: string,
  projectId: string,
  page?: number,
  perPage?: number
): string {
  const baseUrl = `/api/v1/tenants/${tenantSlug}/projects/${projectId}/components`
  const params = new URLSearchParams()

  if (page) params.set('page', String(page))
  if (perPage) params.set('per_page', String(perPage))

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// ============================================
// FETCHER FUNCTIONS
// ============================================

async function fetchComponents(url: string): Promise<ApiComponentListResponse> {
  return get<ApiComponentListResponse>(url)
}

async function fetchComponent(url: string): Promise<ApiComponent> {
  return get<ApiComponent>(url)
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetch components list for current tenant
 *
 * @example
 * ```typescript
 * function ComponentList() {
 *   const { data, error, isLoading } = useComponentsApi({ page: 1, per_page: 20 })
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error error={error} />
 *
 *   return (
 *     <ul>
 *       {data?.data.map(component => (
 *         <li key={component.id}>{component.name}@{component.version}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useComponentsApi(filters?: ComponentApiFilters, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant?.slug
    ? buildComponentsEndpoint(currentTenant.slug, filters)
    : null

  return useSWR<ApiComponentListResponse>(
    key,
    fetchComponents,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch a single component by ID
 */
export function useComponentApi(componentId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant?.slug && componentId
    ? buildComponentEndpoint(currentTenant.slug, componentId)
    : null

  return useSWR<ApiComponent>(
    key,
    fetchComponent,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch components for a specific project
 */
export function useProjectComponentsApi(
  projectId: string | null,
  page?: number,
  perPage?: number,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key = currentTenant?.slug && projectId
    ? buildProjectComponentsEndpoint(currentTenant.slug, projectId, page, perPage)
    : null

  return useSWR<ApiComponentListResponse>(
    key,
    fetchComponents,
    { ...defaultConfig, ...config }
  )
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create a new component
 */
export function useCreateComponentApi() {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant?.slug ? `/api/v1/tenants/${currentTenant.slug}/components` : null,
    async (url: string, { arg }: { arg: CreateComponentInput }) => {
      return post<ApiComponent>(url, arg)
    }
  )
}

/**
 * Update an existing component
 */
export function useUpdateComponentApi(componentId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant?.slug && componentId
      ? buildComponentEndpoint(currentTenant.slug, componentId)
      : null,
    async (url: string, { arg }: { arg: UpdateComponentInput }) => {
      return put<ApiComponent>(url, arg)
    }
  )
}

/**
 * Delete a component
 */
export function useDeleteComponentApi(componentId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant?.slug && componentId
      ? buildComponentEndpoint(currentTenant.slug, componentId)
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
 * Invalidate components cache for tenant
 */
export async function invalidateComponentsCache(tenantSlug: string) {
  const { mutate } = await import('swr')
  await mutate(
    (key) => typeof key === 'string' && key.includes(`/tenants/${tenantSlug}/components`),
    undefined,
    { revalidate: true }
  )
}
