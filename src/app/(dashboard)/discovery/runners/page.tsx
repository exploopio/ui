"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import {
  Plus,
  Download,
  RefreshCw,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Terminal,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Eye,
  Pencil,
  Copy,
  Search as SearchIcon,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Server,
  Cloud,
  Monitor,
  Globe,
  Cpu,
  HardDrive,
  Save,
} from "lucide-react";

// Types
type RunnerStatus = "online" | "offline" | "busy" | "paused";
type RunnerType = "cloud" | "self-hosted" | "agent";
type StatusFilter = RunnerStatus | "all";

interface Runner {
  id: string;
  name: string;
  type: RunnerType;
  status: RunnerStatus;
  version: string;
  lastActive: string;
  jobsCompleted: number;
  jobsRunning: number;
  cpuUsage: number;
  memoryUsage: number;
  tags: string[];
  ipAddress: string;
  region: string;
  createdAt: string;
}

// Mock data
const initialRunners: Runner[] = [
  {
    id: "runner-001",
    name: "scanner-prod-01",
    type: "cloud",
    status: "online",
    version: "2.4.1",
    lastActive: "2025-01-08T10:30:00",
    jobsCompleted: 1523,
    jobsRunning: 3,
    cpuUsage: 45,
    memoryUsage: 62,
    tags: ["production", "high-priority"],
    ipAddress: "10.0.1.50",
    region: "ap-southeast-1",
    createdAt: "2024-06-15T08:00:00",
  },
  {
    id: "runner-002",
    name: "scanner-prod-02",
    type: "cloud",
    status: "busy",
    version: "2.4.1",
    lastActive: "2025-01-08T10:29:00",
    jobsCompleted: 1456,
    jobsRunning: 5,
    cpuUsage: 78,
    memoryUsage: 85,
    tags: ["production"],
    ipAddress: "10.0.1.51",
    region: "ap-southeast-1",
    createdAt: "2024-06-15T08:30:00",
  },
  {
    id: "runner-003",
    name: "scanner-staging-01",
    type: "self-hosted",
    status: "online",
    version: "2.4.0",
    lastActive: "2025-01-08T10:25:00",
    jobsCompleted: 892,
    jobsRunning: 1,
    cpuUsage: 23,
    memoryUsage: 45,
    tags: ["staging", "testing"],
    ipAddress: "192.168.1.100",
    region: "on-premise",
    createdAt: "2024-07-20T14:00:00",
  },
  {
    id: "runner-004",
    name: "agent-external-01",
    type: "agent",
    status: "offline",
    version: "2.3.5",
    lastActive: "2025-01-07T18:00:00",
    jobsCompleted: 234,
    jobsRunning: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    tags: ["external", "pentest"],
    ipAddress: "203.162.xxx.xxx",
    region: "external",
    createdAt: "2024-09-10T09:00:00",
  },
  {
    id: "runner-005",
    name: "scanner-dev-01",
    type: "self-hosted",
    status: "paused",
    version: "2.4.1",
    lastActive: "2025-01-08T08:00:00",
    jobsCompleted: 567,
    jobsRunning: 0,
    cpuUsage: 0,
    memoryUsage: 12,
    tags: ["development"],
    ipAddress: "192.168.1.101",
    region: "on-premise",
    createdAt: "2024-08-05T10:00:00",
  },
  {
    id: "runner-006",
    name: "scanner-prod-03",
    type: "cloud",
    status: "online",
    version: "2.4.1",
    lastActive: "2025-01-08T10:28:00",
    jobsCompleted: 2103,
    jobsRunning: 2,
    cpuUsage: 35,
    memoryUsage: 55,
    tags: ["production", "credential-scan"],
    ipAddress: "10.0.1.52",
    region: "ap-southeast-1",
    createdAt: "2024-05-01T11:00:00",
  },
];

const statusConfig: Record<RunnerStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  online: { label: "Online", color: "text-green-500", bgColor: "bg-green-500", icon: <CheckCircle className="h-3 w-3" /> },
  offline: { label: "Offline", color: "text-gray-500", bgColor: "bg-gray-500", icon: <XCircle className="h-3 w-3" /> },
  busy: { label: "Busy", color: "text-yellow-500", bgColor: "bg-yellow-500", icon: <Activity className="h-3 w-3" /> },
  paused: { label: "Paused", color: "text-blue-500", bgColor: "bg-blue-500", icon: <Clock className="h-3 w-3" /> },
};

const typeConfig: Record<RunnerType, { label: string; color: string; icon: React.ReactNode }> = {
  cloud: { label: "Cloud", color: "text-blue-500", icon: <Cloud className="h-4 w-4" /> },
  "self-hosted": { label: "Self-Hosted", color: "text-purple-500", icon: <Server className="h-4 w-4" /> },
  agent: { label: "Agent", color: "text-orange-500", icon: <Monitor className="h-4 w-4" /> },
};

const regions = [
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "on-premise",
  "external",
];

// Form type
interface RunnerFormData {
  name: string;
  type: RunnerType;
  ipAddress: string;
  region: string;
  tags: string;
}

const emptyForm: RunnerFormData = {
  name: "",
  type: "cloud",
  ipAddress: "",
  region: "",
  tags: "",
};

export default function RunnersPage() {
  const [runners, setRunners] = useState<Runner[]>(initialRunners);
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rowSelection, setRowSelection] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [runnerToDelete, setRunnerToDelete] = useState<Runner | null>(null);

  // Form state
  const [formData, setFormData] = useState<RunnerFormData>(emptyForm);

  // Stats
  const stats = useMemo(() => {
    const online = runners.filter((r) => r.status === "online").length;
    const busy = runners.filter((r) => r.status === "busy").length;
    const offline = runners.filter((r) => r.status === "offline").length;
    const paused = runners.filter((r) => r.status === "paused").length;
    const totalJobs = runners.reduce((sum, r) => sum + r.jobsRunning, 0);
    return { online, busy, offline, paused, total: runners.length, totalJobs };
  }, [runners]);

  // Filtered data
  const filteredData = useMemo(() => {
    let data = [...runners];
    if (statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }
    return data;
  }, [runners, statusFilter]);

  // Table columns
  const columns: ColumnDef<Runner>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
          Runner
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const runner = row.original;
        const config = typeConfig[runner.type];
        return (
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              runner.type === "cloud" ? "bg-blue-500/10" :
              runner.type === "self-hosted" ? "bg-purple-500/10" : "bg-orange-500/10"
            }`}>
              {config.icon}
            </div>
            <div>
              <p className="font-medium">{runner.name}</p>
              <p className="text-xs text-muted-foreground">{runner.ipAddress}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const config = typeConfig[row.original.type];
        return (
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        return (
          <Badge className={`${config.bgColor} text-white gap-1`}>
            {config.icon}
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "jobsRunning",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
          Active Jobs
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${row.original.jobsRunning > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
          <span>{row.original.jobsRunning}</span>
        </div>
      ),
    },
    {
      accessorKey: "cpuUsage",
      header: "CPU",
      cell: ({ row }) => {
        const cpu = row.original.cpuUsage;
        return (
          <div className="w-20">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>{cpu}%</span>
            </div>
            <Progress
              value={cpu}
              className={`h-1.5 ${cpu > 80 ? "[&>div]:bg-red-500" : cpu > 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "memoryUsage",
      header: "Memory",
      cell: ({ row }) => {
        const mem = row.original.memoryUsage;
        return (
          <div className="w-20">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>{mem}%</span>
            </div>
            <Progress
              value={mem}
              className={`h-1.5 ${mem > 80 ? "[&>div]:bg-red-500" : mem > 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "version",
      header: "Version",
      cell: ({ row }) => <span className="text-sm text-muted-foreground font-mono">v{row.original.version}</span>,
    },
    {
      accessorKey: "region",
      header: "Region",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm">
          <Globe className="h-3 w-3 text-muted-foreground" />
          {row.original.region}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const runner = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedRunner(runner)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEdit(runner)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyToken(runner)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Token
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {runner.status === "paused" ? (
                <DropdownMenuItem onClick={() => handleResume(runner)}>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </DropdownMenuItem>
              ) : runner.status !== "offline" ? (
                <DropdownMenuItem onClick={() => handlePause(runner)}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400"
                onClick={() => {
                  setRunnerToDelete(runner);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Runner
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Runners refreshed");
    }, 1000);
  };

  const handleOpenEdit = (runner: Runner) => {
    setFormData({
      name: runner.name,
      type: runner.type,
      ipAddress: runner.ipAddress,
      region: runner.region,
      tags: runner.tags.join(", "),
    });
    setSelectedRunner(runner);
    setEditDialogOpen(true);
  };

  const handleCopyToken = (runner: Runner) => {
    navigator.clipboard.writeText(`runner-token-${runner.id}-xxxx-xxxx`);
    toast.success("Runner token copied to clipboard");
  };

  const handlePause = (runner: Runner) => {
    setRunners(runners.map((r) => (r.id === runner.id ? { ...r, status: "paused" as RunnerStatus, jobsRunning: 0 } : r)));
    toast.success(`Paused runner: ${runner.name}`);
  };

  const handleResume = (runner: Runner) => {
    setRunners(runners.map((r) => (r.id === runner.id ? { ...r, status: "online" as RunnerStatus } : r)));
    toast.success(`Resumed runner: ${runner.name}`);
  };

  const handleAddRunner = () => {
    if (!formData.name || !formData.ipAddress || !formData.region) {
      toast.error("Please fill in required fields");
      return;
    }

    const newRunner: Runner = {
      id: `runner-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      status: "offline",
      version: "2.4.1",
      lastActive: new Date().toISOString(),
      jobsCompleted: 0,
      jobsRunning: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      tags: formData.tags.split(",").map((s) => s.trim()).filter(Boolean),
      ipAddress: formData.ipAddress,
      region: formData.region,
      createdAt: new Date().toISOString(),
    };

    setRunners([newRunner, ...runners]);
    setFormData(emptyForm);
    setAddDialogOpen(false);
    toast.success("Runner added successfully. Waiting for connection...");
  };

  const handleEditRunner = () => {
    if (!selectedRunner || !formData.name || !formData.ipAddress) {
      toast.error("Please fill in required fields");
      return;
    }

    setRunners(
      runners.map((r) =>
        r.id === selectedRunner.id
          ? {
              ...r,
              name: formData.name,
              type: formData.type,
              ipAddress: formData.ipAddress,
              region: formData.region,
              tags: formData.tags.split(",").map((s) => s.trim()).filter(Boolean),
            }
          : r
      )
    );

    setFormData(emptyForm);
    setEditDialogOpen(false);
    setSelectedRunner(null);
    toast.success("Runner updated successfully");
  };

  const handleDeleteRunner = () => {
    if (!runnerToDelete) return;
    setRunners(runners.filter((r) => r.id !== runnerToDelete.id));
    setDeleteDialogOpen(false);
    setRunnerToDelete(null);
    toast.success("Runner removed successfully");
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Type", "Status", "IP Address", "Region", "Version", "Jobs Completed"].join(","),
      ...runners.map((r) =>
        [r.name, r.type, r.status, r.ipAddress, r.region, r.version, r.jobsCompleted].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "runners.csv";
    link.click();
    toast.success("Runners exported");
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
        <PageHeader title="Runners" description={`${stats.total} runners - ${stats.totalJobs} active jobs`}>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setFormData(emptyForm);
                setAddDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Runner
            </Button>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setStatusFilter("all")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Total Runners
              </CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-green-500 transition-colors ${statusFilter === "online" ? "border-green-500" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "online" ? "all" : "online")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Online
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">{stats.online}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-yellow-500 transition-colors ${statusFilter === "busy" ? "border-yellow-500" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "busy" ? "all" : "busy")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-yellow-500" />
                Busy
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-500">{stats.busy}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-gray-500 transition-colors ${statusFilter === "offline" ? "border-gray-500" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "offline" ? "all" : "offline")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-500" />
                Offline
              </CardDescription>
              <CardTitle className="text-3xl text-gray-500">{stats.offline}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Active Jobs
              </CardDescription>
              <CardTitle className="text-3xl text-blue-500">{stats.totalJobs}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              All Runners
            </CardTitle>
            <CardDescription>Manage your scan runners and monitor their performance</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search runners..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              {Object.keys(rowSelection).length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {Object.keys(rowSelection).length} selected
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.info("Pausing selected runners...")}>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-400" onClick={() => toast.info("Removing selected runners...")}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="cursor-pointer"
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest('[role="checkbox"]') ||
                            (e.target as HTMLElement).closest("button")
                          ) {
                            return;
                          }
                          setSelectedRunner(row.original);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No runners found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Main>

      {/* Runner Details Sheet */}
      <Sheet open={!!selectedRunner && !editDialogOpen} onOpenChange={() => setSelectedRunner(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
          <VisuallyHidden>
            <SheetTitle>Runner Details</SheetTitle>
          </VisuallyHidden>
          {selectedRunner && (
            <>
              {/* Header */}
              <div className={`px-6 pt-6 pb-4 bg-gradient-to-br ${
                selectedRunner.status === "online" ? "from-green-500/20 via-green-500/10" :
                selectedRunner.status === "busy" ? "from-yellow-500/20 via-yellow-500/10" :
                selectedRunner.status === "paused" ? "from-blue-500/20 via-blue-500/10" :
                "from-gray-500/20 via-gray-500/10"
              } to-transparent`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    selectedRunner.type === "cloud" ? "bg-blue-500/20" :
                    selectedRunner.type === "self-hosted" ? "bg-purple-500/20" : "bg-orange-500/20"
                  }`}>
                    {typeConfig[selectedRunner.type].icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{selectedRunner.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedRunner.ipAddress}</p>
                  </div>
                  <Badge className={`${statusConfig[selectedRunner.status].bgColor} text-white gap-1`}>
                    {statusConfig[selectedRunner.status].icon}
                    {statusConfig[selectedRunner.status].label}
                  </Badge>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(selectedRunner)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleCopyToken(selectedRunner)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Token
                  </Button>
                  {selectedRunner.status === "paused" ? (
                    <Button size="sm" variant="outline" onClick={() => handleResume(selectedRunner)}>
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                  ) : selectedRunner.status !== "offline" && (
                    <Button size="sm" variant="outline" onClick={() => handlePause(selectedRunner)}>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  )}
                </div>
              </div>

              {/* Content */}
              <Tabs defaultValue="overview" className="px-6 pb-6">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-0">
                  {/* Resource Usage */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Cpu className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-2xl font-bold">{selectedRunner.cpuUsage}%</p>
                          <p className="text-xs text-muted-foreground">CPU Usage</p>
                        </div>
                      </div>
                      <Progress
                        value={selectedRunner.cpuUsage}
                        className={`h-2 ${selectedRunner.cpuUsage > 80 ? "[&>div]:bg-red-500" : selectedRunner.cpuUsage > 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
                      />
                    </div>
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <HardDrive className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-2xl font-bold">{selectedRunner.memoryUsage}%</p>
                          <p className="text-xs text-muted-foreground">Memory Usage</p>
                        </div>
                      </div>
                      <Progress
                        value={selectedRunner.memoryUsage}
                        className={`h-2 ${selectedRunner.memoryUsage > 80 ? "[&>div]:bg-red-500" : selectedRunner.memoryUsage > 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
                      />
                    </div>
                  </div>

                  {/* Job Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{selectedRunner.jobsRunning}</p>
                          <p className="text-xs text-muted-foreground">Active Jobs</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{selectedRunner.jobsCompleted}</p>
                          <p className="text-xs text-muted-foreground">Jobs Completed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedRunner.tags.length > 0 && (
                    <div className="rounded-xl border p-4 bg-card">
                      <h4 className="text-sm font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedRunner.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-0">
                  {/* Info */}
                  <div className="rounded-xl border p-4 bg-card">
                    <h4 className="text-sm font-medium mb-3">Runner Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Type</span>
                        <Badge variant="outline" className={typeConfig[selectedRunner.type].color}>
                          {typeConfig[selectedRunner.type].label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Version</span>
                        <span className="text-sm font-mono">v{selectedRunner.version}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Region</span>
                        <span className="text-sm">{selectedRunner.region}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">IP Address</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{selectedRunner.ipAddress}</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Active</span>
                        <span className="text-sm">{new Date(selectedRunner.lastActive).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="text-sm">{new Date(selectedRunner.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-xl border border-red-500/30 p-4 bg-red-500/5">
                    <h4 className="text-sm font-medium text-red-500 mb-2">Danger Zone</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Permanently remove this runner from your infrastructure.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setRunnerToDelete(selectedRunner);
                        setDeleteDialogOpen(true);
                        setSelectedRunner(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Runner
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Runner Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Add Runner
            </DialogTitle>
            <DialogDescription>Add a new scan runner to your infrastructure</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Runner Name *</Label>
              <Input
                id="name"
                placeholder="e.g., scanner-prod-04"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as RunnerType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloud">Cloud</SelectItem>
                    <SelectItem value="self-hosted">Self-Hosted</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region *</Label>
                <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip">IP Address *</Label>
              <Input
                id="ip"
                placeholder="e.g., 10.0.1.53"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="production, high-priority"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRunner}>
              <Plus className="mr-2 h-4 w-4" />
              Add Runner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Runner Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Runner
            </DialogTitle>
            <DialogDescription>Update runner configuration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Runner Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., scanner-prod-04"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as RunnerType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloud">Cloud</SelectItem>
                    <SelectItem value="self-hosted">Self-Hosted</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region *</Label>
                <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ip">IP Address *</Label>
              <Input
                id="edit-ip"
                placeholder="e.g., 10.0.1.53"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                placeholder="production, high-priority"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRunner}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Runner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{runnerToDelete?.name}</strong>? This will disconnect the runner
              from your infrastructure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDeleteRunner}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
