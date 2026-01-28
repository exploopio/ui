/**
 * Finding API Types
 *
 * Type definitions matching backend API responses for findings
 */

// ============================================
// Common Types
// ============================================

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'none'

/**
 * Finding status - simplified workflow
 *
 * Workflow: new → confirmed → in_progress → resolved
 * Terminal states: false_positive, accepted, duplicate (can reopen to confirmed)
 */
export type FindingStatus =
  | 'new' // Scanner just found it
  | 'confirmed' // Verified as real issue, needs fix
  | 'in_progress' // Developer working on fix
  | 'resolved' // Fix applied - REMEDIATED
  | 'false_positive' // Not a real issue (requires approval)
  | 'accepted' // Risk accepted (requires approval, has expiration)
  | 'duplicate' // Linked to another finding

export type FindingSource =
  | 'sast'
  | 'dast'
  | 'sca'
  | 'secret'
  | 'iac'
  | 'container'
  | 'manual'
  | 'external'

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
  asset?: {
    id: string
    name: string
    type: string
    web_url?: string
  }
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
  is_triaged: boolean // true if status != "new"
  resolution?: string
  resolved_at?: string
  resolved_by?: string
  assigned_to?: string
  assigned_to_user?: {
    id: string
    name: string
    email: string
  }
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

  // Extended fields from SARIF/scanner output
  confidence?: number // 0-100 confidence score
  impact?: string // high/medium/low
  likelihood?: string // high/medium/low
  rank?: number // priority rank score
  vulnerability_class?: string[] // e.g., ["SQL Injection", "Injection"]
  subcategory?: string[] // additional categorization
  baseline_state?: string // new/existing/unchanged
  kind?: string // fail/pass/warning/note
  occurrence_count?: number // number of occurrences
  duplicate_count?: number // number of duplicates
  comments_count?: number // number of comments
  sla_status?: string // on_track/at_risk/breached/not_applicable

  // Security context
  exposure_vector?: string // network/local/adjacent/physical
  is_network_accessible?: boolean // whether accessible from network
  attack_prerequisites?: string // what's needed to exploit
  data_exposure_risk?: string // critical/high/medium/low
  reputational_impact?: boolean // whether has reputational impact
  compliance_impact?: string[] // e.g., ["PCI-DSS", "SOC2", "OWASP"]

  // Remediation context
  remediation_type?: string // patch/config/code/workaround
  estimated_fix_time?: number // minutes
  fix_complexity?: string // simple/moderate/complex
  remedy_available?: boolean // whether fix is available

  // Tracking
  work_item_uris?: string[] // linked issue URLs
  correlation_id?: string // for grouping related findings

  // Technical details
  stacks?: Array<{
    message?: string
    frames?: Array<{
      location?: {
        uri?: string
        startLine?: number
        startColumn?: number
      }
      module?: string
      threadId?: number
    }>
  }>
  related_locations?: Array<{
    id?: number
    physicalLocation?: {
      artifactLocation?: {
        uri?: string
      }
      region?: {
        startLine?: number
        startColumn?: number
      }
    }
    message?: string
  }>
  partial_fingerprints?: Record<string, string>
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
  reason?: string // Optional reason for confirming the finding
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
