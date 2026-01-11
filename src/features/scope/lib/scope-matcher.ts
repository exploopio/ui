/**
 * Scope Matcher Utility
 *
 * Provides functions to match assets against scope targets and exclusions.
 * Used to link discovered assets with their corresponding scope rules.
 *
 * Security improvements:
 * - Pattern length limits to prevent ReDoS
 * - Safe wildcard matching without regex
 * - Input validation and sanitization
 */

import type {
  ScopeTarget,
  ScopeExclusion,
  ScopeMatchResult,
  ScopeCoverage,
  ScopeTargetType,
} from "../types";
import { SCOPE_TO_ASSET_TYPE_MAP } from "../types";

// Constants for security limits
const MAX_PATTERN_LENGTH = 500;
const MAX_VALUE_LENGTH = 2000;
const MAX_WILDCARD_SEGMENTS = 10;

/**
 * Validate and sanitize pattern input
 * Returns null if pattern is invalid
 */
export const validatePattern = (pattern: string): string | null => {
  if (!pattern || typeof pattern !== "string") return null;
  if (pattern.length > MAX_PATTERN_LENGTH) return null;

  // Count wildcard segments to prevent excessive matching
  const wildcardCount = (pattern.match(/\*/g) || []).length;
  if (wildcardCount > MAX_WILDCARD_SEGMENTS) return null;

  return pattern.trim();
};

/**
 * Safe wildcard matching without regex
 * Supports * as wildcard for any characters
 * Prevents ReDoS by using iterative string matching
 */
export const matchWildcard = (pattern: string, value: string): boolean => {
  // Validate inputs
  if (!pattern || !value) return false;
  if (value.length > MAX_VALUE_LENGTH) return false;

  const validPattern = validatePattern(pattern);
  if (!validPattern) return false;

  // Case-insensitive matching
  const p = validPattern.toLowerCase();
  const v = value.toLowerCase();

  // No wildcards - exact match
  if (!p.includes("*")) {
    return p === v;
  }

  // Split pattern by wildcards
  const segments = p.split("*");

  // Empty pattern with only wildcards matches everything
  if (segments.every((s) => s === "")) return true;

  let valueIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (segment === "") continue;

    // First segment must match at the start if pattern doesn't start with *
    if (i === 0 && !p.startsWith("*")) {
      if (!v.startsWith(segment)) return false;
      valueIndex = segment.length;
      continue;
    }

    // Last segment must match at the end if pattern doesn't end with *
    if (i === segments.length - 1 && !p.endsWith("*")) {
      if (!v.endsWith(segment)) return false;
      continue;
    }

    // Find segment in remaining value
    const foundIndex = v.indexOf(segment, valueIndex);
    if (foundIndex === -1) return false;
    valueIndex = foundIndex + segment.length;
  }

  return true;
};

/**
 * Check if an IP address falls within a CIDR range
 * Includes input validation for security
 */
export const matchCIDR = (cidr: string, ip: string): boolean => {
  try {
    // Validate inputs
    if (!cidr || !ip) return false;
    if (cidr.length > 50 || ip.length > 50) return false;

    const [range, bits] = cidr.split("/");
    if (!range || !bits) return false;

    const mask = parseInt(bits, 10);
    if (isNaN(mask) || mask < 0 || mask > 32) return false;

    const ipToLong = (ipStr: string): number => {
      // Validate IP format
      if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ipStr)) return -1;

      const parts = ipStr.split(".").map(Number);
      if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
        return -1;
      }
      return parts.reduce((acc, octet) => (acc << 8) + octet, 0) >>> 0;
    };

    const rangeLong = ipToLong(range);
    const ipLong = ipToLong(ip);

    if (rangeLong === -1 || ipLong === -1) return false;

    const maskBits = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
    return (rangeLong & maskBits) === (ipLong & maskBits);
  } catch {
    return false;
  }
};

/**
 * Check if a domain matches a domain pattern (supports wildcards)
 * Safe implementation without regex for domain matching
 */
export const matchDomain = (pattern: string, domain: string): boolean => {
  // Validate inputs
  if (!pattern || !domain) return false;
  if (pattern.length > MAX_PATTERN_LENGTH || domain.length > MAX_VALUE_LENGTH) {
    return false;
  }

  // Normalize both to lowercase
  const normalizedPattern = pattern.toLowerCase().trim();
  const normalizedDomain = domain.toLowerCase().trim();

  // Exact match
  if (normalizedPattern === normalizedDomain) return true;

  // Wildcard match (*.example.com matches sub.example.com)
  if (normalizedPattern.startsWith("*.")) {
    const baseDomain = normalizedPattern.slice(2);
    return (
      normalizedDomain === baseDomain ||
      normalizedDomain.endsWith(`.${baseDomain}`)
    );
  }

  return false;
};

/**
 * Check if a repository matches a repository pattern
 */
export const matchRepository = (pattern: string, repo: string): boolean => {
  // Validate inputs
  if (!pattern || !repo) return false;
  if (pattern.length > MAX_PATTERN_LENGTH || repo.length > MAX_VALUE_LENGTH) {
    return false;
  }

  const normalizedPattern = pattern.toLowerCase().trim();
  const normalizedRepo = repo.toLowerCase().trim();

  // Exact match
  if (normalizedPattern === normalizedRepo) return true;

  // Wildcard org match (github.com/org/* matches github.com/org/any-repo)
  if (normalizedPattern.endsWith("/*")) {
    const basePattern = normalizedPattern.slice(0, -1); // Remove *
    return normalizedRepo.startsWith(basePattern);
  }

  return matchWildcard(normalizedPattern, normalizedRepo);
};

/**
 * Check if a cloud account matches a pattern
 */
export const matchCloudAccount = (pattern: string, account: string): boolean => {
  // Validate inputs
  if (!pattern || !account) return false;
  if (pattern.length > MAX_PATTERN_LENGTH || account.length > MAX_VALUE_LENGTH) {
    return false;
  }

  const normalizedPattern = pattern.toUpperCase().trim();
  const normalizedAccount = account.toUpperCase().trim();

  return normalizedPattern === normalizedAccount;
};

/**
 * Check if asset type is compatible with scope target type
 * Uses the centralized SCOPE_TO_ASSET_TYPE_MAP from types
 */
const checkTypeCompatibility = (
  scopeType: ScopeTargetType,
  assetType: string
): boolean => {
  return SCOPE_TO_ASSET_TYPE_MAP[scopeType]?.includes(assetType) ?? false;
};

/**
 * Check if an asset matches a scope target
 */
export const matchesScopeTarget = (
  target: ScopeTarget,
  asset: { type: string; name: string; metadata?: Record<string, unknown> }
): { matches: boolean; matchType: "exact" | "wildcard" | "cidr" | "regex" } => {
  const { type: targetType, pattern } = target;
  const { type: assetType, name, metadata } = asset;

  // Validate pattern
  const validPattern = validatePattern(pattern);
  if (!validPattern) {
    return { matches: false, matchType: "exact" };
  }

  // Type compatibility check
  const typeMatches = checkTypeCompatibility(targetType, assetType);
  if (!typeMatches) {
    return { matches: false, matchType: "exact" };
  }

  // Match based on target type
  switch (targetType) {
    case "domain":
    case "subdomain":
    case "certificate":
    case "email_domain": {
      const domain = name || (metadata?.domain as string) || "";
      if (matchDomain(validPattern, domain)) {
        return {
          matches: true,
          matchType: validPattern.includes("*") ? "wildcard" : "exact",
        };
      }
      break;
    }

    case "ip_address": {
      const ip = name || (metadata?.ip as string) || "";
      if (validPattern === ip) {
        return { matches: true, matchType: "exact" };
      }
      break;
    }

    case "ip_range": {
      const ip =
        name ||
        (metadata?.ip as string) ||
        (metadata?.privateIp as string) ||
        (metadata?.publicIp as string) ||
        "";
      if (matchCIDR(validPattern, ip)) {
        return { matches: true, matchType: "cidr" };
      }
      break;
    }

    case "repository": {
      const repo =
        `${metadata?.repoProvider || "github"}.com/${metadata?.org || ""}/${name}` ||
        name;
      if (matchRepository(validPattern, repo)) {
        return {
          matches: true,
          matchType: validPattern.includes("*") ? "wildcard" : "exact",
        };
      }
      break;
    }

    case "cloud_account": {
      const account =
        `${(metadata?.cloudProvider as string)?.toUpperCase() || ""}:${metadata?.accountId || name}`;
      if (matchCloudAccount(validPattern, account)) {
        return { matches: true, matchType: "exact" };
      }
      break;
    }

    case "api":
    case "website":
    case "path": {
      const url = name || (metadata?.url as string) || "";
      if (matchWildcard(validPattern, url)) {
        return {
          matches: true,
          matchType: validPattern.includes("*") ? "wildcard" : "exact",
        };
      }
      break;
    }

    case "container": {
      const image = name || (metadata?.image as string) || "";
      if (matchWildcard(validPattern, image)) {
        return {
          matches: true,
          matchType: validPattern.includes("*") ? "wildcard" : "exact",
        };
      }
      break;
    }

    case "database":
    case "host": {
      const host = name || (metadata?.host as string) || "";
      if (matchWildcard(validPattern, host)) {
        return {
          matches: true,
          matchType: validPattern.includes("*") ? "wildcard" : "exact",
        };
      }
      break;
    }

    default:
      // Generic wildcard match
      if (matchWildcard(validPattern, name)) {
        return {
          matches: true,
          matchType: validPattern.includes("*") ? "wildcard" : "exact",
        };
      }
  }

  return { matches: false, matchType: "exact" };
};

/**
 * Get all matching scope targets for an asset
 */
export const getScopeMatchesForAsset = (
  asset: { id: string; type: string; name: string; metadata?: Record<string, unknown> },
  targets: ScopeTarget[],
  exclusions: ScopeExclusion[]
): ScopeMatchResult => {
  const matchedTargets: ScopeMatchResult["matchedTargets"] = [];
  const matchedExclusions: ScopeMatchResult["matchedExclusions"] = [];

  // Check against all active targets
  for (const target of targets) {
    if (target.status !== "active") continue;

    const { matches, matchType } = matchesScopeTarget(target, asset);
    if (matches) {
      matchedTargets.push({
        targetId: target.id,
        pattern: target.pattern,
        matchType,
      });
    }
  }

  // Check against all active exclusions
  for (const exclusion of exclusions) {
    if (exclusion.status !== "active") continue;

    const { matches } = matchesScopeTarget(
      { ...exclusion, description: "", addedAt: "", addedBy: "" } as ScopeTarget,
      asset
    );
    if (matches) {
      matchedExclusions.push({
        exclusionId: exclusion.id,
        pattern: exclusion.pattern,
        reason: exclusion.reason,
      });
    }
  }

  return {
    assetId: asset.id,
    assetName: asset.name,
    assetType: asset.type,
    matchedTargets,
    matchedExclusions,
    inScope: matchedTargets.length > 0 && matchedExclusions.length === 0,
  };
};

// Simple LRU-like cache for scope coverage calculations
const coverageCache = new Map<string, { result: ScopeCoverage; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds
const MAX_CACHE_SIZE = 100;

/**
 * Generate cache key for coverage calculation
 */
const getCoverageKey = (
  assets: Array<{ id: string }>,
  targets: ScopeTarget[],
  exclusions: ScopeExclusion[]
): string => {
  const assetIds = assets.map((a) => a.id).sort().join(",");
  const targetIds = targets.map((t) => t.id).sort().join(",");
  const exclusionIds = exclusions.map((e) => e.id).sort().join(",");
  return `${assetIds}:${targetIds}:${exclusionIds}`;
};

/**
 * Calculate scope coverage for a list of assets
 * Includes caching for performance optimization
 */
export const calculateScopeCoverage = (
  assets: Array<{ id: string; type: string; name: string; metadata?: Record<string, unknown> }>,
  targets: ScopeTarget[],
  exclusions: ScopeExclusion[]
): ScopeCoverage => {
  // Check cache
  const cacheKey = getCoverageKey(assets, targets, exclusions);
  const cached = coverageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const byType: ScopeCoverage["byType"] = {};
  let inScopeCount = 0;
  let excludedCount = 0;

  for (const asset of assets) {
    // Initialize type stats
    if (!byType[asset.type]) {
      byType[asset.type] = { total: 0, inScope: 0, excluded: 0 };
    }
    byType[asset.type].total++;

    // Get scope match
    const match = getScopeMatchesForAsset(asset, targets, exclusions);

    if (match.matchedExclusions.length > 0) {
      excludedCount++;
      byType[asset.type].excluded++;
    } else if (match.matchedTargets.length > 0) {
      inScopeCount++;
      byType[asset.type].inScope++;
    }
  }

  const totalAssets = assets.length;
  const uncoveredAssets = totalAssets - inScopeCount - excludedCount;
  const coveragePercent =
    totalAssets > 0 ? Math.round((inScopeCount / totalAssets) * 100) : 0;

  const result: ScopeCoverage = {
    totalAssets,
    inScopeAssets: inScopeCount,
    excludedAssets: excludedCount,
    uncoveredAssets,
    coveragePercent,
    byType,
  };

  // Update cache (with size limit)
  if (coverageCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = coverageCache.keys().next().value;
    if (firstKey) coverageCache.delete(firstKey);
  }
  coverageCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
};

/**
 * Clear the coverage cache (useful for testing or forced refresh)
 */
export const clearCoverageCache = (): void => {
  coverageCache.clear();
};

/**
 * Format scope match for display
 */
export const formatScopeMatch = (match: ScopeMatchResult): string => {
  if (match.matchedExclusions.length > 0) {
    return `Excluded: ${match.matchedExclusions[0].reason}`;
  }
  if (match.matchedTargets.length > 0) {
    return `In scope: ${match.matchedTargets.map((t) => t.pattern).join(", ")}`;
  }
  return "Not in scope";
};
