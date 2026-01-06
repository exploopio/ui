/**
 * API Endpoints
 *
 * Centralized API endpoint definitions
 * Type-safe URL builders for backend API
 */

import { buildQueryString } from './client'
import type { SearchFilters, UserListFilters } from './types'

// ============================================
// BASE ENDPOINTS
// ============================================

/**
 * API base paths
 */
export const API_BASE = {
  USERS: '/api/users',
  POSTS: '/api/posts',
  FILES: '/api/files',
  AUTH: '/api/auth',
  PROFILE: '/api/profile',
  SETTINGS: '/api/settings',
} as const

// ============================================
// AUTH ENDPOINTS
// ============================================

/**
 * Authentication endpoints
 */
export const authEndpoints = {
  /**
   * Get current user profile
   */
  me: () => `${API_BASE.AUTH}/me`,

  /**
   * Refresh access token
   */
  refresh: () => `${API_BASE.AUTH}/refresh`,

  /**
   * Logout
   */
  logout: () => `${API_BASE.AUTH}/logout`,

  /**
   * Validate token
   */
  validate: () => `${API_BASE.AUTH}/validate`,
} as const

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * User endpoints
 */
export const userEndpoints = {
  /**
   * List users with filters
   */
  list: (filters?: UserListFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.USERS}${queryString}`
  },

  /**
   * Get single user by ID
   */
  get: (userId: string) => `${API_BASE.USERS}/${userId}`,

  /**
   * Create new user
   */
  create: () => API_BASE.USERS,

  /**
   * Update user by ID
   */
  update: (userId: string) => `${API_BASE.USERS}/${userId}`,

  /**
   * Delete user by ID
   */
  delete: (userId: string) => `${API_BASE.USERS}/${userId}`,

  /**
   * Get user's posts
   */
  posts: (userId: string, filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.USERS}/${userId}/posts${queryString}`
  },

  /**
   * Get user's roles
   */
  roles: (userId: string) => `${API_BASE.USERS}/${userId}/roles`,

  /**
   * Update user's roles
   */
  updateRoles: (userId: string) => `${API_BASE.USERS}/${userId}/roles`,
} as const

// ============================================
// POST ENDPOINTS
// ============================================

/**
 * Post endpoints
 */
export const postEndpoints = {
  /**
   * List posts with filters
   */
  list: (filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.POSTS}${queryString}`
  },

  /**
   * Get single post by ID
   */
  get: (postId: string) => `${API_BASE.POSTS}/${postId}`,

  /**
   * Create new post
   */
  create: () => API_BASE.POSTS,

  /**
   * Update post by ID
   */
  update: (postId: string) => `${API_BASE.POSTS}/${postId}`,

  /**
   * Delete post by ID
   */
  delete: (postId: string) => `${API_BASE.POSTS}/${postId}`,

  /**
   * Publish post
   */
  publish: (postId: string) => `${API_BASE.POSTS}/${postId}/publish`,

  /**
   * Unpublish post
   */
  unpublish: (postId: string) => `${API_BASE.POSTS}/${postId}/unpublish`,
} as const

// ============================================
// FILE ENDPOINTS
// ============================================

/**
 * File endpoints
 */
export const fileEndpoints = {
  /**
   * Upload file
   */
  upload: () => `${API_BASE.FILES}/upload`,

  /**
   * Get file by ID
   */
  get: (fileId: string) => `${API_BASE.FILES}/${fileId}`,

  /**
   * Delete file by ID
   */
  delete: (fileId: string) => `${API_BASE.FILES}/${fileId}`,

  /**
   * Get file URL
   */
  url: (fileId: string) => `${API_BASE.FILES}/${fileId}/url`,

  /**
   * List files with filters
   */
  list: (filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.FILES}${queryString}`
  },
} as const

// ============================================
// PROFILE ENDPOINTS
// ============================================

/**
 * Profile endpoints (current user)
 */
export const profileEndpoints = {
  /**
   * Get current user's profile
   */
  get: () => API_BASE.PROFILE,

  /**
   * Update current user's profile
   */
  update: () => API_BASE.PROFILE,

  /**
   * Upload avatar
   */
  uploadAvatar: () => `${API_BASE.PROFILE}/avatar`,

  /**
   * Delete avatar
   */
  deleteAvatar: () => `${API_BASE.PROFILE}/avatar`,

  /**
   * Get current user's posts
   */
  posts: (filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.PROFILE}/posts${queryString}`
  },

  /**
   * Change password
   */
  changePassword: () => `${API_BASE.PROFILE}/password`,
} as const

// ============================================
// SETTINGS ENDPOINTS
// ============================================

/**
 * Settings endpoints
 */
export const settingsEndpoints = {
  /**
   * Get all settings
   */
  get: () => API_BASE.SETTINGS,

  /**
   * Update settings
   */
  update: () => API_BASE.SETTINGS,

  /**
   * Get specific setting category
   */
  category: (category: string) => `${API_BASE.SETTINGS}/${category}`,

  /**
   * Update specific setting category
   */
  updateCategory: (category: string) => `${API_BASE.SETTINGS}/${category}`,
} as const

// ============================================
// UTILITIES
// ============================================

/**
 * Build paginated endpoint
 */
export function buildPaginatedEndpoint(
  baseUrl: string,
  page: number = 1,
  pageSize: number = 10
): string {
  return `${baseUrl}${buildQueryString({ page, pageSize })}`
}

/**
 * Build search endpoint
 */
export function buildSearchEndpoint(
  baseUrl: string,
  query: string,
  filters?: Record<string, unknown>
): string {
  return `${baseUrl}${buildQueryString({ query, ...filters })}`
}

/**
 * Build sort endpoint
 */
export function buildSortEndpoint(
  baseUrl: string,
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): string {
  return `${baseUrl}${buildQueryString({ sortBy, sortOrder })}`
}

// ============================================
// ENDPOINT COLLECTIONS
// ============================================

/**
 * All API endpoints grouped by resource
 */
export const endpoints = {
  auth: authEndpoints,
  users: userEndpoints,
  posts: postEndpoints,
  files: fileEndpoints,
  profile: profileEndpoints,
  settings: settingsEndpoints,
} as const

/**
 * Export individual collections for convenience
 */
export {
  authEndpoints as auth,
  userEndpoints as users,
  postEndpoints as posts,
  fileEndpoints as files,
  profileEndpoints as profile,
  settingsEndpoints as settings,
}
