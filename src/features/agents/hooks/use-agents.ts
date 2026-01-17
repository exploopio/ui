/**
 * Agent Hooks
 *
 * SWR hooks for Agent Management
 * Agents are daemon workers - workers with execution_mode = 'daemon'
 */

'use client';

import useSWR, { type SWRConfiguration } from 'swr';
import useSWRMutation from 'swr/mutation';
import { get, post, put, del } from '@/lib/api/client';
import { handleApiError } from '@/lib/api/error-handler';
import { useTenant } from '@/context/tenant-provider';
import { workerEndpoints } from '@/lib/api/endpoints';
import type {
  Worker,
  WorkerListResponse,
  CreateWorkerRequest,
  CreateWorkerResponse,
  UpdateWorkerRequest,
  RegenerateAPIKeyResponse,
} from '@/lib/api/worker-types';
import type {
  Agent,
  AgentStats,
  AgentListFilters,
  CreateAgentRequest,
  UpdateAgentRequest,
} from '../types';

// ============================================
// SWR CONFIGURATION
// ============================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  dedupingInterval: 2000,
  onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
    if (error?.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return;
    }
    if (retryCount >= 3) return;
    setTimeout(() => revalidate({ retryCount }), 1000);
  },
  onError: (error) => {
    handleApiError(error, {
      showToast: true,
      logError: true,
    });
  },
};

// ============================================
// CACHE KEYS
// ============================================

export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filters?: AgentListFilters) => [...agentKeys.lists(), filters] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
  stats: () => [...agentKeys.all, 'stats'] as const,
};

// ============================================
// TYPE TRANSFORMATIONS
// ============================================

/**
 * Transform Worker to Agent with metrics
 */
function workerToAgent(worker: Worker): Agent {
  return {
    ...worker,
    type: 'agent',
    deployment_type: mapWorkerTypeToDeployment(worker.type),
    region: worker.labels?.region || worker.metadata?.region as string || undefined,
    metrics: {
      cpu_usage: (worker.metadata?.cpu_usage as number) || 0,
      memory_usage: (worker.metadata?.memory_usage as number) || 0,
      active_jobs: (worker.metadata?.active_jobs as number) || 0,
    },
    jobs_completed: worker.total_scans || 0,
    last_heartbeat_at: worker.last_seen_at,
  };
}

/**
 * Map worker type to deployment type
 */
function mapWorkerTypeToDeployment(type: string): 'cloud' | 'self-hosted' | 'hybrid' {
  switch (type) {
    case 'agent':
      return 'cloud';
    case 'scanner':
      return 'self-hosted';
    case 'collector':
      return 'hybrid';
    default:
      return 'self-hosted';
  }
}

/**
 * Transform Agent request to Worker request
 */
function agentToWorkerRequest(data: CreateAgentRequest | UpdateAgentRequest): CreateWorkerRequest | UpdateWorkerRequest {
  return {
    name: data.name,
    type: 'agent',
    description: data.description,
    capabilities: data.capabilities,
    tools: data.tools,
    execution_mode: 'daemon',
    labels: {
      ...data.labels,
      region: data.region || '',
      deployment_type: data.deployment_type || 'cloud',
    },
  };
}

// ============================================
// FETCHER FUNCTIONS
// ============================================

async function fetchAgents(url: string): Promise<{ agents: Agent[]; total: number }> {
  const response = await get<WorkerListResponse>(url);

  // Filter only daemon workers (agents)
  const agents = response.items
    .filter((w) => w.execution_mode === 'daemon' || w.type === 'agent')
    .map(workerToAgent);

  return {
    agents,
    total: agents.length,
  };
}

async function fetchAgent(url: string): Promise<Agent> {
  const worker = await get<Worker>(url);
  return workerToAgent(worker);
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch agents list (daemon workers only)
 */
export function useAgents(filters?: AgentListFilters, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  // Convert agent filters to worker filters
  const workerFilters = {
    type: 'agent' as const,
    status: filters?.status === 'online' ? 'active' as const :
            filters?.status === 'offline' ? 'inactive' as const : undefined,
    search: filters?.search,
    page: filters?.page,
    page_size: filters?.page_size,
  };

  const key = currentTenant ? workerEndpoints.list(workerFilters) : null;

  const result = useSWR(key, fetchAgents, {
    ...defaultConfig,
    ...config,
  });

  return {
    ...result,
    agents: result.data?.agents || [],
    total: result.data?.total || 0,
  };
}

/**
 * Fetch a single agent by ID
 */
export function useAgent(agentId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant && agentId ? workerEndpoints.get(agentId) : null;

  return useSWR<Agent>(key, fetchAgent, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Calculate agent stats from list
 */
export function useAgentStats(config?: SWRConfiguration) {
  const { agents, isLoading, error, mutate } = useAgents(undefined, config);

  const stats: AgentStats = {
    total: agents.length,
    online: agents.filter((a) => a.status === 'active').length,
    offline: agents.filter((a) => a.status !== 'active').length,
    busy: agents.filter(
      (a) => a.status === 'active' && (a.metrics?.active_jobs || 0) > 0
    ).length,
    paused: 0,
    total_active_jobs: agents.reduce((sum, a) => sum + (a.metrics?.active_jobs || 0), 0),
    total_completed_jobs: agents.reduce((sum, a) => sum + (a.jobs_completed || 0), 0),
  };

  // Adjust online count to exclude busy
  stats.online = stats.online - stats.busy;

  return {
    stats,
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create a new agent
 */
export function useCreateAgent() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? workerEndpoints.create() : null,
    async (url: string, { arg }: { arg: CreateAgentRequest }) => {
      const workerRequest = agentToWorkerRequest(arg) as CreateWorkerRequest;
      const response = await post<CreateWorkerResponse>(url, workerRequest);
      return {
        agent: workerToAgent(response.worker),
        api_key: response.api_key,
      };
    }
  );
}

/**
 * Update an agent
 */
export function useUpdateAgent(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? workerEndpoints.update(agentId) : null,
    async (url: string, { arg }: { arg: UpdateAgentRequest }) => {
      const workerRequest = agentToWorkerRequest(arg) as UpdateWorkerRequest;
      const worker = await put<Worker>(url, workerRequest);
      return workerToAgent(worker);
    }
  );
}

/**
 * Delete an agent
 */
export function useDeleteAgent(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? workerEndpoints.delete(agentId) : null,
    async (url: string) => {
      return del<void>(url);
    }
  );
}

/**
 * Regenerate agent API key
 */
export function useRegenerateAgentKey(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? workerEndpoints.regenerateKey(agentId) : null,
    async (url: string) => {
      return post<RegenerateAPIKeyResponse>(url, {});
    },
    {
      revalidate: false,
      populateCache: false,
    }
  );
}

// ============================================
// COMMAND HOOKS (for daemon agents)
// ============================================

/**
 * Pause an agent (set status to inactive)
 */
export function usePauseAgent(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? workerEndpoints.update(agentId) : null,
    async (url: string) => {
      const worker = await put<Worker>(url, { status: 'inactive' });
      return workerToAgent(worker);
    }
  );
}

/**
 * Resume an agent (set status to active)
 */
export function useResumeAgent(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? workerEndpoints.update(agentId) : null,
    async (url: string) => {
      const worker = await put<Worker>(url, { status: 'active' });
      return workerToAgent(worker);
    }
  );
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Invalidate agents cache
 */
export async function invalidateAgentsCache() {
  const { mutate } = await import('swr');
  await mutate(
    (key) => typeof key === 'string' && key.includes('/api/v1/workers'),
    undefined,
    { revalidate: true }
  );
}
