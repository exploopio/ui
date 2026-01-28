'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Loader,
  Wrench,
  Link,
  ListChecks,
  XCircle,
  Gauge,
  Timer,
} from 'lucide-react'
import type { Remediation, RemediationStepStatus, FindingDetail } from '../../types'

interface RemediationTabProps {
  remediation: Remediation
  finding?: FindingDetail // Optional: for extended remediation info
}

const STATUS_ICONS: Record<RemediationStepStatus, React.ReactNode> = {
  pending: <Circle className="text-muted-foreground h-4 w-4" />,
  in_progress: <Loader className="h-4 w-4 animate-spin text-yellow-400" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-400" />,
}

export function RemediationTab({ remediation, finding }: RemediationTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isOverdue = remediation.deadline && new Date(remediation.deadline) < new Date()
  const daysUntilDeadline = remediation.deadline
    ? Math.ceil(
        (new Date(remediation.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null

  const completedSteps = remediation.steps.filter((s) => s.status === 'completed').length
  const totalSteps = remediation.steps.length

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Remediation Progress</h3>
            <p className="text-muted-foreground text-sm">
              {completedSteps} of {totalSteps} steps completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{remediation.progress}%</p>
            {remediation.deadline && (
              <div
                className={`flex items-center justify-end gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}
              >
                {isOverdue ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                {isOverdue ? (
                  <span>Overdue by {Math.abs(daysUntilDeadline!)} days</span>
                ) : (
                  <span>Due {formatDate(remediation.deadline)}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <Progress value={remediation.progress} className="h-2" />
      </div>

      {/* Remediation Context - from finding extended data */}
      {finding &&
        (finding.remediationType ||
          finding.estimatedFixTime !== undefined ||
          finding.fixComplexity ||
          finding.remedyAvailable !== undefined) && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
            {finding.remediationType && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Remediation Type</p>
                <Badge variant="outline" className="capitalize">
                  {finding.remediationType}
                </Badge>
              </div>
            )}
            {finding.fixComplexity && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Fix Complexity</p>
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" />
                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      finding.fixComplexity === 'complex'
                        ? 'border-red-500/50 text-red-400'
                        : finding.fixComplexity === 'moderate'
                          ? 'border-yellow-500/50 text-yellow-400'
                          : 'border-green-500/50 text-green-400'
                    }`}
                  >
                    {finding.fixComplexity}
                  </Badge>
                </div>
              </div>
            )}
            {finding.estimatedFixTime !== undefined && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Estimated Fix Time</p>
                <div className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {finding.estimatedFixTime >= 60
                      ? `${Math.floor(finding.estimatedFixTime / 60)}h ${finding.estimatedFixTime % 60}m`
                      : `${finding.estimatedFixTime}m`}
                  </span>
                </div>
              </div>
            )}
            {finding.remedyAvailable !== undefined && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Remedy Available</p>
                <div className="flex items-center gap-1.5">
                  {finding.remedyAvailable ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                      <span className="font-medium text-green-400">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-yellow-400" />
                      <span className="font-medium text-yellow-400">No</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Description */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Wrench className="h-4 w-4" />
          Recommended Fix
        </h3>
        <p className="text-muted-foreground text-sm">{remediation.description}</p>
      </div>

      <Separator />

      {/* Remediation Steps */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <ListChecks className="h-4 w-4" />
            Steps
          </h3>
          <Button size="sm" variant="outline">
            Add Step
          </Button>
        </div>
        <div className="space-y-3">
          {remediation.steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                step.status === 'completed'
                  ? 'border-green-500/20 bg-green-500/5'
                  : step.status === 'in_progress'
                    ? 'border-yellow-500/20 bg-yellow-500/5'
                    : 'bg-muted/30'
              }`}
            >
              <div className="pt-0.5">
                <Checkbox
                  checked={step.status === 'completed'}
                  disabled
                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    Step {index + 1}
                  </span>
                  {STATUS_ICONS[step.status]}
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      step.status === 'completed'
                        ? 'border-green-500/50 text-green-400'
                        : step.status === 'in_progress'
                          ? 'border-yellow-500/50 text-yellow-400'
                          : ''
                    }`}
                  >
                    {step.status === 'in_progress'
                      ? 'In Progress'
                      : step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                  </Badge>
                </div>
                <p
                  className={`text-sm ${step.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}
                >
                  {step.description}
                </p>
                {step.completedBy && step.completedAt && (
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">
                        {getInitials(step.completedBy.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      Completed by {step.completedBy.name} on {formatDate(step.completedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* References */}
      {remediation.references.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Link className="h-4 w-4" />
              References
            </h3>
            <ul className="space-y-2">
              {remediation.references.map((ref, index) => (
                <li key={index}>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {ref}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
