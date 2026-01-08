"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Globe,
  Shield,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Clock,
  Server,
  Code,
  Cloud,
  GitBranch,
  Key,
  Target,
  Ban,
  Calendar,
  Play,
  Pause,
} from "lucide-react";

// Mock data for scope targets
const mockScopeTargets = [
  {
    id: "scope-001",
    type: "domain",
    pattern: "*.techcombank.com.vn",
    description: "Main banking domain and subdomains",
    status: "active",
    addedAt: "2024-01-15",
    addedBy: "Nguyen Van An",
  },
  {
    id: "scope-002",
    type: "domain",
    pattern: "*.tcb.com.vn",
    description: "Short domain alias",
    status: "active",
    addedAt: "2024-01-15",
    addedBy: "Nguyen Van An",
  },
  {
    id: "scope-003",
    type: "ip_range",
    pattern: "10.0.0.0/8",
    description: "Internal network range",
    status: "active",
    addedAt: "2024-01-20",
    addedBy: "Tran Thi Binh",
  },
  {
    id: "scope-004",
    type: "domain",
    pattern: "api.techcombank.com.vn",
    description: "API Gateway endpoint",
    status: "active",
    addedAt: "2024-02-01",
    addedBy: "Le Van Cuong",
  },
  {
    id: "scope-005",
    type: "repository",
    pattern: "github.com/techcombank/*",
    description: "All GitHub repositories",
    status: "active",
    addedAt: "2024-02-10",
    addedBy: "Pham Thi Dung",
  },
  {
    id: "scope-006",
    type: "cloud",
    pattern: "AWS:123456789012",
    description: "Production AWS account",
    status: "active",
    addedAt: "2024-02-15",
    addedBy: "Nguyen Van An",
  },
];

const mockExclusions = [
  {
    id: "excl-001",
    type: "domain",
    pattern: "status.techcombank.com.vn",
    reason: "Third-party status page service",
    status: "active",
    addedAt: "2024-01-16",
    addedBy: "Nguyen Van An",
  },
  {
    id: "excl-002",
    type: "ip_range",
    pattern: "10.255.0.0/16",
    reason: "Guest network - out of scope",
    status: "active",
    addedAt: "2024-01-20",
    addedBy: "Tran Thi Binh",
  },
  {
    id: "excl-003",
    type: "domain",
    pattern: "*.cdn.techcombank.com.vn",
    reason: "CDN managed by third-party",
    status: "active",
    addedAt: "2024-02-05",
    addedBy: "Le Van Cuong",
  },
  {
    id: "excl-004",
    type: "path",
    pattern: "/health",
    reason: "Health check endpoints",
    status: "active",
    addedAt: "2024-02-10",
    addedBy: "Pham Thi Dung",
  },
];

const mockScanSchedules = [
  {
    id: "sched-001",
    name: "Daily Vulnerability Scan",
    type: "vulnerability",
    targets: ["*.techcombank.com.vn"],
    frequency: "daily",
    time: "02:00",
    lastRun: "2024-03-10T02:00:00",
    nextRun: "2024-03-11T02:00:00",
    status: "active",
  },
  {
    id: "sched-002",
    name: "Weekly Port Scan",
    type: "port_scan",
    targets: ["10.0.0.0/8"],
    frequency: "weekly",
    time: "Sunday 03:00",
    lastRun: "2024-03-03T03:00:00",
    nextRun: "2024-03-10T03:00:00",
    status: "active",
  },
  {
    id: "sched-003",
    name: "Monthly Penetration Test",
    type: "pentest",
    targets: ["api.techcombank.com.vn"],
    frequency: "monthly",
    time: "1st day 04:00",
    lastRun: "2024-03-01T04:00:00",
    nextRun: "2024-04-01T04:00:00",
    status: "active",
  },
  {
    id: "sched-004",
    name: "Credential Leak Monitor",
    type: "credential",
    targets: ["*@techcombank.com.vn"],
    frequency: "continuous",
    time: "Real-time",
    lastRun: "2024-03-10T10:30:00",
    nextRun: null,
    status: "active",
  },
  {
    id: "sched-005",
    name: "Repository Secret Scan",
    type: "secret_scan",
    targets: ["github.com/techcombank/*"],
    frequency: "on_commit",
    time: "On push",
    lastRun: "2024-03-10T09:15:00",
    nextRun: null,
    status: "paused",
  },
];

const targetTypeIcons: Record<string, React.ReactNode> = {
  domain: <Globe className="h-4 w-4" />,
  ip_range: <Server className="h-4 w-4" />,
  repository: <GitBranch className="h-4 w-4" />,
  cloud: <Cloud className="h-4 w-4" />,
  path: <Code className="h-4 w-4" />,
  credential: <Key className="h-4 w-4" />,
};

const scanTypeConfig: Record<string, { label: string; color: string }> = {
  vulnerability: { label: "Vulnerability", color: "bg-red-500/20 text-red-400" },
  port_scan: { label: "Port Scan", color: "bg-blue-500/20 text-blue-400" },
  pentest: { label: "Pentest", color: "bg-purple-500/20 text-purple-400" },
  credential: { label: "Credential", color: "bg-orange-500/20 text-orange-400" },
  secret_scan: { label: "Secret Scan", color: "bg-yellow-500/20 text-yellow-400" },
};

export default function ScopeConfigPage() {
  const [schedules, setSchedules] = useState(mockScanSchedules);

  const toggleScheduleStatus = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "paused" : "active" }
          : s
      )
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Header fixed>
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <PageHeader
          title="Scope Configuration"
          description="Configure scan targets, exclusions, and schedules"
        />

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                In-Scope Targets
              </CardDescription>
              <CardTitle className="text-3xl">{mockScopeTargets.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Exclusions
              </CardDescription>
              <CardTitle className="text-3xl">{mockExclusions.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled Scans
              </CardDescription>
              <CardTitle className="text-3xl">
                {schedules.filter((s) => s.status === "active").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Coverage
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">94%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="targets" className="mt-6">
          <TabsList>
            <TabsTrigger value="targets">
              In-Scope Targets ({mockScopeTargets.length})
            </TabsTrigger>
            <TabsTrigger value="exclusions">
              Exclusions ({mockExclusions.length})
            </TabsTrigger>
            <TabsTrigger value="schedules">
              Scan Schedules ({schedules.length})
            </TabsTrigger>
          </TabsList>

          {/* In-Scope Targets */}
          <TabsContent value="targets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>In-Scope Targets</CardTitle>
                    <CardDescription>
                      Assets and patterns included in security assessments
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Target
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockScopeTargets.map((target) => (
                      <TableRow key={target.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {targetTypeIcons[target.type]}
                            <span className="text-sm capitalize">
                              {target.type.replace("_", " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted rounded px-2 py-1 text-sm">
                            {target.pattern}
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {target.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              target.status === "active"
                                ? "bg-green-500/20 text-green-400 border-0"
                                : "bg-gray-500/20 text-gray-400 border-0"
                            }
                          >
                            {target.status === "active" ? (
                              <Check className="mr-1 h-3 w-3" />
                            ) : (
                              <X className="mr-1 h-3 w-3" />
                            )}
                            {target.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {target.addedBy}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exclusions */}
          <TabsContent value="exclusions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Exclusions</CardTitle>
                    <CardDescription>
                      Assets and patterns excluded from security assessments
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Exclusion
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockExclusions.map((exclusion) => (
                      <TableRow key={exclusion.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {targetTypeIcons[exclusion.type] || <Ban className="h-4 w-4" />}
                            <span className="text-sm capitalize">
                              {exclusion.type.replace("_", " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted rounded px-2 py-1 text-sm">
                            {exclusion.pattern}
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {exclusion.reason}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-500/20 text-orange-400 border-0">
                            <Ban className="mr-1 h-3 w-3" />
                            Excluded
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {exclusion.addedBy}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scan Schedules */}
          <TabsContent value="schedules">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Scan Schedules</CardTitle>
                    <CardDescription>
                      Automated scan configurations and schedules
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((schedule) => {
                      const typeConfig = scanTypeConfig[schedule.type];
                      return (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{schedule.name}</p>
                              <p className="text-muted-foreground text-xs">
                                {schedule.targets.join(", ")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${typeConfig.color} border-0`}>
                              {typeConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="text-muted-foreground h-3 w-3" />
                              {schedule.time}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(schedule.lastRun)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {schedule.nextRun ? formatDate(schedule.nextRun) : "On trigger"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={schedule.status === "active"}
                                onCheckedChange={() => toggleScheduleStatus(schedule.id)}
                              />
                              <span className="text-xs capitalize">{schedule.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Play className="mr-2 h-4 w-4" />
                                  Run Now
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-400">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}
