'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Findings Layout
 *
 * Wraps all findings pages with ModuleGate to ensure the tenant
 * has the "findings" module enabled in their subscription plan.
 *
 * Findings represent security vulnerabilities discovered through scans.
 */
export default function FindingsLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="findings">{children}</ModuleGate>
}
