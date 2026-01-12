"use client";

/**
 * Create Team Page
 *
 * Page for creating a new team/tenant
 */

import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader } from "@/features/shared";
import { CreateTeamForm } from "@/features/tenant";

export default function CreateTeamPage() {
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
          title="Create New Team"
          description="Set up a new team to organize your security assets and collaborate with others"
        />

        <div className="mt-6 flex justify-center">
          <CreateTeamForm />
        </div>
      </Main>
    </>
  );
}
