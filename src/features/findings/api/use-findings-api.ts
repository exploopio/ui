/**
 * Finding API Hooks
 *
 * SWR hooks for fetching and mutating finding data from backend
 */

'use client'

import useSWR, { type SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'
import { get, post, patch, del } from '@/lib/api/client'
import { handleApiError } from '@/lib/api/error-handler'
import { useTenant } from '@/context/tenant-provider'
import type {
  ApiFinding,
  ApiFindingListResponse,
  ApiVulnerability,
  ApiVulnerabilityListResponse,
  FindingApiFilters,
  VulnerabilityApiFilters,
  CreateFindingInput,
  UpdateFindingStatusInput,
} from './finding-api.types'

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

function buildFindingsEndpoint(tenantSlug: string, filters?: FindingApiFilters): string {
  const baseUrl = `/api/v1/tenants/${tenantSlug}/findings`

  if (!filters) return baseUrl

  const params = new URLSearchParams()

  if (filters.project_id) params.set('project_id', filters.project_id)
  if (filters.component_id) params.set('component_id', filters.component_id)
  if (filters.vulnerability_id) params.set('vulnerability_id', filters.vulnerability_id)
  if (filters.tool_name) params.set('tool_name', filters.tool_name)
  if (filters.rule_id) params.set('rule_id', filters.rule_id)
  if (filters.scan_id) params.set('scan_id', filters.scan_id)
  if (filters.file_path) params.set('file_path', filters.file_path)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))

  if (filters.severities?.length) params.set('severities', filters.severities.join(','))
  if (filters.statuses?.length) params.set('statuses', filters.statuses.join(','))
  if (filters.sources?.length) params.set('sources', filters.sources.join(','))

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

function buildFindingEndpoint(tenantSlug: string, findingId: string): string {
  return `/api/v1/tenants/${tenantSlug}/findings/${findingId}`
}

function buildProjectFindingsEndpoint(
  tenantSlug: string,
  projectId: string,
  sort?: string,
  page?: number,
  perPage?: number
): string {
  const baseUrl = `/api/v1/tenants/${tenantSlug}/projects/${projectId}/findings`
  const params = new URLSearchParams()

  if (sort) params.set('sort', sort)
  if (page) params.set('page', String(page))
  if (perPage) params.set('per_page', String(perPage))

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

function buildVulnerabilitiesEndpoint(filters?: VulnerabilityApiFilters): string {
  const baseUrl = '/api/v1/vulnerabilities'

  if (!filters) return baseUrl

  const params = new URLSearchParams()

  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  if (filters.exploit_available !== undefined) {
    params.set('exploit_available', String(filters.exploit_available))
  }
  if (filters.cisa_kev_only !== undefined) {
    params.set('cisa_kev_only', String(filters.cisa_kev_only))
  }
  if (filters.min_cvss !== undefined) params.set('min_cvss', String(filters.min_cvss))
  if (filters.max_cvss !== undefined) params.set('max_cvss', String(filters.max_cvss))
  if (filters.min_epss !== undefined) params.set('min_epss', String(filters.min_epss))

  if (filters.cve_ids?.length) params.set('cve_ids', filters.cve_ids.join(','))
  if (filters.severities?.length) params.set('severities', filters.severities.join(','))
  if (filters.statuses?.length) params.set('statuses', filters.statuses.join(','))

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// ============================================
// FETCHER FUNCTIONS
// ============================================

async function fetchFindings(url: string): Promise<ApiFindingListResponse> {
  return get<ApiFindingListResponse>(url)
}

async function fetchFinding(url: string): Promise<ApiFinding> {
  return get<ApiFinding>(url)
}

async function fetchVulnerabilities(url: string): Promise<ApiVulnerabilityListResponse> {
  return get<ApiVulnerabilityListResponse>(url)
}

async function fetchVulnerability(url: string): Promise<ApiVulnerability> {
  return get<ApiVulnerability>(url)
}

// ============================================
// FINDING HOOKS
// ============================================

/**
 * Fetch findings list for current tenant
 *
 * @example
 * ```typescript
 * function FindingList() {
 *   const { data, error, isLoading } = useFindingsApi({ page: 1, severities: ['critical', 'high'] })
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error error={error} />
 *
 *   return (
 *     <ul>
 *       {data?.data.map(finding => (
 *         <li key={finding.id}>{finding.message}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useFindingsApi(filters?: FindingApiFilters, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant?.slug
    ? buildFindingsEndpoint(currentTenant.slug, filters)
    : null

  return useSWR<ApiFindingListResponse>(
    key,
    fetchFindings,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch a single finding by ID
 */
export function useFindingApi(findingId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()

  const key = currentTenant?.slug && findingId
    ? buildFindingEndpoint(currentTenant.slug, findingId)
    : null

  return useSWR<ApiFinding>(
    key,
    fetchFinding,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch findings for a specific project
 */
export function useProjectFindingsApi(
  projectId: string | null,
  sort?: string,
  page?: number,
  perPage?: number,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()

  const key = currentTenant?.slug && projectId
    ? buildProjectFindingsEndpoint(currentTenant.slug, projectId, sort, page, perPage)
    : null

  return useSWR<ApiFindingListResponse>(
    key,
    fetchFindings,
    { ...defaultConfig, ...config }
  )
}

// ============================================
// VULNERABILITY HOOKS (Global CVE Database)
// ============================================

/**
 * Fetch vulnerabilities from global CVE database
 */
export function useVulnerabilitiesApi(filters?: VulnerabilityApiFilters, config?: SWRConfiguration) {
  const key = buildVulnerabilitiesEndpoint(filters)

  return useSWR<ApiVulnerabilityListResponse>(
    key,
    fetchVulnerabilities,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch a single vulnerability by ID
 */
export function useVulnerabilityApi(vulnerabilityId: string | null, config?: SWRConfiguration) {
  const key = vulnerabilityId ? `/api/v1/vulnerabilities/${vulnerabilityId}` : null

  return useSWR<ApiVulnerability>(
    key,
    fetchVulnerability,
    { ...defaultConfig, ...config }
  )
}

/**
 * Fetch a vulnerability by CVE ID
 */
export function useVulnerabilityByCveApi(cveId: string | null, config?: SWRConfiguration) {
  const key = cveId ? `/api/v1/vulnerabilities/cve/${cveId}` : null

  return useSWR<ApiVulnerability>(
    key,
    fetchVulnerability,
    { ...defaultConfig, ...config }
  )
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create a new finding
 */
export function useCreateFindingApi() {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant?.slug ? `/api/v1/tenants/${currentTenant.slug}/findings` : null,
    async (url: string, { arg }: { arg: CreateFindingInput }) => {
      return post<ApiFinding>(url, arg)
    }
  )
}

/**
 * Update finding status
 */
export function useUpdateFindingStatusApi(findingId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant?.slug && findingId
      ? `${buildFindingEndpoint(currentTenant.slug, findingId)}/status`
      : null,
    async (url: string, { arg }: { arg: UpdateFindingStatusInput }) => {
      return patch<ApiFinding>(url, arg)
    }
  )
}

/**
 * Delete a finding
 */
export function useDeleteFindingApi(findingId: string) {
  const { currentTenant } = useTenant()

  return useSWRMutation(
    currentTenant?.slug && findingId
      ? buildFindingEndpoint(currentTenant.slug, findingId)
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
 * Invalidate findings cache for tenant
 */
export async function invalidateFindingsCache(tenantSlug: string) {
  const { mutate } = await import('swr')
  await mutate(
    (key) => typeof key === 'string' && key.includes(`/tenants/${tenantSlug}/findings`),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate vulnerabilities cache
 */
export async function invalidateVulnerabilitiesCache() {
  const { mutate } = await import('swr')
  await mutate(
    (key) => typeof key === 'string' && key.includes('/vulnerabilities'),
    undefined,
    { revalidate: true }
  )
}
