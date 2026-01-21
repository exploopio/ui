'use client';

import { Header, Main } from '@/components/layout';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { PageHeader } from '@/features/shared';
import { AgentsSection } from '@/features/agents';

export default function RunnersPage() {
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
          title="CI/CD Runners"
          description="Manage your CI/CD pipeline runners"
        />

        <div className="mt-6">
          <AgentsSection typeFilter="runner" />
        </div>
      </Main>
    </>
  );
}
