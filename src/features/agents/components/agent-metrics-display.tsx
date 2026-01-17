'use client';

import { Progress } from '@/components/ui/progress';
import { Cpu, HardDrive, Zap, CheckCircle } from 'lucide-react';
import type { AgentMetrics } from '../types';

interface AgentMetricsDisplayProps {
  metrics?: AgentMetrics;
  jobsCompleted?: number;
  variant?: 'inline' | 'card';
}

function getProgressColor(value: number): string {
  if (value > 80) return '[&>div]:bg-red-500';
  if (value > 60) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-green-500';
}

export function AgentMetricsDisplay({
  metrics,
  jobsCompleted = 0,
  variant = 'inline',
}: AgentMetricsDisplayProps) {
  const cpuUsage = metrics?.cpu_usage ?? 0;
  const memoryUsage = metrics?.memory_usage ?? 0;
  const activeJobs = metrics?.active_jobs ?? 0;

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-4">
        {/* CPU */}
        <div className="w-20">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>{cpuUsage}%</span>
          </div>
          <Progress
            value={cpuUsage}
            className={`h-1.5 ${getProgressColor(cpuUsage)}`}
          />
        </div>

        {/* Memory */}
        <div className="w-20">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>{memoryUsage}%</span>
          </div>
          <Progress
            value={memoryUsage}
            className={`h-1.5 ${getProgressColor(memoryUsage)}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* CPU Card */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{cpuUsage}%</p>
            <p className="text-xs text-muted-foreground">CPU Usage</p>
          </div>
        </div>
        <Progress
          value={cpuUsage}
          className={`h-2 ${getProgressColor(cpuUsage)}`}
        />
      </div>

      {/* Memory Card */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <HardDrive className="h-5 w-5 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{memoryUsage}%</p>
            <p className="text-xs text-muted-foreground">Memory Usage</p>
          </div>
        </div>
        <Progress
          value={memoryUsage}
          className={`h-2 ${getProgressColor(memoryUsage)}`}
        />
      </div>

      {/* Active Jobs Card */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeJobs}</p>
            <p className="text-xs text-muted-foreground">Active Jobs</p>
          </div>
        </div>
      </div>

      {/* Completed Jobs Card */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{jobsCompleted}</p>
            <p className="text-xs text-muted-foreground">Jobs Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline CPU display for table
 */
export function CpuUsageCell({ value }: { value: number }) {
  return (
    <div className="w-20">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span>{value}%</span>
      </div>
      <Progress value={value} className={`h-1.5 ${getProgressColor(value)}`} />
    </div>
  );
}

/**
 * Inline Memory display for table
 */
export function MemoryUsageCell({ value }: { value: number }) {
  return (
    <div className="w-20">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span>{value}%</span>
      </div>
      <Progress value={value} className={`h-1.5 ${getProgressColor(value)}`} />
    </div>
  );
}
