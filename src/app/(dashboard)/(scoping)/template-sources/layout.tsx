'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Template Sources Layout
 *
 * Wraps all template source pages with ModuleGate to ensure the tenant
 * has the "scans" module enabled in their subscription plan.
 *
 * Template sources are external repositories (Git, S3, HTTP) where
 * custom scanner templates are stored and synced from.
 */
export default function TemplateSourcesLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="scans">{children}</ModuleGate>
}
