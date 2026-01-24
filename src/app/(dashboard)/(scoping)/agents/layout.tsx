'use client'

import { type ReactNode } from 'react'
import { ModuleGate } from '@/features/licensing/components/module-gate'

/**
 * Agents Layout
 *
 * Wraps all agent pages with ModuleGate to ensure the tenant
 * has the "agents" module enabled in their subscription plan.
 *
 * Agents are distributed workers that execute security scans and collect data.
 */
export default function AgentsLayout({ children }: { children: ReactNode }) {
  return <ModuleGate module="agents">{children}</ModuleGate>
}
