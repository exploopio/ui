/**
 * Agent Types
 *
 * Extends Worker types with real-time monitoring capabilities.
 * Agents are daemon workers that run continuously and receive commands from the server.
 */

import type { Worker, WorkerStatus, WorkerCapability, WorkerTool } from '@/lib/api/worker-types';

// Re-export for convenience
export type { WorkerCapability, WorkerTool };

/**
 * Agent status - mapped from WorkerStatus with additional states for real-time monitoring
 */
export type AgentStatus = 'online' | 'offline' | 'busy' | 'paused';

/**
 * Agent deployment type
 */
export type AgentDeploymentType = 'cloud' | 'self-hosted' | 'hybrid';

/**
 * Map Worker status to Agent status
 */
export function mapWorkerStatusToAgentStatus(status: WorkerStatus): AgentStatus {
  switch (status) {
    case 'active':
      return 'online';
    case 'inactive':
    case 'revoked':
      return 'offline';
    case 'error':
      return 'offline';
    case 'pending':
      return 'offline';
    default:
      return 'offline';
  }
}

/**
 * Real-time metrics for an agent
 */
export interface AgentMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage?: number;
  network_in?: number;
  network_out?: number;
  active_jobs: number;
  queued_jobs?: number;
  last_metrics_at?: string;
}

/**
 * Agent entity - extends Worker with real-time monitoring data
 */
export interface Agent extends Omit<Worker, 'type'> {
  // Override type to be more specific
  type: 'agent';

  // Deployment info
  deployment_type: AgentDeploymentType;
  region?: string;

  // Real-time metrics
  metrics?: AgentMetrics;

  // Additional stats
  jobs_completed: number;
  uptime_seconds?: number;
  last_heartbeat_at?: string;
}

/**
 * Agent list filters
 */
export interface AgentListFilters {
  status?: AgentStatus;
  deployment_type?: AgentDeploymentType;
  region?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * Agent stats summary
 */
export interface AgentStats {
  total: number;
  online: number;
  offline: number;
  busy: number;
  paused: number;
  total_active_jobs: number;
  total_completed_jobs: number;
}

/**
 * Agent command types
 */
export type AgentCommandType =
  | 'scan'
  | 'update'
  | 'restart'
  | 'pause'
  | 'resume'
  | 'config'
  | 'health_check';

/**
 * Agent command
 */
export interface AgentCommand {
  id: string;
  agent_id: string;
  type: AgentCommandType;
  payload?: Record<string, unknown>;
  status: 'pending' | 'acknowledged' | 'executing' | 'completed' | 'failed';
  created_at: string;
  acknowledged_at?: string;
  completed_at?: string;
  error_message?: string;
}

/**
 * Create agent request
 */
export interface CreateAgentRequest {
  name: string;
  description?: string;
  deployment_type: AgentDeploymentType;
  region?: string;
  capabilities?: WorkerCapability[];
  tools?: WorkerTool[];
  labels?: Record<string, string>;
  config?: Record<string, unknown>;
}

/**
 * Update agent request
 */
export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  deployment_type?: AgentDeploymentType;
  region?: string;
  capabilities?: WorkerCapability[];
  tools?: WorkerTool[];
  labels?: Record<string, string>;
  config?: Record<string, unknown>;
}

/**
 * Agent form data for UI
 */
export interface AgentFormData {
  name: string;
  description: string;
  deployment_type: AgentDeploymentType;
  region: string;
  capabilities: WorkerCapability[];
  tools: WorkerTool[];
  labels: string; // comma-separated in form
}

/**
 * Status config for UI display
 */
export const AGENT_STATUS_CONFIG: Record<AgentStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  online: {
    label: 'Online',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  },
  offline: {
    label: 'Offline',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500',
  },
  busy: {
    label: 'Busy',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
  },
  paused: {
    label: 'Paused',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
  },
};

/**
 * Deployment type config for UI display
 */
export const AGENT_DEPLOYMENT_CONFIG: Record<AgentDeploymentType, {
  label: string;
  color: string;
  description: string;
}> = {
  cloud: {
    label: 'Cloud',
    color: 'text-blue-500',
    description: 'Managed cloud infrastructure',
  },
  'self-hosted': {
    label: 'Self-Hosted',
    color: 'text-purple-500',
    description: 'On-premise or private cloud',
  },
  hybrid: {
    label: 'Hybrid',
    color: 'text-orange-500',
    description: 'Mixed cloud and on-premise',
  },
};

/**
 * Available regions
 */
export const AGENT_REGIONS = [
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'on-premise',
] as const;

export type AgentRegion = (typeof AGENT_REGIONS)[number];
