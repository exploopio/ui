'use client'

import { type ReactNode } from 'react'
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
        className="rounded-full px-1.5 py-0 text-[10px] text-muted-foreground border-dashed"
      >
        {children}
      </Badge>
    )
  }
  // Beta badge styling
  if (variant === 'beta' || children === 'Beta') {
    return (
      <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
        {children}
      </Badge>
    )
  }
  return <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
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
  const releaseStatusBadge = getReleaseStatusBadge(item.releaseStatus)

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
            {item.items.map((subItem) => {
              const subReleaseStatusBadge = getReleaseStatusBadge(subItem.releaseStatus)
              const isSubComingSoon = subItem.releaseStatus === 'coming_soon'

              if (isSubComingSoon) {
                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton className="cursor-not-allowed opacity-60">
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.title}</span>
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
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.title}</span>
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
  const releaseStatusBadge = getReleaseStatusBadge(item.releaseStatus)

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
          {item.items.map((sub) => {
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
