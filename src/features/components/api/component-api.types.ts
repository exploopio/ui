/**
 * Component API Types
 *
 * Type definitions matching backend API responses
 * These are separate from the richer frontend types
 */

// ============================================
// API Response Types (match backend)
// ============================================

/**
 * Component ecosystem from backend
 */
export type ApiComponentEcosystem =
  | 'npm'
  | 'pypi'
  | 'maven'
  | 'gradle'
  | 'nuget'
  | 'go'
  | 'cargo'
  | 'rubygems'
  | 'composer'
  | 'cocoapods'
  | 'swift'
  | 'pub'
  | 'hex'
  | 'apt'
  | 'yum'
  | 'apk'
  | 'homebrew'
  | 'docker'
  | 'oci'

/**
 * Component dependency type
 */
export type ApiDependencyType = 'direct' | 'transitive' | 'dev' | 'optional' | 'peer'

/**
 * Component status
 */
export type ApiComponentStatus = 'active' | 'deprecated' | 'vulnerable' | 'outdated'

/**
 * Component entity from API
 */
export interface ApiComponent {
  id: string
  tenant_id: string
  project_id: string
  name: string
  version: string
  ecosystem: ApiComponentEcosystem
  package_manager?: string
  namespace?: string
  manifest_file?: string
  manifest_path?: string
  dependency_type: ApiDependencyType
  license?: string
  purl: string
  vulnerability_count: number
  status: ApiComponentStatus
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

export interface ApiComponentListResponse {
  data: ApiComponent[]
  total: number
  page: number
  per_page: number
  total_pages: number
  links?: PaginationLinks
}

// ============================================
// Input Types
// ============================================

export interface CreateComponentInput {
  project_id: string
  name: string
  version: string
  ecosystem: ApiComponentEcosystem
  package_manager?: string
  namespace?: string
  manifest_file?: string
  manifest_path?: string
  dependency_type?: ApiDependencyType
  license?: string
}

export interface UpdateComponentInput {
  version?: string
  package_manager?: string
  namespace?: string
  manifest_file?: string
  manifest_path?: string
  dependency_type?: ApiDependencyType
  license?: string
  status?: ApiComponentStatus
  vulnerability_count?: number
}

// ============================================
// Filter Types
// ============================================

export interface ComponentApiFilters {
  project_id?: string
  name?: string
  ecosystems?: ApiComponentEcosystem[]
  statuses?: ApiComponentStatus[]
  dependency_types?: ApiDependencyType[]
  has_vulnerabilities?: boolean
  licenses?: string[]
  page?: number
  per_page?: number
}
