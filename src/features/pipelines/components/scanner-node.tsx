'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Play, Zap, GitBranch, Mail, Settings, Wrench, Radar } from 'lucide-react'

export type ScannerNodeData = {
  label: string
  description?: string
  tool?: string
  capabilities?: string[]
  stepKey?: string
}

export type ScannerNode = Node<ScannerNodeData, 'scanner'>

const nodeStyles = {
  scanner: {
    border: 'border-blue-500',
    bg: 'bg-blue-500/10',
    icon: Radar,
    iconBg: 'bg-blue-500',
    label: 'SCANNER',
    labelColor: 'text-blue-500',
  },
  trigger: {
    border: 'border-green-500',
    bg: 'bg-green-500/10',
    icon: Zap,
    iconBg: 'bg-green-500',
    label: 'TRIGGER',
    labelColor: 'text-green-500',
  },
  condition: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-500/10',
    icon: GitBranch,
    iconBg: 'bg-yellow-500',
    label: 'CONDITION',
    labelColor: 'text-yellow-500',
  },
  action: {
    border: 'border-purple-500',
    bg: 'bg-purple-500/10',
    icon: Play,
    iconBg: 'bg-purple-500',
    label: 'ACTION',
    labelColor: 'text-purple-500',
  },
  notification: {
    border: 'border-orange-500',
    bg: 'bg-orange-500/10',
    icon: Mail,
    iconBg: 'bg-orange-500',
    label: 'NOTIFY',
    labelColor: 'text-orange-500',
  },
  tool: {
    border: 'border-cyan-500',
    bg: 'bg-cyan-500/10',
    icon: Wrench,
    iconBg: 'bg-cyan-500',
    label: 'TOOL',
    labelColor: 'text-cyan-500',
  },
}

type NodeType = keyof typeof nodeStyles

function getNodeStyle(type: string | undefined): (typeof nodeStyles)[NodeType] {
  if (type && type in nodeStyles) {
    return nodeStyles[type as NodeType]
  }
  return nodeStyles.scanner
}

function ScannerNodeComponent({ data, type, selected }: NodeProps<ScannerNode>) {
  const style = getNodeStyle(type)
  const Icon = style.icon

  return (
    <div
      className={`rounded-lg border-2 ${style.border} ${style.bg} p-3 min-w-[180px] max-w-[220px] ${
        selected ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`!${style.iconBg.replace('bg-', '!bg-')} !w-3 !h-3`}
      />

      <div className="flex items-center gap-2 mb-2">
        <div className={`h-6 w-6 rounded ${style.iconBg} flex items-center justify-center`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className={`text-xs font-medium ${style.labelColor}`}>{style.label}</span>
        {data.tool && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {data.tool}
          </span>
        )}
      </div>

      <p className="text-sm font-medium truncate">{data.label}</p>

      {data.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{data.description}</p>
      )}

      {data.capabilities && data.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.capabilities.slice(0, 2).map((cap, idx) => (
            <span
              key={idx}
              className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded"
            >
              {cap}
            </span>
          ))}
          {data.capabilities.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{data.capabilities.length - 2}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className={`!${style.iconBg.replace('bg-', '!bg-')} !w-3 !h-3`}
      />
    </div>
  )
}

export const ScannerNode = memo(ScannerNodeComponent)
