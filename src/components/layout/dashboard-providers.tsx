'use client'

/**
 * Dashboard Providers
 *
 * Client-side providers for the dashboard layout.
 * Wraps children with TenantProvider for team management
 * and PermissionProvider for real-time permission sync.
 */

import { TenantProvider } from '@/context/tenant-provider'
import { PermissionProvider } from '@/context/permission-provider'

interface DashboardProvidersProps {
  children: React.ReactNode
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <TenantProvider>
      <PermissionProvider>{children}</PermissionProvider>
    </TenantProvider>
  )
}
