'use client'

import { type ReactNode } from 'react'
import { SubModuleGate } from '@/features/licensing/components/sub-module-gate'

/**
 * Cloud Assets Layout
 *
 * Wraps cloud assets page with SubModuleGate to ensure the tenant
 * has the "cloud" sub-module enabled under "assets" module.
 */
export default function CloudAssetsLayout({ children }: { children: ReactNode }) {
  return (
    <SubModuleGate parentModule="assets" subModule="cloud">
      {children}
    </SubModuleGate>
  )
}
