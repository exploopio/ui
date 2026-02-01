'use client'

import { useCallback, useState, useEffect } from 'react'
import { useTriageResult, useRequestTriage } from '../api'
import type { AITriageResult, TriageStatus } from '../types'

interface UseAITriageOptions {
  /** Auto-refresh interval in ms when status is pending/processing (default: 3000) */
  refreshInterval?: number
  /** Whether to auto-refresh when status is pending/processing (default: true) */
  autoRefresh?: boolean
}

interface UseAITriageReturn {
  /** Current triage result */
  result: AITriageResult | null
  /** Whether the result is loading */
  isLoading: boolean
  /** Error if any */
  error: Error | null
  /** Current status */
  status: TriageStatus | null
  /** Whether triage is in progress (pending or processing) */
  isTriageInProgress: boolean
  /** Request a new triage */
  requestTriage: () => Promise<void>
  /** Whether request is in progress */
  isRequesting: boolean
  /** Refresh the result */
  refresh: () => void
}

export function useAITriage(
  findingId: string | null,
  options: UseAITriageOptions = {}
): UseAITriageReturn {
  const { refreshInterval = 3000, autoRefresh = true } = options
  const [isRequesting, setIsRequesting] = useState(false)
  const [shouldRefresh, setShouldRefresh] = useState(false)

  const {
    data: result,
    isLoading,
    error,
    mutate,
  } = useTriageResult(findingId, {
    refreshInterval: shouldRefresh ? refreshInterval : 0,
  })

  const { trigger: triggerRequest } = useRequestTriage(findingId)

  const status = result?.status ?? null
  const isTriageInProgress = status === 'pending' || status === 'processing'

  // Update shouldRefresh based on status
  useEffect(() => {
    if (autoRefresh) {
      setShouldRefresh(isTriageInProgress)
    }
  }, [autoRefresh, isTriageInProgress])

  const requestTriage = useCallback(async () => {
    if (!findingId || isRequesting) return

    setIsRequesting(true)
    setShouldRefresh(true) // Start polling after request
    try {
      await triggerRequest({ mode: 'quick' })
      // Refresh the result after requesting
      await mutate()
    } finally {
      setIsRequesting(false)
    }
  }, [findingId, isRequesting, triggerRequest, mutate])

  const refresh = useCallback(() => {
    mutate()
  }, [mutate])

  return {
    result: result ?? null,
    isLoading,
    error: error ?? null,
    status,
    isTriageInProgress,
    requestTriage,
    isRequesting,
    refresh,
  }
}
