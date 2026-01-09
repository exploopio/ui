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
 * Badge Legend:
 * - Numbers (e.g., "9", "24"): Count of items
 * - "Soon": Feature coming soon / placeholder page
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
  // New icons for enhanced CTEM
  Crown,
  Layers,
  Bug,
  AlertTriangle,
  UserCog,
  Eye,
  Route,
  Crosshair,
  Flame,
  TrendingUp,
  Shield,
  FlaskConical,
  Gauge,
  ClipboardCheck,
  Timer,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  LineChart,
  PieChart,
  Calendar,
  Bell,
  Zap,
  Network,
  Lock,
  Fingerprint,
  Database,
  Cpu,
  Smartphone,
  Mail,
  FileCode,
  Boxes,
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
          title: "Business Context",
          icon: Building2,
          badge: "Soon",
          items: [
            {
              title: "Business Units",
              url: "/scoping/business-units",
              icon: Layers,
              badge: "Soon",
            },
            {
              title: "Crown Jewels",
              url: "/scoping/crown-jewels",
              icon: Crown,
              badge: "Soon",
            },
            {
              title: "Compliance",
              url: "/scoping/compliance",
              icon: ClipboardCheck,
              badge: "Soon",
            },
          ],
        },
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
              title: "Hosts",
              url: "/discovery/assets/hosts",
              icon: Server,
              badge: "Soon",
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
              title: "Cloud Resources",
              url: "/discovery/assets/cloud",
              icon: Cloud,
            },
            {
              title: "Containers",
              url: "/discovery/assets/containers",
              icon: Boxes,
              badge: "Soon",
            },
            {
              title: "Databases",
              url: "/discovery/assets/databases",
              icon: Database,
              badge: "Soon",
            },
            {
              title: "Mobile Apps",
              url: "/discovery/assets/mobile",
              icon: Smartphone,
              badge: "Soon",
            },
          ],
        },
        {
          title: "Exposures",
          icon: AlertTriangle,
          badge: "Soon",
          items: [
            {
              title: "Vulnerabilities",
              url: "/discovery/exposures/vulnerabilities",
              icon: Bug,
              badge: "Soon",
            },
            {
              title: "Misconfigurations",
              url: "/discovery/exposures/misconfigurations",
              icon: Settings2,
              badge: "Soon",
            },
            {
              title: "Secrets Exposure",
              url: "/discovery/exposures/secrets",
              icon: Lock,
              badge: "Soon",
            },
            {
              title: "Code Issues",
              url: "/discovery/exposures/code",
              icon: FileCode,
              badge: "Soon",
            },
          ],
        },
        {
          title: "Credential Leaks",
          url: "/discovery/credentials",
          icon: KeyRound,
          badge: "7",
        },
        {
          title: "Identity & Access",
          icon: UserCog,
          badge: "Soon",
          items: [
            {
              title: "Identity Risks",
              url: "/discovery/identity/risks",
              icon: Fingerprint,
              badge: "Soon",
            },
            {
              title: "Privileged Access",
              url: "/discovery/identity/privileged",
              icon: Crown,
              badge: "Soon",
            },
            {
              title: "Shadow IT",
              url: "/discovery/identity/shadow-it",
              icon: Eye,
              badge: "Soon",
            },
          ],
        },
        {
          title: "Attack Paths",
          url: "/discovery/attack-paths",
          icon: Route,
          badge: "Soon",
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
        {
          title: "Exposure Scoring",
          url: "/prioritization/scoring",
          icon: Gauge,
          badge: "Soon",
        },
        {
          title: "Threat Intelligence",
          icon: Crosshair,
          badge: "Soon",
          items: [
            {
              title: "Active Threats",
              url: "/prioritization/threats/active",
              icon: Flame,
              badge: "Soon",
            },
            {
              title: "Exploitability",
              url: "/prioritization/threats/exploitability",
              icon: Bug,
              badge: "Soon",
            },
            {
              title: "Threat Feeds",
              url: "/prioritization/threats/feeds",
              icon: Zap,
              badge: "Soon",
            },
          ],
        },
        {
          title: "Attack Path Analysis",
          url: "/prioritization/attack-paths",
          icon: Route,
          badge: "Soon",
        },
        {
          title: "Trending Risks",
          url: "/prioritization/trending",
          icon: TrendingUp,
          badge: "Soon",
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
          title: "Attack Simulation",
          url: "/validation/attack-simulation",
          icon: Swords,
        },
        {
          title: "Control Testing",
          url: "/validation/control-testing",
          icon: ShieldCheck,
        },
        {
          title: "Penetration Testing",
          icon: FlaskConical,
          badge: "Soon",
          items: [
            {
              title: "Pentest Campaigns",
              url: "/validation/pentest/campaigns",
              icon: Crosshair,
              badge: "Soon",
            },
            {
              title: "Findings",
              url: "/validation/pentest/findings",
              icon: FileWarning,
              badge: "Soon",
            },
            {
              title: "Retests",
              url: "/validation/pentest/retests",
              icon: Play,
              badge: "Soon",
            },
          ],
        },
        {
          title: "Response Validation",
          icon: Timer,
          badge: "Soon",
          items: [
            {
              title: "Detection Tests",
              url: "/validation/response/detection",
              icon: Eye,
              badge: "Soon",
            },
            {
              title: "Response Time",
              url: "/validation/response/time",
              icon: Timer,
              badge: "Soon",
            },
            {
              title: "Playbook Tests",
              url: "/validation/response/playbooks",
              icon: FileText,
              badge: "Soon",
            },
          ],
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
        {
          title: "Collaboration",
          icon: GitPullRequest,
          badge: "Soon",
          items: [
            {
              title: "Tickets",
              url: "/mobilization/collaboration/tickets",
              icon: FileWarning,
              badge: "Soon",
            },
            {
              title: "Comments",
              url: "/mobilization/collaboration/comments",
              icon: Mail,
              badge: "Soon",
            },
            {
              title: "Assignments",
              url: "/mobilization/collaboration/assignments",
              icon: Users,
              badge: "Soon",
            },
          ],
        },
        {
          title: "Exceptions",
          icon: XCircle,
          badge: "Soon",
          items: [
            {
              title: "Risk Acceptance",
              url: "/mobilization/exceptions/accepted",
              icon: CheckCircle2,
              badge: "Soon",
            },
            {
              title: "False Positives",
              url: "/mobilization/exceptions/false-positives",
              icon: XCircle,
              badge: "Soon",
            },
            {
              title: "Pending Review",
              url: "/mobilization/exceptions/pending",
              icon: Timer,
              badge: "Soon",
            },
          ],
        },
        {
          title: "Progress Tracking",
          url: "/mobilization/progress",
          icon: TrendingUp,
          badge: "Soon",
        },
        {
          title: "SLA Management",
          url: "/mobilization/sla",
          icon: Timer,
          badge: "Soon",
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
        {
          title: "Analytics",
          icon: LineChart,
          badge: "Soon",
          items: [
            {
              title: "Risk Trends",
              url: "/insights/analytics/trends",
              icon: TrendingUp,
              badge: "Soon",
            },
            {
              title: "Coverage",
              url: "/insights/analytics/coverage",
              icon: PieChart,
              badge: "Soon",
            },
            {
              title: "MTTR",
              url: "/insights/analytics/mttr",
              icon: Timer,
              badge: "Soon",
            },
            {
              title: "Team Performance",
              url: "/insights/analytics/performance",
              icon: BarChart3,
              badge: "Soon",
            },
          ],
        },
        {
          title: "Notifications",
          url: "/insights/notifications",
          icon: Bell,
          badge: "Soon",
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
              title: "Teams",
              url: "/settings/teams",
              icon: Users,
              badge: "Soon",
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
        {
          title: "Configuration",
          icon: Settings,
          badge: "Soon",
          items: [
            {
              title: "General",
              url: "/settings/general",
              icon: Settings,
              badge: "Soon",
            },
            {
              title: "Notifications",
              url: "/settings/notifications",
              icon: Bell,
              badge: "Soon",
            },
            {
              title: "Scoring Rules",
              url: "/settings/scoring",
              icon: Gauge,
              badge: "Soon",
            },
            {
              title: "SLA Policies",
              url: "/settings/sla-policies",
              icon: Timer,
              badge: "Soon",
            },
          ],
        },
      ],
    },
  ],
};
