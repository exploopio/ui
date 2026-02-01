'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Bot, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRequestTriage, useTriageResult } from '../api'
import type { TriageStatus } from '../types'

interface AITriageButtonProps {
  findingId: string
  currentStatus?: TriageStatus | null
  onTriageRequested?: () => void
  onTriageCompleted?: () => void
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
}

/**
 * AI Triage Button with automatic polling for status updates.
 * When triage is requested, automatically polls for completion using exponential backoff.
 */
export function AITriageButton({
  findingId,
  currentStatus: initialStatus,
  onTriageRequested,
  onTriageCompleted,
  variant = 'outline',
  size = 'default',
  className,
  disabled,
}: AITriageButtonProps) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [shouldPoll, setShouldPoll] = useState(false)
  const [pollInterval, setPollInterval] = useState(2000)
  const pollCountRef = useRef(0)
  const previousStatusRef = useRef<TriageStatus | null>(null)

  const { trigger: requestTriage } = useRequestTriage(findingId)

  // Poll for result when shouldPoll is true
  const { data: triageResult, mutate } = useTriageResult(findingId, {
    refreshInterval: shouldPoll ? pollInterval : 0,
  })

  // Get current status from polling result or initial prop
  const currentStatus = triageResult?.status ?? initialStatus

  const isTriageInProgress = currentStatus === 'pending' || currentStatus === 'processing'
  const isDisabled = disabled || isRequesting || isTriageInProgress

  // Exponential backoff for polling
  useEffect(() => {
    if (!shouldPoll || !isTriageInProgress) {
      pollCountRef.current = 0
      setPollInterval(2000)
      return
    }

    // Increase interval: 2s -> 3s -> 4.5s -> 6.75s -> max 10s
    const nextInterval = Math.min(2000 * Math.pow(1.5, pollCountRef.current), 10000)
    setPollInterval(nextInterval)
    pollCountRef.current += 1
  }, [shouldPoll, isTriageInProgress, triageResult])

  // Detect completion and notify
  useEffect(() => {
    if (previousStatusRef.current === 'processing' && currentStatus === 'completed') {
      toast.success('AI Triage Completed', {
        description: 'Analysis is ready to view.',
      })
      setShouldPoll(false)
      onTriageCompleted?.()
    } else if (previousStatusRef.current === 'processing' && currentStatus === 'failed') {
      toast.error('AI Triage Failed', {
        description: triageResult?.errorMessage || 'Please try again.',
      })
      setShouldPoll(false)
    }
    previousStatusRef.current = currentStatus ?? null
  }, [currentStatus, triageResult?.errorMessage, onTriageCompleted])

  // Start polling when status becomes pending/processing
  useEffect(() => {
    if (isTriageInProgress && !shouldPoll) {
      setShouldPoll(true)
    }
  }, [isTriageInProgress, shouldPoll])

  const handleClick = useCallback(async () => {
    if (isDisabled) return

    setIsRequesting(true)
    // Reset polling state
    pollCountRef.current = 0
    setPollInterval(2000)

    try {
      const result = await requestTriage({ mode: 'quick' })

      if (result) {
        toast.success('AI Triage Started', {
          description: "Analysis has been queued. We'll notify you when it completes.",
        })
        setShouldPoll(true) // Start polling
        previousStatusRef.current = 'pending'
        onTriageRequested?.()
        // Refresh immediately to get pending status
        mutate()
      }
    } catch (error) {
      toast.error('Failed to start AI triage', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsRequesting(false)
    }
  }, [isDisabled, requestTriage, onTriageRequested, mutate])

  const getButtonContent = () => {
    if (isRequesting || currentStatus === 'processing') {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Analyzing...
        </>
      )
    }

    if (currentStatus === 'pending') {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Queued...
        </>
      )
    }

    if (currentStatus === 'completed') {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          Re-analyze
        </>
      )
    }

    if (currentStatus === 'failed') {
      return (
        <>
          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          Retry Triage
        </>
      )
    }

    return (
      <>
        <Bot className="h-4 w-4 mr-2" />
        AI Triage
      </>
    )
  }

  const getTooltipContent = () => {
    if (currentStatus === 'pending') {
      return 'AI triage is queued and waiting to process'
    }
    if (currentStatus === 'processing') {
      return 'AI is currently analyzing this finding'
    }
    if (currentStatus === 'completed') {
      return 'Run AI triage again to get updated analysis'
    }
    return 'Analyze this finding with AI to get severity assessment, risk score, and remediation guidance'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleClick}
            disabled={isDisabled}
          >
            {getButtonContent()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
