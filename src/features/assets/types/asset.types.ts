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
  | "credential";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  domain: "Domain",
  website: "Website",
  service: "Service",
  repository: "Repository",
  cloud: "Cloud",
  credential: "Credential",
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
  groupId: string;
  groupName?: string;
  metadata: AssetMetadata;
  tags?: string[];
  firstSeen: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
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
