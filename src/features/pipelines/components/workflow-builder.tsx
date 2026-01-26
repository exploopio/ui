'use client'

import { useCallback, useMemo, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { ScannerNode, type ScannerNodeData } from './scanner-node'
import type { PipelineStep, UIPosition } from '@/lib/api'

// ============================================
// TYPES
// ============================================

export interface WorkflowBuilderProps {
  steps: PipelineStep[]
  onStepsChange?: (steps: PipelineStep[]) => void
  onNodeSelect?: (step: PipelineStep | null) => void
  onNodePositionChange?: (stepId: string, position: UIPosition) => void
  readOnly?: boolean
  className?: string
}

type WorkflowNode = Node<ScannerNodeData, string>

// ============================================
// UTILITIES
// ============================================

function stepsToNodes(steps: PipelineStep[]): WorkflowNode[] {
  return steps.map((step) => ({
    id: step.id,
    type: 'scanner',
    position: {
      x: step.ui_position?.x ?? 0,
      y: step.ui_position?.y ?? step.order * 150,
    },
    data: {
      label: step.name,
      description: step.description,
      tool: step.tool,
      capabilities: step.capabilities,
      stepKey: step.step_key,
    },
    draggable: true,
    selectable: true,
  }))
}

function stepsToEdges(steps: PipelineStep[]): Edge[] {
  const edges: Edge[] = []

  steps.forEach((step) => {
    if (step.depends_on && step.depends_on.length > 0) {
      step.depends_on.forEach((dependsOnKey) => {
        const sourceStep = steps.find((s) => s.step_key === dependsOnKey)
        if (sourceStep) {
          edges.push({
            id: `${sourceStep.id}-${step.id}`,
            source: sourceStep.id,
            target: step.id,
            animated: true,
            style: { stroke: '#3b82f6' },
          })
        }
      })
    }
  })

  return edges
}

// ============================================
// COMPONENT
// ============================================

export function WorkflowBuilder({
  steps,
  onStepsChange,
  onNodeSelect,
  onNodePositionChange,
  readOnly = false,
  className,
}: WorkflowBuilderProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Convert steps to nodes and edges
  const initialNodes = useMemo(() => stepsToNodes(steps), [steps])
  const initialEdges = useMemo(() => stepsToEdges(steps), [steps])

  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(initialEdges)

  // Update nodes when steps change from outside
  useEffect(() => {
    const newNodes = stepsToNodes(steps)
    const newEdges = stepsToEdges(steps)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [steps, setNodes, setEdges])

  // Define node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      scanner: ScannerNode,
      trigger: ScannerNode,
      condition: ScannerNode,
      action: ScannerNode,
      notification: ScannerNode,
      tool: ScannerNode,
    }),
    []
  )

  // Handle node changes (position, selection, etc.)
  const onNodesChange: OnNodesChange<WorkflowNode> = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as WorkflowNode[])

      // Handle position changes
      if (onNodePositionChange && !readOnly) {
        changes.forEach((change) => {
          if (change.type === 'position' && change.position && change.dragging === false) {
            onNodePositionChange(change.id, {
              x: change.position.x,
              y: change.position.y,
            })
          }
        })
      }
    },
    [setNodes, onNodePositionChange, readOnly]
  )

  // Handle edge changes
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (!readOnly) {
        setEdges((eds) => applyEdgeChanges(changes, eds))
      }
    },
    [setEdges, readOnly]
  )

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!readOnly && connection.source && connection.target) {
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              animated: true,
              style: { stroke: '#3b82f6' },
            },
            eds
          )
        )

        // Update depends_on for the target step
        if (onStepsChange) {
          const updatedSteps = steps.map((step) => {
            if (step.id === connection.target) {
              const sourceStep = steps.find((s) => s.id === connection.source)
              if (sourceStep) {
                const currentDepsOn = step.depends_on || []
                if (!currentDepsOn.includes(sourceStep.step_key)) {
                  return {
                    ...step,
                    depends_on: [...currentDepsOn, sourceStep.step_key],
                  }
                }
              }
            }
            return step
          })
          onStepsChange(updatedSteps)
        }
      }
    },
    [setEdges, steps, onStepsChange, readOnly]
  )

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
      if (onNodeSelect) {
        const step = steps.find((s) => s.id === node.id)
        onNodeSelect(step || null)
      }
    },
    [steps, onNodeSelect]
  )

  // Handle canvas click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
    if (onNodeSelect) {
      onNodeSelect(null)
    }
  }, [onNodeSelect])

  // MiniMap node color
  const nodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'trigger':
        return '#22c55e'
      case 'condition':
        return '#eab308'
      case 'action':
        return '#a855f7'
      case 'notification':
        return '#f97316'
      case 'tool':
        return '#06b6d4'
      default:
        return '#3b82f6' // scanner (blue)
    }
  }, [])

  return (
    <div className={`h-full w-full ${className || ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        className="bg-background"
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={!readOnly} />
        <MiniMap nodeColor={nodeColor} zoomable pannable />
      </ReactFlow>
    </div>
  )
}
