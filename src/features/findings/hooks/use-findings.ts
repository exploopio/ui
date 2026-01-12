'use client'

import useSWR from 'swr'
import { get, post, patch, del } from '@/lib/api/client'
import { endpoints } from '@/lib/api/endpoints'
import type { PaginatedResponse, SearchFilters } from '@/lib/api/types'
import type { Finding, FindingStatus, FindingStats } from '../types'
import type { Severity } from '@/features/shared/types'

// Backend finding type mapping
interface BackendFinding {
  id: string
  title: string
  description?: string
  severity: string
  status: string
  cvss_score?: number
  cvss_vector?: string
  cve_id?: string
  cwe_id?: string
  owasp?: string
  tags?: string[]
  source?: string
  scanner?: string
  scan_id?: string
  project_id?: string
  project_name?: string
  component_id?: string
  component_name?: string
  vulnerability_id?: string
  assignee_id?: string
  assignee_name?: string
  team?: string
  duplicate_of?: string
  remediation_task_id?: string
  due_date?: string
  discovered_at?: string
  triaged_at?: string
  resolved_at?: string
  verified_at?: string
  created_at: string
  updated_at: string
}

// Transform backend finding to frontend format
function transformFinding(backend: BackendFinding): Finding {
  return {
    id: backend.id,
    title: backend.title,
    description: backend.description || '',
    severity: (backend.severity || 'medium') as Severity,
    status: (backend.status || 'new') as FindingStatus,
    cvss: backend.cvss_score,
    cvssVector: backend.cvss_vector,
    cve: backend.cve_id,
    cwe: backend.cwe_id,
    owasp: backend.owasp,
    tags: backend.tags || [],
    source: (backend.source || 'manual') as Finding['source'],
    scanner: backend.scanner,
    scanId: backend.scan_id,
    assets: [], // Will be populated from related data
    evidence: [], // Will be populated from related data
    remediation: {
      description: '',
      steps: [],
      references: [],
      progress: 0,
    },
    assignee: backend.assignee_id
      ? {
          id: backend.assignee_id,
          name: backend.assignee_name || 'Unknown',
          email: '',
          role: 'analyst',
        }
      : undefined,
    team: backend.team,
    duplicateOf: backend.duplicate_of,
    relatedFindings: [],
    remediationTaskId: backend.remediation_task_id,
    discoveredAt: backend.discovered_at || backend.created_at,
    triagedAt: backend.triaged_at,
    resolvedAt: backend.resolved_at,
    verifiedAt: backend.verified_at,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  }
}

// Backend finding stats type
interface BackendFindingStats {
  total: number
  by_severity: Record<string, number>
  by_status: Record<string, number>
  overdue: number
  average_cvss: number
}

function transformFindingStats(backend: BackendFindingStats): FindingStats {
  return {
    total: backend.total,
    bySeverity: backend.by_severity as Record<Severity, number>,
    byStatus: backend.by_status as Record<FindingStatus, number>,
    averageCvss: backend.average_cvss || 0,
    overdueCount: backend.overdue || 0,
    resolvedThisWeek: 0, // Can be added to backend later
    newThisWeek: 0, // Can be added to backend later
  }
}

/**
 * Hook to fetch paginated findings list
 */
export function useFindings(tenantId: string | null, filters?: SearchFilters) {
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<BackendFinding>>(
    tenantId ? ['findings', tenantId, filters] : null,
    () => get<PaginatedResponse<BackendFinding>>(endpoints.findings.list(tenantId!, filters)),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  return {
    findings: data?.data?.map(transformFinding) || [],
    total: data?.pagination?.total || 0,
    page: data?.pagination?.page || 1,
    pageSize: data?.pagination?.pageSize || 10,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook to fetch a single finding by ID
 */
export function useFinding(tenantId: string | null, findingId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<BackendFinding>(
    tenantId && findingId ? ['finding', tenantId, findingId] : null,
    () => get<BackendFinding>(endpoints.findings.get(tenantId!, findingId!)),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    finding: data ? transformFinding(data) : null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook to fetch findings by project
 */
export function useFindingsByProject(tenantId: string | null, projectId: string | null, filters?: SearchFilters) {
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<BackendFinding>>(
    tenantId && projectId ? ['findings-by-project', tenantId, projectId, filters] : null,
    () => get<PaginatedResponse<BackendFinding>>(endpoints.findings.listByProject(tenantId!, projectId!, filters)),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  return {
    findings: data?.data?.map(transformFinding) || [],
    total: data?.pagination?.total || 0,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Input for creating a finding
 */
export interface CreateFindingInput {
  title: string
  description?: string
  severity: Severity
  status?: FindingStatus
  cvssScore?: number
  cvssVector?: string
  cveId?: string
  cweId?: string
  projectId?: string
  vulnerabilityId?: string
  source?: string
  tags?: string[]
}

/**
 * Create a new finding
 */
export async function createFinding(tenantId: string, input: CreateFindingInput): Promise<Finding> {
  const response = await post<BackendFinding>(endpoints.findings.create(tenantId), {
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: input.status || 'new',
    cvss_score: input.cvssScore,
    cvss_vector: input.cvssVector,
    cve_id: input.cveId,
    cwe_id: input.cweId,
    project_id: input.projectId,
    vulnerability_id: input.vulnerabilityId,
    source: input.source,
    tags: input.tags,
  })
  return transformFinding(response)
}

/**
 * Update finding status
 */
export async function updateFindingStatus(
  tenantId: string,
  findingId: string,
  status: FindingStatus
): Promise<Finding> {
  const response = await patch<BackendFinding>(endpoints.findings.updateStatus(tenantId, findingId), {
    status,
  })
  return transformFinding(response)
}

/**
 * Delete a finding
 */
export async function deleteFinding(tenantId: string, findingId: string): Promise<void> {
  await del(endpoints.findings.delete(tenantId, findingId))
}

/**
 * Hook for finding stats (uses tenant-scoped dashboard stats)
 */
export function useFindingStats(tenantId: string | null) {
  const { data, error, isLoading } = useSWR<{ findings: BackendFindingStats }>(
    tenantId ? ['finding-stats', tenantId] : null,
    async () => {
      const response = await get<{ findings: BackendFindingStats }>(endpoints.dashboard.stats(tenantId!))
      return response
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  const emptyStats: FindingStats = {
    total: 0,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    byStatus: {
      new: 0,
      triaged: 0,
      confirmed: 0,
      in_progress: 0,
      resolved: 0,
      verified: 0,
      closed: 0,
      duplicate: 0,
      false_positive: 0,
    },
    averageCvss: 0,
    overdueCount: 0,
    resolvedThisWeek: 0,
    newThisWeek: 0,
  }

  return {
    stats: data?.findings ? transformFindingStats(data.findings) : emptyStats,
    isLoading,
    error,
  }
}
