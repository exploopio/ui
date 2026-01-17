/**
 * Scan Configuration API Hooks
 *
 * SWR hooks for Scan Configuration Management
 * Part of the Scan Management feature.
 */

"use client";

import useSWR, { type SWRConfiguration } from "swr";
import useSWRMutation from "swr/mutation";
import { get, post, put, del } from "./client";
import { handleApiError } from "./error-handler";
import { useTenant } from "@/context/tenant-provider";
import { scanEndpoints } from "./endpoints";
import type {
  ScanConfig,
  ScanConfigListResponse,
  ScanConfigListFilters,
  ScanConfigStatsData,
  CreateScanConfigRequest,
  UpdateScanConfigRequest,
  TriggerScanRequest,
  CloneScanConfigRequest,
  PipelineRun,
} from "./scan-types";

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

export const scanConfigKeys = {
  all: ["scan-configs"] as const,
  lists: () => [...scanConfigKeys.all, "list"] as const,
  list: (filters?: ScanConfigListFilters) => [...scanConfigKeys.lists(), filters] as const,
  details: () => [...scanConfigKeys.all, "detail"] as const,
  detail: (id: string) => [...scanConfigKeys.details(), id] as const,
  stats: () => [...scanConfigKeys.all, "stats"] as const,
};

// ============================================
// FETCHER FUNCTIONS
// ============================================

async function fetchScanConfigs(url: string): Promise<ScanConfigListResponse> {
  return get<ScanConfigListResponse>(url);
}

async function fetchScanConfig(url: string): Promise<ScanConfig> {
  return get<ScanConfig>(url);
}

async function fetchScanConfigStats(url: string): Promise<ScanConfigStatsData> {
  return get<ScanConfigStatsData>(url);
}

// ============================================
// READ HOOKS
// ============================================

/**
 * Fetch scan configs list
 */
export function useScanConfigs(
  filters?: ScanConfigListFilters,
  config?: SWRConfiguration
) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? scanEndpoints.list(filters) : null;

  return useSWR<ScanConfigListResponse>(key, fetchScanConfigs, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch a single scan config by ID
 */
export function useScanConfig(configId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant && configId ? scanEndpoints.get(configId) : null;

  return useSWR<ScanConfig>(key, fetchScanConfig, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch scan config stats
 */
export function useScanConfigStats(config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? scanEndpoints.stats() : null;

  return useSWR<ScanConfigStatsData>(key, fetchScanConfigStats, {
    ...defaultConfig,
    ...config,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create a new scan config
 */
export function useCreateScanConfig() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? scanEndpoints.create() : null,
    async (url: string, { arg }: { arg: CreateScanConfigRequest }) => {
      return post<ScanConfig>(url, arg);
    }
  );
}

/**
 * Update a scan config
 */
export function useUpdateScanConfig(configId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && configId ? scanEndpoints.update(configId) : null,
    async (url: string, { arg }: { arg: UpdateScanConfigRequest }) => {
      return put<ScanConfig>(url, arg);
    }
  );
}

/**
 * Delete a scan config
 */
export function useDeleteScanConfig(configId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && configId ? scanEndpoints.delete(configId) : null,
    async (url: string) => {
      return del<void>(url);
    }
  );
}

// ============================================
// STATUS HOOKS
// ============================================

/**
 * Activate a scan config
 */
export function useActivateScanConfig(configId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && configId ? scanEndpoints.activate(configId) : null,
    async (url: string) => {
      return post<ScanConfig>(url, {});
    }
  );
}

/**
 * Pause a scan config
 */
export function usePauseScanConfig(configId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && configId ? scanEndpoints.pause(configId) : null,
    async (url: string) => {
      return post<ScanConfig>(url, {});
    }
  );
}

/**
 * Disable a scan config
 */
export function useDisableScanConfig(configId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && configId ? scanEndpoints.disable(configId) : null,
    async (url: string) => {
      return post<ScanConfig>(url, {});
    }
  );
}

// ============================================
// TRIGGER HOOKS
// ============================================

/**
 * Trigger scan execution
 */
export function useTriggerScan(configId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && configId ? scanEndpoints.trigger(configId) : null,
    async (url: string, { arg }: { arg?: TriggerScanRequest }) => {
      return post<PipelineRun>(url, arg || {});
    }
  );
}

/**
 * Clone a scan config
 */
export function useCloneScanConfig(configId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && configId ? scanEndpoints.clone(configId) : null,
    async (url: string, { arg }: { arg: CloneScanConfigRequest }) => {
      return post<ScanConfig>(url, arg);
    }
  );
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Invalidate scan configs cache
 */
export async function invalidateScanConfigsCache() {
  const { mutate } = await import("swr");
  await mutate(
    (key) => typeof key === "string" && key.includes("/api/v1/scans"),
    undefined,
    { revalidate: true }
  );
}

/**
 * Invalidate scan config stats cache
 */
export async function invalidateScanConfigStatsCache() {
  const { mutate } = await import("swr");
  await mutate(
    (key) => typeof key === "string" && key.includes("/api/v1/scans/stats"),
    undefined,
    { revalidate: true }
  );
}

/**
 * Invalidate all scan config-related caches
 */
export async function invalidateAllScanConfigCaches() {
  await Promise.all([
    invalidateScanConfigsCache(),
    invalidateScanConfigStatsCache(),
  ]);
}
