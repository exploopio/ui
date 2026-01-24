import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar, TenantGate } from '@/components/layout'
import { SkipToMain } from '@/components/skip-to-main'
import { DashboardProviders } from '@/components/layout/dashboard-providers'
import { RouteGuard } from '@/components/route-guard'

type SiteLayoutProps = {
  children?: React.ReactNode
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <DashboardProviders>
      <SearchProvider>
        <LayoutProvider>
          {/* TenantGate checks if user has tenants */}
          {/* If no tenants: shows Create Team page without sidebar */}
          {/* If has tenants: shows normal dashboard layout */}
          <TenantGate>
            <SidebarProvider defaultOpen={defaultOpen}>
              <SkipToMain />
              <AppSidebar />
              <SidebarInset
                className={cn(
                  // Set content container, so we can use container queries
                  '@container/content',

                  // If layout is fixed, set the height
                  // to 100svh to prevent overflow
                  'has-[[data-layout=fixed]]:h-svh',

                  // If layout is fixed and sidebar is inset,
                  // set the height to 100svh - spacing (total margins) to prevent overflow
                  'peer-data-[variant=floating]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]'
                )}
              >
                {/* RouteGuard checks if user has permission to access current route */}
                {/* Shows "Access Denied" page if user doesn't have required permission */}
                <RouteGuard>{children}</RouteGuard>
              </SidebarInset>
            </SidebarProvider>
          </TenantGate>
        </LayoutProvider>
      </SearchProvider>
    </DashboardProviders>
  )
}
