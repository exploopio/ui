'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Terminal, CheckCircle, Activity, XCircle, Zap } from 'lucide-react';
import type { AgentStats, AgentStatus } from '../types';

interface AgentStatsCardsProps {
  stats: AgentStats;
  activeFilter: AgentStatus | 'all';
  onFilterChange: (filter: AgentStatus | 'all') => void;
}

export function AgentStatsCards({
  stats,
  activeFilter,
  onFilterChange,
}: AgentStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total Agents */}
      <Card
        className="cursor-pointer transition-colors hover:border-primary"
        onClick={() => onFilterChange('all')}
      >
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Total Agents
          </CardDescription>
          <CardTitle className="text-3xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>

      {/* Online */}
      <Card
        className={`cursor-pointer transition-colors hover:border-green-500 ${
          activeFilter === 'online' ? 'border-green-500' : ''
        }`}
        onClick={() =>
          onFilterChange(activeFilter === 'online' ? 'all' : 'online')
        }
      >
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Online
          </CardDescription>
          <CardTitle className="text-3xl text-green-500">{stats.online}</CardTitle>
        </CardHeader>
      </Card>

      {/* Busy */}
      <Card
        className={`cursor-pointer transition-colors hover:border-yellow-500 ${
          activeFilter === 'busy' ? 'border-yellow-500' : ''
        }`}
        onClick={() => onFilterChange(activeFilter === 'busy' ? 'all' : 'busy')}
      >
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-yellow-500" />
            Busy
          </CardDescription>
          <CardTitle className="text-3xl text-yellow-500">{stats.busy}</CardTitle>
        </CardHeader>
      </Card>

      {/* Offline */}
      <Card
        className={`cursor-pointer transition-colors hover:border-gray-500 ${
          activeFilter === 'offline' ? 'border-gray-500' : ''
        }`}
        onClick={() =>
          onFilterChange(activeFilter === 'offline' ? 'all' : 'offline')
        }
      >
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-gray-500" />
            Offline
          </CardDescription>
          <CardTitle className="text-3xl text-gray-500">{stats.offline}</CardTitle>
        </CardHeader>
      </Card>

      {/* Active Jobs */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            Active Jobs
          </CardDescription>
          <CardTitle className="text-3xl text-blue-500">
            {stats.total_active_jobs}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
