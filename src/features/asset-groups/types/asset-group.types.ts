/**
 * Asset Group Types
 *
 * Type definitions for asset groups
 */

import type { Environment, Criticality } from "@/features/shared/types";

/**
 * Asset Group for organizing assets
 */
export interface AssetGroup {
  id: string;
  name: string;
  description?: string;
  environment: Environment;
  criticality: Criticality;
  assetCount: number;
  domainCount: number;
  websiteCount: number;
  serviceCount: number;
  repositoryCount: number;
  cloudCount: number;
  credentialCount: number;
  riskScore: number;
  findingCount: number;
  createdAt: string;
  updatedAt: string;
}
