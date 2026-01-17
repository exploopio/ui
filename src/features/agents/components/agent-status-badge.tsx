'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Activity, Clock } from 'lucide-react';
import type { AgentStatus } from '../types';
import { AGENT_STATUS_CONFIG } from '../types';

interface AgentStatusBadgeProps {
  status: AgentStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const statusIcons: Record<AgentStatus, React.ReactNode> = {
  online: <CheckCircle className="h-3 w-3" />,
  offline: <XCircle className="h-3 w-3" />,
  busy: <Activity className="h-3 w-3" />,
  paused: <Clock className="h-3 w-3" />,
};

export function AgentStatusBadge({
  status,
  showIcon = true,
  size = 'md',
}: AgentStatusBadgeProps) {
  const config = AGENT_STATUS_CONFIG[status];

  return (
    <Badge
      className={`${config.bgColor} text-white ${showIcon ? 'gap-1' : ''} ${
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : ''
      }`}
    >
      {showIcon && statusIcons[status]}
      {config.label}
    </Badge>
  );
}
