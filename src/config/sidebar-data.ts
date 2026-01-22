/**
 * Sidebar Navigation Data
 *
 * Configuration for the application sidebar navigation
 * Aligned with CTEM (Continuous Threat Exposure Management) framework:
 * 1. Scoping - Define attack surface and business context
 * 2. Discovery - Identify assets, vulnerabilities, and exposures
 * 3. Prioritization - Rank risks based on exploitability and impact
 * 4. Validation - Verify threats and test security controls
 * 5. Mobilization - Execute remediation and track progress
 *
 * Note: Features marked as "Soon" are documented in docs/ROADMAP.md
 * and temporarily hidden from navigation.
 */

import {
  LayoutDashboard,
  FolderKanban,
  Target,
  Settings2,
  Radar,
  Globe,
  MonitorSmartphone,
  Container,
  GitBranch,
  Cloud,
  KeyRound,
  BarChart3,
  Building2,
  Swords,
  ShieldCheck,
  ListChecks,
  Workflow,
  FileWarning,
  FileText,
  Users,
  Puzzle,
  Command,
  AudioWaveform,
  Building,
  Zap,
  Server,
  Boxes,
  Database,
  Smartphone,
  Crosshair,
  ClipboardList,
  Bug,
  RotateCcw,
  BookTemplate,
  History,
  Bot,
  FileSliders,
  Wrench,
  // New icons for CTEM architecture
  ShieldAlert,
  Package,
  Scale,
  Download,
  // CTEM Phase 1 icons
  TrendingUp,
  AlertTriangle,
  // Access Control icons
  FolderKey,
  Key,
} from "lucide-react";
import { type SidebarData } from "@/components/types";
import { Permission, Role } from "@/lib/permissions";

// Re-export Permission and Role for convenience
export { Permission, Role };

export const sidebarData: SidebarData = {
  user: {
    name: "Nguyen Van An",
    email: "an.nguyen@company.vn",
    avatar: "",
  },
  teams: [
    {
      name: "Security Platform",
      logo: Command,
      plan: "Enterprise",
    },
    {
      name: "Security Ops",
      logo: AudioWaveform,
      plan: "Team",
    },
  ],
  navGroups: [
    // ========================================
    // DASHBOARD - Overview & Quick Access
    // ========================================
    {
      title: "",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: LayoutDashboard,
          permission: Permission.DashboardRead,
        },
      ],
    },

    // ========================================
    // PHASE 1: SCOPING
    // Define attack surface, business context, and objectives
    // ========================================
    {
      title: "Scoping",
      items: [
        {
          title: "Attack Surface",
          url: "/attack-surface",
          icon: Target,
          permission: Permission.AssetsRead,
        },
        {
          title: "Asset Groups",
          url: "/asset-groups",
          icon: FolderKanban,
          permission: Permission.AssetGroupsRead,
        },
        {
          title: "Scope Config",
          url: "/scope-config",
          icon: Settings2,
          permission: Permission.AssetGroupsRead,
        },
      ],
    },

    // ========================================
    // PHASE 2: DISCOVERY
    // Identify assets, vulnerabilities, misconfigurations, and exposures
    // Three pillars: Assets, Components (SBOM), Identities
    // ========================================
    {
      title: "Discovery",
      items: [
        {
          title: "Scans",
          url: "/scans",
          icon: Radar,
          permission: Permission.ScansRead,
        },
        // ----------------------------------------
        // ASSET INVENTORY
        // Note: New CTEM asset types (certificates, ip_address, cloud_account,
        // compute, storage, serverless, network) are documented in docs/ROADMAP.md
        // ----------------------------------------
        {
          title: "Asset Inventory",
          icon: Container,
          permission: Permission.AssetsRead,
          items: [
            {
              title: "Domains",
              url: "/assets/domains",
              icon: Globe,
            },
            {
              title: "Websites",
              url: "/assets/websites",
              icon: MonitorSmartphone,
            },
            {
              title: "Services",
              url: "/assets/services",
              icon: Zap,
            },
            {
              title: "Repositories",
              url: "/assets/repositories",
              icon: GitBranch,
            },
            {
              title: "Cloud",
              url: "/assets/cloud",
              icon: Cloud,
            },
            {
              title: "Hosts",
              url: "/assets/hosts",
              icon: Server,
            },
            {
              title: "Kubernetes",
              url: "/assets/containers",
              icon: Boxes,
            },
            {
              title: "Databases",
              url: "/assets/databases",
              icon: Database,
            },
            {
              title: "Mobile Apps",
              url: "/assets/mobile",
              icon: Smartphone,
            },
            {
              title: "APIs",
              url: "/assets/apis",
              icon: Zap,
            },
          ],
        },
        // ----------------------------------------
        // EXPOSURES (Non-CVE security issues)
        // ----------------------------------------
        {
          title: "Exposures",
          url: "/exposures",
          icon: AlertTriangle,
          permission: Permission.FindingsRead,
        },
        // ----------------------------------------
        // CREDENTIAL LEAKS
        // ----------------------------------------
        {
          title: "Credential Leaks",
          url: "/credentials",
          icon: KeyRound,
          // Badge is now dynamic - fetched from API via useDynamicBadges hook
          permission: Permission.CredentialsRead,
        },
        // ----------------------------------------
        // SOFTWARE COMPONENTS (SBOM)
        // ----------------------------------------
        {
          title: "Components",
          icon: Package,
          permission: Permission.ComponentsRead,
          items: [
            {
              title: "Overview",
              url: "/components",
              icon: Package,
            },
            {
              title: "All Components",
              url: "/components/all",
              icon: Package,
            },
            {
              title: "Vulnerable",
              url: "/components/vulnerable",
              icon: ShieldAlert,
              badge: "4",
            },
            {
              title: "Ecosystems",
              url: "/components/ecosystems",
              icon: Boxes,
            },
            {
              title: "Licenses",
              url: "/components/licenses",
              icon: Scale,
            },
            {
              title: "SBOM Export",
              url: "/components/sbom-export",
              icon: Download,
            },
          ],
        },
        // ----------------------------------------
        // COMING SOON - Identities
        // See docs/ROADMAP.md for full feature specs
        // ----------------------------------------
      ],
    },

    // ========================================
    // PHASE 3: PRIORITIZATION
    // Rank risks based on exploitability, impact, and threat intelligence
    // ========================================
    {
      title: "Prioritization",
      items: [
        {
          title: "Threat Intel",
          url: "/threat-intel",
          icon: TrendingUp,
          permission: Permission.FindingsRead,
        },
        {
          title: "Risk Analysis",
          url: "/risk-analysis",
          icon: BarChart3,
          permission: Permission.FindingsRead,
        },
        {
          title: "Business Impact",
          url: "/business-impact",
          icon: Building2,
          permission: Permission.FindingsRead,
        },
      ],
    },

    // ========================================
    // PHASE 4: VALIDATION
    // Verify threats and test security controls effectiveness
    // ========================================
    {
      title: "Validation",
      items: [
        {
          title: "Penetration Testing",
          icon: Crosshair,
          permission: Permission.PentestRead,
          items: [
            {
              title: "Campaigns",
              url: "/pentest/campaigns",
              icon: ClipboardList,
            },
            {
              title: "Findings",
              url: "/pentest/findings",
              icon: Bug,
              badge: "12",
            },
            {
              title: "Retests",
              url: "/pentest/retests",
              icon: RotateCcw,
            },
            {
              title: "Reports",
              url: "/pentest/reports",
              icon: FileText,
            },
            {
              title: "Templates",
              url: "/pentest/templates",
              icon: BookTemplate,
            },
          ],
        },
        {
          title: "Attack Simulation",
          url: "/attack-simulation",
          icon: Swords,
          permission: Permission.PentestRead,
        },
        {
          title: "Control Testing",
          url: "/control-testing",
          icon: ShieldCheck,
          permission: Permission.PentestRead,
        },
      ],
    },

    // ========================================
    // PHASE 5: MOBILIZATION
    // Execute remediation and track progress
    // ========================================
    {
      title: "Mobilization",
      items: [
        {
          title: "Remediation Tasks",
          url: "/remediation",
          icon: ListChecks,
          badge: "24",
          permission: Permission.RemediationRead,
        },
        {
          title: "Workflows",
          url: "/workflows",
          icon: Workflow,
          permission: Permission.WorkflowsRead,
        },
      ],
    },

    // ========================================
    // INSIGHTS - Cross-cutting analytics and reporting
    // ========================================
    {
      title: "Insights",
      items: [
        {
          title: "Findings",
          url: "/findings",
          icon: FileWarning,
          // Badge is dynamically fetched from dashboard stats - see useDynamicBadges hook
          permission: Permission.FindingsRead,
        },
        {
          title: "Reports",
          url: "/reports",
          icon: FileText,
          permission: Permission.ReportsRead,
        },
      ],
    },

    // ========================================
    // SETTINGS - System configuration
    // ========================================
    {
      title: "Settings",
      items: [
        {
          title: "Scanning",
          icon: Radar,
          permission: Permission.ScansRead,
          items: [
            {
              title: "Agents",
              url: "/agents",
              icon: Bot,
              permission: Permission.ScansRead,
            },
            {
              title: "Scan Profiles",
              url: "/scan-profiles",
              icon: FileSliders,
              permission: Permission.ScanProfilesRead,
            },
            {
              title: "Tool Registry",
              url: "/tools",
              icon: Wrench,
              permission: Permission.ToolsRead,
            },
          ],
        },
        {
          title: "Organization",
          icon: Building,
          permission: Permission.TeamRead,
          items: [
            {
              title: "General",
              url: "/settings/tenant",
              icon: Building,
              // Only admin and owner can modify tenant settings
              minRole: Role.Admin,
            },
            {
              title: "Members",
              url: "/settings/users",
              icon: Users,
              permission: Permission.MembersRead,
            },
            {
              title: "Roles",
              url: "/settings/roles",
              icon: Key,
              permission: Permission.RolesRead,
              minRole: Role.Admin,
            },
            {
              title: "Teams",
              url: "/settings/teams",
              icon: FolderKey,
              permission: Permission.GroupsRead,
              minRole: Role.Admin,
            },
            {
              title: "Audit Log",
              url: "/settings/audit",
              icon: History,
              // Audit log is restricted to admin and owner
              minRole: Role.Admin,
              permission: Permission.AuditRead,
            },
            // Billing temporarily hidden - coming soon
            // {
            //   title: "Billing",
            //   url: "/settings/billing",
            //   icon: CreditCard,
            //   minRole: Role.Admin,
            //   permission: Permission.BillingRead,
            // },
          ],
        },
        {
          title: "Integrations",
          url: "/settings/integrations",
          icon: Puzzle,
          // Integrations management requires admin or higher
          minRole: Role.Admin,
          permission: Permission.IntegrationsRead,
        },
      ],
    },
  ],
};
