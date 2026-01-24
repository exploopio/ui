'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Scan Profiles Layout
 *
 * Wraps all scan profile pages with ModuleGate to ensure the tenant
 * has the "scans" module enabled in their subscription plan.
 *
 * Scan profiles are reusable configurations that define how scans are executed.
 */
export default function ScanProfilesLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="scans">{children}</ModuleGate>
}
