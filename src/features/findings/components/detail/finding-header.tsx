'use client'

import { useState, useEffect, useDeferredValue } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ChevronDown,
  ExternalLink,
  User,
  Calendar,
  Shield,
  Loader2,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTenant } from '@/context/tenant-provider'
import { useCVEEnrichment } from '@/features/threat-intel/hooks'
import { EPSSScoreBadge } from '@/features/shared/components/epss-score-badge'
import { KEVIndicatorBadge } from '@/features/shared/components/kev-indicator-badge'
import {
  useUpdateFindingStatusApi,
  useUpdateFindingSeverityApi,
  useAssignFindingApi,
  useUnassignFindingApi,
  invalidateFindingsCache,
} from '../../api/use-findings-api'
import { useMembers } from '@/features/organization/api/use-members'
import {
  FINDING_STATUS_CONFIG,
  SEVERITY_CONFIG,
  STATUS_TRANSITIONS,
  requiresApproval,
} from '../../types'
import type { FindingDetail, FindingStatus, FindingSource } from '../../types'
import type { Severity } from '@/features/shared/types'

// Human-readable source labels
const SOURCE_LABELS: Record<FindingSource, string> = {
  sast: 'SAST',
  dast: 'DAST',
  sca: 'SCA',
  secret: 'Secret Scan',
  iac: 'IaC Scan',
  container: 'Container Scan',
  manual: 'Manual',
  external: 'External',
}

interface FindingHeaderProps {
  finding: FindingDetail
  onStatusChange?: (status: FindingStatus) => void
  onSeverityChange?: (severity: Severity) => void
  onAssigneeChange?: (assigneeId: string | null) => void
}

export function FindingHeader({
  finding,
  onStatusChange,
  onSeverityChange,
  onAssigneeChange,
}: FindingHeaderProps) {
  const [status, setStatus] = useState<FindingStatus>(finding.status)
  const [severity, setSeverity] = useState<Severity>(finding.severity)
  const [assigneeState, setAssigneeState] = useState(finding.assignee)
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const { currentTenant } = useTenant()

  // Debounce search to reduce API calls
  const deferredSearch = useDeferredValue(assigneeSearch)

  // Max members to display in dropdown
  const MAX_DISPLAY_MEMBERS = 5

  // Sync local state when finding prop changes (after SWR revalidation)
  useEffect(() => {
    setStatus(finding.status)
  }, [finding.status])

  useEffect(() => {
    setSeverity(finding.severity)
  }, [finding.severity])

  useEffect(() => {
    setAssigneeState(finding.assignee)
  }, [finding.assignee])

  // API mutation hooks
  const { trigger: updateStatus, isMutating: isUpdatingStatus } = useUpdateFindingStatusApi(
    finding.id
  )
  const { trigger: updateSeverity, isMutating: isUpdatingSeverity } = useUpdateFindingSeverityApi(
    finding.id
  )
  const { trigger: assignUser, isMutating: isAssigning } = useAssignFindingApi(finding.id)
  const { trigger: unassignUser, isMutating: isUnassigning } = useUnassignFindingApi(finding.id)

  // Lazy fetch: Only load members when popover is opened
  // Assignee name now comes from API (assigned_to_user), so no need for name resolution fetch
  const {
    members: dropdownMembers,
    total: dropdownTotal,
    isLoading: isLoadingDropdown,
  } = useMembers(assigneePopoverOpen ? currentTenant?.id : undefined, {
    limit: MAX_DISPLAY_MEMBERS,
  })

  // Fetch members with search (only when popover is open AND searching)
  const isSearchActive = deferredSearch.trim().length > 0
  const {
    members: searchedMembers,
    total: searchedTotal,
    isLoading: isSearching,
  } = useMembers(assigneePopoverOpen && isSearchActive ? currentTenant?.id : undefined, {
    search: deferredSearch.trim(),
    limit: MAX_DISPLAY_MEMBERS,
  })

  // Use searched results if searching, otherwise use dropdown members
  const displayMembers = isSearchActive ? searchedMembers : dropdownMembers
  const totalMembers = isSearchActive ? searchedTotal : dropdownTotal
  const isLoadingMembers = isSearchActive ? isSearching : isLoadingDropdown

  // Check if there are more members than displayed
  const hasMoreMembers = totalMembers > MAX_DISPLAY_MEMBERS

  // Assignee comes from API with full user info (assigned_to_user)
  // No need to resolve from members list anymore
  const assignee = assigneeState

  // Helper to update assignee state
  const setAssignee = (newAssignee: typeof assigneeState) => {
    setAssigneeState(newAssignee)
  }

  // Fetch EPSS/KEV data if finding has CVE
  const { epss, kev } = useCVEEnrichment(currentTenant?.id || null, finding.cve || null)

  const statusConfig = FINDING_STATUS_CONFIG[status]
  const severityConfig = SEVERITY_CONFIG[severity]
  const availableTransitions = STATUS_TRANSITIONS[status]

  const handleStatusChange = async (newStatus: FindingStatus) => {
    // Check if status requires approval
    if (requiresApproval(newStatus)) {
      // TODO: Open approval dialog instead of direct status change
      toast.info(
        `${FINDING_STATUS_CONFIG[newStatus].label} requires approval. Feature coming soon.`
      )
      return
    }

    const previousStatus = status
    // Optimistic update
    setStatus(newStatus)

    try {
      // Backend and frontend now use unified status model
      await updateStatus({
        status: newStatus,
        resolution: newStatus === 'resolved' ? 'Resolved via UI' : undefined,
      })
      onStatusChange?.(newStatus)
      await invalidateFindingsCache()
      toast.success(`Status updated to ${FINDING_STATUS_CONFIG[newStatus].label}`)
    } catch (error) {
      // Revert on error
      setStatus(previousStatus)
      toast.error('Failed to update status')
      console.error('Status update error:', error)
    }
  }

  const handleSeverityChange = async (newSeverity: Severity) => {
    const previousSeverity = severity
    // Optimistic update
    setSeverity(newSeverity)

    try {
      await updateSeverity({ severity: newSeverity })
      onSeverityChange?.(newSeverity)
      await invalidateFindingsCache()
      toast.success(`Severity updated to ${SEVERITY_CONFIG[newSeverity].label}`)
    } catch (error) {
      // Revert on error
      setSeverity(previousSeverity)
      toast.error('Failed to update severity')
      console.error('Severity update error:', error)
    }
  }

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

  const handleAssigneeChange = async (
    userId: string | null,
    userName?: string,
    userEmail?: string
  ) => {
    const previousAssignee = assignee

    // Optimistic update
    if (userId && userName) {
      setAssignee({ id: userId, name: userName, email: userEmail || '', role: 'analyst' })
    } else {
      setAssignee(undefined)
    }

    try {
      if (userId) {
        await assignUser({ user_id: userId })
        toast.success(`Assigned to ${userName}`)
      } else {
        await unassignUser()
        toast.success('Unassigned successfully')
      }
      onAssigneeChange?.(userId)
      await invalidateFindingsCache()
    } catch (error) {
      // Revert on error
      setAssignee(previousAssignee)
      toast.error(userId ? 'Failed to assign' : 'Failed to unassign')
      console.error('Assignee update error:', error)
    }
  }

  return (
    <div className="space-y-2">
      {/* Row 1: Classification badges (left) + Status badges (right) - 2 column grid */}
      <div className="text-muted-foreground grid grid-cols-2 gap-2 text-sm">
        {/* Left: Classification badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Source type badge - always show */}
          <Badge variant="outline" className="text-xs uppercase">
            {SOURCE_LABELS[finding.source] || finding.source}
          </Badge>
          {/* CVE if available */}
          {finding.cve && (
            <Badge variant="outline" className="text-xs">
              {finding.cve}
            </Badge>
          )}
          {/* CWE if available */}
          {finding.cwe && (
            <Badge variant="outline" className="text-xs">
              {finding.cwe}
            </Badge>
          )}
          {/* Vulnerability class badges - show if no CVE/CWE */}
          {!finding.cve &&
            !finding.cwe &&
            finding.vulnerabilityClass &&
            finding.vulnerabilityClass.slice(0, 2).map((cls) => (
              <Badge key={cls} variant="secondary" className="text-xs">
                {cls}
              </Badge>
            ))}
          {/* EPSS Score Badge */}
          {epss && (
            <EPSSScoreBadge
              score={epss.score}
              percentile={epss.percentile}
              showPercentile
              size="sm"
            />
          )}
          {/* KEV Indicator Badge - only show if has CVE */}
          {finding.cve && (
            <KEVIndicatorBadge
              inKEV={!!kev}
              kevData={
                kev
                  ? {
                      date_added: kev.date_added,
                      due_date: kev.due_date,
                      ransomware_use: kev.known_ransomware_campaign_use,
                      notes: kev.notes,
                    }
                  : null
              }
              size="sm"
            />
          )}
        </div>

        {/* Right: Status badges - align to end */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Triaged Badge */}
          {finding.isTriaged && (
            <Badge variant="outline" className="text-xs border-green-500/50 text-green-400 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Triaged
            </Badge>
          )}
          {/* SLA Status Badge */}
          {finding.slaStatus && finding.slaStatus !== 'not_applicable' && (
            <Badge
              variant="outline"
              className={`text-xs gap-1 ${
                finding.slaStatus === 'breached'
                  ? 'border-red-500/50 text-red-400'
                  : finding.slaStatus === 'at_risk'
                    ? 'border-yellow-500/50 text-yellow-400'
                    : 'border-green-500/50 text-green-400'
              }`}
            >
              {finding.slaStatus === 'breached' ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              SLA:{' '}
              {finding.slaStatus === 'on_track'
                ? 'On Track'
                : finding.slaStatus === 'at_risk'
                  ? 'At Risk'
                  : 'Breached'}
            </Badge>
          )}
        </div>
      </div>

      {/* Row 2: Title */}
      <h1 className="text-xl font-bold leading-tight">{finding.title}</h1>

      {/* Row 3: Status + Severity + Meta (combined) */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {/* Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-7 ${statusConfig.bgColor} ${statusConfig.textColor} border-0`}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
              {statusConfig.label}
              <ChevronDown className="ml-1.5 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {availableTransitions.map((s) => {
              const config = FINDING_STATUS_CONFIG[s]
              return (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="flex items-center gap-2"
                  disabled={isUpdatingStatus}
                >
                  <div className={`h-2 w-2 rounded-full ${config.bgColor.replace('/20', '')}`} />
                  {config.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Severity Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-7 ${severityConfig.bgColor} ${severityConfig.textColor} border-0`}
              disabled={isUpdatingSeverity}
            >
              {isUpdatingSeverity ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Shield className="mr-1 h-3 w-3" />
              )}
              {severityConfig.label}
              {finding.cvss !== undefined && (
                <span className="ml-1 font-mono text-xs">({finding.cvss})</span>
              )}
              <ChevronDown className="ml-1.5 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((s) => {
              const config = SEVERITY_CONFIG[s]
              return (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleSeverityChange(s)}
                  className="flex items-center gap-2"
                  disabled={isUpdatingSeverity}
                >
                  <div className={`h-2 w-2 rounded-full ${config.bgColor.replace('/20', '')}`} />
                  {config.label}
                  <span className="text-muted-foreground ml-auto text-xs">{config.cvssRange}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Assignee Popover with Search */}
        <Popover
          open={assigneePopoverOpen}
          onOpenChange={(open) => {
            setAssigneePopoverOpen(open)
            if (!open) setAssigneeSearch('') // Reset search on close
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2"
              disabled={isAssigning || isUnassigning}
            >
              {(isAssigning || isUnassigning) && <Loader2 className="h-3 w-3 animate-spin" />}
              {assignee ? (
                <>
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px]">
                      {getInitials(assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">
                    {assignee.name}
                    {assignee.email && (
                      <span className="text-muted-foreground/70 ml-1">({assignee.email})</span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5" />
                  <span className="text-muted-foreground">Unassigned</span>
                </>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search members..."
                value={assigneeSearch}
                onValueChange={setAssigneeSearch}
              />
              <CommandList>
                {isLoadingMembers && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isLoadingMembers && displayMembers.length === 0 && (
                  <CommandEmpty>No members found.</CommandEmpty>
                )}
                {!isLoadingMembers && (
                  <>
                    {assignee && !assigneeSearch && (
                      <>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              handleAssigneeChange(null)
                              setAssigneePopoverOpen(false)
                              setAssigneeSearch('')
                            }}
                            className="text-muted-foreground"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Unassign
                          </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                      </>
                    )}
                    {displayMembers.length > 0 && (
                      <CommandGroup
                        heading={`Team Members${hasMoreMembers ? ` (${totalMembers} total)` : ''}`}
                      >
                        {displayMembers.map((member) => (
                          <CommandItem
                            key={member.user_id}
                            value={member.user_id}
                            onSelect={() => {
                              handleAssigneeChange(member.user_id, member.name, member.email)
                              setAssigneePopoverOpen(false)
                              setAssigneeSearch('')
                            }}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarFallback className="text-[10px]">
                                {getInitials(member.name || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{member.name || 'Unknown'}</div>
                              {member.email && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {member.email}
                                </div>
                              )}
                            </div>
                            {assignee?.id === member.user_id && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {hasMoreMembers && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                        Type to search for more members
                      </div>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Discovered Date - inline */}
        <div className="text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(finding.discoveredAt)}</span>
        </div>

        {/* Source - inline */}
        <div className="text-muted-foreground flex items-center gap-1">
          <ExternalLink className="h-3.5 w-3.5" />
          <span>{SOURCE_LABELS[finding.source] || finding.source}</span>
          {finding.scanner && <span className="text-xs">({finding.scanner})</span>}
        </div>
      </div>

      {/* Row 4: Primary Repository with full URL */}
      {finding.assets.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Repository:</span>
          {finding.assets[0].url ? (
            <a
              href={
                finding.assets[0].url.startsWith('http')
                  ? finding.assets[0].url
                  : `https://${finding.assets[0].url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1"
            >
              {finding.assets[0].url}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="font-medium">{finding.assets[0].name}</span>
          )}
          {finding.assets.length > 1 && (
            <Badge variant="outline" className="text-xs">
              +{finding.assets.length - 1} more
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
