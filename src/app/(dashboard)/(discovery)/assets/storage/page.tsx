"use client";

import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader } from "@/features/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HardDrive, Clock } from "lucide-react";

export default function StoragePage() {
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
          title="Storage"
          description="S3 buckets, Azure Blobs, and GCS buckets"
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage Buckets
              </CardDescription>
              <CardTitle className="text-3xl">24</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                S3, GCS, Azure Blob Storage
              </p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Coming Soon
              </CardTitle>
              <CardDescription>
                Full storage asset management is under development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This page will allow you to manage and monitor your cloud storage
                buckets across AWS S3, Google Cloud Storage, and Azure Blob Storage.
              </p>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
