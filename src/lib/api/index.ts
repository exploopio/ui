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
 * // Import endpoints
 * import { endpoints } from '@/lib/api'
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
