/**
 * App Configuration Barrel Export
 *
 * Centralized exports for application-level configuration
 * This folder contains shared config used across multiple features
 */

export { sidebarData } from './sidebar-data'

// Re-export types for convenience
export type { SidebarData, NavGroup, NavItem, Team, User } from '@/components/types'
