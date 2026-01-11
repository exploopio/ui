/**
 * Mock Data Helpers
 *
 * Utility functions for generating and enriching mock asset data
 */

import type { Asset, AssetType, AssetScope, ExposureLevel } from "../../types";

/**
 * Base asset type without scope and exposure (to be enriched)
 */
export type BaseAsset = Omit<Asset, "scope" | "exposure">;

/**
 * Derive scope and exposure based on asset characteristics
 * This simulates how a real system would classify assets
 */
export const deriveScopeAndExposure = (
  type: AssetType,
  name: string,
  tags?: string[],
  metadata?: Record<string, unknown>
): { scope: AssetScope; exposure: ExposureLevel } => {
  const tagsSet = new Set(tags || []);
  const nameLC = name.toLowerCase();

  // Determine scope
  let scope: AssetScope = "internal";

  if (metadata?.cloudProvider || type === "cloud") {
    scope = "cloud";
  } else if (tagsSet.has("vendor") || tagsSet.has("third-party") || nameLC.includes("vendor")) {
    scope = "vendor";
  } else if (tagsSet.has("partner") || nameLC.includes("partner")) {
    scope = "partner";
  } else if (tagsSet.has("shadow") || tagsSet.has("unknown")) {
    scope = "shadow";
  } else if (
    type === "domain" ||
    type === "website" ||
    type === "api" ||
    tagsSet.has("customer-facing") ||
    tagsSet.has("public")
  ) {
    scope = "external";
  }

  // Determine exposure
  let exposure: ExposureLevel = "private";

  if (type === "domain" || type === "website") {
    exposure = "public";
  } else if (type === "api" && (nameLC.includes("public") || tagsSet.has("public"))) {
    exposure = "public";
  } else if (type === "api") {
    exposure = "restricted";
  } else if (type === "mobile") {
    exposure = "public"; // Apps are distributed publicly
  } else if (
    type === "service" &&
    (tagsSet.has("customer-facing") || nameLC.includes("gateway") || nameLC.includes("api"))
  ) {
    exposure = "restricted";
  } else if (type === "repository" && metadata?.visibility === "public") {
    exposure = "public";
  } else if (type === "repository") {
    exposure = "restricted";
  } else if (type === "credential") {
    exposure = "isolated"; // Credentials should be highly protected
  } else if (
    type === "database" ||
    type === "container" ||
    type === "host"
  ) {
    exposure = nameLC.includes("staging") || nameLC.includes("dev") ? "private" : "private";
  }

  // Override for critical/banking assets
  if (tagsSet.has("critical") || tagsSet.has("banking") || tagsSet.has("pci-dss")) {
    // Critical assets might be isolated or restricted
    if (exposure === "public" && type !== "domain" && type !== "website") {
      exposure = "restricted";
    }
  }

  return { scope, exposure };
};

/**
 * Enrich a base asset with derived scope and exposure
 */
export const enrichAsset = (asset: BaseAsset): Asset => {
  const { scope, exposure } = deriveScopeAndExposure(
    asset.type,
    asset.name,
    asset.tags,
    asset.metadata as Record<string, unknown>
  );
  return { ...asset, scope, exposure };
};

/**
 * Helper to generate dates relative to today
 */
export const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};
