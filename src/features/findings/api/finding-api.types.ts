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
  branch_id?: string
  component_id?: string
  source: FindingSource
  tool_name: string
  tool_version?: string
  rule_id?: string
  rule_name?: string
  file_path?: string
  start_line?: number
  end_line?: number
  start_column?: number
  end_column?: number
  snippet?: string
  title?: string
  description?: string
  message: string
  recommendation?: string
  severity: Severity
  cvss_score?: number
  cvss_vector?: string
  cve_id?: string
  cwe_ids?: string[]
  owasp_ids?: string[]
  tags?: string[]
  status: FindingStatus
  resolution?: string
  resolved_at?: string
  resolved_by?: string
  triage_status?: string
  triage_reason?: string
  assigned_to?: string
  assigned_at?: string
  assigned_by?: string
  first_detected_at?: string
  last_seen_at?: string
  first_detected_branch?: string
  first_detected_commit?: string
  last_seen_branch?: string
  last_seen_commit?: string
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

export interface UpdateFindingSeverityInput {
  severity: Severity
  cvss_score?: number
  cvss_vector?: string
}

export interface AssignFindingInput {
  user_id: string
  comment?: string
}

export interface TriageFindingInput {
  triage_status: 'accepted' | 'rejected' | 'deferred'
  triage_reason?: string
}

export interface ClassifyFindingInput {
  cve_id?: string
  cwe_ids?: string[]
  owasp_ids?: string[]
  cvss_score?: number
  cvss_vector?: string
}

export interface SetFindingTagsInput {
  tags: string[]
}

// ============================================
// Comment Types
// ============================================

export interface ApiFindingComment {
  id: string
  finding_id: string
  author_id: string
  author_name?: string
  author_email?: string
  content: string
  is_status_change: boolean
  old_status?: FindingStatus
  new_status?: FindingStatus
  created_at: string
  updated_at?: string
}

export interface ApiFindingCommentListResponse {
  data: ApiFindingComment[]
  total: number
}

export interface AddCommentInput {
  content: string
}

export interface UpdateCommentInput {
  content: string
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
  source_id?: string // Agent/Source ID that created the finding
  tool_name?: string
  rule_id?: string
  scan_id?: string
  file_path?: string
  search?: string
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

export interface FindingStatsResponse {
  total: number
  by_severity: Record<string, number>
  by_status: Record<string, number>
  by_source: Record<string, number>
  open_count: number
  resolved_count: number
}

