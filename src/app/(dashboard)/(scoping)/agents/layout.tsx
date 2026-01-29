'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Agents Layout
 *
 * Wraps all agent pages with ModuleGate to ensure the tenant
 * has the "scans" module enabled in their subscription plan.
 *
 * Agents are required to execute scans, so they are bundled with the scans module.
 * The number of agents a tenant can create is controlled by their plan's agent_limit.
 */
export default function AgentsLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="scans">{children}</ModuleGate>
}
