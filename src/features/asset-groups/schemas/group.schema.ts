import { z } from "zod";

/**
 * Zod Schemas for Asset Group validation
 *
 * Note: Types are defined in ../types/asset-group.types.ts
 * These schemas are for runtime validation
 */

// Environment and Criticality enums
export const environmentSchema = z.enum([
  "production",
  "staging",
  "development",
  "testing",
]);

export const criticalitySchema = z.enum(["critical", "high", "medium", "low"]);

// Create Asset Group Schema
export const createAssetGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  environment: environmentSchema,
  criticality: criticalitySchema,
  existingAssetIds: z.array(z.string()).optional(),
  newAssets: z
    .array(
      z.object({
        type: z.string(),
        name: z.string().min(1, "Asset name is required"),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

// Update Asset Group Schema
export const updateAssetGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  environment: environmentSchema.optional(),
  criticality: criticalitySchema.optional(),
});

// Add Assets to Group Schema
export const addAssetsToGroupSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  assetIds: z.array(z.string()).min(1, "At least one asset is required"),
});

// Remove Assets from Group Schema
export const removeAssetsFromGroupSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  assetIds: z.array(z.string()).min(1, "At least one asset is required"),
});

// Move Assets Between Groups Schema
export const moveAssetsBetweenGroupsSchema = z.object({
  sourceGroupId: z.string().min(1, "Source group ID is required"),
  targetGroupId: z.string().min(1, "Target group ID is required"),
  assetIds: z.array(z.string()).min(1, "At least one asset is required"),
});
