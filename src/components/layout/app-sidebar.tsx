"use client";

import { useLayout } from "@/context/layout-provider";
import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
  SidebarRail,
  // useSidebar,
} from "@/components/ui/sidebar";
// Use centralized sidebar data from features
import { sidebarData } from "@/config/sidebar-data";
import { NavGroup } from "./nav-group";
// import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  const { collapsible, variant } = useLayout();
  // const { open } = useSidebar();

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      {/* Header */}
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
        <Separator orientation="horizontal" />
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {sidebarData.navGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      {/* <Separator orientation="horizontal" /> */}

      {/* Footer */}
      {/* <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter> */}

      {/* Sidebar toggle rail */}
      <SidebarRail />
    </Sidebar>
  );
}