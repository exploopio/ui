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
  posts,
  files,
  profile,
  settings,
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
// HOOKS
// ============================================

export {
  // User hooks
  useCurrentUser,
  useUser,
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,

  // Post hooks
  usePosts,
  usePost,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  usePublishPost,

  // File hooks
  useUploadFile,

  // Profile hooks
  useProfile,
  useUpdateProfile,
  useUploadAvatar,

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

  // Post types
  Post,
  CreatePostRequest,
  UpdatePostRequest,

  // File types
  FileUploadResponse,
  UploadProgress,

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
