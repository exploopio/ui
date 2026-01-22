/**
 * Permission & Role Constants
 *
 * These constants mirror the backend definitions.
 * Use these for type-safe permission and role checking.
 *
 * Permissions Pattern: resource:action
 * - resource: The entity type (assets, projects, findings, etc.)
 * - action: The operation (read, write, delete)
 *
 * Roles: owner, admin, member, viewer
 * - Use roles for high-level access checks (e.g., "is owner")
 * - Use permissions for granular feature access (e.g., "can write assets")
 */

/**
 * Role Constants
 * Match backend tenant.Role values
 */
export const Role = {
  Owner: 'owner',
  Admin: 'admin',
  Member: 'member',
  Viewer: 'viewer',
} as const

export type RoleString = (typeof Role)[keyof typeof Role]

/**
 * All roles for validation
 */
export const AllRoles = Object.values(Role)

/**
 * Check if a string is a valid role
 */
export function isValidRole(value: string): value is RoleString {
  return AllRoles.includes(value as RoleString)
}

/**
 * Role hierarchy for comparison
 * Higher index = more privileges
 */
export const RoleHierarchy: Record<RoleString, number> = {
  [Role.Viewer]: 0,
  [Role.Member]: 1,
  [Role.Admin]: 2,
  [Role.Owner]: 3,
}

/**
 * Check if a role has at least the same privileges as another
 * e.g., isRoleAtLeast('admin', 'member') => true
 */
export function isRoleAtLeast(userRole: string, requiredRole: RoleString): boolean {
  const userLevel = RoleHierarchy[userRole as RoleString] ?? -1
  const requiredLevel = RoleHierarchy[requiredRole] ?? -1
  return userLevel >= requiredLevel
}

export const Permission = {
  // Asset permissions
  AssetsRead: 'assets:read',
  AssetsWrite: 'assets:write',
  AssetsDelete: 'assets:delete',

  // Project permissions
  ProjectsRead: 'projects:read',
  ProjectsWrite: 'projects:write',
  ProjectsDelete: 'projects:delete',

  // Component permissions
  ComponentsRead: 'components:read',
  ComponentsWrite: 'components:write',
  ComponentsDelete: 'components:delete',

  // Finding permissions (tenant-scoped vulnerability instances)
  FindingsRead: 'findings:read',
  FindingsWrite: 'findings:write',
  FindingsDelete: 'findings:delete',

  // Vulnerability permissions (global CVE database)
  VulnerabilitiesRead: 'vulnerabilities:read',
  VulnerabilitiesWrite: 'vulnerabilities:write',
  VulnerabilitiesDelete: 'vulnerabilities:delete',

  // Dashboard permissions
  DashboardRead: 'dashboard:read',

  // Scan permissions (binding asset groups + scanners/workflows + schedules)
  ScansRead: 'scans:read',
  ScansWrite: 'scans:write',
  ScansDelete: 'scans:delete',

  // Scan Profile permissions (reusable scan configurations)
  ScanProfilesRead: 'scan-profiles:read',
  ScanProfilesWrite: 'scan-profiles:write',
  ScanProfilesDelete: 'scan-profiles:delete',

  // Tool Registry permissions (system-wide tool definitions)
  ToolsRead: 'tools:read',
  ToolsWrite: 'tools:write',
  ToolsDelete: 'tools:delete',

  // Tenant Tool Config permissions (tenant-specific tool configurations)
  TenantToolsRead: 'tenant-tools:read',
  TenantToolsWrite: 'tenant-tools:write',
  TenantToolsDelete: 'tenant-tools:delete',

  // Credential leak permissions
  CredentialsRead: 'credentials:read',
  CredentialsWrite: 'credentials:write',

  // Report permissions
  ReportsRead: 'reports:read',
  ReportsWrite: 'reports:write',

  // Pentest permissions
  PentestRead: 'pentest:read',
  PentestWrite: 'pentest:write',

  // Remediation permissions
  RemediationRead: 'remediation:read',
  RemediationWrite: 'remediation:write',

  // Workflow permissions
  WorkflowsRead: 'workflows:read',
  WorkflowsWrite: 'workflows:write',

  // Team/Member management permissions
  MembersRead: 'members:read',
  MembersInvite: 'members:invite',
  MembersManage: 'members:manage',

  // Team settings permissions
  TeamRead: 'team:read',
  TeamUpdate: 'team:update',
  TeamDelete: 'team:delete',

  // Billing permissions
  BillingRead: 'billing:read',
  BillingManage: 'billing:manage',

  // Integration permissions
  IntegrationsRead: 'integrations:read',
  IntegrationsManage: 'integrations:manage',

  // Audit log permissions
  AuditRead: 'audit:read',

  // Asset Groups permissions (legacy asset grouping)
  AssetGroupsRead: 'asset-groups:read',
  AssetGroupsWrite: 'asset-groups:write',
  AssetGroupsDelete: 'asset-groups:delete',

  // Groups permissions (access control groups)
  GroupsRead: 'groups:read',
  GroupsWrite: 'groups:write',
  GroupsDelete: 'groups:delete',
  GroupsMembers: 'groups:members',
  GroupsPermissions: 'groups:permissions',

  // Permission Sets permissions
  PermissionSetsRead: 'permission-sets:read',
  PermissionSetsWrite: 'permission-sets:write',
  PermissionSetsDelete: 'permission-sets:delete',

  // Roles permissions (database-driven RBAC)
  RolesRead: 'roles:read',
  RolesWrite: 'roles:write',
  RolesDelete: 'roles:delete',
  RolesAssign: 'roles:assign',

  // Assignment Rules permissions
  AssignmentRulesRead: 'assignment-rules:read',
  AssignmentRulesWrite: 'assignment-rules:write',
  AssignmentRulesDelete: 'assignment-rules:delete',

  // Agents permissions
  AgentsRead: 'agents:read',
  AgentsWrite: 'agents:write',
  AgentsDelete: 'agents:delete',

  // SCM Connections permissions
  ScmConnectionsRead: 'scm-connections:read',
  ScmConnectionsWrite: 'scm-connections:write',
  ScmConnectionsDelete: 'scm-connections:delete',

  // Sources permissions (data sources)
  SourcesRead: 'sources:read',
  SourcesWrite: 'sources:write',
  SourcesDelete: 'sources:delete',

  // Commands permissions
  CommandsRead: 'commands:read',
  CommandsWrite: 'commands:write',
  CommandsDelete: 'commands:delete',

  // Pipelines permissions
  PipelinesRead: 'pipelines:read',
  PipelinesWrite: 'pipelines:write',
  PipelinesDelete: 'pipelines:delete',
} as const

/**
 * Permission string type
 */
export type PermissionString = (typeof Permission)[keyof typeof Permission]

/**
 * All permission values as an array
 */
export const AllPermissions = Object.values(Permission)

/**
 * Check if a string is a valid permission
 */
export function isValidPermission(value: string): value is PermissionString {
  return AllPermissions.includes(value as PermissionString)
}

/**
 * Permission groups for common use cases
 */
export const PermissionGroups = {
  // All read permissions
  AllRead: [
    Permission.AssetsRead,
    Permission.ProjectsRead,
    Permission.ComponentsRead,
    Permission.FindingsRead,
    Permission.VulnerabilitiesRead,
    Permission.DashboardRead,
    Permission.ScansRead,
    Permission.CredentialsRead,
    Permission.ReportsRead,
    Permission.PentestRead,
    Permission.RemediationRead,
    Permission.WorkflowsRead,
    Permission.MembersRead,
    Permission.TeamRead,
    Permission.IntegrationsRead,
  ],

  // All write permissions
  AllWrite: [
    Permission.AssetsWrite,
    Permission.ProjectsWrite,
    Permission.ComponentsWrite,
    Permission.FindingsWrite,
    Permission.ScansWrite,
    Permission.CredentialsWrite,
    Permission.ReportsWrite,
    Permission.PentestWrite,
    Permission.RemediationWrite,
    Permission.WorkflowsWrite,
  ],

  // All delete permissions
  AllDelete: [
    Permission.AssetsDelete,
    Permission.ProjectsDelete,
    Permission.ComponentsDelete,
    Permission.FindingsDelete,
  ],

  // Team management permissions
  TeamManagement: [
    Permission.MembersRead,
    Permission.MembersInvite,
    Permission.MembersManage,
    Permission.TeamRead,
    Permission.TeamUpdate,
  ],

  // Security/vulnerability permissions
  Security: [
    Permission.FindingsRead,
    Permission.FindingsWrite,
    Permission.FindingsDelete,
    Permission.VulnerabilitiesRead,
    Permission.PentestRead,
    Permission.PentestWrite,
    Permission.CredentialsRead,
  ],
} as const

/**
 * Human-readable permission labels for UI display
 * Used in tooltips when user lacks permission
 */
export const PermissionLabels: Partial<Record<PermissionString, string>> = {
  // Assets
  [Permission.AssetsRead]: 'View Assets',
  [Permission.AssetsWrite]: 'Edit Assets',
  [Permission.AssetsDelete]: 'Delete Assets',

  // Projects
  [Permission.ProjectsRead]: 'View Projects',
  [Permission.ProjectsWrite]: 'Edit Projects',
  [Permission.ProjectsDelete]: 'Delete Projects',

  // Components
  [Permission.ComponentsRead]: 'View Components',
  [Permission.ComponentsWrite]: 'Edit Components',
  [Permission.ComponentsDelete]: 'Delete Components',

  // Findings
  [Permission.FindingsRead]: 'View Findings',
  [Permission.FindingsWrite]: 'Edit Findings',
  [Permission.FindingsDelete]: 'Delete Findings',

  // Vulnerabilities
  [Permission.VulnerabilitiesRead]: 'View Vulnerabilities',
  [Permission.VulnerabilitiesWrite]: 'Edit Vulnerabilities',
  [Permission.VulnerabilitiesDelete]: 'Delete Vulnerabilities',

  // Dashboard
  [Permission.DashboardRead]: 'View Dashboard',

  // Scans
  [Permission.ScansRead]: 'View Scans',
  [Permission.ScansWrite]: 'Manage Scans',
  [Permission.ScansDelete]: 'Delete Scans',

  // Scan Profiles
  [Permission.ScanProfilesRead]: 'View Scan Profiles',
  [Permission.ScanProfilesWrite]: 'Manage Scan Profiles',
  [Permission.ScanProfilesDelete]: 'Delete Scan Profiles',

  // Tools
  [Permission.ToolsRead]: 'View Tools',
  [Permission.ToolsWrite]: 'Manage Tools',
  [Permission.ToolsDelete]: 'Delete Tools',
  [Permission.TenantToolsRead]: 'View Tool Configs',
  [Permission.TenantToolsWrite]: 'Manage Tool Configs',
  [Permission.TenantToolsDelete]: 'Delete Tool Configs',

  // Credentials
  [Permission.CredentialsRead]: 'View Credentials',
  [Permission.CredentialsWrite]: 'Manage Credentials',

  // Reports
  [Permission.ReportsRead]: 'View Reports',
  [Permission.ReportsWrite]: 'Create Reports',

  // Pentest
  [Permission.PentestRead]: 'View Pentests',
  [Permission.PentestWrite]: 'Manage Pentests',

  // Remediation
  [Permission.RemediationRead]: 'View Remediation',
  [Permission.RemediationWrite]: 'Manage Remediation',

  // Workflows
  [Permission.WorkflowsRead]: 'View Workflows',
  [Permission.WorkflowsWrite]: 'Manage Workflows',

  // Members
  [Permission.MembersRead]: 'View Members',
  [Permission.MembersInvite]: 'Invite Members',
  [Permission.MembersManage]: 'Manage Members',

  // Team
  [Permission.TeamRead]: 'View Team Settings',
  [Permission.TeamUpdate]: 'Update Team Settings',
  [Permission.TeamDelete]: 'Delete Team',

  // Billing
  [Permission.BillingRead]: 'View Billing',
  [Permission.BillingManage]: 'Manage Billing',

  // Integrations
  [Permission.IntegrationsRead]: 'View Integrations',
  [Permission.IntegrationsManage]: 'Manage Integrations',

  // Audit
  [Permission.AuditRead]: 'View Audit Logs',

  // Asset Groups
  [Permission.AssetGroupsRead]: 'View Asset Groups',
  [Permission.AssetGroupsWrite]: 'Manage Asset Groups',
  [Permission.AssetGroupsDelete]: 'Delete Asset Groups',

  // Groups (Access Control)
  [Permission.GroupsRead]: 'View Groups',
  [Permission.GroupsWrite]: 'Manage Groups',
  [Permission.GroupsDelete]: 'Delete Groups',
  [Permission.GroupsMembers]: 'Manage Group Members',
  [Permission.GroupsPermissions]: 'Manage Group Permissions',

  // Permission Sets
  [Permission.PermissionSetsRead]: 'View Permission Sets',
  [Permission.PermissionSetsWrite]: 'Manage Permission Sets',
  [Permission.PermissionSetsDelete]: 'Delete Permission Sets',

  // Roles
  [Permission.RolesRead]: 'View Roles',
  [Permission.RolesWrite]: 'Manage Roles',
  [Permission.RolesDelete]: 'Delete Roles',
  [Permission.RolesAssign]: 'Assign Roles',

  // Assignment Rules
  [Permission.AssignmentRulesRead]: 'View Assignment Rules',
  [Permission.AssignmentRulesWrite]: 'Manage Assignment Rules',
  [Permission.AssignmentRulesDelete]: 'Delete Assignment Rules',

  // Agents
  [Permission.AgentsRead]: 'View Agents',
  [Permission.AgentsWrite]: 'Manage Agents',
  [Permission.AgentsDelete]: 'Delete Agents',

  // SCM Connections
  [Permission.ScmConnectionsRead]: 'View SCM Connections',
  [Permission.ScmConnectionsWrite]: 'Manage SCM Connections',
  [Permission.ScmConnectionsDelete]: 'Delete SCM Connections',

  // Sources
  [Permission.SourcesRead]: 'View Sources',
  [Permission.SourcesWrite]: 'Manage Sources',
  [Permission.SourcesDelete]: 'Delete Sources',

  // Commands
  [Permission.CommandsRead]: 'View Commands',
  [Permission.CommandsWrite]: 'Manage Commands',
  [Permission.CommandsDelete]: 'Delete Commands',

  // Pipelines
  [Permission.PipelinesRead]: 'View Pipelines',
  [Permission.PipelinesWrite]: 'Manage Pipelines',
  [Permission.PipelinesDelete]: 'Delete Pipelines',
}

/**
 * Get human-readable label for a permission
 * Falls back to formatted permission string if no label defined
 */
export function getPermissionLabel(permission: string): string {
  const label = PermissionLabels[permission as PermissionString]
  if (label) return label

  // Fallback: format permission string (e.g., "assets:write" -> "Assets Write")
  return permission
    .split(':')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Role to Permissions mapping
 * Maps each role to its default permissions.
 * This mirrors the backend role_mapping.go to enable client-side permission derivation.
 */
export const RolePermissions: Record<RoleString, PermissionString[]> = {
  [Role.Owner]: [
    // Full resource access
    Permission.AssetsRead, Permission.AssetsWrite, Permission.AssetsDelete,
    Permission.ProjectsRead, Permission.ProjectsWrite, Permission.ProjectsDelete,
    Permission.ComponentsRead, Permission.ComponentsWrite, Permission.ComponentsDelete,
    Permission.FindingsRead, Permission.FindingsWrite, Permission.FindingsDelete,
    Permission.VulnerabilitiesRead,
    Permission.DashboardRead,
    // Asset Groups
    Permission.AssetGroupsRead, Permission.AssetGroupsWrite, Permission.AssetGroupsDelete,
    // Audit logs
    Permission.AuditRead,
    // Scans
    Permission.ScansRead, Permission.ScansWrite, Permission.ScansDelete,
    // Scan Profiles
    Permission.ScanProfilesRead, Permission.ScanProfilesWrite, Permission.ScanProfilesDelete,
    // Tool Registry
    Permission.ToolsRead, Permission.ToolsWrite, Permission.ToolsDelete,
    Permission.TenantToolsRead, Permission.TenantToolsWrite, Permission.TenantToolsDelete,
    // Credentials
    Permission.CredentialsRead, Permission.CredentialsWrite,
    // Reports
    Permission.ReportsRead, Permission.ReportsWrite,
    // Pentest
    Permission.PentestRead, Permission.PentestWrite,
    // Remediation
    Permission.RemediationRead, Permission.RemediationWrite,
    // Workflows
    Permission.WorkflowsRead, Permission.WorkflowsWrite,
    // Full team management
    Permission.MembersRead, Permission.MembersInvite, Permission.MembersManage,
    Permission.TeamRead, Permission.TeamUpdate, Permission.TeamDelete,
    // Billing
    Permission.BillingRead, Permission.BillingManage,
    // Integrations
    Permission.IntegrationsRead, Permission.IntegrationsManage,
    // Access Control - Groups
    Permission.GroupsRead, Permission.GroupsWrite, Permission.GroupsDelete,
    Permission.GroupsMembers, Permission.GroupsPermissions,
    // Access Control - Permission Sets
    Permission.PermissionSetsRead, Permission.PermissionSetsWrite, Permission.PermissionSetsDelete,
    // Access Control - Roles
    Permission.RolesRead, Permission.RolesWrite, Permission.RolesDelete, Permission.RolesAssign,
    // Access Control - Assignment Rules
    Permission.AssignmentRulesRead, Permission.AssignmentRulesWrite, Permission.AssignmentRulesDelete,
    // Agents
    Permission.AgentsRead, Permission.AgentsWrite, Permission.AgentsDelete,
    // SCM Connections
    Permission.ScmConnectionsRead, Permission.ScmConnectionsWrite, Permission.ScmConnectionsDelete,
    // Sources
    Permission.SourcesRead, Permission.SourcesWrite, Permission.SourcesDelete,
    // Commands
    Permission.CommandsRead, Permission.CommandsWrite, Permission.CommandsDelete,
    // Pipelines
    Permission.PipelinesRead, Permission.PipelinesWrite, Permission.PipelinesDelete,
  ],

  [Role.Admin]: [
    // Full resource access
    Permission.AssetsRead, Permission.AssetsWrite, Permission.AssetsDelete,
    Permission.ProjectsRead, Permission.ProjectsWrite, Permission.ProjectsDelete,
    Permission.ComponentsRead, Permission.ComponentsWrite, Permission.ComponentsDelete,
    Permission.FindingsRead, Permission.FindingsWrite, Permission.FindingsDelete,
    Permission.VulnerabilitiesRead,
    Permission.DashboardRead,
    // Asset Groups
    Permission.AssetGroupsRead, Permission.AssetGroupsWrite, Permission.AssetGroupsDelete,
    // Audit logs
    Permission.AuditRead,
    // Scans
    Permission.ScansRead, Permission.ScansWrite, Permission.ScansDelete,
    // Scan Profiles
    Permission.ScanProfilesRead, Permission.ScanProfilesWrite, Permission.ScanProfilesDelete,
    // Tool Registry (admin can manage tenant tools)
    Permission.ToolsRead, Permission.ToolsWrite, Permission.ToolsDelete,
    Permission.TenantToolsRead, Permission.TenantToolsWrite, Permission.TenantToolsDelete,
    // Credentials
    Permission.CredentialsRead, Permission.CredentialsWrite,
    // Reports
    Permission.ReportsRead, Permission.ReportsWrite,
    // Pentest
    Permission.PentestRead, Permission.PentestWrite,
    // Remediation
    Permission.RemediationRead, Permission.RemediationWrite,
    // Workflows
    Permission.WorkflowsRead, Permission.WorkflowsWrite,
    // Member management (can invite and manage, but not delete team)
    Permission.MembersRead, Permission.MembersInvite, Permission.MembersManage,
    Permission.TeamRead, Permission.TeamUpdate,
    // Billing read only
    Permission.BillingRead,
    // Integrations
    Permission.IntegrationsRead, Permission.IntegrationsManage,
    // Access Control - Groups (admin can manage)
    Permission.GroupsRead, Permission.GroupsWrite, Permission.GroupsDelete,
    Permission.GroupsMembers, Permission.GroupsPermissions,
    // Access Control - Permission Sets (admin can manage)
    Permission.PermissionSetsRead, Permission.PermissionSetsWrite, Permission.PermissionSetsDelete,
    // Access Control - Roles (admin can manage)
    Permission.RolesRead, Permission.RolesWrite, Permission.RolesDelete, Permission.RolesAssign,
    // Access Control - Assignment Rules (admin can manage)
    Permission.AssignmentRulesRead, Permission.AssignmentRulesWrite, Permission.AssignmentRulesDelete,
    // Agents
    Permission.AgentsRead, Permission.AgentsWrite, Permission.AgentsDelete,
    // SCM Connections
    Permission.ScmConnectionsRead, Permission.ScmConnectionsWrite, Permission.ScmConnectionsDelete,
    // Sources
    Permission.SourcesRead, Permission.SourcesWrite, Permission.SourcesDelete,
    // Commands
    Permission.CommandsRead, Permission.CommandsWrite, Permission.CommandsDelete,
    // Pipelines
    Permission.PipelinesRead, Permission.PipelinesWrite, Permission.PipelinesDelete,
  ],

  [Role.Member]: [
    // Read + Write (no delete)
    Permission.AssetsRead, Permission.AssetsWrite,
    Permission.ProjectsRead, Permission.ProjectsWrite,
    Permission.ComponentsRead, Permission.ComponentsWrite,
    Permission.FindingsRead, Permission.FindingsWrite,
    Permission.VulnerabilitiesRead,
    Permission.DashboardRead,
    // Asset Groups (read + write)
    Permission.AssetGroupsRead, Permission.AssetGroupsWrite,
    // Scans (read + write)
    Permission.ScansRead, Permission.ScansWrite,
    // Scan Profiles (read + write, no delete)
    Permission.ScanProfilesRead, Permission.ScanProfilesWrite,
    // Tool Registry (read + tenant config write)
    Permission.ToolsRead,
    Permission.TenantToolsRead, Permission.TenantToolsWrite,
    // Credentials (read only)
    Permission.CredentialsRead,
    // Reports (read + write)
    Permission.ReportsRead, Permission.ReportsWrite,
    // Pentest (read + write)
    Permission.PentestRead, Permission.PentestWrite,
    // Remediation (read + write)
    Permission.RemediationRead, Permission.RemediationWrite,
    // Workflows (read only)
    Permission.WorkflowsRead,
    // Can view members but not manage
    Permission.MembersRead,
    Permission.TeamRead,
    // Integrations (read only)
    Permission.IntegrationsRead,
    // Access Control - Groups (read only for members)
    Permission.GroupsRead,
    // Access Control - Roles (read only for members)
    Permission.RolesRead,
    // Agents (read only)
    Permission.AgentsRead,
    // SCM Connections (read only)
    Permission.ScmConnectionsRead,
    // Sources (read + write)
    Permission.SourcesRead, Permission.SourcesWrite,
    // Commands (read + write)
    Permission.CommandsRead, Permission.CommandsWrite,
    // Pipelines (read only)
    Permission.PipelinesRead,
  ],

  [Role.Viewer]: [
    // Read-only access
    Permission.AssetsRead,
    Permission.ProjectsRead,
    Permission.ComponentsRead,
    Permission.FindingsRead,
    Permission.VulnerabilitiesRead,
    Permission.DashboardRead,
    // Asset Groups (read only)
    Permission.AssetGroupsRead,
    // Scans (read only)
    Permission.ScansRead,
    // Scan Profiles (read only)
    Permission.ScanProfilesRead,
    // Tool Registry (read only)
    Permission.ToolsRead,
    Permission.TenantToolsRead,
    // Credentials (read only)
    Permission.CredentialsRead,
    // Reports (read only)
    Permission.ReportsRead,
    // Pentest (read only)
    Permission.PentestRead,
    // Remediation (read only)
    Permission.RemediationRead,
    // Workflows (read only)
    Permission.WorkflowsRead,
    // Can view team info
    Permission.MembersRead,
    Permission.TeamRead,
    // Integrations (read only)
    Permission.IntegrationsRead,
    // Access Control - Groups (read only)
    Permission.GroupsRead,
    // Access Control - Roles (read only)
    Permission.RolesRead,
    // Agents (read only)
    Permission.AgentsRead,
    // Sources (read only)
    Permission.SourcesRead,
    // Commands (read only)
    Permission.CommandsRead,
    // Pipelines (read only)
    Permission.PipelinesRead,
  ],
}
