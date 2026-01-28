'use client'

import { useParams, useRouter } from 'next/navigation'
import { Header, Main } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import {
  useFindingApi,
  useAddFindingCommentApi,
  useFindingCommentsApi,
} from '@/features/findings/api/use-findings-api'
import { useFindingActivitiesApi } from '@/features/findings/api/use-finding-activities-api'
import { useAsset } from '@/features/assets/hooks/use-assets'
import type { ApiFinding, ApiFindingComment } from '@/features/findings/api/finding-api.types'
import { toast } from 'sonner'
import type { FindingDetail, FindingStatus, Activity } from '@/features/findings/types'
import type { Severity } from '@/features/shared/types'
import {
  FindingHeader,
  OverviewTab,
  EvidenceTab,
  RemediationTab,
  RelatedTab,
  ActivityPanel,
} from '@/features/findings/components/detail'

/**
 * Transform API response to FindingDetail format for UI components
 */
function transformApiToFindingDetail(api: ApiFinding, assetName?: string): FindingDetail {
  // Map API status to internal status
  const statusMap: Record<string, FindingStatus> = {
    open: 'new',
    confirmed: 'confirmed',
    in_progress: 'in_progress',
    resolved: 'resolved',
    false_positive: 'false_positive',
    accepted: 'closed',
    wont_fix: 'closed',
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

    // Asset - use resolved asset name
    assets: [
      {
        id: api.asset_id,
        type: 'repository',
        name: displayAssetName,
        url: api.file_path ? undefined : undefined, // URL will be constructed in component
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

    // Timestamps
    discoveredAt: api.first_detected_at || api.created_at,
    resolvedAt: api.resolved_at,
    createdAt: api.created_at,
    updatedAt: api.updated_at,

    // Activities
    activities,
  }
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full gap-4 lg:gap-6">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Card className="mb-4 flex-shrink-0">
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0 pb-0">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-6 pt-4">
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="hidden w-[320px] flex-shrink-0 overflow-hidden xl:w-[380px] lg:flex lg:flex-col">
        <CardHeader className="flex-shrink-0 pb-2">
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <div className="flex-1 overflow-hidden p-4">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </Card>
    </div>
  )
}

// Transform API comments to Activity format
function transformCommentsToActivities(comments: ApiFindingComment[]): Activity[] {
  return comments.map(
    (comment): Activity => ({
      id: comment.id,
      type: comment.is_status_change ? 'status_changed' : 'comment',
      actor: {
        id: comment.author_id,
        name: comment.author_name || 'Unknown User',
        email: comment.author_email || '',
        role: 'analyst',
      },
      content: comment.content,
      previousValue: comment.old_status,
      newValue: comment.new_status,
      createdAt: comment.created_at,
      editedAt: comment.updated_at,
    })
  )
}

export default function FindingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: apiFinding, error, isLoading } = useFindingApi(id)
  const { data: commentsData, mutate: mutateComments } = useFindingCommentsApi(id)
  const { trigger: addComment } = useAddFindingCommentApi(id)
  const { activities: apiActivities, mutate: mutateActivities } = useFindingActivitiesApi(id)

  // Fetch asset details for name resolution
  const { asset } = useAsset(apiFinding?.asset_id || null)

  // Transform API data to FindingDetail format, passing asset name if available
  const finding = apiFinding ? transformApiToFindingDetail(apiFinding, asset?.name) : null

  // Use API activities if available, otherwise fall back to transformed comments + synthetic activities
  // Activities from the backend are preferred as they include the complete audit trail
  const apiComments = commentsData?.data || []
  const commentActivities = transformCommentsToActivities(apiComments)

  // If we have API activities, use them; otherwise use the fallback (synthetic + comments)
  // API activities already include comment events, so we don't need to merge
  const allActivities =
    apiActivities.length > 0
      ? apiActivities
      : finding
        ? [...finding.activities, ...commentActivities]
        : []

  // Handler for adding new comments
  const handleAddComment = async (content: string, _isInternal: boolean) => {
    if (!content.trim()) return

    try {
      await addComment({ content })
      // Revalidate both comments and activities
      // Activities are updated because adding a comment creates an activity record
      await Promise.all([mutateComments(), mutateActivities()])
      toast.success('Comment added')
    } catch (error) {
      toast.error('Failed to add comment')
      console.error('Add comment error:', error)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <Button variant="ghost" size="sm" onClick={() => router.push('/findings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Findings
          </Button>
        </Header>
        <Main fixed>
          <LoadingSkeleton />
        </Main>
      </>
    )
  }

  if (error || !finding) {
    return (
      <>
        <Header fixed>
          <Button variant="ghost" size="sm" onClick={() => router.push('/findings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Findings
          </Button>
        </Header>
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
      </>
    )
  }

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="sm" onClick={() => router.push('/findings')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <span className="text-muted-foreground ml-4 font-mono text-sm">{finding.id}</span>
        </div>
      </Header>

      <Main fixed>
        {/* Two-panel layout */}
        <div className="flex h-full gap-4 lg:gap-6">
          {/* Left Panel - Main Content */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Finding Header Card */}
            <Card className="mb-4 flex-shrink-0">
              <CardContent className="pt-6">
                <FindingHeader finding={finding} />
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <Tabs defaultValue="overview" className="flex h-full flex-col overflow-hidden">
                <CardHeader className="flex-shrink-0 pb-0">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="evidence">Evidence ({finding.evidence.length})</TabsTrigger>
                    <TabsTrigger value="remediation">Remediation</TabsTrigger>
                    <TabsTrigger value="related">Related</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="flex-1 overflow-auto p-6 pt-4">
                  <TabsContent value="overview" className="m-0 mt-0">
                    <OverviewTab finding={finding} />
                  </TabsContent>
                  <TabsContent value="evidence" className="m-0 mt-0">
                    <EvidenceTab evidence={finding.evidence} />
                  </TabsContent>
                  <TabsContent value="remediation" className="m-0 mt-0">
                    <RemediationTab remediation={finding.remediation} />
                  </TabsContent>
                  <TabsContent value="related" className="m-0 mt-0">
                    <RelatedTab finding={finding} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Panel - Activity */}
          <Card className="hidden w-[320px] flex-shrink-0 overflow-hidden xl:w-[380px] lg:flex lg:flex-col">
            <CardHeader className="flex-shrink-0 pb-2">
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-hidden">
              <ActivityPanel activities={allActivities} onAddComment={handleAddComment} />
            </div>
          </Card>
        </div>
      </Main>
    </>
  )
}
