'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Pencil, Copy, Pause, Trash2, Globe } from 'lucide-react';
import { toast } from 'sonner';

import type { Agent, AgentStatus } from '../types';
import { AGENT_STATUS_CONFIG } from '../types';
import { AgentStatusBadge } from './agent-status-badge';
import { AgentTypeIcon, AgentTypeBadge } from './agent-type-icon';
import { AgentMetricsDisplay } from './agent-metrics-display';

interface AgentDetailSheetProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (agent: Agent) => void;
  onPause: (agent: Agent) => void;
  onResume?: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
}

export function AgentDetailSheet({
  agent,
  open,
  onOpenChange,
  onEdit,
  onPause,
  onResume: _onResume,
  onDelete,
}: AgentDetailSheetProps) {
  if (!agent) return null;

  const agentStatus: AgentStatus = agent.status === 'active' ? 'online' : 'offline';
  const _statusConfig = AGENT_STATUS_CONFIG[agentStatus];

  const handleCopyToken = () => {
    navigator.clipboard.writeText(`agent-token-${agent.id}-xxxx-xxxx`);
    toast.success('Agent token copied to clipboard');
  };

  const gradientClass =
    agentStatus === 'online'
      ? 'from-green-500/20 via-green-500/10'
      : 'from-gray-500/20 via-gray-500/10';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto p-0 sm:max-w-xl">
        <VisuallyHidden>
          <SheetTitle>Agent Details</SheetTitle>
        </VisuallyHidden>

        {/* Header */}
        <div
          className={`bg-gradient-to-br px-6 pb-4 pt-6 ${gradientClass} to-transparent`}
        >
          <div className="mb-3 flex items-center gap-3">
            <AgentTypeIcon type={agent.deployment_type} size="lg" />
            <div className="flex-1">
              <h2 className="text-xl font-bold">{agent.name}</h2>
              <p className="text-sm text-muted-foreground">
                {agent.ip_address || 'No IP assigned'}
              </p>
            </div>
            <AgentStatusBadge status={agentStatus} />
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => onEdit(agent)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyToken}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Token
            </Button>
            {agentStatus === 'online' && (
              <Button size="sm" variant="outline" onClick={() => onPause(agent)}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="overview" className="px-6 pb-6">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-4">
            {/* Resource Usage */}
            <AgentMetricsDisplay
              metrics={agent.metrics}
              jobsCompleted={agent.jobs_completed}
              variant="card"
            />

            {/* Capabilities */}
            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="rounded-xl border bg-card p-4">
                <h4 className="mb-2 text-sm font-medium">Capabilities</h4>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary">
                      {cap.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tools */}
            {agent.tools && agent.tools.length > 0 && (
              <div className="rounded-xl border bg-card p-4">
                <h4 className="mb-2 text-sm font-medium">Tools</h4>
                <div className="flex flex-wrap gap-1">
                  {agent.tools.map((tool) => (
                    <Badge key={tool} variant="outline">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Labels */}
            {agent.labels && Object.keys(agent.labels).length > 0 && (
              <div className="rounded-xl border bg-card p-4">
                <h4 className="mb-2 text-sm font-medium">Labels</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(agent.labels).map(([key, value]) => (
                    <Badge key={key} variant="secondary">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-0 space-y-4">
            {/* Info */}
            <div className="rounded-xl border bg-card p-4">
              <h4 className="mb-3 text-sm font-medium">Agent Information</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <AgentTypeBadge type={agent.deployment_type} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="font-mono text-sm">
                    v{agent.version || 'unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Region</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    {agent.region || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">IP Address</span>
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    {agent.ip_address || 'N/A'}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hostname</span>
                  <span className="text-sm">{agent.hostname || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Seen</span>
                  <span className="text-sm">
                    {agent.last_seen_at
                      ? new Date(agent.last_seen_at).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="rounded-xl border bg-card p-4">
              <h4 className="mb-3 text-sm font-medium">Statistics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Scans</span>
                  <span className="text-sm font-medium">{agent.total_scans}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Findings
                  </span>
                  <span className="text-sm font-medium">{agent.total_findings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Error Count</span>
                  <span className="text-sm font-medium">{agent.error_count}</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <h4 className="mb-2 text-sm font-medium text-red-500">
                Danger Zone
              </h4>
              <p className="mb-3 text-xs text-muted-foreground">
                Permanently remove this agent from your infrastructure.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  onDelete(agent);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Agent
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
