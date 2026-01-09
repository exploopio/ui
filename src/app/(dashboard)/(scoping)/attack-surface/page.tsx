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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Globe,
  Server,
  Cloud,
  GitBranch,
  Key,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Layers,
  Network,
  Eye,
} from "lucide-react";

// Mock data for attack surface overview
const attackSurfaceStats = {
  totalAssets: 303,
  exposedServices: 47,
  criticalExposures: 12,
  riskScore: 72,
};

const assetBreakdown = [
  { type: "Domains", icon: Globe, count: 45, exposed: 12, color: "text-blue-400" },
  { type: "Websites", icon: Layers, count: 78, exposed: 18, color: "text-purple-400" },
  { type: "Services", icon: Server, count: 62, exposed: 8, color: "text-green-400" },
  { type: "Repositories", icon: GitBranch, count: 48, exposed: 5, color: "text-orange-400" },
  { type: "Cloud Assets", icon: Cloud, count: 35, exposed: 3, color: "text-cyan-400" },
  { type: "Credentials", icon: Key, count: 35, exposed: 1, color: "text-red-400" },
];

const exposedServices = [
  {
    id: "exp-001",
    asset: "api.techcombank.com.vn",
    type: "API Gateway",
    port: 443,
    exposure: "Public",
    risk: "high",
    findings: 3,
    lastSeen: "2 hours ago",
  },
  {
    id: "exp-002",
    asset: "mail.techcombank.com.vn",
    type: "Mail Server",
    port: 25,
    exposure: "Public",
    risk: "critical",
    findings: 5,
    lastSeen: "1 hour ago",
  },
  {
    id: "exp-003",
    asset: "vpn.techcombank.com.vn",
    type: "VPN Gateway",
    port: 443,
    exposure: "Public",
    risk: "medium",
    findings: 1,
    lastSeen: "30 mins ago",
  },
  {
    id: "exp-004",
    asset: "ftp.techcombank.com.vn",
    type: "FTP Server",
    port: 21,
    exposure: "Public",
    risk: "critical",
    findings: 7,
    lastSeen: "3 hours ago",
  },
  {
    id: "exp-005",
    asset: "jenkins.internal.tcb.vn",
    type: "CI/CD",
    port: 8080,
    exposure: "Internal",
    risk: "high",
    findings: 4,
    lastSeen: "1 day ago",
  },
];

const recentChanges = [
  { type: "added", asset: "new-api.techcombank.com.vn", time: "2 hours ago" },
  { type: "removed", asset: "legacy.tcb.vn", time: "1 day ago" },
  { type: "changed", asset: "cdn.techcombank.com.vn", time: "2 days ago" },
  { type: "added", asset: "staging-app.tcb.vn", time: "3 days ago" },
  { type: "added", asset: "10.0.5.0/24 subnet", time: "5 days ago" },
];

const riskConfig: Record<string, { color: string; bgColor: string }> = {
  critical: { color: "text-red-400", bgColor: "bg-red-500/20" },
  high: { color: "text-orange-400", bgColor: "bg-orange-500/20" },
  medium: { color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  low: { color: "text-green-400", bgColor: "bg-green-500/20" },
};

export default function AttackSurfacePage() {
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
          title="Attack Surface Overview"
          description="Visualize and monitor your organization's external attack surface"
        />

        {/* Top Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Total Assets
              </CardDescription>
              <CardTitle className="text-3xl">{attackSurfaceStats.totalAssets}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span>+12 this week</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Exposed Services
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-500">
                {attackSurfaceStats.exposedServices}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <TrendingDown className="h-3 w-3 text-green-400" />
                <span>-3 from last week</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical Exposures
              </CardDescription>
              <CardTitle className="text-3xl text-red-500">
                {attackSurfaceStats.criticalExposures}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-red-400" />
                <span>+2 this week</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Risk Score
              </CardDescription>
              <CardTitle className="text-3xl text-orange-500">
                {attackSurfaceStats.riskScore}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={attackSurfaceStats.riskScore} className="h-2" />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Asset Breakdown */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Asset Breakdown</CardTitle>
              <CardDescription>Distribution by type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assetBreakdown.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.type}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.exposed} exposed
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Exposed Services */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Exposed Services</CardTitle>
                  <CardDescription>Publicly accessible services requiring attention</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exposedServices.map((service) => {
                  const risk = riskConfig[service.risk];
                  return (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${risk.bgColor}`}>
                          <Server className={`h-4 w-4 ${risk.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{service.asset}</p>
                            <Badge variant="outline" className="text-xs">
                              :{service.port}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {service.type} - {service.lastSeen}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${risk.bgColor} ${risk.color} border-0`}>
                          {service.findings} findings
                        </Badge>
                        <Badge
                          variant={service.exposure === "Public" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {service.exposure}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Changes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Recent Attack Surface Changes</CardTitle>
            <CardDescription>Assets added, removed, or modified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentChanges.map((change, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        change.type === "added"
                          ? "bg-green-500/20 text-green-400 border-0"
                          : change.type === "removed"
                            ? "bg-red-500/20 text-red-400 border-0"
                            : "bg-yellow-500/20 text-yellow-400 border-0"
                      }
                    >
                      {change.type}
                    </Badge>
                    <span className="text-sm font-medium">{change.asset}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{change.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
