"use client";

import { useState, useMemo } from "react";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Network,
  Plus,
  Globe,
  Lock,
  Server,
} from "lucide-react";
import {
  ScopeBadgeSimple,
  ScopeCoverageCard,
  getScopeMatchesForAsset,
  calculateScopeCoverage,
  getActiveScopeTargets,
  getActiveScopeExclusions,
} from "@/features/scope";

// Mock data
const mockIpAddresses = [
  {
    id: "ip-1",
    address: "203.0.113.50",
    version: "ipv4" as const,
    asn: "AS12345",
    organization: "Example Corp",
    country: "US",
    isPublic: true,
    openPorts: [22, 80, 443],
    services: ["SSH", "HTTP", "HTTPS"],
    riskScore: 45,
  },
  {
    id: "ip-2",
    address: "198.51.100.25",
    version: "ipv4" as const,
    asn: "AS67890",
    organization: "Cloud Provider Inc",
    country: "US",
    isPublic: true,
    openPorts: [443, 8443],
    services: ["HTTPS", "Alt-HTTPS"],
    riskScore: 25,
  },
  {
    id: "ip-3",
    address: "10.0.1.100",
    version: "ipv4" as const,
    asn: "-",
    organization: "Internal",
    country: "-",
    isPublic: false,
    openPorts: [22, 3306],
    services: ["SSH", "MySQL"],
    riskScore: 60,
  },
  {
    id: "ip-4",
    address: "2001:db8::1",
    version: "ipv6" as const,
    asn: "AS12345",
    organization: "Example Corp",
    country: "US",
    isPublic: true,
    openPorts: [443],
    services: ["HTTPS"],
    riskScore: 15,
  },
];

const stats = {
  total: mockIpAddresses.length,
  public: mockIpAddresses.filter((ip) => ip.isPublic).length,
  private: mockIpAddresses.filter((ip) => !ip.isPublic).length,
  ipv6: mockIpAddresses.filter((ip) => ip.version === "ipv6").length,
};

export default function IpAddressesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Scope data
  const scopeTargets = useMemo(() => getActiveScopeTargets(), []);
  const scopeExclusions = useMemo(() => getActiveScopeExclusions(), []);

  // Compute scope matches for each IP
  const scopeMatchesMap = useMemo(() => {
    const map = new Map<string, { inScope: boolean; excluded: boolean }>();
    mockIpAddresses.forEach((ip) => {
      const match = getScopeMatchesForAsset(
        { id: ip.id, type: "ip_address", name: ip.address },
        scopeTargets,
        scopeExclusions
      );
      map.set(ip.id, {
        inScope: match.inScope,
        excluded: match.matchedExclusions.length > 0,
      });
    });
    return map;
  }, [scopeTargets, scopeExclusions]);

  // Calculate scope coverage
  const scopeCoverage = useMemo(() => {
    const assets = mockIpAddresses.map((ip) => ({
      id: ip.id,
      name: ip.address,
      type: "ip_address",
    }));
    return calculateScopeCoverage(assets, scopeTargets, scopeExclusions);
  }, [scopeTargets, scopeExclusions]);

  const filteredIps = mockIpAddresses.filter(
    (ip) =>
      ip.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ip.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600 bg-red-500/15";
    if (score >= 40) return "text-yellow-600 bg-yellow-500/15";
    return "text-green-600 bg-green-500/15";
  };

  return (
    <>
      <Header>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <PageHeader
          title="IP Addresses"
          description="IPv4 and IPv6 addresses in your infrastructure"
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total IPs</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Public</CardTitle>
              <Globe className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.public}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Private</CardTitle>
              <Lock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.private}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IPv6</CardTitle>
              <Server className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">{stats.ipv6}</div>
            </CardContent>
          </Card>
          <ScopeCoverageCard
            coverage={scopeCoverage}
            title="Scope Coverage"
            showBreakdown={false}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Search IP addresses..."
            className="max-w-sm px-3 py-2 border rounded-md bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add IP Address
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">IP Address</th>
                  <th className="text-left p-4 font-medium">ASN / Organization</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Scope</th>
                  <th className="text-left p-4 font-medium">Open Ports</th>
                  <th className="text-left p-4 font-medium">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredIps.map((ip) => (
                  <tr key={ip.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-4">
                      <div className="font-mono font-medium">{ip.address}</div>
                      <div className="text-sm text-muted-foreground">{ip.version.toUpperCase()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{ip.asn}</div>
                      <div className="text-sm text-muted-foreground">{ip.organization}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant={ip.isPublic ? "default" : "secondary"}>
                        {ip.isPublic ? "Public" : "Private"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {scopeMatchesMap.get(ip.id) && (
                        <ScopeBadgeSimple
                          inScope={scopeMatchesMap.get(ip.id)!.inScope}
                          excluded={scopeMatchesMap.get(ip.id)!.excluded}
                        />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {ip.openPorts.slice(0, 3).map((port) => (
                          <Badge key={port} variant="outline" className="text-xs">
                            {port}
                          </Badge>
                        ))}
                        {ip.openPorts.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ip.openPorts.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRiskColor(ip.riskScore)}`}>
                        {ip.riskScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
