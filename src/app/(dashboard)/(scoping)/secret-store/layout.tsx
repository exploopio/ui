'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Secret Store Layout
 *
 * Wraps all secret store pages with ModuleGate to ensure the tenant
 * has the "scans" module enabled in their subscription plan.
 *
 * Secret store securely stores authentication credentials (Git tokens,
 * AWS keys, etc.) used by template sources to access external repositories.
 */
export default function SecretStoreLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="scans">{children}</ModuleGate>
}
