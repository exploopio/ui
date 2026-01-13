/**
 * API Endpoints
 *
 * Centralized API endpoint definitions for Rediver
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
  AUTH: '/api/v1/auth',
  USERS: '/api/v1/users',
  TENANTS: '/api/v1/tenants',
  INVITATIONS: '/api/v1/invitations',
  ASSETS: '/api/v1/assets',
  VULNERABILITIES: '/api/v1/vulnerabilities',
  DASHBOARD: '/api/v1/dashboard',
  AUDIT_LOGS: '/api/v1/audit-logs',
} as const

// ============================================
// AUTH ENDPOINTS
// ============================================

/**
 * Authentication endpoints
 */
export const authEndpoints = {
  /**
   * Get auth provider info
   */
  info: () => `${API_BASE.AUTH}/info`,

  /**
   * Refresh access token
   */
  refresh: () => `${API_BASE.AUTH}/refresh`,

  /**
   * Exchange refresh token for tenant-scoped access token
   */
  token: () => `${API_BASE.AUTH}/token`,

  /**
   * Logout
   */
  logout: () => `${API_BASE.AUTH}/logout`,

  // ============================================
  // LOCAL AUTH
  // ============================================

  /**
   * Register new user (local auth)
   */
  register: () => `${API_BASE.AUTH}/register`,

  /**
   * Login with email/password (local auth)
   */
  login: () => `${API_BASE.AUTH}/login`,

  /**
   * Verify email with token
   */
  verifyEmail: (token: string) => `${API_BASE.AUTH}/verify-email?token=${token}`,

  /**
   * Resend verification email
   */
  resendVerification: () => `${API_BASE.AUTH}/resend-verification`,

  /**
   * Request password reset
   */
  forgotPassword: () => `${API_BASE.AUTH}/forgot-password`,

  /**
   * Reset password with token
   */
  resetPassword: () => `${API_BASE.AUTH}/reset-password`,

  /**
   * Create first team for new user (uses refresh token)
   */
  createFirstTeam: () => `${API_BASE.AUTH}/create-first-team`,

  // ============================================
  // SOCIAL/OAUTH AUTH
  // ============================================

  /**
   * Get OAuth authorization URL for a provider
   * @param provider - OAuth provider (google, github, microsoft)
   */
  oauthAuthorize: (provider: string) => `${API_BASE.AUTH}/oauth/${provider}/authorize`,

  /**
   * OAuth callback endpoint (handled by backend, redirects to frontend)
   * @param provider - OAuth provider (google, github, microsoft)
   */
  oauthCallback: (provider: string) => `${API_BASE.AUTH}/oauth/${provider}/callback`,
} as const

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * User endpoints
 */
export const userEndpoints = {
  // ============================================
  // CURRENT USER (Profile)
  // ============================================

  /**
   * Get current user's profile
   */
  me: () => `${API_BASE.USERS}/me`,

  /**
   * Update current user's profile
   */
  updateMe: () => `${API_BASE.USERS}/me`,

  /**
   * Update current user's preferences
   */
  updatePreferences: () => `${API_BASE.USERS}/me/preferences`,

  /**
   * Get current user's tenants/teams
   */
  myTenants: () => `${API_BASE.USERS}/me/tenants`,

  // ============================================
  // SESSION MANAGEMENT (Local Auth)
  // ============================================

  /**
   * Change password (authenticated user)
   */
  changePassword: () => `${API_BASE.USERS}/me/change-password`,

  /**
   * List active sessions
   */
  sessions: () => `${API_BASE.USERS}/me/sessions`,

  /**
   * Revoke all sessions except current
   */
  revokeAllSessions: () => `${API_BASE.USERS}/me/sessions`,

  /**
   * Revoke specific session
   */
  revokeSession: (sessionId: string) => `${API_BASE.USERS}/me/sessions/${sessionId}`,

  // ============================================
  // USER MANAGEMENT (Admin)
  // ============================================

  /**
   * List users with filters (admin)
   */
  list: (filters?: UserListFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.USERS}${queryString}`
  },

  /**
   * Get single user by ID (admin)
   */
  get: (userId: string) => `${API_BASE.USERS}/${userId}`,

  /**
   * Create new user (admin)
   */
  create: () => API_BASE.USERS,

  /**
   * Update user by ID (admin)
   */
  update: (userId: string) => `${API_BASE.USERS}/${userId}`,

  /**
   * Delete user by ID (admin)
   */
  delete: (userId: string) => `${API_BASE.USERS}/${userId}`,
} as const

// ============================================
// TENANT ENDPOINTS (Teams)
// ============================================

/**
 * Tenant endpoints (API uses "tenant", UI displays "Team")
 */
export const tenantEndpoints = {
  /**
   * List user's tenants/teams
   */
  list: (filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.TENANTS}${queryString}`
  },

  /**
   * Create a new tenant/team
   */
  create: () => API_BASE.TENANTS,

  /**
   * Get tenant by ID or slug
   */
  get: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}`,

  /**
   * Update tenant
   */
  update: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}`,

  /**
   * Delete tenant
   */
  delete: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}`,

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  /**
   * List tenant members
   */
  members: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}/members`,

  /**
   * Get member statistics
   */
  memberStats: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}/members/stats`,

  /**
   * Add member to tenant
   */
  addMember: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}/members`,

  /**
   * Update member (alias for updateMemberRole)
   */
  updateMember: (tenantIdOrSlug: string, memberId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/members/${memberId}`,

  /**
   * Update member role
   */
  updateMemberRole: (tenantIdOrSlug: string, memberId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/members/${memberId}`,

  /**
   * Remove member from tenant
   */
  removeMember: (tenantIdOrSlug: string, memberId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/members/${memberId}`,

  // ============================================
  // INVITATION MANAGEMENT
  // ============================================

  /**
   * List tenant invitations
   */
  invitations: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}/invitations`,

  /**
   * Create invitation
   */
  createInvitation: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}/invitations`,

  /**
   * Delete invitation
   */
  deleteInvitation: (tenantIdOrSlug: string, invitationId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/invitations/${invitationId}`,

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  /**
   * Get tenant settings
   */
  settings: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}/settings`,

  /**
   * Update general settings
   */
  updateGeneralSettings: (tenantIdOrSlug: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/settings/general`,

  /**
   * Update security settings
   */
  updateSecuritySettings: (tenantIdOrSlug: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/settings/security`,

  /**
   * Update API settings
   */
  updateAPISettings: (tenantIdOrSlug: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/settings/api`,

  /**
   * Update branding settings
   */
  updateBrandingSettings: (tenantIdOrSlug: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/settings/branding`,
} as const

// ============================================
// INVITATION ENDPOINTS (Public)
// ============================================

/**
 * Invitation endpoints for accepting invitations
 */
export const invitationEndpoints = {
  /**
   * Get invitation details by token
   */
  get: (token: string) => `${API_BASE.INVITATIONS}/${token}`,

  /**
   * Accept invitation
   */
  accept: (token: string) => `${API_BASE.INVITATIONS}/${token}/accept`,
} as const

// ============================================
// ASSET ENDPOINTS (Global)
// ============================================

/**
 * Asset endpoints (global resources)
 */
export const assetEndpoints = {
  /**
   * List assets
   */
  list: (filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.ASSETS}${queryString}`
  },

  /**
   * Get asset by ID
   */
  get: (assetId: string) => `${API_BASE.ASSETS}/${assetId}`,

  /**
   * Create asset (admin only)
   */
  create: () => API_BASE.ASSETS,

  /**
   * Update asset (admin only)
   */
  update: (assetId: string) => `${API_BASE.ASSETS}/${assetId}`,

  /**
   * Delete asset (admin only)
   */
  delete: (assetId: string) => `${API_BASE.ASSETS}/${assetId}`,
} as const

// ============================================
// PROJECT ENDPOINTS (Tenant-scoped)
// ============================================

/**
 * Project endpoints (tenant-scoped repositories/code projects)
 */
export const projectEndpoints = {
  /**
   * List projects in tenant
   */
  list: (tenantIdOrSlug: string, filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.TENANTS}/${tenantIdOrSlug}/projects${queryString}`
  },

  /**
   * Get project by ID
   */
  get: (tenantIdOrSlug: string, projectId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/projects/${projectId}`,

  /**
   * Create project (member+ role)
   */
  create: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}/projects`,

  /**
   * Update project (member+ role)
   */
  update: (tenantIdOrSlug: string, projectId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/projects/${projectId}`,

  /**
   * Delete project (admin+ role)
   */
  delete: (tenantIdOrSlug: string, projectId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/projects/${projectId}`,
} as const

// ============================================
// COMPONENT ENDPOINTS (Tenant-scoped)
// ============================================

/**
 * Component endpoints (tenant-scoped dependencies/packages)
 */
export const componentEndpoints = {
  /**
   * List components in tenant
   */
  list: (tenantIdOrSlug: string, filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.TENANTS}/${tenantIdOrSlug}/components${queryString}`
  },

  /**
   * Get component by ID
   */
  get: (tenantIdOrSlug: string, componentId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/components/${componentId}`,

  /**
   * Create component (member+ role)
   */
  create: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}/components`,

  /**
   * Update component (member+ role)
   */
  update: (tenantIdOrSlug: string, componentId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/components/${componentId}`,

  /**
   * Delete component (admin+ role)
   */
  delete: (tenantIdOrSlug: string, componentId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/components/${componentId}`,

  /**
   * List components by project
   */
  listByProject: (tenantIdOrSlug: string, projectId: string, filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.TENANTS}/${tenantIdOrSlug}/projects/${projectId}/components${queryString}`
  },
} as const

// ============================================
// VULNERABILITY ENDPOINTS (Global CVE database)
// ============================================

/**
 * Vulnerability endpoints (global CVE database)
 */
export const vulnerabilityEndpoints = {
  /**
   * List vulnerabilities
   */
  list: (filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.VULNERABILITIES}${queryString}`
  },

  /**
   * Get vulnerability by ID
   */
  get: (vulnId: string) => `${API_BASE.VULNERABILITIES}/${vulnId}`,

  /**
   * Get vulnerability by CVE ID
   */
  getByCVE: (cveId: string) => `${API_BASE.VULNERABILITIES}/cve/${cveId}`,

  /**
   * Create vulnerability (admin only)
   */
  create: () => API_BASE.VULNERABILITIES,

  /**
   * Update vulnerability (admin only)
   */
  update: (vulnId: string) => `${API_BASE.VULNERABILITIES}/${vulnId}`,

  /**
   * Delete vulnerability (admin only)
   */
  delete: (vulnId: string) => `${API_BASE.VULNERABILITIES}/${vulnId}`,
} as const

// ============================================
// FINDING ENDPOINTS (Tenant-scoped)
// ============================================

/**
 * Finding endpoints (tenant-scoped vulnerability instances)
 */
export const findingEndpoints = {
  /**
   * List findings in tenant
   */
  list: (tenantIdOrSlug: string, filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.TENANTS}/${tenantIdOrSlug}/findings${queryString}`
  },

  /**
   * Get finding by ID
   */
  get: (tenantIdOrSlug: string, findingId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/findings/${findingId}`,

  /**
   * Create finding (member+ role)
   */
  create: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}/findings`,

  /**
   * Update finding status (member+ role)
   */
  updateStatus: (tenantIdOrSlug: string, findingId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/findings/${findingId}/status`,

  /**
   * Delete finding (admin+ role)
   */
  delete: (tenantIdOrSlug: string, findingId: string) =>
    `${API_BASE.TENANTS}/${tenantIdOrSlug}/findings/${findingId}`,

  /**
   * List findings by project
   */
  listByProject: (tenantIdOrSlug: string, projectId: string, filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.TENANTS}/${tenantIdOrSlug}/projects/${projectId}/findings${queryString}`
  },
} as const

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

/**
 * Dashboard endpoints for aggregated statistics
 */
export const dashboardEndpoints = {
  /**
   * Get global dashboard stats (not tenant-scoped)
   */
  globalStats: () => `${API_BASE.DASHBOARD}/stats`,

  /**
   * Get tenant-scoped dashboard stats
   */
  stats: (tenantIdOrSlug: string) => `${API_BASE.TENANTS}/${tenantIdOrSlug}/dashboard/stats`,
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
// AUDIT LOG ENDPOINTS
// ============================================

/**
 * Audit log endpoints (tenant from JWT token, not URL path)
 * Backend uses /api/v1/audit-logs with tenant extracted from JWT
 */
export const auditLogEndpoints = {
  /**
   * List audit logs with optional filters
   */
  list: (filters?: SearchFilters) => {
    const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : ''
    return `${API_BASE.AUDIT_LOGS}${queryString}`
  },

  /**
   * Get audit log statistics
   */
  stats: () => `${API_BASE.AUDIT_LOGS}/stats`,

  /**
   * Get single audit log by ID
   */
  get: (logId: string) => `${API_BASE.AUDIT_LOGS}/${logId}`,

  /**
   * Get resource audit history
   */
  resourceHistory: (resourceType: string, resourceId: string) =>
    `${API_BASE.AUDIT_LOGS}/resource/${resourceType}/${resourceId}`,

  /**
   * Get user activity
   */
  userActivity: (userId: string) => `${API_BASE.AUDIT_LOGS}/user/${userId}`,
} as const

// ============================================
// ENDPOINT COLLECTIONS
// ============================================

/**
 * All API endpoints grouped by resource
 */
export const endpoints = {
  auth: authEndpoints,
  users: userEndpoints,
  tenants: tenantEndpoints,
  invitations: invitationEndpoints,
  assets: assetEndpoints,
  projects: projectEndpoints,
  components: componentEndpoints,
  vulnerabilities: vulnerabilityEndpoints,
  findings: findingEndpoints,
  dashboard: dashboardEndpoints,
  auditLogs: auditLogEndpoints,
} as const

/**
 * Export individual collections for convenience
 */
export {
  authEndpoints as auth,
  userEndpoints as users,
  tenantEndpoints as tenants,
  invitationEndpoints as invitations,
  assetEndpoints as assets,
  projectEndpoints as projects,
  componentEndpoints as components,
  vulnerabilityEndpoints as vulnerabilities,
  findingEndpoints as findings,
  dashboardEndpoints as dashboard,
  auditLogEndpoints as auditLogs,
}
