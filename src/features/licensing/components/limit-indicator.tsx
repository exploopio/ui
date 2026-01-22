/**
 * LimitIndicator Component
 *
 * Displays usage progress towards a plan limit.
 * Shows visual indicator when approaching or at limit.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LimitIndicator
 *   current={45}
 *   limit={50}
 *   label="Assets"
 * />
 *
 * // With custom thresholds
 * <LimitIndicator
 *   current={8}
 *   limit={10}
 *   label="Team Members"
 *   warningThreshold={70}
 *   criticalThreshold={90}
 * />
 *
 * // Compact variant for sidebar
 * <LimitIndicator
 *   current={450}
 *   limit={500}
 *   label="Assets"
 *   variant="compact"
 * />
 * ```
 */

'use client'

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface LimitIndicatorProps {
  /**
   * Current usage value
   */
  current: number

  /**
   * Maximum limit (-1 for unlimited)
   */
  limit: number

  /**
   * Label to display
   */
  label: string

  /**
   * Percentage at which to show warning (yellow)
   * @default 80
   */
  warningThreshold?: number

  /**
   * Percentage at which to show critical (red)
   * @default 100
   */
  criticalThreshold?: number

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: 'default' | 'compact' | 'minimal'

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Format function for displaying values
   */
  formatValue?: (value: number) => string
}

// ============================================
// HELPERS
// ============================================

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

function getStatusColor(percentage: number, warning: number, critical: number) {
  if (percentage >= critical) return 'destructive'
  if (percentage >= warning) return 'warning'
  return 'default'
}

// ============================================
// COMPONENT
// ============================================

export function LimitIndicator({
  current,
  limit,
  label,
  warningThreshold = 80,
  criticalThreshold = 100,
  variant = 'default',
  className,
  formatValue = formatNumber,
}: LimitIndicatorProps) {
  // Handle unlimited
  if (limit === -1 || limit === 0) {
    if (variant === 'minimal') {
      return (
        <span className={cn('text-sm text-muted-foreground', className)}>
          {formatValue(current)} {label}
        </span>
      )
    }

    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">
            {formatValue(current)} <span className="text-muted-foreground">/ Unlimited</span>
          </span>
        </div>
        {variant === 'default' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>No limits on your plan</span>
          </div>
        )}
      </div>
    )
  }

  const percentage = Math.min((current / limit) * 100, 100)
  const status = getStatusColor(percentage, warningThreshold, criticalThreshold)
  const remaining = Math.max(limit - current, 0)
  const isAtLimit = current >= limit
  const isNearLimit = percentage >= warningThreshold

  // Minimal variant - just text
  if (variant === 'minimal') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'text-sm',
              status === 'destructive' && 'text-destructive font-medium',
              status === 'warning' && 'text-yellow-600 dark:text-yellow-500',
              status === 'default' && 'text-muted-foreground',
              className
            )}
          >
            {formatValue(current)}/{formatValue(limit)} {label}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {isAtLimit
            ? `You've reached your ${label.toLowerCase()} limit`
            : `${formatValue(remaining)} ${label.toLowerCase()} remaining`}
        </TooltipContent>
      </Tooltip>
    )
  }

  // Compact variant - small progress bar
  if (variant === 'compact') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('space-y-1', className)}>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span
                className={cn(
                  status === 'destructive' && 'text-destructive',
                  status === 'warning' && 'text-yellow-600 dark:text-yellow-500'
                )}
              >
                {formatValue(current)}/{formatValue(limit)}
              </span>
            </div>
            <Progress
              value={percentage}
              className={cn(
                'h-1.5',
                status === 'destructive' && '[&>div]:bg-destructive',
                status === 'warning' && '[&>div]:bg-yellow-500'
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isAtLimit
            ? `You've reached your ${label.toLowerCase()} limit. Upgrade for more.`
            : `${formatValue(remaining)} ${label.toLowerCase()} remaining (${Math.round(100 - percentage)}%)`}
        </TooltipContent>
      </Tooltip>
    )
  }

  // Default variant - full display
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={cn(
            'text-sm font-medium',
            status === 'destructive' && 'text-destructive',
            status === 'warning' && 'text-yellow-600 dark:text-yellow-500'
          )}
        >
          {formatValue(current)} / {formatValue(limit)}
        </span>
      </div>

      <Progress
        value={percentage}
        className={cn(
          'h-2',
          status === 'destructive' && '[&>div]:bg-destructive',
          status === 'warning' && '[&>div]:bg-yellow-500'
        )}
      />

      {/* Status message */}
      <div className="flex items-center gap-2 text-xs">
        {isAtLimit ? (
          <>
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-destructive">
              Limit reached. Upgrade for more {label.toLowerCase()}.
            </span>
          </>
        ) : isNearLimit ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-yellow-600 dark:text-yellow-500">
              {formatValue(remaining)} remaining ({Math.round(100 - percentage)}%)
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-muted-foreground">
              {formatValue(remaining)} remaining ({Math.round(100 - percentage)}%)
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// EXPORTS
// ============================================

export type { LimitIndicatorProps }
export default LimitIndicator
