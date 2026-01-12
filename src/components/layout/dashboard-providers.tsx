"use client";

/**
 * Dashboard Providers
 *
 * Client-side providers for the dashboard layout.
 * Wraps children with TenantProvider for team management.
 */

import { TenantProvider } from "@/context/tenant-provider";

interface DashboardProvidersProps {
  children: React.ReactNode;
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return <TenantProvider>{children}</TenantProvider>;
}
