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
import { Cpu, Clock } from "lucide-react";

export default function ServerlessPage() {
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
          title="Serverless"
          description="Lambda functions, Cloud Functions, and Cloud Run"
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Serverless Functions
              </CardDescription>
              <CardTitle className="text-3xl">18</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Lambda, Cloud Functions, Cloud Run
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
                Full serverless asset management is under development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This page will allow you to manage and monitor your serverless
                functions across AWS Lambda, Google Cloud Functions, and Cloud Run.
              </p>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
