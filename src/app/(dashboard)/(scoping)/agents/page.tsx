'use client'

import { Header, Main } from '@/components/layout'
import { AgentsSection } from '@/features/agents'

export default function AgentsPage() {
  return (
    <>
      <Header fixed />

      <Main>
        <AgentsSection />
      </Main>
    </>
  )
}
