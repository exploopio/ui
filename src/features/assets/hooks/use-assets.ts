'use client'

import useSWR from 'swr'
import { get, post, put, del } from '@/lib/api/client'
import { endpoints } from '@/lib/api/endpoints'
import type { Asset, AssetType, AssetScope, ExposureLevel, Criticality, CreateAssetInput, UpdateAssetInput } from '../types'

/**
 * Backend paginated response format (matches Go ListResponse struct)
 */
interface BackendListResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  links?: {
    self?: string
    first?: string
    prev?: string
    next?: string
    last?: string
  }
}

/**
 * Asset-specific search filters
 * Maps to backend ListAssetsInput struct
 */
export interface AssetSearchFilters {
  // Pagination
  page?: number
  pageSize?: number

  // Filtering
  name?: string
  types?: AssetType[]
  criticalities?: Criticality[]
  statuses?: ('active' | 'inactive' | 'archived')[]
  scopes?: AssetScope[]
  exposures?: ExposureLevel[]
  tags?: string[]

  // Search
  search?: string

  // Risk score range
  minRiskScore?: number
  maxRiskScore?: number

  // Has findings filter
  hasFindings?: boolean

  // Sorting (e.g., "-created_at", "name", "-risk_score")
  sort?: string
}

// Backend asset type mapping (matches Go AssetResponse struct)
interface BackendAsset {
  id: string
  tenant_id?: string
  name: string
  type: string           // Backend uses "type" in JSON
  criticality: string    // low, medium, high, critical
  status: string         // active, inactive, archived
  scope: string          // internal, external, cloud, partner, vendor, shadow
  exposure: string       // public, restricted, private, isolated, unknown
  risk_score: number     // 0-100
  finding_count: number
  description?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  first_seen: string
  last_seen: string
  created_at: string
  updated_at: string
}

// Transform backend asset to frontend format
function transformAsset(backend: BackendAsset): Asset {
  return {
    id: backend.id,
    name: backend.name,
    type: backend.type as AssetType,
    criticality: backend.criticality as Criticality,
    status: backend.status as 'active' | 'inactive' | 'archived',
    description: backend.description,
    scope: backend.scope as AssetScope,
    exposure: backend.exposure as ExposureLevel,
    riskScore: backend.risk_score,
    findingCount: backend.finding_count,
    metadata: backend.metadata || {},
    tags: backend.tags || [],
    firstSeen: backend.first_seen,
    lastSeen: backend.last_seen,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  }
}

// Asset stats from backend
interface BackendAssetStats {
  total: number
  by_type: Record<string, number>
  by_status: Record<string, number>
  average_risk_score: number
}

export interface AssetStatsData {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  averageRiskScore: number
}

function transformAssetStats(backend: BackendAssetStats): AssetStatsData {
  return {
    total: backend.total,
    byType: backend.by_type || {},
    byStatus: backend.by_status || {},
    averageRiskScore: backend.average_risk_score || 0,
  }
}

/**
 * Build query params from AssetSearchFilters
 * Converts frontend filter format to backend query string
 */
function buildAssetQueryParams(filters?: AssetSearchFilters): Record<string, string> {
  if (!filters) return {}

  const params: Record<string, string> = {}

  // Pagination
  if (filters.page) params.page = String(filters.page)
  if (filters.pageSize) params.per_page = String(filters.pageSize)

  // Filtering - arrays need to be comma-separated for backend
  if (filters.name) params.name = filters.name
  if (filters.types?.length) params.types = filters.types.join(',')
  if (filters.criticalities?.length) params.criticalities = filters.criticalities.join(',')
  if (filters.statuses?.length) params.statuses = filters.statuses.join(',')
  if (filters.scopes?.length) params.scopes = filters.scopes.join(',')
  if (filters.exposures?.length) params.exposures = filters.exposures.join(',')
  if (filters.tags?.length) params.tags = filters.tags.join(',')

  // Search
  if (filters.search) params.search = filters.search

  // Risk score range
  if (filters.minRiskScore !== undefined) params.min_risk_score = String(filters.minRiskScore)
  if (filters.maxRiskScore !== undefined) params.max_risk_score = String(filters.maxRiskScore)

  // Has findings
  if (filters.hasFindings !== undefined) params.has_findings = String(filters.hasFindings)

  // Sorting
  if (filters.sort) params.sort = filters.sort

  return params
}

/**
 * Hook to fetch paginated assets list
 */
export function useAssets(filters?: AssetSearchFilters) {
  // Build query string from filters
  const queryParams = buildAssetQueryParams(filters)
  const queryString = Object.keys(queryParams).length > 0
    ? '?' + new URLSearchParams(queryParams).toString()
    : ''

  const { data, error, isLoading, mutate } = useSWR<BackendListResponse<BackendAsset>>(
    ['assets', filters],
    () => get<BackendListResponse<BackendAsset>>(`/api/v1/assets${queryString}`),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  return {
    assets: data?.data?.map(transformAsset) || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.per_page || 20,
    totalPages: data?.total_pages || 1,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook to fetch a single asset by ID
 */
export function useAsset(assetId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<BackendAsset>(
    assetId ? ['asset', assetId] : null,
    () => get<BackendAsset>(endpoints.assets.get(assetId!)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    asset: data ? transformAsset(data) : null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook to fetch assets by type
 */
export function useAssetsByType(type: AssetType, additionalFilters?: Omit<AssetSearchFilters, 'types'>) {
  const { assets, total, isLoading, isError, error, mutate, totalPages, page, pageSize } = useAssets({
    types: [type],
    ...additionalFilters,
  })

  return {
    assets,
    total,
    totalPages,
    page,
    pageSize,
    isLoading,
    isError,
    error,
    mutate,
  }
}

/**
 * Create a new asset
 */
export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const response = await post<BackendAsset>(endpoints.assets.create(), {
    name: input.name,
    type: input.type,
    criticality: input.criticality || 'medium',  // Default to medium if not specified
    description: input.description,
    scope: input.scope || 'internal',
    exposure: input.exposure || 'unknown',
    tags: input.tags,
  })
  return transformAsset(response)
}

/**
 * Update an existing asset
 */
export async function updateAsset(assetId: string, input: UpdateAssetInput): Promise<Asset> {
  const response = await put<BackendAsset>(endpoints.assets.update(assetId), {
    name: input.name,
    criticality: input.criticality,
    description: input.description,
    scope: input.scope,
    exposure: input.exposure,
    tags: input.tags,
  })
  return transformAsset(response)
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  await del(endpoints.assets.delete(assetId))
}

/**
 * Bulk delete multiple assets
 * Deletes assets sequentially to avoid overwhelming the server
 */
export async function bulkDeleteAssets(assetIds: string[]): Promise<void> {
  // Delete assets in parallel with a concurrency limit
  const BATCH_SIZE = 5
  for (let i = 0; i < assetIds.length; i += BATCH_SIZE) {
    const batch = assetIds.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(id => del(endpoints.assets.delete(id))))
  }
}

/**
 * Hook for asset stats (uses global dashboard stats)
 * This provides cached asset statistics
 */
export function useAssetStats() {
  const { data, error, isLoading } = useSWR<{ assets: BackendAssetStats }>(
    'asset-stats',
    async () => {
      // Fetch from dashboard global stats which includes asset stats
      const response = await get<{ assets: BackendAssetStats }>(endpoints.dashboard.globalStats())
      return response
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  const emptyStats: AssetStatsData = {
    total: 0,
    byType: {},
    byStatus: {},
    averageRiskScore: 0,
  }

  return {
    stats: data?.assets ? transformAssetStats(data.assets) : emptyStats,
    isLoading,
    error,
  }
}
