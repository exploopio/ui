"use client";

import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { UnifiedWorkersSection } from "@/features/workers";

export default function WorkersPage() {
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
        <UnifiedWorkersSection />
      </Main>
    </>
  );
}
