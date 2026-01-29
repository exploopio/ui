'use client'

import { type ReactNode } from 'react'
import { SubModuleGate } from '@/features/licensing/components/sub-module-gate'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SubModuleGate parentModule="assets" subModule="repositories">
      {children}
    </SubModuleGate>
  )
}
