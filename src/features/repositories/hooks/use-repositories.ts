/**
 * Repository Hooks
 *
 * SWR hooks for fetching and mutating repository data
 * Uses unified asset architecture (assets with type='repository' + asset_repositories extension)
 */

"use client";

import useSWR, { type SWRConfiguration } from "swr";
import useSWRMutation from "swr/mutation";
import { get, post, put, del } from "@/lib/api/client";
import { handleApiError } from "@/lib/api/error-handler";
import { useTenant } from "@/context/tenant-provider";
import type { AssetWithRepository, CreateRepositoryAssetInput, UpdateRepositoryExtensionInput } from "@/features/assets/types/asset.types";
import type {
  RepositoryListResponse,
  RepositoryFilters,
  RepositoryStats,
  RepositoryScan,
  TriggerScanInput,
  Branch,
  BranchConfig,
  SCMConnection,
  CreateSCMConnectionInput,
  ImportJob,
  ImportPreview,
  RepositoryImportConfig,
} from "../types/repository.types";

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
// ENDPOINT BUILDERS
// ============================================

function buildRepositoriesEndpoint(filters?: RepositoryFilters): string {
  // Use assets endpoint with types=repository filter
  const baseUrl = "/api/v1/assets";
  const params = new URLSearchParams();

  // Always filter by repository type (API uses 'types' plural)
  params.set("types", "repository");

  if (filters) {
    // Text search
    if (filters.name) params.set("name", filters.name);
    if (filters.search) params.set("search", filters.search);

    // SCM filters
    if (filters.scmProviders?.length) params.set("scm_providers", filters.scmProviders.join(","));
    if (filters.scmConnectionIds?.length) params.set("scm_connection_ids", filters.scmConnectionIds.join(","));
    if (filters.scmOrganizations?.length) params.set("scm_organizations", filters.scmOrganizations.join(","));

    // Status filters
    if (filters.visibilities?.length) params.set("visibilities", filters.visibilities.join(","));
    if (filters.statuses?.length) params.set("statuses", filters.statuses.join(","));
    if (filters.syncStatuses?.length) params.set("sync_statuses", filters.syncStatuses.join(","));
    if (filters.complianceStatuses?.length) params.set("compliance_statuses", filters.complianceStatuses.join(","));
    if (filters.qualityGateStatuses?.length) params.set("quality_gate_statuses", filters.qualityGateStatuses.join(","));

    // Classification filters
    if (filters.criticalities?.length) params.set("criticalities", filters.criticalities.join(","));
    if (filters.scopes?.length) params.set("scopes", filters.scopes.join(","));
    if (filters.exposures?.length) params.set("exposures", filters.exposures.join(","));

    // Other filters
    if (filters.languages?.length) params.set("languages", filters.languages.join(","));
    if (filters.tags?.length) params.set("tags", filters.tags.join(","));
    if (filters.groupIds?.length) params.set("group_ids", filters.groupIds.join(","));
    if (filters.teamIds?.length) params.set("team_ids", filters.teamIds.join(","));
    if (filters.policyIds?.length) params.set("policy_ids", filters.policyIds.join(","));

    // Finding filters
    if (filters.hasFindings !== undefined) params.set("has_findings", String(filters.hasFindings));
    if (filters.hasCriticalFindings !== undefined) params.set("has_critical_findings", String(filters.hasCriticalFindings));
    if (filters.minRiskScore !== undefined) params.set("min_risk_score", String(filters.minRiskScore));
    if (filters.maxRiskScore !== undefined) params.set("max_risk_score", String(filters.maxRiskScore));

    // Date filters
    if (filters.lastScannedAfter) params.set("last_scanned_after", filters.lastScannedAfter);
    if (filters.lastScannedBefore) params.set("last_scanned_before", filters.lastScannedBefore);
    if (filters.createdAfter) params.set("created_after", filters.createdAfter);
    if (filters.createdBefore) params.set("created_before", filters.createdBefore);

    // Pagination & sorting
    if (filters.sortBy) params.set("sort_by", filters.sortBy);
    if (filters.sortOrder) params.set("sort_order", filters.sortOrder);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.perPage) params.set("per_page", String(filters.perPage));
  }

  const queryString = params.toString();
  return `${baseUrl}?${queryString}`;
}

function buildRepositoryEndpoint(assetId: string): string {
  return `/api/v1/assets/${assetId}/full`;
}

function buildRepositoryExtensionEndpoint(assetId: string): string {
  return `/api/v1/assets/${assetId}/repository`;
}

function buildSCMConnectionsEndpoint(): string {
  return "/api/v1/scm-connections";
}

function buildSCMConnectionEndpoint(connectionId: string): string {
  return `/api/v1/scm-connections/${connectionId}`;
}

function buildImportEndpoint(): string {
  return "/api/v1/assets/repository/import";
}

function buildImportPreviewEndpoint(): string {
  return "/api/v1/assets/repository/import/preview";
}

function buildImportJobEndpoint(jobId: string): string {
  return `/api/v1/assets/repository/import/${jobId}`;
}

// ============================================
// FETCHER FUNCTIONS
// ============================================

async function fetchRepositories(url: string): Promise<RepositoryListResponse> {
  return get<RepositoryListResponse>(url);
}

async function fetchRepository(url: string): Promise<AssetWithRepository> {
  return get<AssetWithRepository>(url);
}

async function fetchRepositoryStats(url: string): Promise<RepositoryStats> {
  return get<RepositoryStats>(url);
}

async function fetchSCMConnections(url: string): Promise<SCMConnection[]> {
  return get<SCMConnection[]>(url);
}

async function fetchSCMConnection(url: string): Promise<SCMConnection> {
  return get<SCMConnection>(url);
}

async function fetchRepositoryScans(url: string): Promise<RepositoryScan[]> {
  return get<RepositoryScan[]>(url);
}

async function fetchRepositoryBranches(url: string): Promise<Branch[]> {
  return get<Branch[]>(url);
}

async function fetchImportJob(url: string): Promise<ImportJob> {
  return get<ImportJob>(url);
}

// ============================================
// REPOSITORY HOOKS
// ============================================

/**
 * Fetch repositories list for current tenant
 *
 * @example
 * ```typescript
 * function RepositoryList() {
 *   const { data, error, isLoading } = useRepositories({ page: 1, perPage: 20 })
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error error={error} />
 *
 *   return (
 *     <ul>
 *       {data?.data.map(repo => (
 *         <li key={repo.id}>{repo.name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useRepositories(filters?: RepositoryFilters, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? buildRepositoriesEndpoint(filters) : null;

  return useSWR<RepositoryListResponse>(key, fetchRepositories, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch a single repository by asset ID
 *
 * @example
 * ```typescript
 * function RepositoryDetail({ id }: { id: string }) {
 *   const { data: repository, error, isLoading } = useRepository(id)
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error error={error} />
 *
 *   return <h1>{repository?.name}</h1>
 * }
 * ```
 */
export function useRepository(assetId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant && assetId ? buildRepositoryEndpoint(assetId) : null;

  return useSWR<AssetWithRepository>(key, fetchRepository, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch repository statistics
 */
export function useRepositoryStats(config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? "/api/v1/assets/stats?type=repository" : null;

  return useSWR<RepositoryStats>(key, fetchRepositoryStats, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch scans for a repository
 */
export function useRepositoryScans(assetId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant && assetId ? `/api/v1/assets/${assetId}/scans` : null;

  return useSWR<RepositoryScan[]>(key, fetchRepositoryScans, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch branches for a repository
 */
export function useRepositoryBranches(assetId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant && assetId ? `/api/v1/assets/${assetId}/branches` : null;

  return useSWR<Branch[]>(key, fetchRepositoryBranches, {
    ...defaultConfig,
    ...config,
  });
}

// ============================================
// REPOSITORY MUTATION HOOKS
// ============================================

/**
 * Create a new repository asset
 */
export function useCreateRepository() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? "/api/v1/assets/repository" : null,
    async (url: string, { arg }: { arg: CreateRepositoryAssetInput }) => {
      return post<AssetWithRepository>(url, arg);
    }
  );
}

/**
 * Update a repository extension
 */
export function useUpdateRepository(assetId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && assetId ? buildRepositoryExtensionEndpoint(assetId) : null,
    async (url: string, { arg }: { arg: UpdateRepositoryExtensionInput }) => {
      return put<AssetWithRepository>(url, arg);
    }
  );
}

/**
 * Delete a repository asset
 */
export function useDeleteRepository(assetId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && assetId ? `/api/v1/assets/${assetId}` : null,
    async (url: string) => {
      return del<void>(url);
    }
  );
}

/**
 * Trigger a scan for a repository
 */
export function useTriggerRepositoryScan(assetId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && assetId ? `/api/v1/assets/${assetId}/scan` : null,
    async (url: string, { arg }: { arg: TriggerScanInput }) => {
      return post<RepositoryScan>(url, arg);
    }
  );
}

/**
 * Sync a repository with SCM
 */
export function useSyncRepository(assetId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && assetId ? `/api/v1/assets/${assetId}/sync` : null,
    async (url: string) => {
      return post<AssetWithRepository>(url, {});
    }
  );
}

/**
 * Update branch configuration
 */
export function useUpdateBranchConfig(assetId: string, branchName: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && assetId && branchName
      ? `/api/v1/assets/${assetId}/branches/${encodeURIComponent(branchName)}`
      : null,
    async (url: string, { arg }: { arg: BranchConfig }) => {
      return put<Branch>(url, arg);
    }
  );
}

/**
 * Activate a repository asset
 */
export function useActivateRepository(assetId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && assetId ? `/api/v1/assets/${assetId}/activate` : null,
    async (url: string) => {
      return post<AssetWithRepository>(url, {});
    }
  );
}

/**
 * Deactivate a repository asset
 */
export function useDeactivateRepository(assetId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && assetId ? `/api/v1/assets/${assetId}/deactivate` : null,
    async (url: string) => {
      return post<AssetWithRepository>(url, {});
    }
  );
}

/**
 * Archive a repository asset
 */
export function useArchiveRepository(assetId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && assetId ? `/api/v1/assets/${assetId}/archive` : null,
    async (url: string) => {
      return post<AssetWithRepository>(url, {});
    }
  );
}

// ============================================
// SCM CONNECTION HOOKS
// ============================================

/**
 * Fetch all SCM connections
 */
export function useSCMConnections(config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant ? buildSCMConnectionsEndpoint() : null;

  return useSWR<SCMConnection[]>(key, fetchSCMConnections, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Fetch a single SCM connection
 */
export function useSCMConnection(connectionId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant && connectionId ? buildSCMConnectionEndpoint(connectionId) : null;

  return useSWR<SCMConnection>(key, fetchSCMConnection, {
    ...defaultConfig,
    ...config,
  });
}

/**
 * Create a new SCM connection
 */
export function useCreateSCMConnection() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? buildSCMConnectionsEndpoint() : null,
    async (url: string, { arg }: { arg: CreateSCMConnectionInput }) => {
      return post<SCMConnection>(url, arg);
    }
  );
}

/**
 * Delete an SCM connection
 */
export function useDeleteSCMConnection(connectionId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && connectionId ? buildSCMConnectionEndpoint(connectionId) : null,
    async (url: string) => {
      return del<void>(url);
    }
  );
}

/**
 * Validate an SCM connection
 */
export function useValidateSCMConnection(connectionId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && connectionId ? `${buildSCMConnectionEndpoint(connectionId)}/validate` : null,
    async (url: string) => {
      return post<SCMConnection>(url, {});
    }
  );
}

// ============================================
// IMPORT HOOKS
// ============================================

/**
 * Preview import results before actually importing
 */
export function useImportPreview() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? buildImportPreviewEndpoint() : null,
    async (url: string, { arg }: { arg: RepositoryImportConfig }) => {
      return post<ImportPreview>(url, arg);
    }
  );
}

/**
 * Start repository import
 */
export function useStartImport() {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant ? buildImportEndpoint() : null,
    async (url: string, { arg }: { arg: RepositoryImportConfig }) => {
      return post<ImportJob>(url, arg);
    }
  );
}

/**
 * Fetch import job status
 */
export function useImportJob(jobId: string | null, config?: SWRConfiguration) {
  const { currentTenant } = useTenant();

  const key = currentTenant && jobId ? buildImportJobEndpoint(jobId) : null;

  return useSWR<ImportJob>(key, fetchImportJob, {
    ...defaultConfig,
    // Poll more frequently for running jobs
    refreshInterval: 5000,
    ...config,
  });
}

/**
 * Cancel an import job
 */
export function useCancelImport(jobId: string) {
  const { currentTenant } = useTenant();

  return useSWRMutation(
    currentTenant && jobId ? `${buildImportJobEndpoint(jobId)}/cancel` : null,
    async (url: string) => {
      return post<ImportJob>(url, {});
    }
  );
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Get cache key for repositories list
 */
export function getRepositoriesKey(filters?: RepositoryFilters) {
  return buildRepositoriesEndpoint(filters);
}

/**
 * Get cache key for single repository
 */
export function getRepositoryKey(assetId: string) {
  return buildRepositoryEndpoint(assetId);
}

/**
 * Get cache key for SCM connections
 */
export function getSCMConnectionsKey() {
  return buildSCMConnectionsEndpoint();
}

/**
 * Invalidate repositories cache
 */
export async function invalidateRepositoriesCache() {
  const { mutate } = await import("swr");
  await mutate(
    (key) => typeof key === "string" && key.includes("/api/v1/assets") && key.includes("type=repository"),
    undefined,
    { revalidate: true }
  );
}

/**
 * Invalidate SCM connections cache
 */
export async function invalidateSCMConnectionsCache() {
  const { mutate } = await import("swr");
  await mutate(
    (key) => typeof key === "string" && key.includes("/api/v1/scm-connections"),
    undefined,
    { revalidate: true }
  );
}
