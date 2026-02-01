'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Bot, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRequestTriage } from '../api'
import type { TriageStatus } from '../types'

interface AITriageButtonProps {
  findingId: string
  currentStatus?: TriageStatus | null
  onTriageRequested?: () => void
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
}

export function AITriageButton({
  findingId,
  currentStatus,
  onTriageRequested,
  variant = 'outline',
  size = 'default',
  className,
  disabled,
}: AITriageButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { trigger: requestTriage } = useRequestTriage(findingId)

  const isDisabled =
    disabled || isLoading || currentStatus === 'pending' || currentStatus === 'processing'

  const handleClick = async () => {
    if (isDisabled) return

    setIsLoading(true)

    try {
      const result = await requestTriage({ mode: 'quick' })

      if (result) {
        toast.success('AI Triage Started', {
          description: 'Analysis has been queued and will complete shortly.',
        })
        onTriageRequested?.()
      }
    } catch (error) {
      toast.error('Failed to start AI triage', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonContent = () => {
    if (isLoading || currentStatus === 'processing') {
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
          <Bot className="h-4 w-4 mr-2" />
          Pending...
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
