'use client'

import { type ReactNode, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  type NavCollapsible,
  type NavItem,
  type NavLink,
  type NavGroup as NavGroupProps,
} from '@/components/types'
import { useDynamicBadges, getBadgeValue, type DynamicBadges } from '@/hooks/use-dynamic-badges'
import {
  useTenantModules,
  type LicensingModule,
} from '@/features/integrations/api/use-tenant-modules'

export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const pathname = usePathname() // ✅ thay cho useLocation
  const dynamicBadges = useDynamicBadges()

  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const key = 'items' in item ? item.title : `${item.title}-${String(item.url)}`

          if (!('items' in item))
            return (
              <SidebarMenuLink
                key={key}
                item={item}
                pathname={pathname}
                dynamicBadges={dynamicBadges}
              />
            )

          if (state === 'collapsed' && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown
                key={key}
                item={item}
                pathname={pathname}
                dynamicBadges={dynamicBadges}
              />
            )

          return (
            <SidebarMenuCollapsible
              key={key}
              item={item}
              pathname={pathname}
              dynamicBadges={dynamicBadges}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavBadge({
  children,
  variant,
}: {
  children: ReactNode
  variant?: 'default' | 'soon' | 'beta'
}) {
  // Special styling for "Soon" badge to indicate Coming Soon pages
  if (variant === 'soon' || children === 'Soon') {
    return (
      <Badge
        variant="outline"
        className="ms-auto shrink-0 rounded-full px-1.5 py-0 text-[10px] text-muted-foreground border-dashed"
      >
        {children}
      </Badge>
    )
  }
  // Beta badge styling
  if (variant === 'beta' || children === 'Beta') {
    return (
      <Badge variant="secondary" className="ms-auto shrink-0 rounded-full px-1.5 py-0 text-[10px]">
        {children}
      </Badge>
    )
  }
  return <Badge className="ms-auto shrink-0 rounded-full px-1 py-0 text-xs">{children}</Badge>
}

/**
 * Get the appropriate badge based on releaseStatus
 */
function getReleaseStatusBadge(
  releaseStatus?: string
): { text: string; variant: 'soon' | 'beta' } | null {
  if (releaseStatus === 'coming_soon') {
    return { text: 'Soon', variant: 'soon' }
  }
  if (releaseStatus === 'beta') {
    return { text: 'Beta', variant: 'beta' }
  }
  return null
}

/**
 * Filter sub-items based on sub-modules from API.
 * - Items without assetModuleKey are always shown (like "Overview")
 * - Items with assetModuleKey are filtered by sub-module release_status and is_active
 * - "disabled" modules or is_active=false are hidden completely
 * - "coming_soon" and "beta" modules get their release status applied
 */
function useFilteredSubItems(
  items: NavLink[],
  parentModuleId: string | undefined,
  subModules: Record<string, LicensingModule[]>
) {
  return useMemo(() => {
    // If no parent module specified, return all items
    if (!parentModuleId) return items

    // Get sub-modules for this parent
    const parentSubModules = subModules[parentModuleId] || []

    // If no sub-modules loaded yet, return all items (for loading state)
    if (parentSubModules.length === 0 && Object.keys(subModules).length === 0) {
      return items
    }

    return items
      .map((item) => {
        // Items without assetModuleKey are always shown (like "Overview")
        if (!item.assetModuleKey) return item

        // Find the sub-module that matches this item
        const subModule = parentSubModules.find((m) => m.slug === item.assetModuleKey)

        // If sub-module not found in API response, hide the item
        // This means it's either not configured or the parent module has no sub-modules
        if (!subModule) {
          // If sub-modules exist for parent but this item not found, hide it
          if (parentSubModules.length > 0) {
            return null
          }
          // If no sub-modules at all for parent, show item as-is (backward compat)
          return item
        }

        // If sub-module is inactive (is_active=false), hide completely
        if (!subModule.is_active) return null

        // If sub-module is disabled, hide completely
        if (subModule.release_status === 'disabled') return null

        // Apply release status from sub-module to the item
        return {
          ...item,
          releaseStatus: subModule.release_status,
        }
      })
      .filter((item): item is NavLink => item !== null)
  }, [items, parentModuleId, subModules])
}

function SidebarMenuLink({
  item,
  pathname,
  dynamicBadges,
}: {
  item: NavLink
  pathname: string
  dynamicBadges: DynamicBadges
}) {
  const { setOpenMobile } = useSidebar()
  const badge = getBadgeValue(dynamicBadges, item.url as string, item.badge)
  const releaseStatusBadge = getReleaseStatusBadge(item.releaseStatus)
  const isComingSoon = item.releaseStatus === 'coming_soon'

  // If coming soon, render as disabled span instead of link
  if (isComingSoon) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={`${item.title} (Coming Soon)`}
          className="cursor-not-allowed opacity-60"
        >
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {releaseStatusBadge && (
            <NavBadge variant={releaseStatusBadge.variant}>{releaseStatusBadge.text}</NavBadge>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={checkIsActive(pathname, item)} tooltip={item.title}>
        <Link href={item.url} prefetch={false} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {releaseStatusBadge ? (
            <NavBadge variant={releaseStatusBadge.variant}>{releaseStatusBadge.text}</NavBadge>
          ) : (
            badge && <NavBadge>{badge}</NavBadge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({
  item,
  pathname,
  dynamicBadges: _dynamicBadges,
}: {
  item: NavCollapsible
  pathname: string
  dynamicBadges: DynamicBadges
}) {
  const { setOpenMobile } = useSidebar()
  const { subModules } = useTenantModules()
  const releaseStatusBadge = getReleaseStatusBadge(item.releaseStatus)

  // Filter sub-items based on sub-modules from API
  const filteredItems = useFilteredSubItems(item.items, item.module, subModules)

  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(pathname, item, true)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {releaseStatusBadge ? (
              <NavBadge variant={releaseStatusBadge.variant}>{releaseStatusBadge.text}</NavBadge>
            ) : (
              item.badge && <NavBadge>{item.badge}</NavBadge>
            )}
            <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent">
          <SidebarMenuSub>
            {filteredItems.map((subItem) => {
              const subReleaseStatusBadge = getReleaseStatusBadge(subItem.releaseStatus)
              const isSubComingSoon = subItem.releaseStatus === 'coming_soon'

              if (isSubComingSoon) {
                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton className="cursor-not-allowed opacity-60">
                      {subItem.icon && <subItem.icon className="shrink-0" />}
                      <span className="flex-1 truncate">{subItem.title}</span>
                      {subReleaseStatusBadge && (
                        <NavBadge variant={subReleaseStatusBadge.variant}>
                          {subReleaseStatusBadge.text}
                        </NavBadge>
                      )}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              }

              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton asChild isActive={checkIsActive(pathname, subItem)}>
                    <Link href={subItem.url} prefetch={false} onClick={() => setOpenMobile(false)}>
                      {subItem.icon && <subItem.icon className="shrink-0" />}
                      <span className="flex-1 truncate">{subItem.title}</span>
                      {subReleaseStatusBadge ? (
                        <NavBadge variant={subReleaseStatusBadge.variant}>
                          {subReleaseStatusBadge.text}
                        </NavBadge>
                      ) : (
                        subItem.badge && <NavBadge>{subItem.badge}</NavBadge>
                      )}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({
  item,
  pathname,
  dynamicBadges: _dynamicBadges,
}: {
  item: NavCollapsible
  pathname: string
  dynamicBadges: DynamicBadges
}) {
  const { subModules } = useTenantModules()
  const releaseStatusBadge = getReleaseStatusBadge(item.releaseStatus)

  // Filter sub-items based on sub-modules from API
  const filteredItems = useFilteredSubItems(item.items, item.module, subModules)

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={checkIsActive(pathname, item)}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {releaseStatusBadge ? (
              <NavBadge variant={releaseStatusBadge.variant}>{releaseStatusBadge.text}</NavBadge>
            ) : (
              item.badge && <NavBadge>{item.badge}</NavBadge>
            )}
            <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={4}>
          <DropdownMenuLabel>
            {item.title}{' '}
            {releaseStatusBadge
              ? `(${releaseStatusBadge.text})`
              : item.badge
                ? `(${item.badge})`
                : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filteredItems.map((sub) => {
            const subReleaseStatusBadge = getReleaseStatusBadge(sub.releaseStatus)
            const isSubComingSoon = sub.releaseStatus === 'coming_soon'

            if (isSubComingSoon) {
              return (
                <DropdownMenuItem
                  key={`${sub.title}-${sub.url}`}
                  disabled
                  className="cursor-not-allowed opacity-60"
                >
                  {sub.icon && <sub.icon />}
                  <span className="max-w-52 text-wrap">{sub.title}</span>
                  {subReleaseStatusBadge && (
                    <span className="ms-auto text-xs text-muted-foreground">
                      {subReleaseStatusBadge.text}
                    </span>
                  )}
                </DropdownMenuItem>
              )
            }

            return (
              <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
                <Link
                  href={sub.url}
                  prefetch={false}
                  className={`${checkIsActive(pathname, sub) ? 'bg-secondary' : ''}`}
                >
                  {sub.icon && <sub.icon />}
                  <span className="max-w-52 text-wrap">{sub.title}</span>
                  {subReleaseStatusBadge ? (
                    <span className="ms-auto text-xs">{subReleaseStatusBadge.text}</span>
                  ) : (
                    sub.badge && <span className="ms-auto text-xs">{sub.badge}</span>
                  )}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(pathname: string, item: NavItem, mainNav = false) {
  // For collapsible items with sub-items, check if any sub-item is active
  if ('items' in item) {
    return item.items.some((i) => pathname === i.url)
  }

  // For leaf items with a url
  if ('url' in item && typeof item.url === 'string') {
    // Exact match always counts
    if (pathname === item.url) {
      return true
    }

    // For mainNav items only (top-level, not sub-items), also use startsWith
    // This allows top-level items to stay highlighted when on child pages
    if (mainNav && pathname.startsWith(`/${item.url.split('/')[1]}`)) {
      return true
    }

    return false
  }

  return false
}
