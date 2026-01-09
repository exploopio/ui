/**
 * Asset Types
 *
 * Type definitions for assets in the security platform
 */

import type { Status } from "@/features/shared/types";

export type AssetType =
  | "domain"
  | "website"
  | "service"
  | "repository"
  | "cloud"
  | "credential"
  | "host"
  | "container"
  | "database"
  | "mobile"
  | "api";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  domain: "Domain",
  website: "Website",
  service: "Service",
  repository: "Repository",
  cloud: "Cloud",
  credential: "Credential",
  host: "Host",
  container: "Container",
  database: "Database",
  mobile: "Mobile App",
  api: "API",
};

/**
 * Asset metadata varies by asset type
 */
export interface AssetMetadata {
  // Domain-specific
  registrar?: string;
  expiryDate?: string;
  nameservers?: string[];

  // Website-specific
  technology?: string[];
  ssl?: boolean;
  sslExpiry?: string;
  httpStatus?: number;
  responseTime?: number;
  server?: string;

  // Service-specific
  port?: number;
  protocol?: string;
  version?: string;
  banner?: string;

  // Repository-specific
  provider?: "github" | "gitlab" | "bitbucket";
  visibility?: "public" | "private";
  language?: string;
  stars?: number;

  // Cloud-specific
  cloudProvider?: "aws" | "gcp" | "azure";
  region?: string;
  resourceType?: string;

  // Credential-specific
  source?: string;
  username?: string;
  leakDate?: string;

  // Host-specific
  ip?: string;
  hostname?: string;
  os?: string;
  osVersion?: string;
  architecture?: "x86" | "x64" | "arm64";
  cpuCores?: number;
  memoryGB?: number;
  isVirtual?: boolean;
  hypervisor?: string;
  openPorts?: number[];
  lastBoot?: string;

  // Container-specific
  image?: string;
  imageTag?: string;
  registry?: string;
  runtime?: "docker" | "containerd" | "cri-o";
  orchestrator?: "kubernetes" | "docker-swarm" | "ecs" | "standalone";
  namespace?: string;
  cluster?: string;
  replicas?: number;
  cpuLimit?: string;
  memoryLimit?: string;
  containerPorts?: number[];
  vulnerabilities?: number;

  // Database-specific
  engine?: "mysql" | "postgresql" | "mongodb" | "redis" | "elasticsearch" | "mssql" | "oracle";
  dbVersion?: string;
  dbHost?: string;
  dbPort?: number;
  sizeGB?: number;
  encryption?: boolean;
  backupEnabled?: boolean;
  lastBackup?: string;
  replication?: "single" | "replica-set" | "cluster";
  connections?: number;

  // Mobile App-specific
  platform?: "ios" | "android" | "cross-platform";
  bundleId?: string;
  appVersion?: string;
  buildNumber?: string;
  minSdkVersion?: string;
  targetSdkVersion?: string;
  storeUrl?: string;
  lastRelease?: string;
  downloads?: number;
  rating?: number;
  permissions?: string[];
  sdks?: string[];

  // API-specific
  apiType?: "rest" | "graphql" | "grpc" | "websocket" | "soap";
  baseUrl?: string;
  apiVersion?: string;
  authType?: "none" | "api_key" | "oauth2" | "jwt" | "basic";
  endpointCount?: number;
  documentationUrl?: string;
  openApiSpec?: boolean;
  rateLimit?: number;
  lastActivity?: string;
}

/**
 * Asset represents a single discoverable asset
 */
export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  description?: string;
  status: Status;
  riskScore: number; // 0-100
  findingCount: number;
  groupId?: string; // Optional - asset can be ungrouped
  groupName?: string;
  metadata: AssetMetadata;
  tags?: string[];
  firstSeen: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new asset
 * Used when creating assets independently or within a group
 */
export interface CreateAssetInput {
  type: AssetType;
  name: string;
  description?: string;
  groupId?: string; // Optional - can create ungrouped assets
  metadata?: Partial<AssetMetadata>;
  tags?: string[];
}

/**
 * Input for updating an asset
 */
export interface UpdateAssetInput {
  name?: string;
  description?: string;
  status?: Status;
  groupId?: string | null; // null to remove from group
  metadata?: Partial<AssetMetadata>;
  tags?: string[];
}

/**
 * Bulk operation to assign assets to a group
 */
export interface AssignAssetsToGroupInput {
  assetIds: string[];
  groupId: string;
}

/**
 * Bulk operation to remove assets from their groups
 */
export interface UnassignAssetsInput {
  assetIds: string[];
}

/**
 * Asset statistics summary
 */
export interface AssetStats {
  totalAssets: number;
  byType: Record<AssetType, number>;
  byStatus: Record<Status, number>;
  averageRiskScore: number;
  totalFindings: number;
}

// ============================================
// Kubernetes Types
// ============================================

export type K8sClusterStatus = "healthy" | "warning" | "critical" | "unknown";

/**
 * Kubernetes Cluster
 */
export interface K8sCluster {
  id: string;
  name: string;
  provider: "eks" | "gke" | "aks" | "self-managed" | "k3s" | "openshift";
  version: string;
  region?: string;
  nodeCount: number;
  namespaceCount: number;
  workloadCount: number;
  podCount: number;
  status: K8sClusterStatus;
  riskScore: number;
  findingCount: number;
  apiServerUrl?: string;
  createdAt: string;
  lastSeen: string;
}

export type WorkloadType = "deployment" | "statefulset" | "daemonset" | "job" | "cronjob" | "replicaset";

/**
 * Kubernetes Workload (Deployment, StatefulSet, DaemonSet, etc.)
 */
export interface K8sWorkload {
  id: string;
  name: string;
  type: WorkloadType;
  clusterId: string;
  clusterName: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  images: string[];
  labels?: Record<string, string>;
  status: "running" | "pending" | "failed" | "unknown";
  riskScore: number;
  findingCount: number;
  cpuRequest?: string;
  cpuLimit?: string;
  memoryRequest?: string;
  memoryLimit?: string;
  createdAt: string;
  lastSeen: string;
}

/**
 * Container Image
 */
export interface ContainerImage {
  id: string;
  name: string;
  tag: string;
  fullName: string; // name:tag
  registry: string;
  digest?: string;
  size?: number; // in MB
  os?: string;
  architecture?: string;
  workloadCount: number; // Number of workloads using this image
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  riskScore: number;
  lastScanned?: string;
  pushedAt?: string;
  createdAt: string;
}

// ============================================
// API Types
// ============================================

export type ApiType = "rest" | "graphql" | "grpc" | "websocket" | "soap";
export type ApiAuthType = "none" | "api_key" | "oauth2" | "jwt" | "basic" | "mtls";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/**
 * API Endpoint represents a single API endpoint
 */
export interface ApiEndpoint {
  id: string;
  apiId: string;
  apiName: string;
  path: string;
  method: HttpMethod;
  description?: string;
  parameters?: {
    name: string;
    in: "query" | "path" | "header" | "body";
    required: boolean;
    type: string;
  }[];
  responseType?: string;
  authenticated: boolean;
  deprecated: boolean;
  riskScore: number;
  findingCount: number;
  lastCalled?: string;
  avgResponseTime?: number; // in ms
  errorRate?: number; // percentage
  createdAt: string;
  lastSeen: string;
}

/**
 * API represents a collection of endpoints
 */
export interface Api {
  id: string;
  name: string;
  description?: string;
  type: ApiType;
  baseUrl: string;
  version?: string;
  authType: ApiAuthType;
  status: "active" | "inactive" | "deprecated" | "development";
  endpointCount: number;
  documentationUrl?: string;
  openApiSpec: boolean;
  owner?: string;
  team?: string;
  riskScore: number;
  findingCount: number;
  // Traffic stats
  requestsPerDay?: number;
  avgResponseTime?: number;
  errorRate?: number;
  // Security
  tlsVersion?: string;
  corsEnabled?: boolean;
  rateLimitEnabled?: boolean;
  rateLimit?: number;
  // Timestamps
  createdAt: string;
  lastSeen: string;
  lastActivity?: string;
}

// ============================================
// Finding Types (for asset drill-down)
// ============================================

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";
export type FindingType = "vulnerability" | "misconfiguration" | "exposure" | "secret" | "compliance";
export type FindingStatus = "open" | "in_progress" | "resolved" | "accepted" | "false_positive";

/**
 * Finding associated with an asset
 */
export interface AssetFinding {
  id: string;
  type: FindingType;
  severity: FindingSeverity;
  status: FindingStatus;
  title: string;
  description: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  // Vulnerability specific
  cveId?: string;
  cvssScore?: number;
  cweId?: string;
  // Misconfiguration specific
  rule?: string;
  benchmark?: string; // CIS, etc.
  // Remediation
  remediation?: string;
  references?: string[];
  // Timestamps
  firstSeen: string;
  lastSeen: string;
  resolvedAt?: string;
}
