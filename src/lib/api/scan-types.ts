/**
 * Scan Configuration API Types
 *
 * TypeScript types for Scan Configuration Management
 * Scan configurations bind asset groups with scanners/workflows and schedules.
 */

// Scan types
export const SCAN_TYPES = ['workflow', 'single'] as const;
export type ScanType = (typeof SCAN_TYPES)[number];

// Schedule types
export const SCHEDULE_TYPES = [
  'manual',
  'daily',
  'weekly',
  'monthly',
  'crontab',
] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

// Status types
export const SCAN_CONFIG_STATUSES = ['active', 'paused', 'disabled'] as const;
export type ScanConfigStatus = (typeof SCAN_CONFIG_STATUSES)[number];

// Labels for display
export const SCAN_TYPE_LABELS: Record<ScanType, string> = {
  workflow: 'Workflow',
  single: 'Single Scan',
};

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  manual: 'Manual',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  crontab: 'Custom (Cron)',
};

export const SCAN_CONFIG_STATUS_LABELS: Record<ScanConfigStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  disabled: 'Disabled',
};

/**
 * Scan Configuration entity
 */
export interface ScanConfig {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  asset_group_id: string;
  scan_type: ScanType;
  pipeline_id?: string;
  scanner_name?: string;
  scanner_config?: Record<string, unknown>;
  targets_per_job: number;
  schedule_type: ScheduleType;
  schedule_cron?: string;
  schedule_day?: number;
  schedule_time?: string;
  schedule_timezone: string;
  next_run_at?: string;
  tags?: string[];
  run_on_tenant_runner: boolean;
  status: ScanConfigStatus;
  last_run_id?: string;
  last_run_at?: string;
  last_run_status?: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Scan Configuration with related entities
 */
export interface ScanConfigWithRelations extends ScanConfig {
  asset_group?: {
    id: string;
    name: string;
  };
  pipeline?: {
    id: string;
    name: string;
  };
}

/**
 * Create scan configuration request
 */
export interface CreateScanConfigRequest {
  name: string;
  description?: string;
  asset_group_id: string;
  scan_type: ScanType;
  pipeline_id?: string;
  scanner_name?: string;
  scanner_config?: Record<string, unknown>;
  targets_per_job?: number;
  schedule_type?: ScheduleType;
  schedule_cron?: string;
  schedule_day?: number;
  schedule_time?: string;
  timezone?: string;
  tags?: string[];
  run_on_tenant_runner?: boolean;
}

/**
 * Update scan configuration request
 */
export interface UpdateScanConfigRequest {
  name?: string;
  description?: string;
  pipeline_id?: string;
  scanner_name?: string;
  scanner_config?: Record<string, unknown>;
  targets_per_job?: number;
  schedule_type?: ScheduleType;
  schedule_cron?: string;
  schedule_day?: number;
  schedule_time?: string;
  timezone?: string;
  tags?: string[];
  run_on_tenant_runner?: boolean;
}

/**
 * Trigger scan request
 */
export interface TriggerScanRequest {
  context?: Record<string, unknown>;
}

/**
 * Clone config request
 */
export interface CloneScanConfigRequest {
  name: string;
}

/**
 * Scan configuration list filters
 */
export interface ScanConfigListFilters {
  asset_group_id?: string;
  pipeline_id?: string;
  scan_type?: ScanType;
  schedule_type?: ScheduleType;
  status?: ScanConfigStatus;
  tags?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

/**
 * Scan configuration list response
 */
export interface ScanConfigListResponse {
  items: ScanConfig[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Scan configuration stats data
 */
export interface ScanConfigStatsData {
  total: number;
  active: number;
  paused: number;
  disabled: number;
  by_schedule_type: Record<ScheduleType, number>;
  by_scan_type: Record<ScanType, number>;
}

/**
 * Pipeline run response (returned when triggering scan)
 */
export interface PipelineRun {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  asset_id?: string;
  scan_id?: string;
  trigger_type: string;
  triggered_by?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  total_findings: number;
  error_message?: string;
  created_at: string;
}

/**
 * Status counts for overview dashboard
 */
export interface StatusCounts {
  total: number;
  running: number;
  pending: number;
  completed: number;
  failed: number;
  canceled: number;
}

/**
 * Overview stats for scan management dashboard
 */
export interface ScanManagementOverview {
  pipelines: StatusCounts;
  scans: StatusCounts;
  jobs: StatusCounts;
}
