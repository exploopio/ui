"use client";

import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader, StatusBadge, RiskScoreBadge } from "@/features/shared";
import { KeyRound, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCredentials } from "@/features/assets";

export default function CredentialsPage() {
  const credentials = getCredentials();

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
          title="Credential Leaks"
          description={`${credentials.length} leaked credentials detected`}
        />

        {/* Warning Banner */}
        <Card className="mt-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Credential Leak Alert
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {credentials.filter((c) => c.status === "active").length} active
                credential leaks require immediate attention
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              All Credential Leaks
            </CardTitle>
            <CardDescription>
              Leaked credentials discovered from various sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credential</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Leak Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credentials.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {asset.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{asset.metadata.source}</span>
                    </TableCell>
                    <TableCell>
                      {asset.metadata.leakDate
                        ? new Date(asset.metadata.leakDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell>
                      <RiskScoreBadge score={asset.riskScore} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
