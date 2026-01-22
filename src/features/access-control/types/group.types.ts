/**
 * Group Types for Access Control
 *
 * Groups are used to organize users and manage access to assets.
 * Each group can have members with different roles and assigned permission sets.
 */

/**
 * Group type classification
 */
export type GroupType = 'security_team' | 'asset_owner' | 'team' | 'department' | 'project' | 'external' | 'custom';

/**
 * Member role within a group
 */
export type GroupMemberRole = 'admin' | 'member';

/**
 * Group entity
 */
export interface Group {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  description: string;
  group_type: GroupType;
  // Alias for backward compatibility in UI
  type?: GroupType;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Computed fields from API
  member_count?: number;
  asset_count?: number;
  permission_set_count?: number;
}

/**
 * Group member - a user's membership in a group
 */
export interface GroupMember {
  id: string; // May be missing in flat response
  group_id: string; // May be missing
  user_id: string;
  role: GroupMemberRole;
  joined_at: string;
  added_by?: string;
  // Backend standard response fields
  name: string;
  email: string;
  avatar_url?: string;
  // Legacy/Alternative fields (keep for safety)
  user_name?: string;
  user_email?: string;
  user_avatar_url?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  };
}

/**
 * Group with full details including members and permission sets
 */
export interface GroupWithDetails extends Group {
  members: GroupMember[];
  permission_sets: GroupPermissionSet[];
  assets?: GroupAsset[];
}

/**
 * Permission set assigned to a group
 */
export interface GroupPermissionSet {
  id: string;
  group_id: string;
  permission_set_id: string;
  assigned_at: string;
  assigned_by: string;
  // Flattened permission set fields from API join
  name: string;
  description?: string;
  is_system: boolean;
  permission_count: number;
  // Or nested permission set object (alternative response format)
  permission_set?: {
    id: string;
    name: string;
    description: string;
    is_system: boolean;
  };
}

/**
 * Asset ownership by a group
 */
export type AssetOwnershipType = 'primary' | 'shared';

export interface GroupAsset {
  id: string;
  group_id: string;
  asset_id: string;
  ownership_type: AssetOwnershipType;
  assigned_at: string;
  assigned_by: string;
  // Populated from asset
  asset?: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
}

/**
 * Input types for API operations
 */
export interface CreateGroupInput {
  slug: string;
  name: string;
  description?: string;
  group_type: GroupType;
}

export interface UpdateGroupInput {
  slug?: string;
  name?: string;
  description?: string;
  group_type?: GroupType;
}

export interface AddGroupMemberInput {
  user_id: string;
  role: GroupMemberRole;
}

export interface UpdateGroupMemberInput {
  role: GroupMemberRole;
}

export interface AssignAssetInput {
  asset_id: string;
  ownership_type: AssetOwnershipType;
}

export interface AssignPermissionSetInput {
  permission_set_id: string;
}

/**
 * Filter options for listing groups
 */
export interface GroupFilters {
  type?: GroupType;
  search?: string;
}

/**
 * Group type display configuration
 */
export const GroupTypeConfig: Record<GroupType, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  security_team: {
    label: 'Security Team',
    description: 'Teams focused on security operations (SOC, AppSec, Pentest, etc.)',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  asset_owner: {
    label: 'Asset Owner',
    description: 'Groups that own and manage specific assets',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  team: {
    label: 'Development',
    description: 'Development teams owning code repositories and applications',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  department: {
    label: 'Department',
    description: 'Organizational departments for company structure',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  project: {
    label: 'Project',
    description: 'Project-specific teams for temporary initiatives',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  external: {
    label: 'External',
    description: 'External partners, vendors, or contractors',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  custom: {
    label: 'Custom',
    description: 'Custom groups for specific use cases',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
};

/**
 * Member role display configuration
 */
export const MemberRoleConfig: Record<GroupMemberRole, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  admin: {
    label: 'Admin',
    description: 'Can manage group members and settings',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
  },
  member: {
    label: 'Member',
    description: 'Regular group member',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/20',
  },
};
