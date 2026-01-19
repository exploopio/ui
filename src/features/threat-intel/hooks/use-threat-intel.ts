'use client'

import useSWR from 'swr'
import { get, post, put } from '@/lib/api/client'
import { threatIntelEndpoints } from '@/lib/api/endpoints'
import type {
  SyncStatus,
  EPSSScore,
  EPSSStats,
  KEVEntry,
  KEVStats,
  CVEEnrichment,
  BulkEnrichmentResponse,
  ThreatIntelSource,
  SetSyncEnabledRequest,
  EnrichCVEsRequest,
  ThreatIntelStats,
} from '@/lib/api/threatintel-types'

// ============================================
// UNIFIED STATS HOOK (RECOMMENDED)
// ============================================

/**
 * Hook to fetch unified threat intel stats (EPSS + KEV + sync status)
 * This is the recommended hook - single API call for all data
 */
export function useThreatIntelStats(tenantId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ThreatIntelStats>(
    tenantId ? ['threat-intel-stats', tenantId] : null,
    () => get<ThreatIntelStats>(threatIntelEndpoints.stats()),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  const emptyEPSS: EPSSStats = {
    total_scores: 0,
    high_risk_count: 0,
    critical_risk_count: 0,
  }

  const emptyKEV: KEVStats = {
    total_entries: 0,
    past_due_count: 0,
    recently_added_last_30_days: 0,
    ransomware_related_count: 0,
  }

  return {
    stats: data || null,
    epssStats: data?.epss || emptyEPSS,
    kevStats: data?.kev || emptyKEV,
    syncStatuses: data?.sync_statuses || [],
    isLoading,
    error,
    mutate,
  }
}

// ============================================
// SYNC STATUS HOOKS
// ============================================

/**
 * Hook to fetch all sync statuses
 */
export function useSyncStatuses(tenantId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SyncStatus[]>(
    tenantId ? ['threat-intel-sync-statuses', tenantId] : null,
    async () => {
      try {
        return await get<SyncStatus[]>(threatIntelEndpoints.syncStatuses())
      } catch (err: unknown) {
        // 404 means no sync status exists yet - return empty array
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
          return []
        }
        throw err
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    statuses: data || [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook to fetch sync status for a specific source
 */
export function useSyncStatus(tenantId: string | null, source: ThreatIntelSource) {
  const { data, error, isLoading, mutate } = useSWR<SyncStatus>(
    tenantId ? ['threat-intel-sync-status', tenantId, source] : null,
    () => get<SyncStatus>(threatIntelEndpoints.syncStatus(source)),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    status: data || null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Trigger sync for a source
 */
export async function triggerSync(source: ThreatIntelSource): Promise<SyncStatus> {
  return post<SyncStatus>(threatIntelEndpoints.triggerSync(source), {})
}

/**
 * Enable/disable sync for a source
 */
export async function setSyncEnabled(
  source: ThreatIntelSource,
  enabled: boolean
): Promise<SyncStatus> {
  return put<SyncStatus>(threatIntelEndpoints.setSyncEnabled(source), { enabled } as SetSyncEnabledRequest)
}

// ============================================
// EPSS HOOKS
// ============================================

/**
 * Hook to fetch EPSS score for a CVE
 */
export function useEPSSScore(tenantId: string | null, cveId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<EPSSScore>(
    tenantId && cveId ? ['epss-score', tenantId, cveId] : null,
    () => get<EPSSScore>(threatIntelEndpoints.epssScore(cveId!)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    epss: data || null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook to fetch EPSS statistics
 */
export function useEPSSStats(tenantId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<EPSSStats>(
    tenantId ? ['epss-stats', tenantId] : null,
    () => get<EPSSStats>(threatIntelEndpoints.epssStats()),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const emptyStats: EPSSStats = {
    total_scores: 0,
    high_risk_count: 0,
    critical_risk_count: 0,
  }

  return {
    stats: data || emptyStats,
    isLoading,
    error,
    mutate,
  }
}

// ============================================
// KEV HOOKS
// ============================================

/**
 * Hook to fetch KEV entry for a CVE
 */
export function useKEVEntry(tenantId: string | null, cveId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<KEVEntry>(
    tenantId && cveId ? ['kev-entry', tenantId, cveId] : null,
    () => get<KEVEntry>(threatIntelEndpoints.kevEntry(cveId!)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    kev: data || null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook to fetch KEV statistics
 */
export function useKEVStats(tenantId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<KEVStats>(
    tenantId ? ['kev-stats', tenantId] : null,
    () => get<KEVStats>(threatIntelEndpoints.kevStats()),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const emptyStats: KEVStats = {
    total_entries: 0,
    past_due_count: 0,
    recently_added_last_30_days: 0,
    ransomware_related_count: 0,
  }

  return {
    stats: data || emptyStats,
    isLoading,
    error,
    mutate,
  }
}

// ============================================
// ENRICHMENT FUNCTIONS
// ============================================

/**
 * Enrich a single CVE with threat intel
 */
export async function enrichCVE(cveId: string): Promise<CVEEnrichment> {
  return get<CVEEnrichment>(threatIntelEndpoints.enrichCVE(cveId))
}

/**
 * Bulk enrich multiple CVEs
 */
export async function enrichCVEs(cveIds: string[]): Promise<BulkEnrichmentResponse> {
  return post<BulkEnrichmentResponse>(threatIntelEndpoints.enrichCVEs(), {
    cve_ids: cveIds,
  } as EnrichCVEsRequest)
}

// ============================================
// COMBINED HOOKS
// ============================================

/**
 * Hook to fetch CVE enrichment data (EPSS + KEV)
 */
export function useCVEEnrichment(tenantId: string | null, cveId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<CVEEnrichment>(
    tenantId && cveId ? ['cve-enrichment', tenantId, cveId] : null,
    () => enrichCVE(cveId!),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    enrichment: data || null,
    epss: data?.epss || null,
    kev: data?.kev || null,
    isLoading,
    error,
    mutate,
  }
}
