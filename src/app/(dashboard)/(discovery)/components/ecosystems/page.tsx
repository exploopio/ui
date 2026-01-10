"use client";

import { useMemo, useState } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Package,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
} from "lucide-react";
import {
  getEcosystemStats,
  getComponentStats,
  getComponentsByEcosystem,
  ComponentTable,
  ComponentDetailSheet,
  EcosystemBadge,
  COMPONENT_ECOSYSTEM_LABELS,
} from "@/features/components";
import type { Component, ComponentEcosystem } from "@/features/components";

export default function EcosystemsPage() {
  const ecosystemStats = useMemo(() => getEcosystemStats(), []);
  const stats = useMemo(() => getComponentStats(), []);
  const [selectedEcosystem, setSelectedEcosystem] = useState<ComponentEcosystem | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  const ecosystemComponents = useMemo(() => {
    if (!selectedEcosystem) return [];
    return getComponentsByEcosystem(selectedEcosystem);
  }, [selectedEcosystem]);

  // Find the most used ecosystem
  const topEcosystem = ecosystemStats.length > 0 ? ecosystemStats[0] : null;

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
          title="Package Ecosystems"
          description={`Components distributed across ${ecosystemStats.length} package ecosystems`}
        >
          <Link href="/components/all">
            <Button variant="outline">
              View All Components
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </PageHeader>

        {/* Summary Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Ecosystems
              </CardDescription>
              <CardTitle className="text-3xl">{ecosystemStats.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Unique package managers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Total Components
              </CardDescription>
              <CardTitle className="text-3xl text-blue-500">{stats.totalComponents}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Across all ecosystems
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                With Vulnerabilities
              </CardDescription>
              <CardTitle className="text-3xl text-red-500">
                {ecosystemStats.reduce((acc, e) => acc + e.vulnerabilities, 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Total vulnerable components
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Outdated
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-500">
                {ecosystemStats.reduce((acc, e) => acc + e.outdated, 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Updates available
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ecosystem Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ecosystemStats.map((eco) => {
            const percentage = (eco.count / stats.totalComponents) * 100;
            return (
              <Card
                key={eco.ecosystem}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedEcosystem(eco.ecosystem)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <EcosystemBadge ecosystem={eco.ecosystem} />
                    <Badge variant="secondary">{eco.count}</Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {COMPONENT_ECOSYSTEM_LABELS[eco.ecosystem]}
                  </CardTitle>
                  <CardDescription>
                    {percentage.toFixed(1)}% of total components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={percentage} className="h-2 mb-4" />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold">{eco.count}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${eco.vulnerabilities > 0 ? "text-red-500" : "text-green-500"}`}>
                        {eco.vulnerabilities}
                      </p>
                      <p className="text-xs text-muted-foreground">Vulnerable</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${eco.outdated > 0 ? "text-yellow-500" : "text-green-500"}`}>
                        {eco.outdated}
                      </p>
                      <p className="text-xs text-muted-foreground">Outdated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {ecosystemStats.length === 0 && (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Components Found</h3>
              <p className="text-muted-foreground">
                Components will appear here once discovered from your assets.
              </p>
            </CardContent>
          </Card>
        )}
      </Main>

      {/* Ecosystem Detail Sheet */}
      <Sheet open={!!selectedEcosystem} onOpenChange={() => setSelectedEcosystem(null)}>
        <SheetContent className="sm:max-w-3xl overflow-y-auto">
          {selectedEcosystem && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <EcosystemBadge ecosystem={selectedEcosystem} />
                  {COMPONENT_ECOSYSTEM_LABELS[selectedEcosystem]} Components
                </SheetTitle>
                <SheetDescription>
                  {ecosystemComponents.length} components in this ecosystem
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6">
                <ComponentTable
                  data={ecosystemComponents}
                  onViewDetails={setSelectedComponent}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Component Detail Sheet */}
      <ComponentDetailSheet
        component={selectedComponent}
        open={!!selectedComponent}
        onOpenChange={() => setSelectedComponent(null)}
      />
    </>
  );
}
