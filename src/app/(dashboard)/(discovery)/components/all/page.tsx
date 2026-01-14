"use client";

import { useState, useMemo } from "react";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search as SearchIcon,
  Download,
  Filter,
} from "lucide-react";
import {
  getComponents,
  getComponentStats,
  ComponentTable,
  ComponentDetailSheet,
} from "@/features/components";
import type { Component } from "@/features/components";
import { toast } from "sonner";

type FilterType = "all" | "direct" | "transitive" | "outdated" | "vulnerable";

export default function AllComponentsPage() {
  const allComponents = useMemo(() => getComponents(), []);
  const stats = useMemo(() => getComponentStats(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [ecosystemFilter, setEcosystemFilter] = useState<string>("all");
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  // Filter components
  const filteredComponents = useMemo(() => {
    let result = [...allComponents];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.purl.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    switch (filterType) {
      case "direct":
        result = result.filter((c) => c.isDirect);
        break;
      case "transitive":
        result = result.filter((c) => !c.isDirect);
        break;
      case "outdated":
        result = result.filter((c) => c.isOutdated);
        break;
      case "vulnerable":
        result = result.filter(
          (c) =>
            c.vulnerabilityCount.critical > 0 ||
            c.vulnerabilityCount.high > 0 ||
            c.vulnerabilityCount.medium > 0
        );
        break;
    }

    // Apply ecosystem filter
    if (ecosystemFilter !== "all") {
      result = result.filter((c) => c.ecosystem === ecosystemFilter);
    }

    return result;
  }, [allComponents, searchQuery, filterType, ecosystemFilter]);

  // Get unique ecosystems
  const ecosystems = useMemo(() => {
    const unique = new Set(allComponents.map((c) => c.ecosystem));
    return Array.from(unique);
  }, [allComponents]);

  // Filter counts
  const filterCounts = useMemo(
    () => ({
      all: allComponents.length,
      direct: allComponents.filter((c) => c.isDirect).length,
      transitive: allComponents.filter((c) => !c.isDirect).length,
      outdated: allComponents.filter((c) => c.isOutdated).length,
      vulnerable: allComponents.filter(
        (c) =>
          c.vulnerabilityCount.critical > 0 ||
          c.vulnerabilityCount.high > 0 ||
          c.vulnerabilityCount.medium > 0
      ).length,
    }),
    [allComponents]
  );

  const handleExport = () => {
    const csv = [
      ["Name", "Version", "Ecosystem", "License", "Risk Score", "Vulnerabilities", "Direct"].join(","),
      ...filteredComponents.map((c) =>
        [
          c.name,
          c.version,
          c.ecosystem,
          c.licenseId || "Unknown",
          c.riskScore,
          c.vulnerabilityCount.critical + c.vulnerabilityCount.high + c.vulnerabilityCount.medium,
          c.isDirect ? "Yes" : "No",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "components.csv";
    a.click();
    toast.success("Components exported");
  };

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
          title="All Components"
          description={`${stats.totalComponents} software components in your organization`}
        >
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setFilterType("all")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Components
              </CardDescription>
              <CardTitle className="text-3xl">{stats.totalComponents}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stats.directDependencies} direct, {stats.transitiveDependencies} transitive
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:border-green-500 transition-colors ${
              filterType === "direct" ? "border-green-500" : ""
            }`}
            onClick={() => setFilterType("direct")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Direct Dependencies
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {stats.directDependencies}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Explicitly declared
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:border-yellow-500 transition-colors ${
              filterType === "outdated" ? "border-yellow-500" : ""
            }`}
            onClick={() => setFilterType("outdated")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Outdated
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-500">
                {stats.outdatedComponents}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Updates available
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:border-red-500 transition-colors ${
              filterType === "vulnerable" ? "border-red-500" : ""
            }`}
            onClick={() => setFilterType("vulnerable")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Vulnerable
              </CardDescription>
              <CardTitle className="text-3xl text-red-500">
                {stats.componentsWithVulnerabilities}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Component Inventory
                </CardTitle>
                <CardDescription>
                  {filteredComponents.length} of {stats.totalComponents} components
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter Tabs */}
            <Tabs
              value={filterType}
              onValueChange={(v) => setFilterType(v as FilterType)}
              className="mb-4"
            >
              <TabsList>
                <TabsTrigger value="all" className="gap-1.5">
                  All
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {filterCounts.all}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="direct" className="gap-1.5">
                  Direct
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {filterCounts.direct}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="transitive" className="gap-1.5">
                  Transitive
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {filterCounts.transitive}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="outdated" className="gap-1.5">
                  Outdated
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-xs bg-yellow-500/15 text-yellow-600"
                  >
                    {filterCounts.outdated}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="vulnerable" className="gap-1.5">
                  Vulnerable
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {filterCounts.vulnerable}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={ecosystemFilter} onValueChange={setEcosystemFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Ecosystem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ecosystems</SelectItem>
                    {ecosystems.map((eco) => (
                      <SelectItem key={eco} value={eco}>
                        {eco}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Component Table */}
            <ComponentTable
              data={filteredComponents}
              onViewDetails={setSelectedComponent}
            />
          </CardContent>
        </Card>
      </Main>

      {/* Component Detail Sheet */}
      <ComponentDetailSheet
        component={selectedComponent}
        open={!!selectedComponent}
        onOpenChange={() => setSelectedComponent(null)}
      />
    </>
  );
}
