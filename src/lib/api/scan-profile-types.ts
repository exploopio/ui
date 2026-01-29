/**
 * Scan Profile API Types
 *
 * TypeScript types for Scan Profile Management
 */

// Intensity levels
export type Intensity = 'low' | 'medium' | 'high';

// Severity levels for tool findings
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

// Template modes for scanner templates
export type TemplateMode = 'default' | 'custom' | 'both';

/**
 * Tool configuration within a scan profile
 */
export interface ToolConfig {
  enabled: boolean;
  severity?: Severity;
  timeout?: number;
  options?: Record<string, unknown>;
  template_mode?: TemplateMode;          // "default", "custom", "both"
  custom_template_ids?: string[];        // IDs of custom templates to use
}

/**
 * Quality Gate configuration for CI/CD pass/fail decisions
 */
export interface QualityGate {
  enabled: boolean;
  fail_on_critical: boolean;
  fail_on_high: boolean;
  max_critical: number;  // -1 = unlimited
  max_high: number;
  max_medium: number;
  max_total: number;
  new_findings_only?: boolean;
  baseline_branch?: string;
}

/**
 * Quality Gate breach when threshold is exceeded
 */
export interface QualityGateBreach {
  metric: 'critical' | 'high' | 'medium' | 'total';
  limit: number;
  actual: number;
}

/**
 * Finding counts by severity
 */
export interface FindingCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
}

/**
 * Quality Gate evaluation result
 */
export interface QualityGateResult {
  passed: boolean;
  reason?: string;
  breaches?: QualityGateBreach[];
  counts: FindingCounts;
}

/**
 * Scan Profile entity
 */
export interface ScanProfile {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_system: boolean;
  tools_config: Record<string, ToolConfig>;
  intensity: Intensity;
  max_concurrent_scans: number;
  timeout_seconds: number;
  tags: string[];
  metadata: Record<string, unknown>;
  quality_gate: QualityGate;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create scan profile request
 */
export interface CreateScanProfileRequest {
  name: string;
  description?: string;
  tools_config?: Record<string, ToolConfig>;
  intensity?: Intensity;
  max_concurrent_scans?: number;
  timeout_seconds?: number;
  tags?: string[];
  is_default?: boolean;
  quality_gate?: QualityGate;
}

/**
 * Update scan profile request
 */
export interface UpdateScanProfileRequest {
  name?: string;
  description?: string;
  tools_config?: Record<string, ToolConfig>;
  intensity?: Intensity;
  max_concurrent_scans?: number;
  timeout_seconds?: number;
  tags?: string[];
  quality_gate?: QualityGate;
}

/**
 * Update quality gate request
 */
export interface UpdateQualityGateRequest {
  enabled: boolean;
  fail_on_critical: boolean;
  fail_on_high: boolean;
  max_critical: number;
  max_high: number;
  max_medium: number;
  max_total: number;
  new_findings_only?: boolean;
  baseline_branch?: string;
}

/**
 * Clone scan profile request
 */
export interface CloneScanProfileRequest {
  new_name: string;
}

/**
 * Scan profile list response
 */
export interface ScanProfileListResponse {
  items: ScanProfile[];
  total: number;
  page: number;
  per_page: number;
}

/**
 * Scan profile list filters
 */
export interface ScanProfileListFilters {
  is_default?: boolean;
  is_system?: boolean;
  tags?: string[];
  search?: string;
  page?: number;
  per_page?: number;
}

// Available tools for scan profiles
export const SCAN_PROFILE_TOOLS = [
  'semgrep',
  'trivy',
  'nuclei',
  'gitleaks',
  'checkov',
  'tfsec',
  'grype',
  'syft',
] as const;

export type ScanProfileTool = (typeof SCAN_PROFILE_TOOLS)[number];

// Tool display names
export const TOOL_DISPLAY_NAMES: Record<ScanProfileTool, string> = {
  semgrep: 'Semgrep',
  trivy: 'Trivy',
  nuclei: 'Nuclei',
  gitleaks: 'Gitleaks',
  checkov: 'Checkov',
  tfsec: 'Tfsec',
  grype: 'Grype',
  syft: 'Syft',
};

// Tool descriptions
export const TOOL_DESCRIPTIONS: Record<ScanProfileTool, string> = {
  semgrep: 'Static application security testing (SAST)',
  trivy: 'Container and dependency vulnerability scanning',
  nuclei: 'Web vulnerability scanner',
  gitleaks: 'Secret detection in git repositories',
  checkov: 'Infrastructure as code security scanner',
  tfsec: 'Terraform security scanner',
  grype: 'Software composition analysis (SCA)',
  syft: 'SBOM generation and analysis',
};

// Intensity display names
export const INTENSITY_DISPLAY_NAMES: Record<Intensity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

// Intensity descriptions
export const INTENSITY_DESCRIPTIONS: Record<Intensity, string> = {
  low: 'Fast scans with basic checks',
  medium: 'Balanced scans with standard checks',
  high: 'Comprehensive scans with all checks',
};

// Severity display names
export const SEVERITY_DISPLAY_NAMES: Record<Severity, string> = {
  info: 'Info',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

// Default Quality Gate configuration
export const DEFAULT_QUALITY_GATE: QualityGate = {
  enabled: false,
  fail_on_critical: false,
  fail_on_high: false,
  max_critical: -1,
  max_high: -1,
  max_medium: -1,
  max_total: -1,
  new_findings_only: false,
  baseline_branch: '',
};

/**
 * Create a new Quality Gate with defaults
 */
export function createDefaultQualityGate(overrides?: Partial<QualityGate>): QualityGate {
  return {
    ...DEFAULT_QUALITY_GATE,
    ...overrides,
  };
}

/**
 * Check if a quality gate threshold is unlimited
 */
export function isUnlimited(value: number): boolean {
  return value < 0;
}

// Template mode display names
export const TEMPLATE_MODE_DISPLAY_NAMES: Record<TemplateMode, string> = {
  default: 'Default',
  custom: 'Custom Only',
  both: 'Both',
};

// Template mode descriptions
export const TEMPLATE_MODE_DESCRIPTIONS: Record<TemplateMode, string> = {
  default: 'Use only official/built-in templates',
  custom: 'Use only tenant-uploaded custom templates',
  both: 'Run both default and custom templates',
};
