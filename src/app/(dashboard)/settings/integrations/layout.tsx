'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Integrations Layout
 *
 * Wraps all integrations pages with ModuleGate to ensure the tenant
 * has the "integrations" module enabled in their subscription plan.
 *
 * Integrations connect the platform to external services like SCM, CI/CD,
 * ticketing systems, SIEM, and notification channels.
 */
export default function IntegrationsLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="integrations">{children}</ModuleGate>
}
