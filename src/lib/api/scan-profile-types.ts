/**
 * Scan Profile API Types
 *
 * TypeScript types for Scan Profile Management
 */

// Intensity levels
export type Intensity = 'low' | 'medium' | 'high';

// Severity levels for tool findings
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Tool configuration within a scan profile
 */
export interface ToolConfig {
  enabled: boolean;
  severity?: Severity;
  timeout?: number;
  options?: Record<string, unknown>;
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
