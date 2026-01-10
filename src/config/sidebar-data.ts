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
  Play,
  CreditCard,
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
  // New icons for CTEM architecture
  ShieldAlert,
  Network,
  HardDrive,
  Cpu,
  Package,
  UserCog,
  Key,
  Bot,
  Lock,
  AlertTriangle,
  FileCode,
  Scale,
  Download,
} from "lucide-react";
import { type SidebarData } from "@/components/types";

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
        },
        {
          title: "Asset Groups",
          url: "/asset-groups",
          icon: FolderKanban,
          badge: "9",
        },
        {
          title: "Scope Config",
          url: "/scope-config",
          icon: Settings2,
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
          title: "Scan Management",
          url: "/scans",
          icon: Radar,
        },
        {
          title: "Runners",
          url: "/runners",
          icon: Play,
        },
        // ----------------------------------------
        // ASSET INVENTORY
        // Note: New CTEM asset types (certificates, ip_address, cloud_account,
        // compute, storage, serverless, network) are documented in docs/ROADMAP.md
        // ----------------------------------------
        {
          title: "Asset Inventory",
          icon: Container,
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
        // CREDENTIAL LEAKS
        // ----------------------------------------
        {
          title: "Credential Leaks",
          url: "/credentials",
          icon: KeyRound,
          badge: "7",
        },
        // ----------------------------------------
        // SOFTWARE COMPONENTS (SBOM)
        // ----------------------------------------
        {
          title: "Components",
          icon: Package,
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
          title: "Risk Analysis",
          url: "/risk-analysis",
          icon: BarChart3,
        },
        {
          title: "Business Impact",
          url: "/business-impact",
          icon: Building2,
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
        },
        {
          title: "Control Testing",
          url: "/control-testing",
          icon: ShieldCheck,
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
        },
        {
          title: "Workflows",
          url: "/workflows",
          icon: Workflow,
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
          badge: "24",
        },
        {
          title: "Reports",
          url: "/reports",
          icon: FileText,
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
          title: "Organization",
          icon: Building,
          items: [
            {
              title: "Tenant Settings",
              url: "/settings/tenant",
              icon: Building,
            },
            {
              title: "Users & Roles",
              url: "/settings/users",
              icon: Users,
            },
            {
              title: "Billing",
              url: "/settings/billing",
              icon: CreditCard,
            },
          ],
        },
        {
          title: "Integrations",
          url: "/settings/integrations",
          icon: Puzzle,
        },
      ],
    },
  ],
};
