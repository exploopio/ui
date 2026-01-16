/**
 * Worker API Hooks
 *
 * SWR hooks for Worker Management
 */

"use client";

import useSWR, { type SWRConfiguration } from "swr";
import useSWRMutation from "swr/mutation";
import { get, post, put, del } from "./client";
import { handleApiError } from "./error-handler";
import { useTenant } from "@/context/tenant-provider";
import { workerEndpoints } from "./endpoints";
import type {
  Worker,
  WorkerListResponse,
  WorkerListFilters,
  CreateWorkerRequest,
  CreateWorkerResponse,
  UpdateWorkerRequest,
  RegenerateAPIKeyResponse,
} from "./worker-types";

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

export const workerKeys = {
  all: ["workers"] as const,
  lists: () => [...workerKeys.all, "list"] as const,
  list: (filters?: WorkerListFilters) =>
    [...workerKeys.lists(), filters] as const,
  details: () => [...workerKeys.all, "detail"] as const,
  detail: (id: string) => [...workerKeys.details(), id] as const,
};

// ============================================
// FETCHER FUNCTIONS
// ============================================

async function fetchWorkers(url: string): Promise<WorkerListResponse> {
  return get<WorkerListResponse>(url);
}

async function fetchWorker(url: string): Promise<Worker> {
  return get<Worker>(url);
}

// ============================================
// WORKER HOOKS
// ============================================

/**
 * Fetch workers list
 */
export function useWorkers(filters?: WorkerListFilters, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? workerEndpoints.list(filters) : null;

  return useSWR<WorkerListResponse>(key, fetchWorkers, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch a single worker by ID
 */
export function useWorker(workerId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant && workerId ? workerEndpoints.get(workerId) : null;

  return useSWR<Worker>(key, fetchWorker, {
    ...defaultConfig,
    ...config,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create a new worker
 */
export function useCreateWorker() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? workerEndpoints.create() : null,
    async (url: string, { arg }: { arg: CreateWorkerRequest }) => {
      return post<CreateWorkerResponse>(url, arg);
    }
  );
}

/**
 * Update a worker
 */
export function useUpdateWorker(workerId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && workerId ? workerEndpoints.update(workerId) : null,
    async (url: string, { arg }: { arg: UpdateWorkerRequest }) => {
      return put<Worker>(url, arg);
    }
  );
}

/**
 * Delete a worker
 */
export function useDeleteWorker(workerId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && workerId ? workerEndpoints.delete(workerId) : null,
    async (url: string) => {
      return del<void>(url);
    }
  );
}

/**
 * Regenerate worker API key
 */
export function useRegenerateWorkerKey(workerId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && workerId ? workerEndpoints.regenerateKey(workerId) : null,
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

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Invalidate workers cache
 */
export async function invalidateWorkersCache() {
  const { mutate } = await import("swr");
  await mutate(
    (key) => typeof key === "string" && key.includes("/api/v1/workers"),
    undefined,
    { revalidate: true }
  );
}
