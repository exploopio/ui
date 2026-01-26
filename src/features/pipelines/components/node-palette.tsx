'use client'

import { Radar, Zap, GitBranch, Play, Mail, Wrench, GripVertical } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface NodeTemplate {
  type: string
  label: string
  icon: React.ElementType
  color: string
  description: string
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'scanner',
    label: 'Scanner',
    icon: Radar,
    color: 'blue',
    description: 'Security scanning tool',
  },
  {
    type: 'trigger',
    label: 'Trigger',
    icon: Zap,
    color: 'green',
    description: 'Start workflow execution',
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: GitBranch,
    color: 'yellow',
    description: 'Conditional branching',
  },
  {
    type: 'action',
    label: 'Action',
    icon: Play,
    color: 'purple',
    description: 'Execute an action',
  },
  {
    type: 'notification',
    label: 'Notification',
    icon: Mail,
    color: 'orange',
    description: 'Send notification',
  },
  {
    type: 'tool',
    label: 'Tool',
    icon: Wrench,
    color: 'cyan',
    description: 'Custom tool execution',
  },
]

const colorClasses: Record<string, { border: string; bg: string; hover: string }> = {
  blue: {
    border: 'border-blue-500/50',
    bg: 'bg-blue-500',
    hover: 'hover:border-blue-500',
  },
  green: {
    border: 'border-green-500/50',
    bg: 'bg-green-500',
    hover: 'hover:border-green-500',
  },
  yellow: {
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-500',
    hover: 'hover:border-yellow-500',
  },
  purple: {
    border: 'border-purple-500/50',
    bg: 'bg-purple-500',
    hover: 'hover:border-purple-500',
  },
  orange: {
    border: 'border-orange-500/50',
    bg: 'bg-orange-500',
    hover: 'hover:border-orange-500',
  },
  cyan: {
    border: 'border-cyan-500/50',
    bg: 'bg-cyan-500',
    hover: 'hover:border-cyan-500',
  },
}

interface NodePaletteProps {
  onDragStart?: (event: React.DragEvent, nodeType: string) => void
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
    onDragStart?.(event, nodeType)
  }

  return (
    <div className="w-64 border-r p-4 bg-muted/30 h-full overflow-y-auto">
      <h4 className="font-medium mb-4">Components</h4>
      <div className="space-y-2">
        {nodeTemplates.map((template) => {
          const colors = colorClasses[template.color]
          const Icon = template.icon

          return (
            <div
              key={template.type}
              draggable
              onDragStart={(e) => handleDragStart(e, template.type)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab hover:shadow-md transition-shadow bg-card ${colors.border} ${colors.hover}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div
                className={`h-8 w-8 rounded flex items-center justify-center flex-shrink-0 ${colors.bg}`}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium block">{template.label}</span>
                <span className="text-[10px] text-muted-foreground truncate block">
                  {template.description}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <Separator className="my-4" />

      <h4 className="font-medium mb-4">Quick Tips</h4>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Drag components to the canvas to build your workflow.</p>
        <p>Connect nodes by dragging from one handle to another.</p>
        <p>Click a node to view and edit its properties.</p>
      </div>
    </div>
  )
}
