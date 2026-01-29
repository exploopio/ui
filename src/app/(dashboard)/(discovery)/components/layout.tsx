'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Components Layout
 *
 * Wraps all components pages with ModuleGate to ensure the tenant
 * has the "assets" module enabled in their subscription plan.
 *
 * Components (SBOM - Software Bill of Materials) are a sub-feature of assets.
 * They track dependencies, licenses, and vulnerabilities in software components.
 */
export default function ComponentsLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="assets">{children}</ModuleGate>
}
