import { z } from 'zod';

// Worker type options
export const WORKER_TYPE_OPTIONS = [
    { value: 'worker', label: 'Worker' },
    { value: 'agent', label: 'Agent' },
    { value: 'scanner', label: 'Scanner' },
    { value: 'collector', label: 'Collector' },
] as const;

// Worker status options
export const WORKER_STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'error', label: 'Error' },
    { value: 'revoked', label: 'Revoked' },
] as const;

// Execution mode options
export const EXECUTION_MODE_OPTIONS = [
    { value: 'standalone', label: 'Standalone' },
    { value: 'daemon', label: 'Daemon' },
] as const;

// Capability options
export const CAPABILITY_OPTIONS = [
    { value: 'sast', label: 'SAST', description: 'Static Application Security Testing' },
    { value: 'sca', label: 'SCA', description: 'Software Composition Analysis' },
    { value: 'dast', label: 'DAST', description: 'Dynamic Application Security Testing' },
    { value: 'secrets', label: 'Secrets', description: 'Secret Detection' },
    { value: 'iac', label: 'IaC', description: 'Infrastructure as Code Scanning' },
    { value: 'infra', label: 'Infra', description: 'Infrastructure Scanning' },
    { value: 'collector', label: 'Collector', description: 'Data Collection' },
    { value: 'container', label: 'Container', description: 'Container Scanning' },
    { value: 'cloud', label: 'Cloud', description: 'Cloud Security' },
] as const;

// Tool options
export const TOOL_OPTIONS = [
    { value: 'semgrep', label: 'Semgrep', description: 'Code analysis' },
    { value: 'trivy', label: 'Trivy', description: 'Container/SCA scanner' },
    { value: 'nuclei', label: 'Nuclei', description: 'Vulnerability scanner' },
    { value: 'gitleaks', label: 'Gitleaks', description: 'Secret scanner' },
    { value: 'checkov', label: 'Checkov', description: 'IaC scanner' },
    { value: 'tfsec', label: 'TFSec', description: 'Terraform scanner' },
    { value: 'grype', label: 'Grype', description: 'Vulnerability scanner' },
    { value: 'syft', label: 'Syft', description: 'SBOM generator' },
    { value: 'custom', label: 'Custom', description: 'Custom tool' },
] as const;

// Enum schemas
export const workerTypeSchema = z.enum(['worker', 'agent', 'scanner', 'collector']);
export const workerStatusSchema = z.enum(['pending', 'active', 'inactive', 'error', 'revoked']);
export const executionModeSchema = z.enum(['standalone', 'daemon']);

// Create worker form data type (for form)
export interface CreateWorkerFormData {
    name: string;
    type: 'worker' | 'agent' | 'scanner' | 'collector';
    description?: string;
    capabilities: string[];
    tools: string[];
    execution_mode: 'standalone' | 'daemon';
    labels?: Record<string, string>;
}

// Create worker schema
export const createWorkerSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(255, 'Name must be less than 255 characters'),
    type: workerTypeSchema,
    description: z.string().max(1000).optional(),
    capabilities: z.array(z.string()),
    tools: z.array(z.string()),
    execution_mode: executionModeSchema,
    labels: z.record(z.string(), z.string()).optional(),
});

// Update worker form data type (for form)
export interface UpdateWorkerFormData {
    name?: string;
    description?: string;
    capabilities?: string[];
    tools?: string[];
    execution_mode?: 'standalone' | 'daemon';
    status?: 'pending' | 'active' | 'inactive' | 'error' | 'revoked';
    labels?: Record<string, string>;
}

// Update worker schema
export const updateWorkerSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(255, 'Name must be less than 255 characters')
        .optional(),
    description: z.string().max(1000).optional(),
    capabilities: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    execution_mode: executionModeSchema.optional(),
    status: workerStatusSchema.optional(),
    labels: z.record(z.string(), z.string()).optional(),
});
