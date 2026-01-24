'use client'

import { Header, Main } from '@/components/layout'
import { ScanProfilesSection } from '@/features/scan-profiles'

export default function ScanProfilesPage() {
  return (
    <>
      <Header fixed />

      <Main>
        <ScanProfilesSection />
      </Main>
    </>
  )
}
