/**
 * Finding API Types
 *
 * Type definitions matching backend API responses for findings
 */

// ============================================
// Common Types
// ============================================

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type FindingStatus = 'open' | 'confirmed' | 'in_progress' | 'resolved' | 'false_positive' | 'accepted' | 'wont_fix'

export type FindingSource = 'sast' | 'dast' | 'sca' | 'secret' | 'iac' | 'container' | 'manual' | 'external'

// ============================================
// API Response Types
// ============================================

/**
 * Finding entity from API
 */
export interface ApiFinding {
  id: string
  tenant_id: string
  vulnerability_id?: string
  asset_id: string
  component_id?: string
  source: FindingSource
  tool_name: string
  tool_version?: string
  rule_id?: string
  file_path?: string
  start_line?: number
  end_line?: number
  start_column?: number
  end_column?: number
  snippet?: string
  message: string
  severity: Severity
  status: FindingStatus
  resolution?: string
  resolved_at?: string
  resolved_by?: string
  scan_id?: string
  fingerprint: string
  location?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

/**
 * Vulnerability entity from API (global CVE database)
 */
export interface ApiVulnerability {
  id: string
  cve_id: string
  aliases?: string[]
  title: string
  description?: string
  severity: Severity
  cvss_score?: number
  cvss_vector?: string
  epss_score?: number
  epss_percentile?: number
  cisa_kev?: {
    date_added: string
    due_date: string
    ransomware_use?: string
    notes?: string
    is_past_due: boolean
  }
  exploit_available: boolean
  exploit_maturity: string
  references?: Array<{
    type: string
    url: string
  }>
  affected_versions?: Array<{
    ecosystem: string
    package: string
    introduced?: string
    fixed?: string
  }>
  fixed_versions?: string[]
  remediation?: string
  published_at?: string
  modified_at?: string
  status: string
  risk_score: number
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

export interface ApiFindingListResponse {
  data: ApiFinding[]
  total: number
  page: number
  per_page: number
  total_pages: number
  links?: PaginationLinks
}

export interface ApiVulnerabilityListResponse {
  data: ApiVulnerability[]
  total: number
  page: number
  per_page: number
  total_pages: number
  links?: PaginationLinks
}

// ============================================
// Input Types
// ============================================

export interface CreateFindingInput {
  asset_id: string
  vulnerability_id?: string
  component_id?: string
  source: FindingSource
  tool_name: string
  tool_version?: string
  rule_id?: string
  file_path?: string
  start_line?: number
  end_line?: number
  start_column?: number
  end_column?: number
  snippet?: string
  message: string
  severity: Severity
  scan_id?: string
}

export interface UpdateFindingStatusInput {
  status: FindingStatus
  resolution?: string
  resolved_by?: string
}

// ============================================
// Filter Types
// ============================================

export interface FindingApiFilters {
  asset_id?: string
  component_id?: string
  vulnerability_id?: string
  severities?: Severity[]
  statuses?: FindingStatus[]
  sources?: FindingSource[]
  tool_name?: string
  rule_id?: string
  scan_id?: string
  file_path?: string
  page?: number
  per_page?: number
}

export interface VulnerabilityApiFilters {
  cve_ids?: string[]
  severities?: Severity[]
  exploit_available?: boolean
  cisa_kev_only?: boolean
  statuses?: string[]
  min_cvss?: number
  max_cvss?: number
  min_epss?: number
  page?: number
  per_page?: number
}

// ============================================
// Stats Types
// ============================================

export interface FindingStats {
  total: number
  by_severity: Record<Severity, number>
  by_status: Record<FindingStatus, number>
  by_source: Record<FindingSource, number>
  open_count: number
  resolved_count: number
}
