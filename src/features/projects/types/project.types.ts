/**
 * Project Types
 *
 * Comprehensive type definitions for Git project management in CTEM platform
 * Based on best practices from Semgrep, Black Duck, Checkmarx, Snyk
 */

// ============================================
// Enums & Constants
// ============================================

/**
 * SCM Provider (Source Code Management)
 */
export type SCMProvider =
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'azure_devops'
  | 'codecommit'
  | 'local'

export const SCM_PROVIDER_LABELS: Record<SCMProvider, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  azure_devops: 'Azure DevOps',
  codecommit: 'AWS CodeCommit',
  local: 'Local Repository',
}

export const SCM_PROVIDER_COLORS: Record<SCMProvider, string> = {
  github: 'bg-gray-900 text-white',
  gitlab: 'bg-orange-600 text-white',
  bitbucket: 'bg-blue-600 text-white',
  azure_devops: 'bg-blue-500 text-white',
  codecommit: 'bg-yellow-600 text-white',
  local: 'bg-gray-500 text-white',
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

export const PROJECT_VISIBILITY_COLORS: Record<ProjectVisibility, string> = {
  public: 'text-green-500',
  private: 'text-orange-500',
  internal: 'text-blue-500',
}

/**
 * Project status
 */
export type ProjectStatus = 'active' | 'archived' | 'inactive' | 'importing'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  archived: 'Archived',
  inactive: 'Inactive',
  importing: 'Importing',
}

/**
 * Sync status with SCM
 */
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error' | 'disabled'

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  synced: 'Synced',
  pending: 'Pending',
  syncing: 'Syncing',
  error: 'Sync Error',
  disabled: 'Sync Disabled',
}

/**
 * Compliance status
 */
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'not_assessed' | 'partial'

/**
 * Quality gate status
 */
export type QualityGateStatus = 'passed' | 'failed' | 'warning' | 'not_computed'

/**
 * Scanner types
 */
export type ScannerType = 'sast' | 'sca' | 'secret' | 'iac' | 'container' | 'dast'

export const SCANNER_TYPE_LABELS: Record<ScannerType, string> = {
  sast: 'SAST',
  sca: 'SCA',
  secret: 'Secret Detection',
  iac: 'IaC Security',
  container: 'Container Security',
  dast: 'DAST',
}

/**
 * Severity levels
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

/**
 * Finding status
 */
export type FindingStatus =
  | 'open'
  | 'confirmed'
  | 'in_progress'
  | 'resolved'
  | 'false_positive'
  | 'accepted_risk'

/**
 * Asset criticality
 */
export type Criticality = 'low' | 'medium' | 'high' | 'critical'

/**
 * Asset scope
 */
export type AssetScope = 'internal' | 'external' | 'cloud' | 'partner' | 'vendor' | 'shadow'

/**
 * Asset exposure
 */
export type AssetExposure = 'public' | 'restricted' | 'private' | 'isolated' | 'unknown'

// ============================================
// SCM Connection Types
// ============================================

/**
 * SCM Connection configuration
 */
export interface SCMConnection {
  id: string
  tenant_id: string
  name: string
  provider: SCMProvider

  // Connection details
  base_url: string                    // e.g., https://github.com or self-hosted URL
  api_url?: string                    // API endpoint if different

  // Authentication
  auth_type: 'oauth' | 'pat' | 'app'  // OAuth, Personal Access Token, GitHub App

  // For organization-level connections
  scm_organization?: string           // GitHub org / GitLab group

  // Status
  status: 'connected' | 'disconnected' | 'error'
  last_validated_at?: string
  error_message?: string

  // Permissions
  permissions: SCMPermission[]

  // Metadata
  created_at: string
  updated_at: string
  created_by: string
}

export type SCMPermission =
  | 'repo:read'
  | 'repo:write'
  | 'webhook:manage'
  | 'org:read'
  | 'user:read'

export interface CreateSCMConnectionInput {
  name: string
  provider: SCMProvider
  base_url?: string
  auth_type: 'oauth' | 'pat' | 'app'
  access_token?: string               // For PAT auth
  scm_organization?: string
}

// ============================================
// Project Entity Types
// ============================================

/**
 * Findings summary for a project
 */
export interface FindingsSummary {
  total: number
  by_severity: Record<Severity, number>
  by_status: Record<FindingStatus, number>
  by_type: Record<ScannerType, number>

  // Trends (optional)
  new_last_7_days?: number
  resolved_last_7_days?: number
  trend?: 'increasing' | 'decreasing' | 'stable'
}

/**
 * Components/Dependencies summary
 */
export interface ComponentsSummary {
  total: number
  direct: number
  transitive: number
  vulnerable: number
  outdated: number

  // License info
  license_risk_high: number
  license_risk_medium: number
  unique_licenses: number
}

/**
 * Scan settings for a project
 */
export interface ScanSettings {
  enabled_scanners: ScannerType[]

  // Scheduling
  auto_scan: boolean
  schedule?: string                   // Cron expression
  scan_on_push: boolean
  scan_on_pr: boolean

  // Branch configuration
  branch_patterns: string[]           // Glob patterns, e.g., ["main", "release/*"]
  exclude_patterns: string[]          // Files/folders to exclude

  // Scan behavior
  scan_mode: 'full' | 'incremental'
  fail_on_severity?: Severity[]       // Block PR on these severities

  // Preset/template
  preset_id?: string
}

/**
 * Integration settings
 */
export interface IntegrationSettings {
  jira?: {
    enabled: boolean
    project_key?: string
    issue_type?: string
    auto_create: boolean
  }
  slack?: {
    enabled: boolean
    channel?: string
    notify_on: Severity[]
  }
  teams?: {
    enabled: boolean
    webhook_url?: string
    notify_on: Severity[]
  }
  webhook?: {
    enabled: boolean
    url: string
    events: string[]
  }
}

/**
 * Main Project entity
 */
export interface Project {
  id: string
  tenant_id: string
  organization_id?: string            // For org hierarchy (Snyk-style)

  // === Basic Info ===
  name: string
  description?: string

  // === SCM Integration ===
  scm_connection_id?: string
  scm_provider: SCMProvider
  scm_organization?: string           // GitHub org / GitLab group name
  repo_id?: string                    // External repository ID
  repo_url?: string                   // Clone URL (SSH or HTTPS)
  web_url?: string                    // Browser URL

  // === Repository Info ===
  visibility: ProjectVisibility
  default_branch: string
  protected_branches: string[]
  languages: Record<string, number>   // { "TypeScript": 65.5, "Go": 34.5 }
  primary_language?: string

  // === Repository Stats ===
  stars: number
  forks: number
  open_issues: number
  contributors_count: number
  size_kb: number

  // === Security Metrics (CTEM) ===
  risk_score: number                  // 0-100
  criticality: Criticality
  scope: AssetScope
  exposure: AssetExposure

  // === Finding Statistics ===
  findings_summary: FindingsSummary

  // === Component/SBOM Info ===
  components_summary?: ComponentsSummary
  has_sbom: boolean
  sbom_generated_at?: string

  // === Scan Configuration ===
  scan_settings: ScanSettings

  // === Integration Settings ===
  integrations?: IntegrationSettings

  // === Policy & Compliance ===
  policy_id?: string
  policy_name?: string
  compliance_status: ComplianceStatus
  quality_gate_status: QualityGateStatus

  // === Sync Status ===
  sync_status: SyncStatus
  last_synced_at?: string
  sync_error?: string

  // === Scan Status ===
  status: ProjectStatus
  last_scanned_at?: string
  last_scan_id?: string

  // === Security Features (from SCM) ===
  security_features: {
    has_security_policy: boolean
    branch_protection: boolean
    secret_scanning_enabled: boolean
    dependabot_enabled: boolean
    code_scanning_enabled: boolean
  }

  // === Metadata ===
  tags: string[]
  owner_id?: string
  team_ids: string[]
  group_id?: string                   // Asset group
  group_name?: string

  // === Timestamps ===
  created_at: string
  updated_at: string
  archived_at?: string
}

// ============================================
// Branch Types
// ============================================

export interface Branch {
  name: string
  project_id: string

  is_default: boolean
  is_protected: boolean

  // Scan configuration per branch
  scan_on_push: boolean
  scan_on_pr: boolean

  // Latest commit info
  last_commit_sha?: string
  last_commit_message?: string
  last_commit_author?: string
  last_commit_at?: string

  // Scan info
  last_scan_id?: string
  last_scanned_at?: string
  findings_count: number

  // Data retention
  keep_when_inactive: boolean
  retention_days?: number
}

export interface BranchConfig {
  name: string
  is_protected: boolean
  scan_on_push: boolean
  scan_on_pr: boolean
  keep_when_inactive: boolean
  retention_days?: number
}

// ============================================
// Import Types (Semgrep Managed Scans style)
// ============================================

export type ImportMode = 'all' | 'selected' | 'pattern'

export interface ProjectImportConfig {
  scm_connection_id: string
  import_mode: ImportMode

  // For 'selected' mode
  selected_repos?: string[]           // List of repo full names

  // For 'pattern' mode
  include_patterns?: string[]         // ["org/*", "team-*/*"]
  exclude_patterns?: string[]         // ["*-archived", "fork-*"]

  // Filter options
  visibility_filter?: ProjectVisibility[]
  language_filter?: string[]
  min_stars?: number
  exclude_forks?: boolean
  exclude_archived?: boolean

  // Auto-sync settings
  auto_sync: boolean
  sync_interval?: 'hourly' | 'daily' | 'weekly'

  // Default settings for imported projects
  default_scan_settings?: Partial<ScanSettings>
  default_policy_id?: string
  default_criticality?: Criticality
  default_tags?: string[]
  auto_assign_team?: string
  auto_assign_group?: string
}

export interface ImportPreview {
  total_found: number
  will_import: number
  already_imported: number
  excluded: number

  repositories: ImportPreviewItem[]
}

export interface ImportPreviewItem {
  repo_id: string
  full_name: string                   // org/repo-name
  name: string
  visibility: ProjectVisibility
  default_branch: string
  language?: string
  stars: number
  updated_at: string

  // Import status
  status: 'new' | 'exists' | 'excluded'
  exclude_reason?: string
}

export interface ImportJob {
  id: string
  tenant_id: string
  scm_connection_id: string

  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number                    // 0-100

  total_repos: number
  imported_count: number
  failed_count: number
  skipped_count: number

  errors: ImportError[]

  started_at?: string
  completed_at?: string
  created_at: string
}

export interface ImportError {
  repo_name: string
  error: string
}

// ============================================
// API Response Types
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
  description?: string

  // SCM connection (optional - for manual creation)
  scm_connection_id?: string
  scm_provider: SCMProvider
  scm_organization?: string
  repo_url?: string
  web_url?: string

  // Basic info
  visibility: ProjectVisibility
  default_branch?: string
  primary_language?: string

  // Classification
  criticality?: Criticality
  scope?: AssetScope
  exposure?: AssetExposure

  // Scan settings
  scan_settings?: Partial<ScanSettings>

  // Organization
  tags?: string[]
  group_id?: string
  team_ids?: string[]
  policy_id?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string

  visibility?: ProjectVisibility
  default_branch?: string

  // Classification
  criticality?: Criticality
  scope?: AssetScope
  exposure?: AssetExposure

  // Scan settings
  scan_settings?: Partial<ScanSettings>

  // Integration settings
  integrations?: Partial<IntegrationSettings>

  // Organization
  status?: ProjectStatus
  tags?: string[]
  group_id?: string
  team_ids?: string[]
  owner_id?: string
  policy_id?: string
}

// ============================================
// Filter Types
// ============================================

export interface ProjectFilters {
  // Text search
  search?: string
  name?: string

  // SCM filters
  scm_providers?: SCMProvider[]
  scm_connection_ids?: string[]
  scm_organizations?: string[]

  // Status filters
  visibilities?: ProjectVisibility[]
  statuses?: ProjectStatus[]
  sync_statuses?: SyncStatus[]
  compliance_statuses?: ComplianceStatus[]
  quality_gate_statuses?: QualityGateStatus[]

  // Classification filters
  criticalities?: Criticality[]
  scopes?: AssetScope[]
  exposures?: AssetExposure[]

  // Other filters
  languages?: string[]
  tags?: string[]
  group_ids?: string[]
  team_ids?: string[]
  policy_ids?: string[]

  // Finding filters
  has_findings?: boolean
  has_critical_findings?: boolean
  min_risk_score?: number
  max_risk_score?: number

  // Date filters
  last_scanned_after?: string
  last_scanned_before?: string
  created_after?: string
  created_before?: string

  // Pagination & sorting
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

// ============================================
// Stats Types
// ============================================

export interface ProjectStats {
  total: number

  by_provider: Record<SCMProvider, number>
  by_status: Record<ProjectStatus, number>
  by_visibility: Record<ProjectVisibility, number>
  by_criticality: Record<Criticality, number>
  by_compliance: Record<ComplianceStatus, number>
  by_quality_gate: Record<QualityGateStatus, number>

  // Security metrics
  with_findings: number
  with_critical_findings: number
  avg_risk_score: number
  total_findings: number

  // Component metrics
  total_components: number
  vulnerable_components: number

  // Sync metrics
  synced: number
  sync_errors: number

  // Coverage
  scanned_last_24h: number
  scanned_last_7d: number
  never_scanned: number
}

// ============================================
// Scan Types
// ============================================

export interface ProjectScan {
  id: string
  project_id: string

  // Scan info
  branch: string
  commit_sha?: string
  commit_message?: string

  // Scan type
  trigger: 'manual' | 'scheduled' | 'push' | 'pr' | 'api'
  scan_mode: 'full' | 'diff' | 'incremental'
  scanners: ScannerType[]

  // Status
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number

  // Results
  findings_new: number
  findings_fixed: number
  findings_total: number

  // Quality gate
  quality_gate_passed?: boolean

  // Timing
  queued_at: string
  started_at?: string
  completed_at?: string
  duration_seconds?: number

  // Error info
  error_message?: string
}

export interface TriggerScanInput {
  branch?: string                     // Defaults to default_branch
  scan_mode?: 'full' | 'diff'
  scanners?: ScannerType[]
  base_branch?: string                // For diff mode
}

// ============================================
// Extended Branch Types (with findings tracking)
// ============================================

export type BranchType = 'main' | 'develop' | 'feature' | 'release' | 'hotfix' | 'other'

export type BranchStatus = 'passed' | 'failed' | 'warning' | 'scanning' | 'not_scanned'

export const BRANCH_STATUS_LABELS: Record<BranchStatus, string> = {
  passed: 'Passed',
  failed: 'Failed',
  warning: 'Warning',
  scanning: 'Scanning',
  not_scanned: 'Not Scanned',
}

export const BRANCH_STATUS_COLORS: Record<BranchStatus, string> = {
  passed: 'text-green-500 bg-green-500/10 border-green-500/20',
  failed: 'text-red-500 bg-red-500/10 border-red-500/20',
  warning: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  scanning: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  not_scanned: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
}

/**
 * Extended Branch with full security info
 */
export interface BranchDetail {
  id: string
  project_id: string
  name: string
  type: BranchType

  is_default: boolean
  is_protected: boolean

  // Latest commit info
  last_commit_sha?: string
  last_commit_message?: string
  last_commit_author?: string
  last_commit_author_avatar?: string
  last_commit_at?: string

  // Scan info
  last_scan_id?: string
  last_scanned_at?: string
  scan_status: BranchStatus

  // Quality gate
  quality_gate_status: QualityGateStatus

  // Findings summary for this branch
  findings_summary: FindingsSummary

  // Comparison with default branch
  compared_to_default?: {
    new_findings: number
    resolved_findings: number
    unchanged_findings: number
  }

  // Configuration
  scan_on_push: boolean
  scan_on_pr: boolean

  created_at: string
  updated_at: string
}

/**
 * Branch comparison result
 */
export interface BranchComparison {
  from_branch: string
  to_branch: string

  new_findings: FindingDetail[]
  resolved_findings: FindingDetail[]
  unchanged_findings: number

  summary: {
    new: Record<Severity, number>
    resolved: Record<Severity, number>
  }
}

// ============================================
// Finding Entity Types
// ============================================

export type TriageStatus =
  | 'needs_triage'
  | 'confirmed'
  | 'false_positive'
  | 'wont_fix'
  | 'duplicate'

export const TRIAGE_STATUS_LABELS: Record<TriageStatus, string> = {
  needs_triage: 'Needs Triage',
  confirmed: 'Confirmed',
  false_positive: 'False Positive',
  wont_fix: "Won't Fix",
  duplicate: 'Duplicate',
}

export const TRIAGE_STATUS_COLORS: Record<TriageStatus, string> = {
  needs_triage: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  confirmed: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  false_positive: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  wont_fix: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  duplicate: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
}

export type SLAStatus = 'on_track' | 'warning' | 'overdue' | 'exceeded' | 'not_applicable'

export const SLA_STATUS_LABELS: Record<SLAStatus, string> = {
  on_track: 'On Track',
  warning: 'Warning',
  overdue: 'Overdue',
  exceeded: 'SLA Exceeded',
  not_applicable: 'N/A',
}

export const SLA_STATUS_COLORS: Record<SLAStatus, string> = {
  on_track: 'text-green-500',
  warning: 'text-yellow-500',
  overdue: 'text-orange-500',
  exceeded: 'text-red-500',
  not_applicable: 'text-gray-500',
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'text-red-500 bg-red-500/10 border-red-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  info: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
}

export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  open: 'Open',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  false_positive: 'False Positive',
  accepted_risk: 'Accepted Risk',
}

export const FINDING_STATUS_COLORS: Record<FindingStatus, string> = {
  open: 'text-red-500 bg-red-500/10 border-red-500/20',
  confirmed: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  in_progress: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  resolved: 'text-green-500 bg-green-500/10 border-green-500/20',
  false_positive: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  accepted_risk: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
}

/**
 * Full Finding entity
 */
export interface FindingDetail {
  id: string  // e.g., SEC-001
  project_id: string

  // Title & Description
  title: string
  description: string
  recommendation?: string

  // Location
  file_path: string
  line_start: number
  line_end?: number
  column_start?: number
  column_end?: number
  code_snippet?: string

  // Classification
  scanner_type: ScannerType
  rule_id: string
  rule_name?: string
  severity: Severity
  cvss_score?: number
  cwe_ids?: string[]
  owasp_ids?: string[]

  // Status & Triage
  status: FindingStatus
  triage_status: TriageStatus
  triage_reason?: string
  triaged_by?: string
  triaged_at?: string

  // Ownership
  assigned_to?: string
  assigned_to_name?: string
  assigned_to_avatar?: string
  assigned_at?: string

  // SLA
  sla_deadline?: string
  sla_status: SLAStatus
  sla_days_remaining?: number

  // Branch tracking
  branches: string[]  // Branches where this finding exists
  first_detected_branch: string
  first_detected_commit: string
  first_detected_at: string
  last_seen_branch: string
  last_seen_commit: string
  last_seen_at: string

  // Resolution
  resolved_at?: string
  resolved_by?: string
  resolved_commit?: string
  resolved_branch?: string

  // Duplicates
  duplicate_of?: string  // Parent finding ID
  duplicate_count: number

  // Related entities
  related_issue_url?: string  // Jira/GitHub issue
  related_pr_url?: string

  // Comments count
  comments_count: number

  // Metadata
  scanner_metadata?: Record<string, unknown>

  created_at: string
  updated_at: string
}

/**
 * Finding comment
 */
export interface FindingComment {
  id: string
  finding_id: string

  author_id: string
  author_name: string
  author_avatar?: string

  content: string

  // If this comment is a status change
  is_status_change: boolean
  old_status?: FindingStatus
  new_status?: FindingStatus

  created_at: string
  updated_at: string
}

/**
 * Finding filters
 */
export interface FindingFilters {
  search?: string

  // Location
  branches?: string[]
  file_paths?: string[]

  // Classification
  scanner_types?: ScannerType[]
  severities?: Severity[]
  rule_ids?: string[]
  cwe_ids?: string[]

  // Status
  statuses?: FindingStatus[]
  triage_statuses?: TriageStatus[]
  sla_statuses?: SLAStatus[]

  // Ownership
  assigned_to?: string[]
  unassigned?: boolean

  // Date filters
  first_detected_after?: string
  first_detected_before?: string

  // Pagination
  sort_by?: 'severity' | 'status' | 'sla_deadline' | 'first_detected_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

// ============================================
// Activity/Audit Log Types
// ============================================

export type ActivityAction =
  // Scan events
  | 'scan_started'
  | 'scan_completed'
  | 'scan_failed'
  | 'scan_cancelled'
  // Finding events
  | 'finding_created'
  | 'finding_resolved'
  | 'finding_regressed'
  | 'finding_status_changed'
  | 'finding_assigned'
  | 'finding_triaged'
  | 'finding_commented'
  // Branch events
  | 'branch_created'
  | 'branch_deleted'
  | 'branch_scanned'
  // PR events
  | 'pr_opened'
  | 'pr_merged'
  | 'pr_closed'
  // Project events
  | 'project_created'
  | 'project_updated'
  | 'project_archived'
  | 'project_synced'
  | 'settings_changed'
  // Integration events
  | 'webhook_received'
  | 'issue_created'
  | 'notification_sent'

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  scan_started: 'Scan Started',
  scan_completed: 'Scan Completed',
  scan_failed: 'Scan Failed',
  scan_cancelled: 'Scan Cancelled',
  finding_created: 'Finding Created',
  finding_resolved: 'Finding Resolved',
  finding_regressed: 'Finding Regressed',
  finding_status_changed: 'Status Changed',
  finding_assigned: 'Finding Assigned',
  finding_triaged: 'Finding Triaged',
  finding_commented: 'Comment Added',
  branch_created: 'Branch Created',
  branch_deleted: 'Branch Deleted',
  branch_scanned: 'Branch Scanned',
  pr_opened: 'PR Opened',
  pr_merged: 'PR Merged',
  pr_closed: 'PR Closed',
  project_created: 'Project Created',
  project_updated: 'Project Updated',
  project_archived: 'Project Archived',
  project_synced: 'Project Synced',
  settings_changed: 'Settings Changed',
  webhook_received: 'Webhook Received',
  issue_created: 'Issue Created',
  notification_sent: 'Notification Sent',
}

export type ActivityEntityType = 'finding' | 'scan' | 'branch' | 'project' | 'pr' | 'integration'

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: string
  project_id: string
  timestamp: string

  // Actor
  actor_id: string
  actor_name: string
  actor_avatar?: string
  actor_type: 'user' | 'system' | 'webhook' | 'automation'

  // Action
  action: ActivityAction

  // Entity
  entity_type: ActivityEntityType
  entity_id: string
  entity_name?: string

  // Changes (for status changes, etc.)
  changes?: {
    field: string
    old_value: string | number | boolean | null
    new_value: string | number | boolean | null
  }[]

  // Additional context
  comment?: string

  // For scan events
  scan_summary?: {
    branch: string
    findings_new: number
    findings_resolved: number
    findings_total: number
    duration_seconds: number
    quality_gate_passed: boolean
  }

  // For PR events
  pr_info?: {
    number: number
    title: string
    url: string
    source_branch: string
    target_branch: string
  }

  // Metadata
  metadata?: Record<string, unknown>
}

/**
 * Activity filters
 */
export interface ActivityFilters {
  actions?: ActivityAction[]
  entity_types?: ActivityEntityType[]
  actor_ids?: string[]
  actor_types?: ('user' | 'system' | 'webhook' | 'automation')[]

  // Date range
  from_date?: string
  to_date?: string

  // Pagination
  page?: number
  per_page?: number
}

// ============================================
// SLA Policy Types
// ============================================

export interface SLAPolicy {
  id: string
  project_id?: string  // null = default policy
  tenant_id: string

  name: string
  description?: string
  is_default: boolean

  // SLA rules per severity
  rules: SLARule[]

  // Escalation
  escalation_enabled: boolean
  escalation_rules?: EscalationRule[]

  created_at: string
  updated_at: string
}

export interface SLARule {
  severity: Severity
  days_to_remediate: number
  warning_threshold_percent: number  // e.g., 80 = warn at 80% of time used
}

export interface EscalationRule {
  trigger: 'warning' | 'overdue' | 'exceeded'
  notify_users?: string[]
  notify_channels?: string[]  // Slack/Teams channels
  auto_assign_to?: string
}

// Default SLA values (industry standard)
export const DEFAULT_SLA_DAYS: Record<Severity, number> = {
  critical: 2,
  high: 15,
  medium: 30,
  low: 60,
  info: 90,
}

// ============================================
// Project Detail Page Types
// ============================================

export type ProjectDetailTab = 'overview' | 'branches' | 'findings' | 'activity' | 'settings'

export interface ProjectDetailData {
  project: Project
  branches: BranchDetail[]
  recent_findings: FindingDetail[]
  recent_activities: ActivityLog[]
  sla_policy: SLAPolicy

  // Computed stats
  findings_by_branch: Record<string, FindingsSummary>
  active_sla_warnings: number
  overdue_findings: number
}

// ============================================
// Legacy type aliases for backward compatibility
// ============================================

/** @deprecated Use SCMProvider instead */
export type ProjectProvider = SCMProvider

/** @deprecated Use SCM_PROVIDER_LABELS instead */
export const PROJECT_PROVIDER_LABELS = SCM_PROVIDER_LABELS

/** @deprecated Use PROJECT_STATUS_LABELS instead */
export const PROJECT_STATUS_CONFIG = PROJECT_STATUS_LABELS
