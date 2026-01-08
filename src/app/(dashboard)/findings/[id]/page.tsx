"use client";

import { useParams, useRouter } from "next/navigation";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { getFindingById } from "@/features/findings";
import {
  FindingHeader,
  OverviewTab,
  EvidenceTab,
  RemediationTab,
  RelatedTab,
  ActivityPanel,
} from "@/features/findings/components/detail";

export default function FindingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const finding = getFindingById(id);

  if (!finding) {
    return (
      <>
        <Header fixed>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/findings")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Findings
          </Button>
        </Header>
        <Main>
          <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">Finding Not Found</h2>
              <p className="text-muted-foreground mt-2">
                The finding with ID &quot;{id}&quot; does not exist.
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/findings")}
              >
                Return to Findings
              </Button>
            </div>
          </div>
        </Main>
      </>
    );
  }

  return (
    <>
      <Header fixed>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/findings")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <span className="text-muted-foreground ml-4 font-mono text-sm">
            {finding.id}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        {/* Two-panel layout */}
        <div className="flex h-full gap-4 lg:gap-6">
          {/* Left Panel - Main Content */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Finding Header Card */}
            <Card className="mb-4 flex-shrink-0">
              <CardContent className="pt-6">
                <FindingHeader finding={finding} />
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <Tabs defaultValue="overview" className="flex h-full flex-col overflow-hidden">
                <CardHeader className="flex-shrink-0 pb-0">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="evidence">
                      Evidence ({finding.evidence.length})
                    </TabsTrigger>
                    <TabsTrigger value="remediation">Remediation</TabsTrigger>
                    <TabsTrigger value="related">Related</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="flex-1 overflow-auto p-6 pt-4">
                  <TabsContent value="overview" className="m-0 mt-0">
                    <OverviewTab finding={finding} />
                  </TabsContent>
                  <TabsContent value="evidence" className="m-0 mt-0">
                    <EvidenceTab evidence={finding.evidence} />
                  </TabsContent>
                  <TabsContent value="remediation" className="m-0 mt-0">
                    <RemediationTab remediation={finding.remediation} />
                  </TabsContent>
                  <TabsContent value="related" className="m-0 mt-0">
                    <RelatedTab finding={finding} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Panel - Activity */}
          <Card className="hidden w-[320px] flex-shrink-0 overflow-hidden xl:w-[380px] lg:flex lg:flex-col">
            <CardHeader className="flex-shrink-0 pb-2">
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-hidden">
              <ActivityPanel activities={finding.activities} />
            </div>
          </Card>
        </div>
      </Main>
    </>
  );
}
