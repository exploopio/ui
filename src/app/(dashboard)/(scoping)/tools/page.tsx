'use client'

import { Header, Main } from '@/components/layout'
import { ToolsSection } from '@/features/tools'

export default function ToolsPage() {
  return (
    <>
      <Header fixed />

      <Main>
        <ToolsSection />
      </Main>
    </>
  )
}
