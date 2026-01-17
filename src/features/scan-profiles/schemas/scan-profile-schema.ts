import { z } from 'zod';

// Tool configuration schema
export const toolConfigSchema = z.object({
  enabled: z.boolean(),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
  timeout: z.number().min(0).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

// Create scan profile form data type (for form)
export interface CreateScanProfileFormData {
  name: string;
  description?: string;
  tools_config?: Record<string, z.infer<typeof toolConfigSchema>>;
  intensity: 'low' | 'medium' | 'high';
  max_concurrent_scans: number;
  timeout_seconds: number;
  tags?: string[];
  is_default: boolean;
}

// Create scan profile schema
export const createScanProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  tools_config: z.record(z.string(), toolConfigSchema).optional(),
  intensity: z.enum(['low', 'medium', 'high']),
  max_concurrent_scans: z.number().min(1).max(100),
  timeout_seconds: z.number().min(60).max(86400),
  tags: z.array(z.string().max(50)).max(20).optional(),
  is_default: z.boolean(),
});

// Update scan profile form data type (for form)
export interface UpdateScanProfileFormData {
  name?: string;
  description?: string;
  tools_config?: Record<string, z.infer<typeof toolConfigSchema>>;
  intensity?: 'low' | 'medium' | 'high';
  max_concurrent_scans?: number;
  timeout_seconds?: number;
  tags?: string[];
}

// Update scan profile schema
export const updateScanProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  tools_config: z.record(z.string(), toolConfigSchema).optional(),
  intensity: z.enum(['low', 'medium', 'high']).optional(),
  max_concurrent_scans: z.number().min(1).max(100).optional(),
  timeout_seconds: z.number().min(60).max(86400).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

// Clone scan profile form data type (for form)
export interface CloneScanProfileFormData {
  new_name: string;
}

// Clone scan profile schema
export const cloneScanProfileSchema = z.object({
  new_name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

// Options for forms
export const INTENSITY_OPTIONS = [
  { value: 'low', label: 'Low', description: 'Fast scans with basic checks' },
  { value: 'medium', label: 'Medium', description: 'Balanced scans with standard checks' },
  { value: 'high', label: 'High', description: 'Comprehensive scans with all checks' },
] as const;

export const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

export const TOOL_OPTIONS = [
  { value: 'semgrep', label: 'Semgrep', description: 'Static application security testing (SAST)' },
  { value: 'trivy', label: 'Trivy', description: 'Container and dependency vulnerability scanning' },
  { value: 'nuclei', label: 'Nuclei', description: 'Web vulnerability scanner' },
  { value: 'gitleaks', label: 'Gitleaks', description: 'Secret detection in git repositories' },
  { value: 'checkov', label: 'Checkov', description: 'Infrastructure as code security scanner' },
  { value: 'tfsec', label: 'Tfsec', description: 'Terraform security scanner' },
  { value: 'grype', label: 'Grype', description: 'Software composition analysis (SCA)' },
  { value: 'syft', label: 'Syft', description: 'SBOM generation and analysis' },
] as const;
