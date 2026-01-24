'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Asset Groups Layout
 *
 * Wraps all asset-groups pages with ModuleGate to ensure the tenant
 * has the "assets" module enabled in their subscription plan.
 *
 * Asset groups are part of the assets module - they allow users to
 * organize assets into logical groups for better management and access control.
 */
export default function AssetGroupsLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="assets">{children}</ModuleGate>
}
