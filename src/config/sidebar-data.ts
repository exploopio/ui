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
          url: "/scoping/attack-surface",
          icon: Target,
        },
        {
          title: "Asset Groups",
          url: "/scoping/asset-groups",
          icon: FolderKanban,
          badge: "9",
        },
        {
          title: "Scope Config",
          url: "/scoping/scope-config",
          icon: Settings2,
        },
      ],
    },

    // ========================================
    // PHASE 2: DISCOVERY
    // Identify assets, vulnerabilities, misconfigurations, and exposures
    // ========================================
    {
      title: "Discovery",
      items: [
        {
          title: "Scan Management",
          url: "/discovery/scans",
          icon: Radar,
        },
        {
          title: "Runners",
          url: "/discovery/runners",
          icon: Play,
        },
        {
          title: "Asset Inventory",
          icon: Container,
          items: [
            {
              title: "Domains",
              url: "/discovery/assets/domains",
              icon: Globe,
            },
            {
              title: "Websites",
              url: "/discovery/assets/websites",
              icon: MonitorSmartphone,
            },
            {
              title: "Services",
              url: "/discovery/assets/services",
              icon: Zap,
            },
            {
              title: "Repositories",
              url: "/discovery/assets/repositories",
              icon: GitBranch,
            },
            {
              title: "Cloud",
              url: "/discovery/assets/cloud",
              icon: Cloud,
            },
            {
              title: "Hosts",
              url: "/discovery/assets/hosts",
              icon: Server,
            },
            {
              title: "Kubernetes",
              url: "/discovery/assets/containers",
              icon: Boxes,
            },
            {
              title: "Databases",
              url: "/discovery/assets/databases",
              icon: Database,
            },
            {
              title: "Mobile Apps",
              url: "/discovery/assets/mobile",
              icon: Smartphone,
            },
            {
              title: "APIs",
              url: "/discovery/assets/apis",
              icon: Zap,
            },
          ],
        },
        {
          title: "Credential Leaks",
          url: "/discovery/credentials",
          icon: KeyRound,
          badge: "7",
        },
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
          url: "/prioritization/risk-analysis",
          icon: BarChart3,
        },
        {
          title: "Business Impact",
          url: "/prioritization/business-impact",
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
              url: "/validation/pentest/campaigns",
              icon: ClipboardList,
            },
            {
              title: "Findings",
              url: "/validation/pentest/findings",
              icon: Bug,
              badge: "12",
            },
            {
              title: "Retests",
              url: "/validation/pentest/retests",
              icon: RotateCcw,
            },
            {
              title: "Reports",
              url: "/validation/pentest/reports",
              icon: FileText,
            },
            {
              title: "Templates",
              url: "/validation/pentest/templates",
              icon: BookTemplate,
            },
          ],
        },
        {
          title: "Attack Simulation",
          url: "/validation/attack-simulation",
          icon: Swords,
        },
        {
          title: "Control Testing",
          url: "/validation/control-testing",
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
          url: "/mobilization/remediation",
          icon: ListChecks,
          badge: "24",
        },
        {
          title: "Workflows",
          url: "/mobilization/workflows",
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
