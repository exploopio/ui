"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

// Route labels mapping - add more as needed
const routeLabels: Record<string, string> = {
  // Main sections
  "": "Dashboard",
  "asset-groups": "Asset Groups",
  findings: "Findings",
  reports: "Reports",

  // Scoping
  scoping: "Scoping",
  "attack-surface": "Attack Surface",
  "scope-config": "Scope Configuration",

  // Discovery
  discovery: "Discovery",
  scans: "Scan Management",
  assets: "Asset Inventory",
  domains: "Domains",
  websites: "Websites",
  services: "Services",
  repositories: "Repositories",
  cloud: "Cloud Assets",
  credentials: "Credential Leaks",

  // Prioritization
  prioritization: "Prioritization",
  "risk-analysis": "Risk Analysis",
  "business-impact": "Business Impact",

  // Validation
  validation: "Validation",
  "attack-simulation": "Attack Simulation",
  "control-testing": "Control Testing",

  // Mobilization
  mobilization: "Mobilization",
  remediation: "Remediation Tasks",
  workflows: "Workflows",

  // Settings
  settings: "Settings",
  users: "Users",
  integrations: "Integrations",
  runners: "Runners",
  billing: "Billing",
  tenant: "Tenant",
};

interface BreadcrumbNavProps {
  /** Override the auto-generated page title */
  pageTitle?: string;
  /** Custom className for the breadcrumb container */
  className?: string;
}

export function BreadcrumbNav({ pageTitle, className }: BreadcrumbNavProps) {
  const pathname = usePathname();

  // Split pathname and filter empty strings
  const segments = pathname.split("/").filter(Boolean);

  // If we're on the home page, don't show breadcrumb
  if (segments.length === 0) {
    return null;
  }

  // Build breadcrumb items with accumulated paths
  const breadcrumbItems = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const label = routeLabels[segment] || segment.replace(/-/g, " ");
    const isLast = index === segments.length - 1;

    return {
      path,
      label: isLast && pageTitle ? pageTitle : label,
      isLast,
    };
  });

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbItems.map((item) => (
          <Fragment key={item.path}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage className="max-w-[200px] truncate capitalize">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={item.path}
                    className="max-w-[150px] truncate capitalize"
                  >
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
