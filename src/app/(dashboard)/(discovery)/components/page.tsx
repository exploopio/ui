"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  ShieldAlert,
  AlertTriangle,
  Scale,
  Download,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  GitBranch,
} from "lucide-react";
import {
  getComponentStats,
  getVulnerableComponents,
  getEcosystemStats,
  getLicenseStats,
} from "@/features/components";
import { EcosystemBadge, LicenseRiskBadge } from "@/features/components";

export default function ComponentsOverviewPage() {
  const stats = useMemo(() => getComponentStats(), []);
  const vulnerableComponents = useMemo(() => getVulnerableComponents(), []);
  const ecosystemStats = useMemo(() => getEcosystemStats(), []);
  const licenseStats = useMemo(() => getLicenseStats(), []);

  const criticalVulns = stats.vulnerabilitiesBySeverity.critical;
  const highVulns = stats.vulnerabilitiesBySeverity.high;

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
          title="Software Components"
          description="Software Bill of Materials (SBOM) and supply chain security"
        >
          <Link href="/components/sbom-export">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export SBOM
            </Button>
          </Link>
        </PageHeader>

        {/* Key Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Components</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComponents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.directDependencies} direct, {stats.transitiveDependencies} transitive
              </p>
            </CardContent>
          </Card>

          <Card className={criticalVulns > 0 ? "border-red-500/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
              <ShieldAlert className={`h-4 w-4 ${criticalVulns > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${criticalVulns > 0 ? "text-red-500" : ""}`}>
                {stats.totalVulnerabilities}
              </div>
              <div className="flex gap-2 mt-1">
                {criticalVulns > 0 && (
                  <Badge variant="destructive" className="text-xs">{criticalVulns}C</Badge>
                )}
                {highVulns > 0 && (
                  <Badge className="bg-orange-500/15 text-orange-600 text-xs">{highVulns}H</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">License Risks</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.byLicenseRisk?.critical || 0) + (stats.byLicenseRisk?.high || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Components with compliance risks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outdated</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.outdatedComponents}</div>
              <Progress
                value={(stats.outdatedComponents / stats.totalComponents) * 100}
                className="mt-2 h-1.5"
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Vulnerable Components */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  Vulnerable Components
                </CardTitle>
                <CardDescription>
                  {stats.componentsWithVulnerabilities} components need attention
                </CardDescription>
              </div>
              <Link href="/components/vulnerable">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vulnerableComponents.slice(0, 5).map((component) => (
                  <div
                    key={component.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium truncate">{component.name}</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {component.version}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <EcosystemBadge ecosystem={component.ecosystem} size="sm" />
                          {component.vulnerabilities.some(v => v.inCisaKev) && (
                            <Badge className="bg-red-600 text-white text-xs">CISA KEV</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {component.vulnerabilityCount.critical > 0 && (
                        <Badge variant="destructive">{component.vulnerabilityCount.critical}C</Badge>
                      )}
                      {component.vulnerabilityCount.high > 0 && (
                        <Badge className="bg-orange-500/15 text-orange-600">{component.vulnerabilityCount.high}H</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {vulnerableComponents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>No vulnerable components found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ecosystems Distribution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Ecosystem Distribution
                </CardTitle>
                <CardDescription>
                  Components by package manager
                </CardDescription>
              </div>
              <Link href="/components/ecosystems">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ecosystemStats.slice(0, 5).map((eco) => (
                  <div key={eco.ecosystem} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <EcosystemBadge ecosystem={eco.ecosystem} />
                        <span className="text-sm font-medium">{eco.count}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {eco.vulnerabilities > 0 && (
                          <span className="text-red-500">{eco.vulnerabilities} vulns</span>
                        )}
                        {eco.outdated > 0 && (
                          <span className="text-yellow-500">{eco.outdated} outdated</span>
                        )}
                      </div>
                    </div>
                    <Progress
                      value={(eco.count / stats.totalComponents) * 100}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* License Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  License Compliance
                </CardTitle>
                <CardDescription>
                  License distribution and risks
                </CardDescription>
              </div>
              <Link href="/components/licenses">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {licenseStats.slice(0, 6).map((license) => (
                  <div
                    key={license.licenseId}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
                  >
                    <LicenseRiskBadge
                      risk={license.risk}
                      licenseId={license.licenseId}
                    />
                    <span className="text-sm text-muted-foreground">
                      {license.count} component{license.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Link href="/components/all">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="mr-2 h-4 w-4" />
                    View All Components
                  </Button>
                </Link>
                <Link href="/components/vulnerable">
                  <Button variant="outline" className="w-full justify-start">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Review Vulnerable Components
                    {stats.componentsWithVulnerabilities > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {stats.componentsWithVulnerabilities}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/components/licenses">
                  <Button variant="outline" className="w-full justify-start">
                    <Scale className="mr-2 h-4 w-4" />
                    License Compliance Report
                    {(stats.byLicenseRisk?.critical || 0) + (stats.byLicenseRisk?.high || 0) > 0 && (
                      <Badge className="ml-auto bg-orange-500/15 text-orange-600">
                        {(stats.byLicenseRisk?.critical || 0) + (stats.byLicenseRisk?.high || 0)}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/components/sbom-export">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export SBOM
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CISA KEV Alert */}
        {stats.componentsInCisaKev > 0 && (
          <Card className="mt-6 border-red-500/50 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                CISA Known Exploited Vulnerabilities
              </CardTitle>
              <CardDescription>
                {stats.componentsInCisaKev} component(s) contain vulnerabilities listed in CISA KEV catalog.
                These require immediate attention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/components/vulnerable?cisaKev=true">
                <Button variant="destructive">
                  View KEV Components
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  );
}
