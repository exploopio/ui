'use client';

import { Header, Main } from '@/components/layout';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { PageHeader } from '@/features/shared';
import { AgentsSection } from '@/features/agents';
import { mockAgents } from '@/features/agents/data/mock-agents';

export default function RunnersPage() {
  // Calculate summary for page header
  const totalAgents = mockAgents.length;
  const totalActiveJobs = mockAgents.reduce(
    (sum, a) => sum + (a.metrics?.active_jobs ?? 0),
    0
  );

  return (
    <>
      <Header fixed>
        <div className="ms-auto flex items-center gap-2 sm:gap-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <PageHeader
          title="Agents"
          description={`${totalAgents} agents - ${totalActiveJobs} active jobs`}
        />

        <div className="mt-6">
          <AgentsSection agents={mockAgents} />
        </div>
      </Main>
    </>
  );
}
