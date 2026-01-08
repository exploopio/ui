/**
 * Sidebar Navigation Data
 *
 * Configuration for the application sidebar navigation
 * - User profile information
 * - Team/organization switcher
 * - Navigation groups and items
 */

import {
  LayoutDashboard,
  FolderKanban,
  Target,
  Settings2,
  Radar,
  Server,
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
  Settings,
  Command,
  AudioWaveform,
  Play,
  CreditCard,
  Building,
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
    {
      title: "Scoping",
      items: [
        {
          title: "Asset Groups",
          url: "/scoping/asset-groups",
          icon: FolderKanban,
          badge: "9",
        },
        {
          title: "Attack Surface",
          url: "/scoping/attack-surface",
          icon: Target,
        },
        {
          title: "Scope Config",
          url: "/scoping/scope-config",
          icon: Settings2,
        },
      ],
    },
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
              icon: Server,
            },
            {
              title: "Repositories",
              url: "/discovery/assets/repositories",
              icon: GitBranch,
            },
            {
              title: "Cloud Assets",
              url: "/discovery/assets/cloud",
              icon: Cloud,
            },
          ],
        },
        {
          title: "Credential Leaks",
          url: "/discovery/credentials",
          icon: KeyRound,
        },
      ],
    },
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
    {
      title: "Validation",
      items: [
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
    {
      title: "Mobilization",
      items: [
        {
          title: "Remediation Tasks",
          url: "/mobilization/remediation",
          icon: ListChecks,
          badge: "8",
        },
        {
          title: "Workflows",
          url: "/mobilization/workflows",
          icon: Workflow,
        },
      ],
    },
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
    {
      title: "Settings",
      items: [
        {
          title: "Tenant",
          url: "/settings/tenant",
          icon: Building,
        },
        {
          title: "Users",
          url: "/settings/users",
          icon: Users,
        },
        {
          title: "Billing",
          url: "/settings/billing",
          icon: CreditCard,
        },
        {
          title: "Integrations",
          url: "/settings/integrations",
          icon: Puzzle,
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
};
