/**
 * Tool API Hooks
 *
 * SWR hooks for Tool Registry Management
 */

"use client";

import useSWR, { type SWRConfiguration } from "swr";
import useSWRMutation from "swr/mutation";
import { get, post, put, del } from "./client";
import { handleApiError } from "./error-handler";
import { useTenant } from "@/context/tenant-provider";
import { toolEndpoints, tenantToolEndpoints, toolStatsEndpoints } from "./endpoints";
import type {
  Tool,
  ToolListResponse,
  ToolListFilters,
  CreateToolRequest,
  UpdateToolRequest,
  TenantToolConfig,
  TenantToolConfigListResponse,
  TenantToolConfigListFilters,
  TenantToolConfigRequest,
  ToolWithConfig,
  BulkToolIDsRequest,
  ToolStats,
  TenantToolStats,
  ToolExecution,
  ToolExecutionListResponse,
  ToolExecutionListFilters,
} from "./tool-types";

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

export const toolKeys = {
  all: ["tools"] as const,
  lists: () => [...toolKeys.all, "list"] as const,
  list: (filters?: ToolListFilters) => [...toolKeys.lists(), filters] as const,
  details: () => [...toolKeys.all, "detail"] as const,
  detail: (id: string) => [...toolKeys.details(), id] as const,
  byName: (name: string) => [...toolKeys.all, "name", name] as const,
};

export const tenantToolKeys = {
  all: ["tenant-tools"] as const,
  lists: () => [...tenantToolKeys.all, "list"] as const,
  list: (filters?: TenantToolConfigListFilters) =>
    [...tenantToolKeys.lists(), filters] as const,
  details: () => [...tenantToolKeys.all, "detail"] as const,
  detail: (toolId: string) => [...tenantToolKeys.details(), toolId] as const,
  withConfig: (toolId: string) =>
    [...tenantToolKeys.all, "with-config", toolId] as const,
};

export const toolStatsKeys = {
  all: ["tool-stats"] as const,
  tool: (toolId: string) => [...toolStatsKeys.all, "tool", toolId] as const,
  tenant: () => [...toolStatsKeys.all, "tenant"] as const,
  executions: (filters?: ToolExecutionListFilters) =>
    [...toolStatsKeys.all, "executions", filters] as const,
  execution: (id: string) =>
    [...toolStatsKeys.all, "execution", id] as const,
};

// ============================================
// FETCHER FUNCTIONS
// ============================================

async function fetchTools(url: string): Promise<ToolListResponse> {
  return get<ToolListResponse>(url);
}

async function fetchTool(url: string): Promise<Tool> {
  return get<Tool>(url);
}

async function fetchTenantToolConfigs(
  url: string
): Promise<TenantToolConfigListResponse> {
  return get<TenantToolConfigListResponse>(url);
}

async function fetchTenantToolConfig(url: string): Promise<TenantToolConfig> {
  return get<TenantToolConfig>(url);
}

async function fetchToolWithConfig(url: string): Promise<ToolWithConfig> {
  return get<ToolWithConfig>(url);
}

async function fetchToolStats(url: string): Promise<ToolStats> {
  return get<ToolStats>(url);
}

async function fetchTenantToolStats(url: string): Promise<TenantToolStats> {
  return get<TenantToolStats>(url);
}

async function fetchToolExecutions(
  url: string
): Promise<ToolExecutionListResponse> {
  return get<ToolExecutionListResponse>(url);
}

async function fetchToolExecution(url: string): Promise<ToolExecution> {
  return get<ToolExecution>(url);
}

// ============================================
// TOOL HOOKS (System-wide tools)
// ============================================

/**
 * Fetch tools list
 */
export function useTools(
  filters?: ToolListFilters,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? toolEndpoints.list(filters) : null;

  return useSWR<ToolListResponse>(key, fetchTools, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch a single tool by ID
 */
export function useTool(toolId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant && toolId ? toolEndpoints.get(toolId) : null;

  return useSWR<Tool>(key, fetchTool, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch a single tool by name
 */
export function useToolByName(
  name: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant();

  const key = currentTenant && name ? toolEndpoints.getByName(name) : null;

  return useSWR<Tool>(key, fetchTool, {
    ...defaultConfig,
    ...config,
  });
}

// ============================================
// TOOL MUTATION HOOKS
// ============================================

/**
 * Create a new tool (admin only)
 */
export function useCreateTool() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? toolEndpoints.create() : null,
    async (url: string, { arg }: { arg: CreateToolRequest }) => {
      return post<Tool>(url, arg);
    }
  );
}

/**
 * Update a tool (admin only)
 */
export function useUpdateTool(toolId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && toolId ? toolEndpoints.update(toolId) : null,
    async (url: string, { arg }: { arg: UpdateToolRequest }) => {
      return put<Tool>(url, arg);
    }
  );
}

/**
 * Delete a tool (admin only)
 */
export function useDeleteTool(toolId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && toolId ? toolEndpoints.delete(toolId) : null,
    async (url: string) => {
      return del<void>(url);
    }
  );
}

/**
 * Activate a tool
 */
export function useActivateTool(toolId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && toolId ? toolEndpoints.activate(toolId) : null,
    async (url: string) => {
      return post<Tool>(url, {});
    }
  );
}

/**
 * Deactivate a tool
 */
export function useDeactivateTool(toolId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && toolId ? toolEndpoints.deactivate(toolId) : null,
    async (url: string) => {
      return post<Tool>(url, {});
    }
  );
}

/**
 * Check tool version
 */
export function useCheckToolVersion(toolId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && toolId ? toolEndpoints.checkVersion(toolId) : null,
    async (url: string) => {
      return post<Tool>(url, {});
    }
  );
}

// ============================================
// TENANT TOOL CONFIG HOOKS
// ============================================

/**
 * Fetch tenant tool configs list
 */
export function useTenantToolConfigs(
  filters?: TenantToolConfigListFilters,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? tenantToolEndpoints.list(filters) : null;

  return useSWR<TenantToolConfigListResponse>(key, fetchTenantToolConfigs, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch a single tenant tool config
 */
export function useTenantToolConfig(
  toolId: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant();

  const key =
    currentTenant && toolId ? tenantToolEndpoints.get(toolId) : null;

  return useSWR<TenantToolConfig>(key, fetchTenantToolConfig, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch tool with effective tenant config
 */
export function useToolWithConfig(
  toolId: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant();

  const key =
    currentTenant && toolId ? tenantToolEndpoints.getWithConfig(toolId) : null;

  return useSWR<ToolWithConfig>(key, fetchToolWithConfig, {
    ...defaultConfig,
    ...config,
  });
}

// ============================================
// TENANT TOOL CONFIG MUTATION HOOKS
// ============================================

/**
 * Update tenant tool config
 */
export function useUpdateTenantToolConfig(toolId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && toolId ? tenantToolEndpoints.update(toolId) : null,
    async (url: string, { arg }: { arg: TenantToolConfigRequest }) => {
      return put<TenantToolConfig>(url, arg);
    }
  );
}

/**
 * Delete tenant tool config (reset to defaults)
 */
export function useDeleteTenantToolConfig(toolId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && toolId ? tenantToolEndpoints.delete(toolId) : null,
    async (url: string) => {
      return del<void>(url);
    }
  );
}

/**
 * Bulk enable tools for tenant
 */
export function useBulkEnableTools() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? tenantToolEndpoints.bulkEnable() : null,
    async (url: string, { arg }: { arg: BulkToolIDsRequest }) => {
      return post<void>(url, arg);
    }
  );
}

/**
 * Bulk disable tools for tenant
 */
export function useBulkDisableTools() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? tenantToolEndpoints.bulkDisable() : null,
    async (url: string, { arg }: { arg: BulkToolIDsRequest }) => {
      return post<void>(url, arg);
    }
  );
}

// ============================================
// TOOL STATS HOOKS
// ============================================

/**
 * Fetch stats for a specific tool
 */
export function useToolStats(toolId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key =
    currentTenant && toolId ? toolStatsEndpoints.toolStats(toolId) : null;

  return useSWR<ToolStats>(key, fetchToolStats, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch tenant tool stats summary
 */
export function useTenantToolStats(config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? toolStatsEndpoints.tenantStats() : null;

  return useSWR<TenantToolStats>(key, fetchTenantToolStats, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch tool executions list
 */
export function useToolExecutions(
  filters?: ToolExecutionListFilters,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? toolStatsEndpoints.executions(filters) : null;

  return useSWR<ToolExecutionListResponse>(key, fetchToolExecutions, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch a single tool execution
 */
export function useToolExecution(
  executionId: string | null,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant();

  const key =
    currentTenant && executionId
      ? toolStatsEndpoints.execution(executionId)
      : null;

  return useSWR<ToolExecution>(key, fetchToolExecution, {
    ...defaultConfig,
    ...config,
  });
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Invalidate tools cache
 */
export async function invalidateToolsCache() {
  const { mutate } = await import("swr");
  await mutate(
    (key) => typeof key === "string" && key.includes("/api/v1/tools"),
    undefined,
    { revalidate: true }
  );
}

/**
 * Invalidate tenant tools cache
 */
export async function invalidateTenantToolsCache() {
  const { mutate } = await import("swr");
  await mutate(
    (key) => typeof key === "string" && key.includes("/api/v1/tenant-tools"),
    undefined,
    { revalidate: true }
  );
}

/**
 * Invalidate tool stats cache
 */
export async function invalidateToolStatsCache() {
  const { mutate } = await import("swr");
  await mutate(
    (key) => typeof key === "string" && key.includes("/api/v1/tool-stats"),
    undefined,
    { revalidate: true }
  );
}

/**
 * Invalidate all tool-related caches
 */
export async function invalidateAllToolCaches() {
  await Promise.all([
    invalidateToolsCache(),
    invalidateTenantToolsCache(),
    invalidateToolStatsCache(),
  ]);
}
