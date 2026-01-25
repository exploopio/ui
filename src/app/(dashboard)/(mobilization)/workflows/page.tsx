'use client'

import { useState, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react'
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
import {
  Workflow,
  Play,
  Plus,
  CheckCircle,
  XCircle,
  Zap,
  GitBranch,
  Mail,
  RefreshCw,
  Save,
  Trash2,
  Eye,
  MoreHorizontal,
  Pencil,
  Copy,
  Clock,
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

// Mock data
const workflowStats = {
  totalWorkflows: 12,
  active: 8,
  triggered: 156,
  successRate: 94,
}

const workflows = [
  {
    id: 'wf-001',
    name: 'Critical Finding Auto-Assign',
    description: 'Automatically assign critical findings to senior security engineers',
    trigger: 'New Critical Finding',
    actions: ['Assign to Team Lead', 'Send Slack Alert', 'Create Jira Ticket'],
    status: 'active',
    lastTriggered: '10 mins ago',
    triggerCount: 45,
    successRate: 98,
  },
  {
    id: 'wf-002',
    name: 'Weekly Scan Schedule',
    description: 'Run comprehensive security scans every Monday at 2 AM',
    trigger: 'Schedule: Every Monday 2:00 AM',
    actions: ['Full Asset Scan', 'Generate Report', 'Email to Security Team'],
    status: 'active',
    lastTriggered: '2 days ago',
    triggerCount: 24,
    successRate: 100,
  },
  {
    id: 'wf-003',
    name: 'High-Risk Alert Escalation',
    description: 'Escalate high-risk findings not addressed within 48 hours',
    trigger: 'Finding Age > 48 hours',
    actions: ['Escalate to Manager', 'Send Email Reminder', 'Update Priority'],
    status: 'active',
    lastTriggered: '3 hours ago',
    triggerCount: 18,
    successRate: 95,
  },
  {
    id: 'wf-004',
    name: 'New Asset Discovery Notification',
    description: 'Notify team when new external assets are discovered',
    trigger: 'New Asset Discovered',
    actions: ['Slack Notification', 'Add to Inventory', 'Schedule Scan'],
    status: 'active',
    lastTriggered: '1 hour ago',
    triggerCount: 32,
    successRate: 92,
  },
  {
    id: 'wf-005',
    name: 'Compliance Report Generation',
    description: 'Generate monthly compliance reports for PCI-DSS',
    trigger: 'Schedule: 1st of Month',
    actions: ['Generate Report', 'Email to Compliance', 'Archive Report'],
    status: 'paused',
    lastTriggered: '1 month ago',
    triggerCount: 6,
    successRate: 100,
  },
]

const recentExecutions = [
  {
    workflow: 'Critical Finding Auto-Assign',
    status: 'success',
    duration: '1.2s',
    timestamp: '10 mins ago',
  },
  {
    workflow: 'New Asset Discovery Notification',
    status: 'success',
    duration: '0.8s',
    timestamp: '1 hour ago',
  },
  {
    workflow: 'High-Risk Alert Escalation',
    status: 'success',
    duration: '2.1s',
    timestamp: '3 hours ago',
  },
  {
    workflow: 'Vulnerability Remediation Reminder',
    status: 'failed',
    duration: '0.5s',
    timestamp: '5 hours ago',
  },
]

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  active: { color: 'text-green-400', bgColor: 'bg-green-500/20' },
  paused: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  error: { color: 'text-red-400', bgColor: 'bg-red-500/20' },
}

const executionStatusConfig: Record<string, string> = {
  success: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  running: 'bg-blue-500/20 text-blue-400',
}

// Custom Node Components
function TriggerNode({ data }: NodeProps) {
  return (
    <div className="rounded-lg border-2 border-green-500 bg-green-500/10 p-3 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded bg-green-500 flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-xs font-medium text-green-500">TRIGGER</span>
      </div>
      <p className="text-sm font-medium">{data.label as string}</p>
      {Boolean(data.description) && (
        <p className="text-xs text-muted-foreground mt-1">{data.description as string}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3" />
    </div>
  )
}

function ConditionNode({ data }: NodeProps) {
  return (
    <div className="rounded-lg border-2 border-yellow-500 bg-yellow-500/10 p-3 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-yellow-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded bg-yellow-500 flex items-center justify-center">
          <GitBranch className="h-4 w-4 text-white" />
        </div>
        <span className="text-xs font-medium text-yellow-500">CONDITION</span>
      </div>
      <p className="text-sm font-medium">{data.label as string}</p>
      {Boolean(data.description) && (
        <p className="text-xs text-muted-foreground mt-1">{data.description as string}</p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!bg-green-500 !w-3 !h-3 !left-[30%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="!bg-red-500 !w-3 !h-3 !left-[70%]"
      />
    </div>
  )
}

function ActionNode({ data }: NodeProps) {
  return (
    <div className="rounded-lg border-2 border-blue-500 bg-blue-500/10 p-3 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded bg-blue-500 flex items-center justify-center">
          <Play className="h-4 w-4 text-white" />
        </div>
        <span className="text-xs font-medium text-blue-500">ACTION</span>
      </div>
      <p className="text-sm font-medium">{data.label as string}</p>
      {Boolean(data.description) && (
        <p className="text-xs text-muted-foreground mt-1">{data.description as string}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  )
}

function NotificationNode({ data }: NodeProps) {
  return (
    <div className="rounded-lg border-2 border-purple-500 bg-purple-500/10 p-3 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded bg-purple-500 flex items-center justify-center">
          <Mail className="h-4 w-4 text-white" />
        </div>
        <span className="text-xs font-medium text-purple-500">NOTIFY</span>
      </div>
      <p className="text-sm font-medium">{data.label as string}</p>
      {Boolean(data.description) && (
        <p className="text-xs text-muted-foreground mt-1">{data.description as string}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3" />
    </div>
  )
}

// Initial nodes and edges for demo
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { label: 'New Critical Finding', description: 'Severity >= Critical' },
  },
  {
    id: '2',
    type: 'condition',
    position: { x: 250, y: 180 },
    data: { label: 'Check Asset Criticality', description: 'Is Production Asset?' },
  },
  {
    id: '3',
    type: 'action',
    position: { x: 100, y: 320 },
    data: { label: 'Assign to Senior Engineer', description: 'Auto-assign based on expertise' },
  },
  {
    id: '4',
    type: 'action',
    position: { x: 400, y: 320 },
    data: { label: 'Assign to Regular Queue', description: 'Standard assignment flow' },
  },
  {
    id: '5',
    type: 'notification',
    position: { x: 100, y: 460 },
    data: { label: 'Send Slack Alert', description: '#security-critical channel' },
  },
  {
    id: '6',
    type: 'action',
    position: { x: 100, y: 600 },
    data: { label: 'Create Jira Ticket', description: 'Priority: P1' },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    sourceHandle: 'yes',
    label: 'Yes',
    style: { stroke: '#22c55e' },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    sourceHandle: 'no',
    label: 'No',
    style: { stroke: '#ef4444' },
  },
  { id: 'e3-5', source: '3', target: '5', animated: true },
  { id: 'e5-6', source: '5', target: '6', animated: true },
]

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  notification: NotificationNode,
}

// Draggable node components for sidebar
const nodeTemplates = [
  { type: 'trigger', label: 'Trigger', icon: Zap, color: 'green' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'yellow' },
  { type: 'action', label: 'Action', icon: Play, color: 'blue' },
  { type: 'notification', label: 'Notification', icon: Mail, color: 'purple' },
]

export default function WorkflowsPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedWorkflow, setSelectedWorkflow] = useState<(typeof workflows)[0] | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return

      const position = {
        x: event.clientX - 250,
        y: event.clientY - 100,
      }

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `New ${type}`, description: 'Configure this node' },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleSaveWorkflow = () => {
    toast.success('Workflow saved successfully')
  }

  const handleRunWorkflow = (workflow: (typeof workflows)[0]) => {
    toast.success(`Running workflow: ${workflow.name}`)
  }

  const handleDeleteWorkflow = (workflow: (typeof workflows)[0]) => {
    toast.success(`Deleted workflow: ${workflow.name}`)
  }

  return (
    <>
      <Main>
        <PageHeader
          title="Automation Workflows"
          description="Create and manage automated security response workflows"
        >
          <Can permission={Permission.WorkflowsWrite} mode="disable">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </Can>
        </PageHeader>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Total Workflows
              </CardDescription>
              <CardTitle className="text-3xl">{workflowStats.totalWorkflows}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Active
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">{workflowStats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Total Triggered
              </CardDescription>
              <CardTitle className="text-3xl">{workflowStats.triggered}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Success Rate
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {workflowStats.successRate}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="workflows" className="mt-6">
          <TabsList>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="executions">Recent Executions</TabsTrigger>
            <TabsTrigger value="builder">Visual Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Configured Workflows</CardTitle>
                <CardDescription>Manage your automation workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map((workflow) => {
                    const status = statusConfig[workflow.status]
                    return (
                      <div
                        key={workflow.id}
                        className="flex items-start justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{workflow.name}</h4>
                            <Badge className={`${status.bgColor} ${status.color} border-0`}>
                              {workflow.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">{workflow.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {workflow.trigger}
                            </span>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last: {workflow.lastTriggered}
                            </span>
                            <span className="text-muted-foreground">
                              {workflow.triggerCount} runs ({workflow.successRate}% success)
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {workflow.actions.map((action, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Switch checked={workflow.status === 'active'} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedWorkflow(workflow)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit in Builder
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRunWorkflow(workflow)}>
                                <Play className="mr-2 h-4 w-4" />
                                Run Now
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-400"
                                onClick={() => handleDeleteWorkflow(workflow)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="executions">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
                <CardDescription>Latest workflow runs and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentExecutions.map((exec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{exec.workflow}</p>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{exec.duration}</span>
                          <span>-</span>
                          <span>{exec.timestamp}</span>
                        </div>
                      </div>
                      <Badge className={`${executionStatusConfig[exec.status]} border-0`}>
                        {exec.status === 'success' ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {exec.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builder">
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Visual Workflow Builder</CardTitle>
                    <CardDescription>Drag and drop to create workflows</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={handleSaveWorkflow}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Workflow
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex h-[600px] border-t">
                  {/* Sidebar with node templates */}
                  <div className="w-64 border-r p-4 bg-muted/30">
                    <h4 className="font-medium mb-4">Components</h4>
                    <div className="space-y-2">
                      {nodeTemplates.map((template) => (
                        <div
                          key={template.type}
                          draggable
                          onDragStart={(e) => onDragStart(e, template.type)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab hover:shadow-md transition-shadow bg-card ${
                            template.color === 'green'
                              ? 'border-green-500/50 hover:border-green-500'
                              : template.color === 'yellow'
                                ? 'border-yellow-500/50 hover:border-yellow-500'
                                : template.color === 'blue'
                                  ? 'border-blue-500/50 hover:border-blue-500'
                                  : 'border-purple-500/50 hover:border-purple-500'
                          }`}
                        >
                          <div
                            className={`h-8 w-8 rounded flex items-center justify-center ${
                              template.color === 'green'
                                ? 'bg-green-500'
                                : template.color === 'yellow'
                                  ? 'bg-yellow-500'
                                  : template.color === 'blue'
                                    ? 'bg-blue-500'
                                    : 'bg-purple-500'
                            }`}
                          >
                            <template.icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium">{template.label}</span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <h4 className="font-medium mb-4">Quick Actions</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Drag components to the canvas to build your workflow.</p>
                      <p>Connect nodes by dragging from one handle to another.</p>
                    </div>
                  </div>

                  {/* ReactFlow Canvas */}
                  <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      nodeTypes={nodeTypes}
                      fitView
                      className="bg-background"
                    >
                      <Background />
                      <Controls />
                      <MiniMap
                        nodeColor={(node) => {
                          switch (node.type) {
                            case 'trigger':
                              return '#22c55e'
                            case 'condition':
                              return '#eab308'
                            case 'action':
                              return '#3b82f6'
                            case 'notification':
                              return '#a855f7'
                            default:
                              return '#64748b'
                          }
                        }}
                      />
                    </ReactFlow>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>

      {/* Workflow Detail Sheet */}
      <Sheet open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              {selectedWorkflow?.name}
            </SheetTitle>
            <SheetDescription>{selectedWorkflow?.description}</SheetDescription>
          </SheetHeader>
          {selectedWorkflow && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={`${statusConfig[selectedWorkflow.status].bgColor} ${statusConfig[selectedWorkflow.status].color} border-0`}
                >
                  {selectedWorkflow.status}
                </Badge>
                <Badge variant="outline">{selectedWorkflow.triggerCount} runs</Badge>
                <Badge variant="outline">{selectedWorkflow.successRate}% success</Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-muted-foreground">Trigger</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg border">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span>{selectedWorkflow.trigger}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Actions</Label>
                <div className="space-y-2">
                  {selectedWorkflow.actions.map((action, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border">
                      <Play className="h-4 w-4 text-blue-500" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{selectedWorkflow.triggerCount}</p>
                  <p className="text-xs text-muted-foreground">Total Runs</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {selectedWorkflow.successRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleRunWorkflow(selectedWorkflow)}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Now
                </Button>
                <Button variant="outline" onClick={() => setSelectedWorkflow(null)}>
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
