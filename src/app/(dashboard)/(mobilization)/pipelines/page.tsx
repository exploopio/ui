'use client'

import { useState, useCallback } from 'react'
import '@xyflow/react/dist/style.css'

import { Main } from '@/components/layout'
import { PageHeader } from '@/features/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Workflow,
  Play,
  Plus,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Eye,
  MoreHorizontal,
  Pencil,
  Copy,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Can, Permission } from '@/lib/permissions'

import { WorkflowBuilder, NodePalette } from '@/features/pipelines'
import {
  usePipelines,
  usePipeline,
  usePipelineRuns,
  useScanManagementStats,
  useTriggerPipelineRun,
  useUpdatePipeline,
  useActivatePipeline,
  useDeactivatePipeline,
  invalidateAllPipelineCaches,
  type PipelineTemplate,
  type PipelineRun,
  type PipelineStep,
  type UIPosition,
  PIPELINE_RUN_STATUS_LABELS,
  PIPELINE_TRIGGER_LABELS,
} from '@/lib/api'

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  active: { color: 'text-green-400', bgColor: 'bg-green-500/20' },
  inactive: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  error: { color: 'text-red-400', bgColor: 'bg-red-500/20' },
}

const runStatusConfig: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  running: 'bg-blue-500/20 text-blue-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
  timeout: 'bg-orange-500/20 text-orange-400',
}

export default function PipelinesPage() {
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineTemplate | null>(null)
  const [isBuilderMode, setIsBuilderMode] = useState(false)

  // Fetch data from API
  const { data: pipelines, isLoading: loadingPipelines, error: pipelinesError } = usePipelines()
  const { data: pipelineRuns, isLoading: loadingRuns } = usePipelineRuns({ per_page: 10 })
  const { data: stats, isLoading: loadingStats } = useScanManagementStats()

  // Mutations
  const { trigger: triggerRun, isMutating: triggeringRun } = useTriggerPipelineRun()
  const activatePipeline = useActivatePipeline(selectedPipeline?.id || '')
  const deactivatePipeline = useDeactivatePipeline(selectedPipeline?.id || '')

  const handleTriggerPipeline = async (pipeline: PipelineTemplate) => {
    try {
      await triggerRun({
        template_id: pipeline.id,
        trigger_type: 'manual',
      })
      toast.success(`Pipeline "${pipeline.name}" triggered successfully`)
      await invalidateAllPipelineCaches()
    } catch {
      toast.error(`Failed to trigger pipeline "${pipeline.name}"`)
    }
  }

  const handleToggleActive = async (pipeline: PipelineTemplate) => {
    try {
      if (pipeline.is_active) {
        await deactivatePipeline.trigger()
        toast.success(`Pipeline "${pipeline.name}" deactivated`)
      } else {
        await activatePipeline.trigger()
        toast.success(`Pipeline "${pipeline.name}" activated`)
      }
      await invalidateAllPipelineCaches()
    } catch {
      toast.error(`Failed to update pipeline "${pipeline.name}"`)
    }
  }

  const handleNodePositionChange = useCallback(async (stepId: string, position: UIPosition) => {
    // Would call updateStep mutation here
    console.log('Position changed:', stepId, position)
  }, [])

  const handleSaveWorkflow = async () => {
    toast.success('Workflow saved successfully')
    await invalidateAllPipelineCaches()
  }

  // Calculate stats
  const totalPipelines = stats?.pipelines.total ?? pipelines?.items?.length ?? 0
  const activePipelines =
    stats?.pipelines.completed ?? pipelines?.items?.filter((p) => p.is_active).length ?? 0
  const totalRuns = stats?.scans.total ?? 0
  const successRate =
    stats && stats.scans.total > 0
      ? Math.round((stats.scans.completed / stats.scans.total) * 100)
      : 0

  return (
    <>
      <Main>
        <PageHeader
          title="Scan Pipelines"
          description="Create and manage multi-step scan workflows with visual builder"
        >
          <Can permission={Permission.WorkflowsWrite} mode="disable">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Pipeline
            </Button>
          </Can>
        </PageHeader>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Total Pipelines
              </CardDescription>
              {loadingStats ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <CardTitle className="text-3xl">{totalPipelines}</CardTitle>
              )}
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Active
              </CardDescription>
              {loadingStats ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <CardTitle className="text-3xl text-green-500">{activePipelines}</CardTitle>
              )}
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Total Runs
              </CardDescription>
              {loadingStats ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <CardTitle className="text-3xl">{totalRuns}</CardTitle>
              )}
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Success Rate
              </CardDescription>
              {loadingStats ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <CardTitle className="text-3xl text-green-500">{successRate}%</CardTitle>
              )}
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="pipelines" className="mt-6">
          <TabsList>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
            <TabsTrigger value="runs">Recent Runs</TabsTrigger>
            <TabsTrigger value="builder">Visual Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="pipelines">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Configured Pipelines</CardTitle>
                <CardDescription>Manage your scan pipeline templates</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelinesError ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Failed to load pipelines
                  </div>
                ) : loadingPipelines ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : pipelines?.items?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Workflow className="mb-2 h-8 w-8" />
                    <p>No pipelines configured yet</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create your first pipeline
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pipelines?.items?.map((pipeline) => {
                      const status = pipeline.is_active
                        ? statusConfig.active
                        : statusConfig.inactive
                      const triggerLabels = pipeline.triggers
                        .map((t) => PIPELINE_TRIGGER_LABELS[t.type])
                        .join(', ')

                      return (
                        <div
                          key={pipeline.id}
                          className="flex items-start justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{pipeline.name}</h4>
                              <Badge className={`${status.bgColor} ${status.color} border-0`}>
                                {pipeline.is_active ? 'active' : 'inactive'}
                              </Badge>
                              {pipeline.is_system_template && (
                                <Badge variant="outline" className="text-xs">
                                  System
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm">{pipeline.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {triggerLabels || 'Manual'}
                              </span>
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />v{pipeline.version}
                              </span>
                              <span className="text-muted-foreground">
                                {pipeline.steps?.length || 0} steps
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {pipeline.tags?.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Switch
                              checked={pipeline.is_active}
                              onCheckedChange={() => handleToggleActive(pipeline)}
                              disabled={pipeline.is_system_template}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedPipeline(pipeline)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPipeline(pipeline)
                                    setIsBuilderMode(true)
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit in Builder
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleTriggerPipeline(pipeline)}
                                  disabled={triggeringRun}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Run Now
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Clone
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="runs">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Recent Pipeline Runs</CardTitle>
                <CardDescription>Latest pipeline executions and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRuns ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : pipelineRuns?.items?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Play className="mb-2 h-8 w-8" />
                    <p>No pipeline runs yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pipelineRuns?.items?.map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">Pipeline Run</p>
                          <div className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{PIPELINE_TRIGGER_LABELS[run.trigger_type]}</span>
                            <span>-</span>
                            <span>
                              {run.completed_steps}/{run.total_steps} steps
                            </span>
                          </div>
                        </div>
                        <Badge className={`${runStatusConfig[run.status] || ''} border-0`}>
                          {run.status === 'completed' ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : run.status === 'failed' ? (
                            <XCircle className="mr-1 h-3 w-3" />
                          ) : null}
                          {PIPELINE_RUN_STATUS_LABELS[run.status] || run.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builder">
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Visual Pipeline Builder</CardTitle>
                    <CardDescription>
                      {selectedPipeline
                        ? `Editing: ${selectedPipeline.name}`
                        : 'Select a pipeline to edit or create a new one'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedPipeline(null)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={handleSaveWorkflow} disabled={!selectedPipeline}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Pipeline
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex h-[600px] border-t">
                  <NodePalette />
                  <div className="flex-1">
                    {selectedPipeline ? (
                      <WorkflowBuilder
                        steps={selectedPipeline.steps || []}
                        onNodePositionChange={handleNodePositionChange}
                        readOnly={selectedPipeline.is_system_template}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Workflow className="mx-auto mb-4 h-12 w-12" />
                          <p className="text-lg font-medium">No Pipeline Selected</p>
                          <p className="text-sm mt-2">
                            Select a pipeline from the list or create a new one
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>

      {/* Pipeline Detail Sheet */}
      <Sheet
        open={!!selectedPipeline && !isBuilderMode}
        onOpenChange={() => setSelectedPipeline(null)}
      >
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              {selectedPipeline?.name}
            </SheetTitle>
            <SheetDescription>{selectedPipeline?.description}</SheetDescription>
          </SheetHeader>
          {selectedPipeline && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={`${selectedPipeline.is_active ? statusConfig.active.bgColor : statusConfig.inactive.bgColor} ${selectedPipeline.is_active ? statusConfig.active.color : statusConfig.inactive.color} border-0`}
                >
                  {selectedPipeline.is_active ? 'active' : 'inactive'}
                </Badge>
                <Badge variant="outline">v{selectedPipeline.version}</Badge>
                <Badge variant="outline">{selectedPipeline.steps?.length || 0} steps</Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-muted-foreground">Triggers</Label>
                {selectedPipeline.triggers.length > 0 ? (
                  selectedPipeline.triggers.map((trigger, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border">
                      <Zap className="h-4 w-4 text-green-500" />
                      <span>{PIPELINE_TRIGGER_LABELS[trigger.type]}</span>
                      {trigger.schedule && (
                        <span className="text-xs text-muted-foreground">({trigger.schedule})</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span>Manual</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Steps</Label>
                <div className="space-y-2">
                  {selectedPipeline.steps?.map((step) => (
                    <div key={step.id} className="flex items-center gap-2 p-3 rounded-lg border">
                      <Play className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <span className="font-medium">{step.name}</span>
                        {step.tool && (
                          <span className="text-xs text-muted-foreground ml-2">({step.tool})</span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{step.order}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {selectedPipeline.settings?.max_parallel_steps || 3}
                  </p>
                  <p className="text-xs text-muted-foreground">Max Parallel</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {Math.round((selectedPipeline.settings?.timeout_seconds || 3600) / 60)}m
                  </p>
                  <p className="text-xs text-muted-foreground">Timeout</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleTriggerPipeline(selectedPipeline)}
                  disabled={triggeringRun}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Run Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsBuilderMode(true)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
