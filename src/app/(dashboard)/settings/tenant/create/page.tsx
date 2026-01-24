'use client'

/**
 * Create Team Page
 *
 * Page for creating a new team/tenant
 */

import { Header, Main } from '@/components/layout'
import { PageHeader } from '@/features/shared'
import { CreateTeamForm } from '@/features/tenant'

export default function CreateTeamPage() {
  return (
    <>
      <Header fixed />

      <Main>
        <PageHeader
          title="Create New Team"
          description="Set up a new team to organize your security assets and collaborate with others"
        />

        <div className="mt-6 flex justify-center">
          <CreateTeamForm />
        </div>
      </Main>
    </>
  )
}
