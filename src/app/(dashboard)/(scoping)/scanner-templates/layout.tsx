'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Scanner Templates Layout
 *
 * Wraps all scanner template pages with ModuleGate to ensure the tenant
 * has the "scans" module enabled in their subscription plan.
 *
 * Scanner templates are custom YAML/TOML files for Nuclei, Semgrep, and
 * Gitleaks scanners that define security rules and detection patterns.
 */
export default function ScannerTemplatesLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="scans">{children}</ModuleGate>
}
