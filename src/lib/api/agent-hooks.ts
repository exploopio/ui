/**
 * Agent API Hooks
 *
 * SWR hooks for Agent Management
 */

"use client";

import useSWR, { type SWRConfiguration } from "swr";
import useSWRMutation from "swr/mutation";
import { get, post, put, del } from "./client";
import { handleApiError } from "./error-handler";
import { useTenant } from "@/context/tenant-provider";
import { agentEndpoints } from "./endpoints";
import type {
  Agent,
  AgentListResponse,
  AgentListFilters,
  CreateAgentRequest,
  CreateAgentResponse,
  UpdateAgentRequest,
  RegenerateAPIKeyResponse,
} from "./agent-types";

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
    // Don't retry on client errors (4xx) - they won't change
    if (error?.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return;
    }
    // Only retry server errors (5xx) up to 3 times
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
  all: ["agents"] as const,
  lists: () => [...agentKeys.all, "list"] as const,
  list: (filters?: AgentListFilters) =>
    [...agentKeys.lists(), filters] as const,
  details: () => [...agentKeys.all, "detail"] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
};

// ============================================
// FETCHER FUNCTIONS
// ============================================

async function fetchAgents(url: string): Promise<AgentListResponse> {
  return get<AgentListResponse>(url);
}

async function fetchAgent(url: string): Promise<Agent> {
  return get<Agent>(url);
}

// ============================================
// WORKER HOOKS
// ============================================

/**
 * Fetch agents list
 */
export function useAgents(filters?: AgentListFilters, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? agentEndpoints.list(filters) : null;

  return useSWR<AgentListResponse>(key, fetchAgents, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch a single agent by ID
 */
export function useAgent(agentId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant && agentId ? agentEndpoints.get(agentId) : null;

  return useSWR<Agent>(key, fetchAgent, {
    ...defaultConfig,
    ...config,
  });
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
    currentTenant ? agentEndpoints.create() : null,
    async (url: string, { arg }: { arg: CreateAgentRequest }) => {
      return post<CreateAgentResponse>(url, arg);
    }
  );
}

/**
 * Update an agent
 */
export function useUpdateAgent(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? agentEndpoints.update(agentId) : null,
    async (url: string, { arg }: { arg: UpdateAgentRequest }) => {
      return put<Agent>(url, arg);
    }
  );
}

/**
 * Delete an agent
 */
export function useDeleteAgent(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? agentEndpoints.delete(agentId) : null,
    async (url: string) => {
      return del<void>(url);
    }
  );
}

/**
 * Delete multiple agents (bulk delete)
 */
export function useBulkDeleteAgents() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? "bulk-delete-agents" : null,
    async (_key: string, { arg: agentIds }: { arg: string[] }) => {
      // Delete agents sequentially to avoid overwhelming the server
      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const id of agentIds) {
        try {
          await del<void>(agentEndpoints.delete(id));
          results.push({ id, success: true });
        } catch (error) {
          results.push({
            id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      return results;
    }
  );
}

/**
 * Regenerate agent API key
 */
export function useRegenerateAgentKey(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? agentEndpoints.regenerateKey(agentId) : null,
    async (url: string) => {
      return post<RegenerateAPIKeyResponse>(url, {});
    },
    {
      // Don't revalidate other SWR hooks after mutation
      // We'll manually invalidate when user closes the dialog
      revalidate: false,
      populateCache: false,
    }
  );
}

/**
 * Activate an agent (set status to active)
 */
export function useActivateAgent(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? agentEndpoints.activate(agentId) : null,
    async (url: string) => {
      return post<Agent>(url, {});
    }
  );
}

/**
 * Deactivate an agent (set status to disabled)
 */
export function useDeactivateAgent(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? agentEndpoints.deactivate(agentId) : null,
    async (url: string) => {
      return post<Agent>(url, {});
    }
  );
}

/**
 * Revoke an agent (permanently revoke access)
 */
export function useRevokeAgent(agentId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && agentId ? agentEndpoints.revoke(agentId) : null,
    async (url: string) => {
      return post<Agent>(url, {});
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
  const { mutate } = await import("swr");
  await mutate(
    (key) => typeof key === "string" && key.includes("/api/v1/agents"),
    undefined,
    { revalidate: true }
  );
}
