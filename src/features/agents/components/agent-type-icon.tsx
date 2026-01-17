'use client';

import { Cloud, Server, Monitor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AgentDeploymentType } from '../types';
import { AGENT_DEPLOYMENT_CONFIG } from '../types';

interface AgentTypeIconProps {
  type: AgentDeploymentType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const typeIcons: Record<AgentDeploymentType, React.ReactNode> = {
  cloud: <Cloud className="h-4 w-4" />,
  'self-hosted': <Server className="h-4 w-4" />,
  hybrid: <Monitor className="h-4 w-4" />,
};

const sizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
};

const bgColors: Record<AgentDeploymentType, string> = {
  cloud: 'bg-blue-500/10',
  'self-hosted': 'bg-purple-500/10',
  hybrid: 'bg-orange-500/10',
};

export function AgentTypeIcon({
  type,
  showLabel = false,
  size = 'md',
}: AgentTypeIconProps) {
  const config = AGENT_DEPLOYMENT_CONFIG[type];

  if (showLabel) {
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-lg ${bgColors[type]} ${sizeClasses[size]}`}
    >
      <span className={config.color}>{typeIcons[type]}</span>
    </div>
  );
}

export function AgentTypeBadge({ type }: { type: AgentDeploymentType }) {
  const config = AGENT_DEPLOYMENT_CONFIG[type];

  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}
