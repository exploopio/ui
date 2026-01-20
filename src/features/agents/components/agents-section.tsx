'use client';

import { useState, useMemo, useCallback } from 'react';
import { SortingState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Pause, Plus, RefreshCw, Search, Terminal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Agent, AgentFormData, AgentStats, AgentStatus } from '../types';
import { AgentStatsCards } from './agent-stats-cards';
import { AgentTable } from './agent-table';
import { AgentDetailSheet } from './agent-detail-sheet';
import { AgentFormDialog } from './agent-form-dialog';
import { AgentDeleteDialog } from './agent-delete-dialog';

interface AgentsSectionProps {
  agents: Agent[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onCreateAgent?: (data: AgentFormData) => Promise<void>;
  onUpdateAgent?: (id: string, data: AgentFormData) => Promise<void>;
  onDeleteAgent?: (id: string) => Promise<void>;
  onPauseAgent?: (id: string) => Promise<void>;
  onResumeAgent?: (id: string) => Promise<void>;
}

export function AgentsSection({
  agents: initialAgents,
  isLoading = false,
  onRefresh,
  onCreateAgent,
  onUpdateAgent,
  onDeleteAgent,
  onPauseAgent,
  onResumeAgent,
}: AgentsSectionProps) {
  // Local state for demo (remove when API is connected)
  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  // UI state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Calculate stats
  const stats = useMemo<AgentStats>(() => {
    const online = agents.filter((a) => a.status === 'active').length;
    const offline = agents.filter(
      (a) => a.status === 'inactive' || a.status === 'error' || a.status === 'pending'
    ).length;
    const busy = agents.filter(
      (a) => a.status === 'active' && (a.metrics?.active_jobs ?? 0) > 0
    ).length;
    const totalActiveJobs = agents.reduce(
      (sum, a) => sum + (a.metrics?.active_jobs ?? 0),
      0
    );
    const totalCompletedJobs = agents.reduce(
      (sum, a) => sum + (a.jobs_completed ?? 0),
      0
    );

    return {
      total: agents.length,
      online: online - busy,
      offline,
      busy,
      paused: 0,
      total_active_jobs: totalActiveJobs,
      total_completed_jobs: totalCompletedJobs,
    };
  }, [agents]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    let data = [...agents];
    if (statusFilter !== 'all') {
      data = data.filter((a) => {
        const agentStatus: AgentStatus =
          a.status === 'active'
            ? (a.metrics?.active_jobs ?? 0) > 0
              ? 'busy'
              : 'online'
            : 'offline';
        return agentStatus === statusFilter;
      });
    }
    return data;
  }, [agents, statusFilter]);

  // Handlers
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Agents refreshed');
    }, 1000);
  }, [onRefresh]);

  const handleViewAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setDetailSheetOpen(true);
  }, []);

  const handleEditAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setEditDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((agent: Agent) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!agentToDelete) return;

    if (onDeleteAgent) {
      await onDeleteAgent(agentToDelete.id);
    } else {
      // Local demo
      setAgents((prev) => prev.filter((a) => a.id !== agentToDelete.id));
    }

    setDeleteDialogOpen(false);
    setAgentToDelete(null);
    toast.success('Agent removed successfully');
  }, [agentToDelete, onDeleteAgent]);

  const handlePauseAgent = useCallback(
    async (agent: Agent) => {
      if (onPauseAgent) {
        await onPauseAgent(agent.id);
      } else {
        // Local demo
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id
              ? { ...a, status: 'inactive' as const }
              : a
          )
        );
      }
      toast.success(`Paused agent: ${agent.name}`);
    },
    [onPauseAgent]
  );

  const handleResumeAgent = useCallback(
    async (agent: Agent) => {
      if (onResumeAgent) {
        await onResumeAgent(agent.id);
      } else {
        // Local demo
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id ? { ...a, status: 'active' as const } : a
          )
        );
      }
      toast.success(`Resumed agent: ${agent.name}`);
    },
    [onResumeAgent]
  );

  const handleCopyToken = useCallback((agent: Agent) => {
    navigator.clipboard.writeText(`agent-token-${agent.id}-xxxx-xxxx`);
    toast.success('Agent token copied to clipboard');
  }, []);

  const handleAddAgent = useCallback(
    async (data: AgentFormData) => {
      if (onCreateAgent) {
        await onCreateAgent(data);
      } else {
        // Local demo
        const newAgent: Agent = {
          id: `agent-${Date.now()}`,
          tenant_id: 'demo',
          name: data.name,
          type: 'agent',
          description: data.description,
          deployment_type: data.deployment_type,
          region: data.region,
          capabilities: data.capabilities,
          tools: data.tools,
          execution_mode: 'daemon',
          status: 'pending',
          api_key_prefix: 'rk_xxxx',
          labels: data.labels
            ? Object.fromEntries(
              data.labels.split(',').map((l) => {
                const [k, v] = l.trim().split(':');
                return [k, v || ''];
              })
            )
            : {},
          config: {},
          metadata: {},
          total_findings: 0,
          total_scans: 0,
          error_count: 0,
          jobs_completed: 0,
          cpu_percent: 0,
          memory_percent: 0,
          active_jobs: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setAgents((prev) => [newAgent, ...prev]);
      }
      setAddDialogOpen(false);
      toast.success('Agent added successfully. Waiting for connection...');
    },
    [onCreateAgent]
  );

  const handleUpdateAgent = useCallback(
    async (data: AgentFormData) => {
      if (!selectedAgent) return;

      if (onUpdateAgent) {
        await onUpdateAgent(selectedAgent.id, data);
      } else {
        // Local demo
        setAgents((prev) =>
          prev.map((a) =>
            a.id === selectedAgent.id
              ? {
                ...a,
                name: data.name,
                description: data.description,
                deployment_type: data.deployment_type,
                region: data.region,
                capabilities: data.capabilities,
                tools: data.tools,
                labels: data.labels
                  ? Object.fromEntries(
                    data.labels.split(',').map((l) => {
                      const [k, v] = l.trim().split(':');
                      return [k, v || ''];
                    })
                  )
                  : {},
                updated_at: new Date().toISOString(),
              }
              : a
          )
        );
      }
      setEditDialogOpen(false);
      setSelectedAgent(null);
      toast.success('Agent updated successfully');
    },
    [selectedAgent, onUpdateAgent]
  );

  const handleExport = useCallback(() => {
    const csv = [
      ['Name', 'Type', 'Status', 'IP Address', 'Region', 'Version', 'Jobs Completed'].join(
        ','
      ),
      ...agents.map((a) =>
        [
          a.name,
          a.deployment_type,
          a.status,
          a.ip_address || '',
          a.region || '',
          a.version || '',
          a.jobs_completed,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agents.csv';
    link.click();
    toast.success('Agents exported');
  }, [agents]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <AgentStatsCards
        stats={stats}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                All Agents
              </CardTitle>
              <CardDescription>
                Manage your daemon agents and monitor their performance
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Agent
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search & Bulk Actions */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            {Object.keys(rowSelection).length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {Object.keys(rowSelection).length} selected
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => toast.info('Pausing selected agents...')}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-400"
                    onClick={() => toast.info('Removing selected agents...')}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Table */}
          <AgentTable
            agents={filteredAgents}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onViewAgent={handleViewAgent}
            onEditAgent={handleEditAgent}
            onDeleteAgent={handleDeleteClick}
            onPauseAgent={handlePauseAgent}
            onResumeAgent={handleResumeAgent}
            onCopyToken={handleCopyToken}
          />
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <AgentDetailSheet
        agent={selectedAgent}
        open={detailSheetOpen && !editDialogOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={handleEditAgent}
        onPause={handlePauseAgent}
        onResume={handleResumeAgent}
        onDelete={handleDeleteClick}
      />

      {/* Add Dialog */}
      <AgentFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddAgent}
        mode="add"
      />

      {/* Edit Dialog */}
      <AgentFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        agent={selectedAgent}
        onSubmit={handleUpdateAgent}
        mode="edit"
      />

      {/* Delete Dialog */}
      <AgentDeleteDialog
        agent={agentToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
