/**
 * API Module
 *
 * Centralized exports for API client, hooks, types, and utilities
 *
 * @example
 * ```typescript
 * // Import API client
 * import { apiClient, get, post } from '@/lib/api'
 *
 * // Import hooks
 * import { useUsers, useCreateUser } from '@/lib/api'
 *
 * // Import security platform hooks
 * import { useAssets, useFindings, useScans } from '@/lib/api'
 *
 * // Import endpoints
 * import { endpoints, securityEndpoints } from '@/lib/api'
 *
 * // Import types
 * import type { User, ApiResponse } from '@/lib/api'
 * ```
 */

// ============================================
// CLIENT
// ============================================

export {
  apiClient,
  get,
  post,
  put,
  patch,
  del,
  uploadFile,
  buildQueryString,
  isAuthenticated,
  getApiBaseUrl,
} from './client'

// ============================================
// ENDPOINTS
// ============================================

export {
  endpoints,
  auth,
  users,
  tenants,
  invitations,
  assets,
  projects,
  components,
  vulnerabilities,
  findings,
  API_BASE,
  buildPaginatedEndpoint,
  buildSearchEndpoint,
  buildSortEndpoint,
} from './endpoints'

// ============================================
// ERROR HANDLING
// ============================================

export {
  ApiClientError,
  handleApiError,
  isRetryableError,
  getRetryDelay,
  retryWithBackoff,
  extractValidationErrors,
} from './error-handler'

// ============================================
// HOOKS (Base)
// ============================================

export {
  // Current user hooks
  useCurrentUser,
  useUpdateCurrentUser,

  // User management hooks (admin)
  useUser,
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,

  // Tenant hooks (base)
  useTenants,
  useTenant,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  useTenantMembers,

  // Vulnerability hooks
  useVulnerabilities,
  useVulnerability,
  useVulnerabilityByCVE,

  // Utilities
  mutateMultiple,
  clearAllCache,
  optimisticUpdate,
  useInfiniteUsers,
  useDependentData,
  usePolling,

  // Config
  defaultSwrConfig,
} from './hooks'

// ============================================
// TYPES
// ============================================

export type {
  // Common types
  ApiResponse,
  ApiError,
  ApiRequestOptions,
  PaginatedResponse,

  // User types
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListFilters,

  // Tenant types
  Tenant,
  TenantMember,
  TenantInvitation,

  // Vulnerability types
  Vulnerability,
  Finding,

  // Component types
  Component,

  // Asset types
  Asset,

  // Validation types
  ValidationError,
  ValidationErrorResponse,

  // Search types
  SearchFilters,
  SortOptions,

  // Utility types
  UnwrapApiResponse,
  PartialExcept,
  AuthenticatedRequest,
} from './types'

// ============================================
// SECURITY PLATFORM ENDPOINTS
// ============================================

export {
  securityEndpoints,
  assetEndpoints,
  assetGroupEndpoints,
  componentEndpoints,
  findingEndpoints,
  scanEndpoints,
  runnerEndpoints,
  credentialEndpoints,
  pentestEndpoints,
  remediationEndpoints,
  analyticsEndpoints,
  reportEndpoints,
  integrationEndpoints,
  SECURITY_API_BASE,
} from './security-endpoints'

export type {
  PaginationParams,
  AssetFilters,
  FindingFilters,
  ComponentFilters,
  ScanFilters,
} from './security-endpoints'

// ============================================
// PROJECT ENDPOINTS & HOOKS
// ============================================

export { projectEndpoints } from './project-endpoints'

export {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  getProjectsListKey,
  getProjectKey,
  invalidateProjectsCache,
  defaultProjectSwrConfig,
} from './project-hooks'

export type {
  Project,
  ProjectProvider,
  ProjectVisibility,
  ProjectStatus,
  ProjectScope,
  ProjectExposure,
  ProjectListResponse,
  ProjectFilters,
  CreateProjectRequest,
  UpdateProjectRequest,
} from './project-types'

// ============================================
// USER TENANT MEMBERSHIP
// ============================================

export {
  useMyTenants,
  getMyTenantsKey,
  invalidateMyTenantsCache,
} from './user-tenant-hooks'

export type {
  TenantMembership,
  TenantPlan,
  TenantRole,
} from './user-tenant-types'

export {
  RolePermissions,
  RoleLabels,
  RoleColors,
} from './user-tenant-types'

// ============================================
// SECURITY PLATFORM HOOKS
// ============================================

export {
  // Asset hooks
  useAssets,
  useAssetsByType,
  useAsset,
  useAssetStats,
  useAssetRelationships,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,

  // Asset group hooks
  useAssetGroups,
  useAssetGroup,
  useAssetGroupStats,
  useCreateAssetGroup,
  useUpdateAssetGroup,
  useDeleteAssetGroup,

  // Component (SBOM) hooks
  useComponents,
  useComponent,
  useVulnerableComponents,
  useComponentsByEcosystem,
  useComponentStats,
  useEcosystemStats,
  useLicenseStats,

  // Finding hooks
  useFindings,
  useFinding,
  useFindingStats,
  useFindingsBySeverity,
  useCreateFinding,
  useUpdateFinding,
  useUpdateFindingStatus,
  useAssignFinding,

  // Scan hooks
  useScans,
  useScan,
  useScanStats,
  useScanResults,
  useStartScan,
  useStopScan,

  // Runner hooks
  useRunners,
  useRunner,
  useRunnerStats,
  useCreateRunner,
  useDeleteRunner,

  // Credential leak hooks
  useCredentialLeaks,
  useCredentialLeak,
  useCredentialStats,

  // Remediation hooks
  useRemediationTasks,
  useRemediationTask,
  useRemediationStats,
  useOverdueTasks,
  usePriorityTasks,
  useCreateRemediationTask,
  useUpdateRemediationTask,

  // Pentest hooks
  usePentestCampaigns,
  usePentestCampaign,
  usePentestCampaignStats,
  usePentestFindings,
  usePentestFindingStats,
  usePentestRetests,
  usePentestReports,
  usePentestTemplates,

  // Analytics hooks
  useDashboardAnalytics,
  useRiskTrend,
  useFindingTrend,
  useCoverageAnalytics,
  useMTTRAnalytics,

  // Report hooks
  useReports,
  useReport,
  useGenerateReport,

  // Integration hooks
  useIntegrations,
  useIntegration,
  useIntegrationTypes,
  useCreateIntegration,
  useTestIntegration,
} from './security-hooks'

// ============================================
// FINDING HOOKS (with typed responses)
// ============================================

export {
  // Finding list/detail hooks
  useFindings as useFindingsTyped,
  useAssetFindings,
  useFinding as useFindingTyped,
  useFindingComments,

  // Finding mutation hooks
  useCreateFinding as useCreateFindingTyped,
  useUpdateFindingStatus as useUpdateFindingStatusTyped,
  useDeleteFinding as useDeleteFindingTyped,
  useAddFindingComment,
  useDeleteFindingComment,

  // Cache utilities
  findingKeys,
  invalidateFindingsCache,
  invalidateAssetFindingsCache,
} from './finding-hooks'

export type {
  Finding as FindingTyped,
  FindingSeverity,
  FindingStatus,
  FindingSource,
  FindingListFilters,
  FindingListResponse,
  CreateFindingRequest,
  UpdateFindingStatusRequest,
  FindingComment,
  AddCommentRequest,
  FindingStats,
} from './finding-types'

export {
  SEVERITY_CONFIG,
  STATUS_CONFIG,
  SOURCE_CONFIG,
} from './finding-types'
