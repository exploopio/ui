'use client'

import { Header, Main } from '@/components/layout'
import { PageHeader } from '@/features/shared'
import { AgentsSection } from '@/features/agents'

export default function RunnersPage() {
  return (
    <>
      <Header fixed />

      <Main>
        <PageHeader title="CI/CD Runners" description="Manage your CI/CD pipeline runners" />

        <div className="mt-6">
          <AgentsSection typeFilter="runner" />
        </div>
      </Main>
    </>
  )
}
