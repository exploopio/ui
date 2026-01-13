'use client'

import useSWR from 'swr'
import { get, post, put, del } from '@/lib/api/client'
import { endpoints } from '@/lib/api/endpoints'
import type { PaginatedResponse, SearchFilters } from '@/lib/api/types'
import type { Asset, AssetType, AssetScope, ExposureLevel, Criticality, CreateAssetInput, UpdateAssetInput } from '../types'

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
 * Hook to fetch paginated assets list
 */
export function useAssets(filters?: SearchFilters) {
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<BackendAsset>>(
    ['assets', filters],
    () => get<PaginatedResponse<BackendAsset>>(endpoints.assets.list(filters)),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  return {
    assets: data?.data?.map(transformAsset) || [],
    total: data?.pagination?.total || 0,
    page: data?.pagination?.page || 1,
    pageSize: data?.pagination?.pageSize || 10,
    isLoading,
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
export function useAssetsByType(type: AssetType) {
  const { assets, total, isLoading, error, mutate } = useAssets({
    asset_type: type
  } as SearchFilters)

  return {
    assets,
    total,
    isLoading,
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
