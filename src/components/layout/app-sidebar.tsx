"use client";

import { useLayout } from "@/context/layout-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
// Use centralized sidebar data from features
import { sidebarData } from "@/config/sidebar-data";
import { useFilteredSidebarData } from "@/lib/permissions";
import { NavGroup } from "./nav-group";
import { SidebarUser } from "./sidebar-user";
import { TeamSwitcher } from "./team-switcher";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  const { collapsible, variant } = useLayout();
  // Filter sidebar items based on user permissions
  const filteredSidebarData = useFilteredSidebarData(sidebarData);

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      {/* Header - Team Switcher */}
      <SidebarHeader>
        <TeamSwitcher />
        <Separator orientation="horizontal" />
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {filteredSidebarData.navGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      <Separator orientation="horizontal" />

      {/* Footer - User profile and logout */}
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>

      {/* Sidebar toggle rail */}
      <SidebarRail />
    </Sidebar>
  );
}