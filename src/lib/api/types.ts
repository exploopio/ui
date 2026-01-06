/**
 * API Types & Interfaces
 *
 * Type definitions for API requests and responses
 */

// ============================================
// COMMON TYPES
// ============================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

/**
 * API error structure
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  statusCode?: number
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * API request options
 */
export interface ApiRequestOptions extends RequestInit {
  /**
   * Skip auth header injection
   */
  skipAuth?: boolean

  /**
   * Custom base URL (override default)
   */
  baseUrl?: string

  /**
   * Request timeout in milliseconds
   */
  timeout?: number

  /**
   * Retry failed requests
   */
  retry?: {
    count: number
    delay: number
  }
}

// ============================================
// USER TYPES
// ============================================

/**
 * User entity from backend
 */
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  roles: string[]
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string
  name: string
  password: string
  roles?: string[]
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  name?: string
  avatar?: string
  roles?: string[]
}

/**
 * User list filters
 */
export interface UserListFilters {
  page?: number
  pageSize?: number
  search?: string
  role?: string
  sortBy?: 'name' | 'email' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// ============================================
// POST TYPES (Example)
// ============================================

/**
 * Post entity from backend
 */
export interface Post {
  id: string
  title: string
  content: string
  author: User
  createdAt: string
  updatedAt: string
  published: boolean
}

/**
 * Create post request
 */
export interface CreatePostRequest {
  title: string
  content: string
  published?: boolean
}

/**
 * Update post request
 */
export interface UpdatePostRequest {
  title?: string
  content?: string
  published?: boolean
}

// ============================================
// FILE UPLOAD TYPES
// ============================================

/**
 * File upload response
 */
export interface FileUploadResponse {
  id: string
  url: string
  filename: string
  size: number
  mimeType: string
  createdAt: string
}

/**
 * File upload progress
 */
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// ============================================
// VALIDATION TYPES
// ============================================

/**
 * Validation error from backend
 */
export interface ValidationError {
  field: string
  message: string
  code: string
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse {
  errors: ValidationError[]
  message: string
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

/**
 * Common search filters
 */
export interface SearchFilters {
  query?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

/**
 * Sort options
 */
export interface SortOptions {
  field: string
  order: 'asc' | 'desc'
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Extract data type from ApiResponse
 */
export type UnwrapApiResponse<T> = T extends ApiResponse<infer U> ? U : never

/**
 * Make all properties optional except specified
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Request with required auth
 */
export type AuthenticatedRequest<T = unknown> = T & {
  userId: string
}
