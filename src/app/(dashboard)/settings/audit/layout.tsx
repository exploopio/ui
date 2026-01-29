'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Audit Layout
 *
 * Wraps all audit log pages with ModuleGate to ensure the tenant
 * has the "audit" module enabled in their subscription plan.
 *
 * Audit logs track all significant actions performed within the platform
 * for compliance and security monitoring.
 */
export default function AuditLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="audit">{children}</ModuleGate>
}
