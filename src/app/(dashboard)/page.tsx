"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProcessStepper, StatsCard } from "@/features/shared";
import { ActivityItem, QuickStat } from "@/features/dashboard";
import {
  Server,
  AlertTriangle,
  ShieldAlert,
  ListChecks,
  TrendingUp,
  TrendingDown,
  Plus,
  FileWarning,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAssetStats } from "@/features/assets";
import { getAssetGroupStats } from "@/features/asset-groups";
import { getFindingStats, mockFindingTrends } from "@/features/findings";
import { getScanStats, getActiveScans } from "@/features/scans";
import { getTaskStats } from "@/features/remediation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "@/components/charts";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const assetStats = getAssetStats();
  const groupStats = getAssetGroupStats();
  const findingStats = getFindingStats();
  const scanStats = getScanStats();
  const taskStats = getTaskStats();
  const activeScans = getActiveScans();

  // Severity distribution for pie chart
  const severityData = [
    { name: "Critical", value: findingStats.bySeverity.critical, color: "#ef4444" },
    { name: "High", value: findingStats.bySeverity.high, color: "#f97316" },
    { name: "Medium", value: findingStats.bySeverity.medium, color: "#eab308" },
    { name: "Low", value: findingStats.bySeverity.low, color: "#3b82f6" },
  ];

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
        {/* Quick Actions & Process Stepper */}
        <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Quick Actions */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start" size="sm">
                <Link href="/discovery/scans">
                  <Plus className="mr-2 h-4 w-4" />
                  New Scan
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/findings">
                  <FileWarning className="mr-2 h-4 w-4" />
                  View Findings
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/mobilization/remediation">
                  <ListChecks className="mr-2 h-4 w-4" />
                  Remediation Tasks
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="sm">
                <Link href="/reports">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Generate Report
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Process Stepper */}
          <Card className="md:col-span-1 lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">CTEM Process</CardTitle>
              <CardDescription>
                Continuous Threat Exposure Management lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessStepper currentStep={1} />
            </CardContent>
          </Card>
        </section>

        {/* Stats Cards */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Assets"
            value={assetStats.total}
            change="+12 this week"
            changeType="positive"
            icon={Server}
          />
          <StatsCard
            title="Active Findings"
            value={findingStats.byStatus.new + findingStats.byStatus.triaged + findingStats.byStatus.confirmed + findingStats.byStatus.in_progress}
            change={`${findingStats.overdueCount} overdue`}
            changeType={findingStats.overdueCount > 0 ? "negative" : "neutral"}
            icon={AlertTriangle}
          />
          <StatsCard
            title="Risk Score"
            value={groupStats.averageRiskScore}
            change="+5 from last scan"
            changeType="negative"
            icon={ShieldAlert}
          />
          <StatsCard
            title="Pending Tasks"
            value={taskStats.byStatus.open + taskStats.byStatus.in_progress}
            change={`${taskStats.overdue} overdue`}
            changeType={taskStats.overdue > 0 ? "negative" : "neutral"}
            icon={ListChecks}
          />
        </section>

        {/* Charts Row */}
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-7">
          {/* Findings Trend Chart */}
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>Findings Trend</CardTitle>
              <CardDescription>
                Security findings over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockFindingTrends}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.8}
                    name="Critical"
                  />
                  <Area
                    type="monotone"
                    dataKey="high"
                    stackId="1"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.8}
                    name="High"
                  />
                  <Area
                    type="monotone"
                    dataKey="medium"
                    stackId="1"
                    stroke="#eab308"
                    fill="#eab308"
                    fillOpacity={0.8}
                    name="Medium"
                  />
                  <Area
                    type="monotone"
                    dataKey="low"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.8}
                    name="Low"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Severity Distribution */}
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Severity Distribution</CardTitle>
              <CardDescription>
                Findings by severity level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* Active Scans & Asset Distribution */}
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Active Scans */}
          <Card>
            <CardHeader>
              <CardTitle>Active Scans</CardTitle>
              <CardDescription>
                {scanStats.activeScans} scans currently running
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeScans.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No active scans at the moment
                </p>
              ) : (
                activeScans.map((scan) => (
                  <div key={scan.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{scan.name}</span>
                      <Badge variant="outline">{scan.progress}%</Badge>
                    </div>
                    <Progress value={scan.progress} className="h-2" />
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <span>{scan.targetCount} targets</span>
                      <span>{scan.findingsCount} findings found</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Asset Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Distribution</CardTitle>
              <CardDescription>
                {assetStats.total} total assets by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { name: "Domains", count: assetStats.domains },
                    { name: "Websites", count: assetStats.websites },
                    { name: "Services", count: assetStats.services },
                    { name: "Repos", count: assetStats.repositories },
                    { name: "Cloud", count: assetStats.cloud },
                    { name: "Creds", count: assetStats.credentials },
                  ]}
                  layout="vertical"
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* Recent Activity & Quick Stats */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Recent Findings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest security events and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem
                  icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                  title="Critical SQL Injection found"
                  description="ebanking.techcombank.com.vn"
                  time="2 hours ago"
                />
                <ActivityItem
                  icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                  title="Vulnerability scan completed"
                  description="67% of targets scanned"
                  time="4 hours ago"
                />
                <ActivityItem
                  icon={<ListChecks className="h-4 w-4 text-blue-500" />}
                  title="Remediation task assigned"
                  description="Fix file upload RCE - Nguyen Van An"
                  time="Yesterday"
                />
                <ActivityItem
                  icon={<TrendingDown className="h-4 w-4 text-green-500" />}
                  title="3 findings resolved"
                  description="Risk score decreased by 5 points"
                  time="2 days ago"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Key metrics overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <QuickStat
                  label="Asset Groups"
                  value={groupStats.total}
                  subtext={`${groupStats.byCriticality.critical} critical`}
                />
                <QuickStat
                  label="Total Findings"
                  value={findingStats.total}
                  subtext={`Avg CVSS: ${findingStats.averageCvss}`}
                />
                <QuickStat
                  label="Completed Scans"
                  value={scanStats.completedScans}
                  subtext={`${scanStats.failedScans} failed`}
                />
                <QuickStat
                  label="Open Tasks"
                  value={taskStats.byStatus.open}
                  subtext={`${taskStats.byStatus.in_progress} in progress`}
                />
              </div>
            </CardContent>
          </Card>
        </section>
      </Main>
    </>
  );
}
