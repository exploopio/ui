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
    // Audit logs
    Permission.AuditRead,
    // Scans
    Permission.ScansRead, Permission.ScansWrite,
    // Scan Profiles
    Permission.ScanProfilesRead, Permission.ScanProfilesWrite, Permission.ScanProfilesDelete,
    // Tool Registry
    Permission.ToolsRead, Permission.ToolsWrite, Permission.ToolsDelete,
    Permission.TenantToolsRead, Permission.TenantToolsWrite, Permission.TenantToolsDelete,
    // Scan Configurations
    Permission.ScansRead, Permission.ScansWrite, Permission.ScansDelete,
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
  ],

  [Role.Admin]: [
    // Full resource access
    Permission.AssetsRead, Permission.AssetsWrite, Permission.AssetsDelete,
    Permission.ProjectsRead, Permission.ProjectsWrite, Permission.ProjectsDelete,
    Permission.ComponentsRead, Permission.ComponentsWrite, Permission.ComponentsDelete,
    Permission.FindingsRead, Permission.FindingsWrite, Permission.FindingsDelete,
    Permission.VulnerabilitiesRead,
    Permission.DashboardRead,
    // Audit logs
    Permission.AuditRead,
    // Scans
    Permission.ScansRead, Permission.ScansWrite,
    // Scan Profiles
    Permission.ScanProfilesRead, Permission.ScanProfilesWrite, Permission.ScanProfilesDelete,
    // Tool Registry (admin can manage tenant tools)
    Permission.ToolsRead, Permission.ToolsWrite, Permission.ToolsDelete,
    Permission.TenantToolsRead, Permission.TenantToolsWrite, Permission.TenantToolsDelete,
    // Scan Configurations
    Permission.ScansRead, Permission.ScansWrite, Permission.ScansDelete,
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
  ],

  [Role.Member]: [
    // Read + Write (no delete)
    Permission.AssetsRead, Permission.AssetsWrite,
    Permission.ProjectsRead, Permission.ProjectsWrite,
    Permission.ComponentsRead, Permission.ComponentsWrite,
    Permission.FindingsRead, Permission.FindingsWrite,
    Permission.VulnerabilitiesRead,
    Permission.DashboardRead,
    // Scans (read + write)
    Permission.ScansRead, Permission.ScansWrite,
    // Scan Profiles (read + write, no delete)
    Permission.ScanProfilesRead, Permission.ScanProfilesWrite,
    // Tool Registry (read + tenant config write)
    Permission.ToolsRead,
    Permission.TenantToolsRead, Permission.TenantToolsWrite,
    // Scan Configurations (read + write, no delete)
    Permission.ScansRead, Permission.ScansWrite,
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
  ],

  [Role.Viewer]: [
    // Read-only access
    Permission.AssetsRead,
    Permission.ProjectsRead,
    Permission.ComponentsRead,
    Permission.FindingsRead,
    Permission.VulnerabilitiesRead,
    Permission.DashboardRead,
    // Scans (read only)
    Permission.ScansRead,
    // Scan Profiles (read only)
    Permission.ScanProfilesRead,
    // Tool Registry (read only)
    Permission.ToolsRead,
    Permission.TenantToolsRead,
    // Scan Configurations (read only)
    Permission.ScansRead,
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
  ],
}
