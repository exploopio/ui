'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bot,
  CheckCircle,
  AlertCircle,
  Play,
  Server,
  Database,
} from 'lucide-react';
import type { Worker, WorkerType, ExecutionMode } from '@/lib/api/worker-types';

interface WorkerStats {
  total: number;
  active: number;
  inactive: number;
  error: number;
  byType: Record<WorkerType, number>;
  byMode: Record<ExecutionMode, number>;
}

interface WorkerStatsCardsProps {
  workers: Worker[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

function calculateStats(workers: Worker[]): WorkerStats {
  return {
    total: workers.length,
    active: workers.filter((w) => w.status === 'active').length,
    inactive: workers.filter((w) => w.status === 'inactive' || w.status === 'pending').length,
    error: workers.filter((w) => w.status === 'error').length,
    byType: {
      worker: workers.filter((w) => w.type === 'worker').length,
      agent: workers.filter((w) => w.type === 'agent').length,
      scanner: workers.filter((w) => w.type === 'scanner').length,
      collector: workers.filter((w) => w.type === 'collector').length,
    },
    byMode: {
      standalone: workers.filter((w) => w.execution_mode === 'standalone').length,
      daemon: workers.filter((w) => w.execution_mode === 'daemon').length,
    },
  };
}

export function WorkerStatsCards({
  workers,
  activeFilter,
  onFilterChange,
}: WorkerStatsCardsProps) {
  const stats = calculateStats(workers);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {/* Total Workers */}
      <Card
        className={`cursor-pointer transition-colors hover:border-primary ${
          activeFilter === null ? 'border-primary' : ''
        }`}
        onClick={() => onFilterChange(null)}
      >
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Total
          </CardDescription>
          <CardTitle className="text-2xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>

      {/* Active */}
      <Card
        className={`cursor-pointer transition-colors hover:border-green-500 ${
          activeFilter === 'status:active' ? 'border-green-500' : ''
        }`}
        onClick={() =>
          onFilterChange(activeFilter === 'status:active' ? null : 'status:active')
        }
      >
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Active
          </CardDescription>
          <CardTitle className="text-2xl text-green-500">{stats.active}</CardTitle>
        </CardHeader>
      </Card>

      {/* Error */}
      <Card
        className={`cursor-pointer transition-colors hover:border-red-500 ${
          activeFilter === 'status:error' ? 'border-red-500' : ''
        }`}
        onClick={() =>
          onFilterChange(activeFilter === 'status:error' ? null : 'status:error')
        }
      >
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Error
          </CardDescription>
          <CardTitle className="text-2xl text-red-500">{stats.error}</CardTitle>
        </CardHeader>
      </Card>

      {/* Daemon (Agents) */}
      <Card
        className={`cursor-pointer transition-colors hover:border-blue-500 ${
          activeFilter === 'mode:daemon' ? 'border-blue-500' : ''
        }`}
        onClick={() =>
          onFilterChange(activeFilter === 'mode:daemon' ? null : 'mode:daemon')
        }
      >
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-500" />
            Daemon
          </CardDescription>
          <CardTitle className="text-2xl text-blue-500">{stats.byMode.daemon}</CardTitle>
        </CardHeader>
      </Card>

      {/* Standalone (CI/CD) */}
      <Card
        className={`cursor-pointer transition-colors hover:border-purple-500 ${
          activeFilter === 'mode:standalone' ? 'border-purple-500' : ''
        }`}
        onClick={() =>
          onFilterChange(activeFilter === 'mode:standalone' ? null : 'mode:standalone')
        }
      >
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Play className="h-4 w-4 text-purple-500" />
            CI/CD
          </CardDescription>
          <CardTitle className="text-2xl text-purple-500">
            {stats.byMode.standalone}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Collectors */}
      <Card
        className={`cursor-pointer transition-colors hover:border-orange-500 ${
          activeFilter === 'type:collector' ? 'border-orange-500' : ''
        }`}
        onClick={() =>
          onFilterChange(activeFilter === 'type:collector' ? null : 'type:collector')
        }
      >
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Database className="h-4 w-4 text-orange-500" />
            Collectors
          </CardDescription>
          <CardTitle className="text-2xl text-orange-500">
            {stats.byType.collector}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

/**
 * Compact stats for inline display
 */
export function WorkerStatsInline({ workers }: { workers: Worker[] }) {
  const stats = calculateStats(workers);

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{stats.total} workers</span>
      <span className="text-green-500">{stats.active} active</span>
      {stats.error > 0 && <span className="text-red-500">{stats.error} error</span>}
    </div>
  );
}
