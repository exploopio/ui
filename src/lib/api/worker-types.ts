/**
 * Worker API Types
 *
 * TypeScript types for Worker Management
 */

// Worker types
export type WorkerType = 'worker' | 'agent' | 'scanner' | 'collector';
export type WorkerStatus = 'pending' | 'active' | 'inactive' | 'error' | 'revoked';
export type ExecutionMode = 'standalone' | 'daemon';

// Worker capabilities
export const WORKER_CAPABILITIES = [
    'sast',
    'sca',
    'dast',
    'secrets',
    'iac',
    'infra',
    'collector',
    'container',
    'cloud',
] as const;

export type WorkerCapability = (typeof WORKER_CAPABILITIES)[number];

// Worker tools
export const WORKER_TOOLS = [
    'semgrep',
    'trivy',
    'nuclei',
    'gitleaks',
    'checkov',
    'tfsec',
    'grype',
    'syft',
    'custom',
] as const;

export type WorkerTool = (typeof WORKER_TOOLS)[number];

/**
 * Worker entity
 */
export interface Worker {
    id: string;
    tenant_id: string;
    name: string;
    type: WorkerType;
    description?: string;
    capabilities: WorkerCapability[];
    tools: WorkerTool[];
    execution_mode: ExecutionMode;
    status: WorkerStatus;
    status_message?: string;
    api_key_prefix: string;
    version?: string;
    hostname?: string;
    ip_address?: string;
    labels: Record<string, string>;
    config: Record<string, unknown>;
    metadata: Record<string, unknown>;
    last_seen_at?: string;
    last_error_at?: string;
    total_findings: number;
    total_scans: number;
    error_count: number;
    created_at: string;
    updated_at: string;
}

/**
 * Create worker request
 */
export interface CreateWorkerRequest {
    name: string;
    type: WorkerType;
    description?: string;
    capabilities?: WorkerCapability[];
    tools?: WorkerTool[];
    execution_mode?: ExecutionMode;
    labels?: Record<string, string>;
    config?: Record<string, unknown>;
}

/**
 * Create worker response (includes API key)
 */
export interface CreateWorkerResponse {
    worker: Worker;
    api_key: string; // Only returned on create
}

/**
 * Update worker request
 */
export interface UpdateWorkerRequest {
    name?: string;
    description?: string;
    capabilities?: WorkerCapability[];
    tools?: WorkerTool[];
    execution_mode?: ExecutionMode;
    status?: WorkerStatus;
    labels?: Record<string, string>;
    config?: Record<string, unknown>;
}

/**
 * Regenerate API key response
 */
export interface RegenerateAPIKeyResponse {
    api_key: string;
    api_key_prefix: string;
}

/**
 * Worker list response
 */
export interface WorkerListResponse {
    items: Worker[];
    total: number;
    page: number;
    page_size: number;
}

/**
 * Worker list filters
 */
export interface WorkerListFilters {
    type?: WorkerType;
    status?: WorkerStatus;
    search?: string;
    page?: number;
    page_size?: number;
}
