'use client'

import { useParams, useRouter } from 'next/navigation'
import { Main } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { useFindingApi, useAddFindingCommentApi } from '@/features/findings/api/use-findings-api'
import { useFindingActivitiesInfinite } from '@/features/findings/api/use-finding-activities-api'
import type { ApiFinding } from '@/features/findings/api/finding-api.types'
import { toast } from 'sonner'
import type {
  FindingDetail,
  FindingStatus,
  Activity,
  FindingType,
  SecretType,
  ComplianceFramework,
  ComplianceResult,
} from '@/features/findings/types'
import type { Severity } from '@/features/shared/types'
import {
  FindingHeader,
  OverviewTab,
  EvidenceTab,
  RemediationTab,
  RelatedTab,
  ActivityPanel,
  DataFlowTab,
} from '@/features/findings/components/detail'

/**
 * Transform API response to FindingDetail format for UI components
 * Asset info now comes from api.asset (enriched by backend)
 */
function transformApiToFindingDetail(api: ApiFinding): FindingDetail {
  // Use asset info from API (enriched by backend) or fall back to asset_id
  const assetName = api.asset?.name || api.asset_id
  const assetWebUrl = api.asset?.web_url
  const statusMap: Record<string, FindingStatus> = {
    new: 'new',
    open: 'new',
    confirmed: 'confirmed',
    in_progress: 'in_progress',
    resolved: 'resolved',
    false_positive: 'false_positive',
    accepted: 'accepted',
    duplicate: 'duplicate',
  }

  // Create initial activity from creation
  const activities: Activity[] = [
    {
      id: `act-created-${api.id}`,
      type: 'created',
      actor: 'system',
      content: `Discovered by ${api.tool_name}`,
      metadata: {
        source: api.source,
        scanId: api.scan_id,
      },
      createdAt: api.created_at,
    },
  ]

  // Add status change activity if resolved
  if (api.resolved_at) {
    activities.unshift({
      id: `act-resolved-${api.id}`,
      type: 'status_changed',
      actor: api.resolved_by
        ? { id: 'resolver', name: api.resolved_by, email: '', role: 'analyst' }
        : 'system',
      previousValue: 'in_progress',
      newValue: 'resolved',
      content: api.resolution || 'Finding resolved',
      createdAt: api.resolved_at,
    })
  }

  // Build location string for display (file:line:col)
  let locationDisplay = api.file_path || ''
  if (api.start_line) {
    locationDisplay = `${locationDisplay}:${api.start_line}`
    if (api.start_column) {
      locationDisplay = `${locationDisplay}:${api.start_column}`
    }
  }

  // Use asset name if provided, otherwise use a display-friendly version
  const displayAssetName = assetName || api.asset_id

  return {
    id: api.id,
    title: api.title || api.rule_name || api.message,
    description: api.description || api.message,
    severity: api.severity as Severity,
    status: statusMap[api.status] || 'new',

    // Technical details - use direct API fields first, then metadata fallback
    cvss: api.cvss_score ?? (api.metadata?.cvss as number) ?? undefined,
    cvssVector: api.cvss_vector || (api.metadata?.cvss_vector as string) || undefined,
    cve: api.cve_id || (api.metadata?.cve as string) || undefined,
    cwe: api.cwe_ids?.[0] || (api.metadata?.cwe as string) || undefined,
    owasp: api.owasp_ids?.[0] || (api.metadata?.owasp as string) || undefined,
    tags: api.tags || (api.metadata?.tags as string[]) || [],

    // Location Info
    filePath: api.file_path,
    startLine: api.start_line,
    endLine: api.end_line,
    startColumn: api.start_column,
    endColumn: api.end_column,

    // Scanner/Tool Info
    ruleId: api.rule_id,
    ruleName: api.rule_name,
    toolName: api.tool_name,
    toolVersion: api.tool_version,

    // Code snippet
    snippet: api.snippet,

    // Asset - use resolved asset name and webUrl
    assets: [
      {
        id: api.asset_id,
        type: 'repository',
        name: displayAssetName,
        url: assetWebUrl,
      },
    ],

    // Evidence - include snippet if available
    evidence: api.snippet
      ? [
          {
            id: `ev-snippet-${api.id}`,
            type: 'code',
            title: locationDisplay || 'Code Snippet',
            content: api.snippet,
            mimeType: 'text/plain',
            createdAt: api.created_at,
            createdBy: {
              id: 'system',
              name: api.tool_name,
              email: 'scanner@rediver.io',
              role: 'admin',
            },
          },
        ]
      : [],

    // Remediation - use recommendation from scanner, then resolution, then fallback
    remediation: {
      description: api.recommendation || api.resolution || 'No recommendation provided by scanner.',
      steps: [],
      references: (api.metadata?.references as string[]) || [],
      progress: api.status === 'resolved' ? 100 : 0,
    },

    // Source info - pass through actual source type from API
    source: api.source as FindingDetail['source'],
    scanner: api.tool_name,
    scanId: api.scan_id,

    // Relations - empty for now
    relatedFindings: [],

    // Assignment - use assigned_to_user if available (from backend enrichment)
    assignee: api.assigned_to
      ? {
          id: api.assigned_to,
          name: api.assigned_to_user?.name || api.assigned_to, // Use enriched name or fall back to ID
          email: api.assigned_to_user?.email || '',
          role: 'analyst' as const,
        }
      : undefined,

    // Timestamps
    discoveredAt: api.first_detected_at || api.created_at,
    resolvedAt: api.resolved_at,
    createdAt: api.created_at,
    updatedAt: api.updated_at,

    // Activities
    activities,

    // Extended: Risk Assessment
    isTriaged: api.is_triaged,
    confidence: api.confidence,
    impact: api.impact,
    likelihood: api.likelihood,
    rank: api.rank,
    slaStatus: api.sla_status,

    // Extended: Security Context
    exposureVector: api.exposure_vector,
    isNetworkAccessible: api.is_network_accessible,
    attackPrerequisites: api.attack_prerequisites,
    dataExposureRisk: api.data_exposure_risk,
    reputationalImpact: api.reputational_impact,
    complianceImpact: api.compliance_impact,

    // Extended: Classification
    vulnerabilityClass: api.vulnerability_class,
    baselineState: api.baseline_state,
    kind: api.kind,

    // Extended: Remediation Info
    remediationType: api.remediation_type,
    estimatedFixTime: api.estimated_fix_time,
    fixComplexity: api.fix_complexity,
    remedyAvailable: api.remedy_available,

    // Extended: Tracking
    workItemUris: api.work_item_uris,
    occurrenceCount: api.occurrence_count,
    duplicateCount: api.duplicate_count,
    lastSeenAt: api.last_seen_at,
    correlationId: api.correlation_id,

    // Extended: Technical context
    stacks: api.stacks,
    relatedLocations: api.related_locations,

    // Data Flow (Attack Path / Taint Tracking)
    dataFlow: api.data_flow
      ? {
          sources: api.data_flow.sources?.map((loc) => ({
            path: loc.path,
            line: loc.line,
            column: loc.column,
            content: loc.content,
            label: loc.label,
            index: loc.index,
            type: loc.location_type,
          })),
          intermediates: api.data_flow.intermediates?.map((loc) => ({
            path: loc.path,
            line: loc.line,
            column: loc.column,
            content: loc.content,
            label: loc.label,
            index: loc.index,
            type: loc.location_type,
          })),
          sinks: api.data_flow.sinks?.map((loc) => ({
            path: loc.path,
            line: loc.line,
            column: loc.column,
            content: loc.content,
            label: loc.label,
            index: loc.index,
            type: loc.location_type,
          })),
        }
      : undefined,

    // Finding Type discriminator
    findingType: api.finding_type as FindingType | undefined,

    // Type-specific details
    secretDetails: api.secret_type
      ? {
          secretType: api.secret_type as SecretType,
          service: api.secret_service,
          valid: api.secret_valid,
          revoked: api.secret_revoked,
        }
      : undefined,
    complianceDetails: api.compliance_framework
      ? {
          framework: api.compliance_framework as ComplianceFramework,
          controlId: api.compliance_control_id,
          result: api.compliance_result as ComplianceResult | undefined,
        }
      : undefined,
    web3Details: api.web3_chain
      ? {
          chain: api.web3_chain,
          contractAddress: api.web3_contract_address,
          swcId: api.web3_swc_id,
        }
      : undefined,
  }
}

function LoadingSkeleton() {
  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Left Panel - Header + Tabs */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        {/* Header skeleton */}
        <CardHeader className="flex-shrink-0 border-b pb-4">
          <Skeleton className="mb-2 h-4 w-32" />
          <Skeleton className="mb-2 h-7 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
        </CardHeader>

        {/* Tabs skeleton - underline style */}
        <div className="flex-shrink-0 border-b px-6">
          <div className="flex gap-4 py-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>

        {/* Content skeleton */}
        <CardContent className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Activity */}
      <Card className="hidden w-[320px] flex-shrink-0 flex-col overflow-hidden lg:flex xl:w-[380px]">
        <CardHeader className="flex-shrink-0 border-b pb-2">
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        {/* Comment form skeleton */}
        <div className="flex-shrink-0 border-t p-2">
          <Skeleton className="mb-1.5 h-[50px] w-full" />
          <div className="flex justify-between">
            <div className="flex gap-1">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-5" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function FindingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: apiFinding, error, isLoading } = useFindingApi(id)
  const { trigger: addComment } = useAddFindingCommentApi(id)
  const {
    activities: apiActivities,
    total: activitiesTotal,
    isLoadingMore,
    isReachingEnd,
    loadMore,
    mutate: mutateActivities,
  } = useFindingActivitiesInfinite(id)

  // Transform API data to FindingDetail format
  // Asset info now comes from api.asset (enriched by backend), no need for separate fetch
  const finding = apiFinding ? transformApiToFindingDetail(apiFinding) : null

  // Activities from backend include all events: status changes, comments, assignments, etc.
  // Comments are included as activity_type='comment_added' with full content in changes.content
  // No need for separate /comments API call - everything is in activities
  const allActivities = apiActivities.length > 0 ? apiActivities : finding ? finding.activities : []

  // Handler for adding new comments
  const handleAddComment = async (content: string, _isInternal: boolean) => {
    if (!content.trim()) return

    try {
      await addComment({ content })
      // Revalidate activities - comment is created as an activity record
      await mutateActivities()
      toast.success('Comment added')
    } catch (error) {
      toast.error('Failed to add comment')
      console.error('Add comment error:', error)
    }
  }

  if (isLoading) {
    return (
      <Main>
        <LoadingSkeleton />
      </Main>
    )
  }

  if (error || !finding) {
    return (
      <Main>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Finding Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The finding with ID &quot;{id}&quot; does not exist.
            </p>
            <Button className="mt-4" onClick={() => router.push('/findings')}>
              Return to Findings
            </Button>
          </div>
        </div>
      </Main>
    )
  }

  return (
    <Main fixed>
      {/* Two-panel resizable layout */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 rounded-lg"
        autoSaveId="finding-detail-layout"
      >
        {/* Left Panel - Header + Tabs */}
        <ResizablePanel defaultSize={70} minSize={40}>
          <Card className="flex h-full flex-col overflow-hidden pb-4 gap-0">
            {/* Finding Header */}
            <CardHeader className="flex-shrink-0 pb-1">
              <FindingHeader finding={finding} />
            </CardHeader>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
              <div className="flex-shrink-0 border-b px-6">
                <TabsList className="h-auto gap-4 rounded-none bg-transparent p-0">
                  <TabsTrigger
                    value="overview"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="evidence"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Evidence (
                    {finding.evidence.length +
                      (finding.stacks?.length || 0) +
                      (finding.relatedLocations?.length || 0)}
                    )
                  </TabsTrigger>
                  <TabsTrigger
                    value="remediation"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Remediation
                  </TabsTrigger>
                  <TabsTrigger
                    value="attack-path"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Attack Path
                    {finding.dataFlow && (
                      <span className="ml-1.5 rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400">
                        {(finding.dataFlow.sources?.length || 0) +
                          (finding.dataFlow.intermediates?.length || 0) +
                          (finding.dataFlow.sinks?.length || 0)}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="related"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Related
                  </TabsTrigger>
                </TabsList>
              </div>

              <CardContent className="min-h-0 flex-1 overflow-y-auto p-6">
                <TabsContent value="overview" className="m-0 mt-0">
                  <OverviewTab finding={finding} />
                </TabsContent>
                <TabsContent value="evidence" className="m-0 mt-0">
                  <EvidenceTab evidence={finding.evidence} finding={finding} />
                </TabsContent>
                <TabsContent value="remediation" className="m-0 mt-0">
                  <RemediationTab remediation={finding.remediation} finding={finding} />
                </TabsContent>
                <TabsContent value="attack-path" className="m-0 mt-0">
                  <DataFlowTab finding={finding} />
                </TabsContent>
                <TabsContent value="related" className="m-0 mt-0">
                  <RelatedTab finding={finding} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </ResizablePanel>

        {/* Resize Handle */}
        <ResizableHandle withHandle className="mx-2 hidden lg:flex" />

        {/* Right Panel - Activity */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50} className="hidden lg:block">
          <Card className="h-full overflow-hidden py-1">
            <div className="flex h-full flex-col">
              <CardHeader className="flex-shrink-0 border-b [.border-b]:pb-3 py-1">
                <CardTitle className="text-base">Activity ({activitiesTotal})</CardTitle>
              </CardHeader>
              <div className="relative flex-1">
                <div className="absolute inset-0 overflow-hidden">
                  <ActivityPanel
                    activities={allActivities}
                    onAddComment={handleAddComment}
                    total={activitiesTotal}
                    hasMore={!isReachingEnd}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={loadMore}
                  />
                </div>
              </div>
            </div>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Main>
  )
}
