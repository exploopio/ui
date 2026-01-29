'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Scans Layout
 *
 * Wraps all scans pages with ModuleGate to ensure the tenant
 * has the "scans" module enabled in their subscription plan.
 *
 * Scans are security assessments that run against assets to discover vulnerabilities.
 */
export default function ScansLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="scans">{children}</ModuleGate>
}
