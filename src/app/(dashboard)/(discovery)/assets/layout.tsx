'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Assets Layout
 *
 * Wraps all assets pages with ModuleGate to ensure the tenant
 * has the "assets" module enabled in their subscription plan.
 *
 * If the module is not enabled, shows an UpgradePrompt instead.
 */
export default function AssetsLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="assets">{children}</ModuleGate>
}
