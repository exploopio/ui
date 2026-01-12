/**
 * Project Types
 *
 * Type definitions for projects (repositories/code projects)
 * Aligned with backend API responses
 */

// ============================================
// API Response Types (match backend)
// ============================================

/**
 * Project provider (source code host)
 */
export type ProjectProvider =
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'azure_devops'
  | 'local'
  | 'other'

export const PROJECT_PROVIDER_LABELS: Record<ProjectProvider, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  azure_devops: 'Azure DevOps',
  local: 'Local',
  other: 'Other',
}

/**
 * Project visibility
 */
export type ProjectVisibility = 'public' | 'private' | 'internal'

export const PROJECT_VISIBILITY_LABELS: Record<ProjectVisibility, string> = {
  public: 'Public',
  private: 'Private',
  internal: 'Internal',
}

/**
 * Project status
 */
export type ProjectStatus = 'active' | 'archived' | 'inactive'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  archived: 'Archived',
  inactive: 'Inactive',
}

/**
 * Project entity from API
 */
export interface Project {
  id: string
  tenant_id: string
  name: string
  provider: ProjectProvider
  visibility: ProjectVisibility
  default_branch?: string
  clone_url?: string
  web_url?: string
  language?: string
  description?: string
  stars: number
  status: ProjectStatus
  finding_count: number
  risk_score: number
  scope?: string
  exposure?: string
  last_scanned_at?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ============================================
// List Response Types
// ============================================

export interface PaginationLinks {
  first?: string
  prev?: string
  next?: string
  last?: string
}

export interface ProjectListResponse {
  data: Project[]
  total: number
  page: number
  per_page: number
  total_pages: number
  links?: PaginationLinks
}

// ============================================
// Input Types
// ============================================

export interface CreateProjectInput {
  name: string
  provider: ProjectProvider
  visibility: ProjectVisibility
  default_branch?: string
  clone_url?: string
  web_url?: string
  language?: string
  description?: string
  stars?: number
  tags?: string[]
}

export interface UpdateProjectInput {
  name?: string
  visibility?: ProjectVisibility
  default_branch?: string
  clone_url?: string
  web_url?: string
  language?: string
  description?: string
  stars?: number
  status?: ProjectStatus
  tags?: string[]
}

// ============================================
// Filter Types
// ============================================

export interface ProjectFilters {
  name?: string
  providers?: ProjectProvider[]
  visibilities?: ProjectVisibility[]
  statuses?: ProjectStatus[]
  languages?: string[]
  tags?: string[]
  has_findings?: boolean
  search?: string
  sort?: string
  page?: number
  per_page?: number
}

// ============================================
// Stats Types
// ============================================

export interface ProjectStats {
  total: number
  by_provider: Record<ProjectProvider, number>
  by_status: Record<ProjectStatus, number>
  by_visibility: Record<ProjectVisibility, number>
  with_findings: number
  avg_risk_score: number
}
