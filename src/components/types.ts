import { type LinkProps } from "next/link";

type User = {
  name: string;
  email: string;
  avatar: string;
};

type Team = {
  name: string;
  logo: React.ElementType;
  plan: string;
};

type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: React.ElementType;
};

// ✅ Nav item là 1 link trực tiếp (không có submenu)
type NavLink = BaseNavItem & {
  url: LinkProps["href"] | string;
};

// ✅ Nav item dạng collapsible có danh sách con
type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps["href"] | string })[];
};

// ✅ NavItem là union type (một trong hai loại trên)
type NavItem = NavCollapsible | NavLink;

type NavGroup = {
  title: string;
  items: NavItem[];
};

type SidebarData = {
  user: User;
  teams: Team[];
  navGroups: NavGroup[];
};

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink, Team, User };