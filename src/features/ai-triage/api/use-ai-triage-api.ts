'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type { SWRConfiguration } from 'swr'

import { get, post } from '@/lib/api/client'
import { handleApiError } from '@/lib/api/error-handler'
import { useTenant } from '@/context/tenant-provider'
import type {
  AITriageResult,
  RequestTriageInput,
  RequestTriageResponse,
  TriageHistoryResponse,
  TriageStatus,
  Exploitability,
  RemediationStep,
  RemediationEffort,
} from '../types'
import type {
  ApiTriageResult,
  ApiRequestTriageResponse,
  ApiTriageHistoryResponse,
  ApiRequestTriageInput,
} from './ai-triage-api.types'

// ============================================
// CONFIGURATION
// ============================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: (error: { statusCode?: number }) => {
    return error.statusCode !== undefined && error.statusCode >= 500
  },
  errorRetryCount: 3,
  dedupingInterval: 2000,
  onError: (error) => handleApiError(error, { showToast: true, logError: true }),
}

// ============================================
// TRANSFORMERS
// ============================================

/**
 * Transform API triage result to domain type
 */
function transformTriageResult(api: ApiTriageResult): AITriageResult {
  return {
    id: api.id,
    findingId: '', // Not returned by API in single result
    status: api.status as TriageStatus,
    severityAssessment: api.severity_assessment as AITriageResult['severityAssessment'],
    severityJustification: api.severity_justification,
    riskScore: api.risk_score,
    exploitability: api.exploitability as Exploitability | undefined,
    exploitabilityDetails: api.exploitability_details,
    businessImpact: api.business_impact,
    priorityRank: api.priority_rank,
    falsePositiveLikelihood: api.false_positive_likelihood,
    falsePositiveReason: api.false_positive_reason,
    summary: api.summary,
    remediationSteps: api.remediation_steps?.map((step) => ({
      step: step.step,
      description: step.description,
      effort: step.effort as RemediationEffort,
    })) as RemediationStep[] | undefined,
    relatedCves: api.related_cves,
    relatedCwes: api.related_cwes,
    llmProvider: api.llm_provider,
    llmModel: api.llm_model,
    promptTokens: api.prompt_tokens,
    completionTokens: api.completion_tokens,
    createdAt: api.created_at,
    completedAt: api.completed_at,
    errorMessage: api.error_message,
  }
}

/**
 * Transform API response for request triage
 */
function transformRequestTriageResponse(api: ApiRequestTriageResponse): RequestTriageResponse {
  return {
    jobId: api.job_id,
    status: api.status as TriageStatus,
  }
}

/**
 * Transform API history response
 */
function transformHistoryResponse(api: ApiTriageHistoryResponse): TriageHistoryResponse {
  return {
    data: api.data.map(transformTriageResult),
    total: api.total,
    limit: api.limit,
    offset: api.offset,
  }
}

// ============================================
// ENDPOINT BUILDERS
// ============================================

function buildTriageEndpoint(findingId: string): string {
  return `/api/v1/findings/${findingId}/ai-triage`
}

function buildTriageHistoryEndpoint(findingId: string, limit?: number, offset?: number): string {
  const params = new URLSearchParams()
  if (limit) params.set('limit', limit.toString())
  if (offset) params.set('offset', offset.toString())
  const query = params.toString()
  return `/api/v1/findings/${findingId}/ai-triage/history${query ? `?${query}` : ''}`
}

// ============================================
// FETCHERS
// ============================================

async function fetchTriageResult(url: string): Promise<AITriageResult> {
  const response = await get<ApiTriageResult>(url)
  return transformTriageResult(response)
}

async function fetchTriageHistory(url: string): Promise<TriageHistoryResponse> {
  const response = await get<ApiTriageHistoryResponse>(url)
  return transformHistoryResponse(response)
}

async function postTriage(
  url: string,
  { arg }: { arg: RequestTriageInput }
): Promise<RequestTriageResponse> {
  const input: ApiRequestTriageInput = {
    mode: arg.mode,
  }
  const response = await post<ApiRequestTriageResponse>(url, input)
  return transformRequestTriageResponse(response)
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook to get the latest triage result for a finding
 */
export function useTriageResult(findingId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant()
  const key = currentTenant && findingId ? buildTriageEndpoint(findingId) : null

  return useSWR<AITriageResult>(key, fetchTriageResult, {
    ...defaultConfig,
    ...config,
  })
}

/**
 * Hook to get triage history for a finding
 */
export function useTriageHistory(
  findingId: string | null,
  options?: { limit?: number; offset?: number },
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant()
  const key =
    currentTenant && findingId
      ? buildTriageHistoryEndpoint(findingId, options?.limit, options?.offset)
      : null

  return useSWR<TriageHistoryResponse>(key, fetchTriageHistory, {
    ...defaultConfig,
    ...config,
  })
}

/**
 * Hook to trigger AI triage for a finding
 */
export function useRequestTriage(findingId: string | null) {
  const { currentTenant } = useTenant()
  const key = currentTenant && findingId ? buildTriageEndpoint(findingId) : null

  return useSWRMutation<RequestTriageResponse, Error, string | null, RequestTriageInput>(
    key,
    postTriage
  )
}

/**
 * Get cache key for triage result
 */
export function getTriageCacheKey(findingId: string): string {
  return buildTriageEndpoint(findingId)
}
