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
  /**
   * Permission required to view this item.
   * If not specified, item is visible to all authenticated users.
   * Can be a single permission string or array (user needs ANY of them).
   */
  permission?: string | string[];
  /**
   * Role required to view this item.
   * Use this for role-based checks instead of permission-based.
   * Can be a single role string or array (user needs ANY of them).
   * Example: 'owner' or ['owner', 'admin']
   */
  role?: string | string[];
  /**
   * Minimum role level required.
   * Uses role hierarchy: viewer < member < admin < owner
   * Example: 'admin' means admin and owner can see it
   */
  minRole?: string;
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