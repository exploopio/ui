"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { PageHeader, RiskScoreBadge } from "@/features/shared";
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
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Plus,
  GitBranch,
  Search as SearchIcon,
  MoreHorizontal,
  Eye,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle,
  Copy,
  RefreshCw,
  Lock,
  Globe,
  ExternalLink,
  Github,
  GitlabIcon,
  Cloud,
  Upload,
  XCircle,
  Clock,
  AlertCircle,
  Package,
  FileCode,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Play,
} from "lucide-react";
import {
  mockRepositories,
  mockSCMConnections,
  getRepositoryStats,
  type RepositoryView,
  type SCMProvider,
  type SyncStatus,
  type ComplianceStatus,
  type QualityGateStatus,
  type Criticality,
  SCM_PROVIDER_LABELS,
  SYNC_STATUS_LABELS,
} from "@/features/repositories";
import type { Status } from "@/features/shared/types";

// Alias for compatibility
type Repository = RepositoryView;
type RepositoryStatus = Status;
import { cn } from "@/lib/utils";

// ============================================
// Filter Types
// ============================================

type StatusFilter = RepositoryStatus | "all";
type ProviderFilter = SCMProvider | "all";
type SCMConnectionFilter = string | "all";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const REPOSITORY_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
};

const SCM_PROVIDER_COLORS: Record<SCMProvider, string> = {
  github: "bg-gray-900 text-white",
  gitlab: "bg-orange-600 text-white",
  bitbucket: "bg-blue-600 text-white",
  azure_devops: "bg-blue-500 text-white",
  codecommit: "bg-yellow-600 text-white",
  local: "bg-gray-500 text-white",
};

// ============================================
// Helper Components
// ============================================

function ProviderIcon({ provider, className }: { provider: SCMProvider; className?: string }) {
  switch (provider) {
    case "github":
      return <Github className={cn("h-4 w-4", className)} />;
    case "gitlab":
      return <GitlabIcon className={cn("h-4 w-4", className)} />;
    case "bitbucket":
      return <Cloud className={cn("h-4 w-4", className)} />;
    case "azure_devops":
      return <Cloud className={cn("h-4 w-4", className)} />;
    default:
      return <GitBranch className={cn("h-4 w-4", className)} />;
  }
}

function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const config: Record<SyncStatus, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    synced: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
    pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
    syncing: { variant: "outline", icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
    error: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    disabled: { variant: "secondary", icon: <Minus className="h-3 w-3" /> },
  };
  const { variant, icon } = config[status];
  return (
    <Badge variant={variant} className="gap-1">
      {icon}
      {SYNC_STATUS_LABELS[status]}
    </Badge>
  );
}

function QualityGateBadge({ status }: { status: QualityGateStatus }) {
  const config: Record<QualityGateStatus, { color: string; icon: React.ReactNode; label: string }> = {
    passed: { color: "text-green-500", icon: <CheckCircle className="h-3.5 w-3.5" />, label: "Passed" },
    failed: { color: "text-red-500", icon: <XCircle className="h-3.5 w-3.5" />, label: "Failed" },
    warning: { color: "text-yellow-500", icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "Warning" },
    not_computed: { color: "text-muted-foreground", icon: <Minus className="h-3.5 w-3.5" />, label: "N/A" },
  };
  const { color, icon, label } = config[status];
  return (
    <span className={cn("flex items-center gap-1 text-sm", color)}>
      {icon}
      {label}
    </span>
  );
}

function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  const config: Record<ComplianceStatus, { color: string; label: string }> = {
    compliant: { color: "bg-green-500/10 text-green-500 border-green-500/20", label: "Compliant" },
    non_compliant: { color: "bg-red-500/10 text-red-500 border-red-500/20", label: "Non-Compliant" },
    partial: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Partial" },
    not_assessed: { color: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "Not Assessed" },
  };
  const { color, label } = config[status];
  return <Badge variant="outline" className={cn("text-xs", color)}>{label}</Badge>;
}

function CriticalityBadge({ criticality }: { criticality: Criticality }) {
  const config: Record<Criticality, string> = {
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };
  return (
    <Badge variant="outline" className={cn("text-xs capitalize", config[criticality])}>
      {criticality}
    </Badge>
  );
}

function FindingsTrendIcon({ trend }: { trend?: "increasing" | "decreasing" | "stable" }) {
  if (!trend) return null;
  switch (trend) {
    case "increasing":
      return <TrendingUp className="h-3 w-3 text-red-500" />;
    case "decreasing":
      return <TrendingDown className="h-3 w-3 text-green-500" />;
    default:
      return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
}

function RepositoryStatusBadge({ status }: { status: RepositoryStatus }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; color?: string }> = {
    active: { variant: "default" },
    inactive: { variant: "secondary" },
    archived: { variant: "outline", color: "text-muted-foreground" },
    pending: { variant: "outline", color: "text-yellow-500" },
    completed: { variant: "default", color: "text-green-500" },
    failed: { variant: "destructive" },
  };
  const statusConfig = config[status] || { variant: "secondary" };
  return (
    <Badge variant={statusConfig.variant} className={statusConfig.color}>
      {REPOSITORY_STATUS_LABELS[status] || status}
    </Badge>
  );
}

// ============================================
// Main Component
// ============================================

export default function RepositoriesPage() {
  const router = useRouter();

  // Use mock data (will be replaced with API hooks)
  const repositories = mockRepositories;
  const scmConnections = mockSCMConnections;
  const stats = useMemo(() => getRepositoryStats(repositories), [repositories]);

  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [scmConnectionFilter, setSCMConnectionFilter] = useState<SCMConnectionFilter>("all");
  const [rowSelection, setRowSelection] = useState({});

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [repositoryToDelete, setRepositoryToDelete] = useState<Repository | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...repositories];
    if (statusFilter !== "all") {
      data = data.filter((p) => p.status === statusFilter);
    }
    if (providerFilter !== "all") {
      data = data.filter((p) => p.scm_provider === providerFilter);
    }
    if (scmConnectionFilter !== "all") {
      // Filter by SCM organization since connection_id is not available in RepositoryView
      data = data.filter((p) => p.scm_organization === scmConnectionFilter);
    }
    return data;
  }, [repositories, statusFilter, providerFilter, scmConnectionFilter]);

  // Table columns
  const columns: ColumnDef<Repository>[] = [
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
          Repository
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="shrink-0">
            <ProviderIcon provider={row.original.scm_provider} />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{row.original.name}</p>
            <p className="text-muted-foreground text-xs truncate max-w-[200px]">
              {row.original.description || "No description"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "scm_connection",
      header: "Source",
      cell: ({ row }) => {
        const connection = scmConnections.find((c) => c.scmOrganization === row.original.scm_organization);
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={cn("text-xs", SCM_PROVIDER_COLORS[row.original.scm_provider])}>
                    {SCM_PROVIDER_LABELS[row.original.scm_provider]}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{connection?.name || "Manual"}</p>
                {connection && <p className="text-xs text-muted-foreground">{connection.baseUrl}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "visibility",
      header: "Visibility",
      cell: ({ row }) =>
        row.original.visibility === "private" ? (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="h-3 w-3 shrink-0" /> Private
          </span>
        ) : row.original.visibility === "internal" ? (
          <span className="flex items-center gap-1 text-sm text-blue-500">
            <Users className="h-3 w-3 shrink-0" /> Internal
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm text-green-500">
            <Globe className="h-3 w-3 shrink-0" /> Public
          </span>
        ),
    },
    {
      accessorKey: "primary_language",
      header: "Language",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.original.primary_language || "-"}
        </Badge>
      ),
    },
    {
      id: "findings",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
          Findings
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: (row) => row.findings_summary.total,
      cell: ({ row }) => {
        const { total, by_severity, trend } = row.original.findings_summary;
        if (total === 0) return <span className="text-muted-foreground">0</span>;
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {by_severity.critical > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                  {by_severity.critical}C
                </Badge>
              )}
              {by_severity.high > 0 && (
                <Badge className="h-5 px-1.5 text-xs bg-orange-500">
                  {by_severity.high}H
                </Badge>
              )}
              {(by_severity.medium > 0 || by_severity.low > 0) && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  +{by_severity.medium + by_severity.low}
                </Badge>
              )}
            </div>
            <FindingsTrendIcon trend={trend} />
          </div>
        );
      },
    },
    {
      accessorKey: "risk_score",
      header: "Risk",
      cell: ({ row }) => <RiskScoreBadge score={row.original.risk_score} size="sm" />,
    },
    {
      accessorKey: "quality_gate_status",
      header: "Quality Gate",
      cell: ({ row }) => <QualityGateBadge status={row.original.quality_gate_status} />,
    },
    {
      accessorKey: "sync_status",
      header: "Sync",
      cell: ({ row }) => <SyncStatusBadge status={row.original.sync_status} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <RepositoryStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const repository = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/assets/repositories/${repository.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Triggering scan...")}>
                <Play className="mr-2 h-4 w-4" />
                Trigger Scan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Syncing repository...")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyUrl(repository)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenExternal(repository)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Browser
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info("Opening settings...")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400"
                onClick={() => {
                  setRepositoryToDelete(repository);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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
  const handleCopyUrl = (repo: Repository) => {
    const webUrl = repo.repository?.webUrl;
    if (webUrl) {
      navigator.clipboard.writeText(webUrl);
      toast.success("URL copied to clipboard");
    }
  };

  const handleOpenExternal = (repo: Repository) => {
    const webUrl = repo.repository?.webUrl;
    if (webUrl) {
      window.open(webUrl, "_blank");
    }
  };

  const handleDelete = async () => {
    if (!repositoryToDelete) return;
    toast.success(`Repository "${repositoryToDelete.name}" deleted`);
    setDeleteDialogOpen(false);
    setRepositoryToDelete(null);
  };

  const handleBulkDelete = async () => {
    const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (selectedIds.length === 0) return;
    toast.success(`Deleted ${selectedIds.length} repositories`);
    setRowSelection({});
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Provider", "Visibility", "Language", "Risk Score", "Findings", "Quality Gate", "Status"].join(","),
      ...repositories.map((p) =>
        [
          p.name,
          p.scm_provider,
          p.visibility,
          p.primary_language || "",
          p.risk_score,
          p.findings_summary.total,
          p.quality_gate_status,
          p.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "repositories.csv";
    a.click();
    toast.success("Repositories exported");
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
          title="Git Repositories"
          description={`${repositories.length} repositories from ${scmConnections.filter((c) => c.status === "connected").length} SCM connections`}
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => toast.info("Add repository dialog coming soon")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Repository
            </Button>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("all")}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 shrink-0" />
                Total Repositories
              </CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:border-red-500 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                Critical Findings
              </CardDescription>
              <CardTitle className="text-3xl text-red-500">{stats.with_critical_findings}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                {stats.total_findings} total findings
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-green-500 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                Quality Gate Passed
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">{stats.by_quality_gate.passed}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Progress
                value={(stats.by_quality_gate.passed / stats.total) * 100}
                className="h-1"
              />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-blue-500 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500 shrink-0" />
                Components
              </CardDescription>
              <CardTitle className="text-3xl text-blue-500">{stats.total_components}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                {stats.vulnerable_components} vulnerable
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-purple-500 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500 shrink-0" />
                Avg Risk Score
              </CardDescription>
              <CardTitle className="text-3xl text-purple-500">{stats.avg_risk_score}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                {stats.scanned_last_24h} scanned today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SCM Connections Overview */}
        <div className="mt-4 flex flex-wrap gap-2">
          {scmConnections.map((conn) => (
            <Badge
              key={conn.id}
              variant={scmConnectionFilter === conn.id ? "default" : "outline"}
              className={cn(
                "cursor-pointer gap-1.5 py-1.5",
                conn.status === "error" && "border-red-500/50",
                conn.status === "connected" && scmConnectionFilter !== conn.id && "border-green-500/50"
              )}
              onClick={() => setSCMConnectionFilter(scmConnectionFilter === conn.id ? "all" : conn.id)}
            >
              <ProviderIcon provider={conn.provider} className="h-3.5 w-3.5" />
              {conn.name}
              {conn.status === "error" && <AlertCircle className="h-3 w-3 text-red-500" />}
              <span className="text-muted-foreground">
                ({repositories.filter((p) => p.scm_organization === conn.scmOrganization).length})
              </span>
            </Badge>
          ))}
        </div>

        {/* Table Card */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  All Repositories
                </CardTitle>
                <CardDescription>Manage your source code repositories and security scans</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Quick Filter Tabs */}
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="mb-4">
              <TabsList>
                {statusFilters.map((filter) => (
                  <TabsTrigger key={filter.value} value={filter.value} className="gap-1.5">
                    {filter.label}
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {filter.value === "all"
                        ? stats.total
                        : (stats.by_status as Record<string, number>)[filter.value] || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search and Actions */}
            <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 text-left"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Provider filter */}
                <Select value={providerFilter} onValueChange={(v) => setProviderFilter(v as ProviderFilter)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="bitbucket">Bitbucket</SelectItem>
                    <SelectItem value="azure_devops">Azure DevOps</SelectItem>
                  </SelectContent>
                </Select>

                {Object.keys(rowSelection).length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {Object.keys(rowSelection).length} selected
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.info("Scanning selected repositories...")}>
                        <Play className="mr-2 h-4 w-4" />
                        Scan Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Syncing selected repositories...")}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-400" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
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
                          router.push(`/assets/repositories/${row.original.id}`);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No repositories found.
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
              <div className="flex flex-wrap items-center gap-2">
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

      {/* Repository Detail Sheet */}
      <Sheet open={!!selectedRepository} onOpenChange={() => setSelectedRepository(null)}>
        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col h-full gap-0">
          {selectedRepository && (
            <>
              {/* Fixed Header */}
              <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border">
                    <ProviderIcon provider={selectedRepository.scm_provider} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold truncate">{selectedRepository.name}</h2>
                      <RepositoryStatusBadge status={selectedRepository.status} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {selectedRepository.description || "No description"}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="outline" className={cn("text-xs", SCM_PROVIDER_COLORS[selectedRepository.scm_provider])}>
                        {SCM_PROVIDER_LABELS[selectedRepository.scm_provider]}
                      </Badge>
                      <SyncStatusBadge status={selectedRepository.sync_status} />
                      <QualityGateBadge status={selectedRepository.quality_gate_status} />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button size="sm" onClick={() => handleOpenExternal(selectedRepository)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Browser
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("Triggering scan...")}>
                    <Play className="mr-2 h-4 w-4" />
                    Scan
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("Syncing...")}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCopyUrl(selectedRepository)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-4 rounded-xl border bg-card">
                      <RiskScoreBadge score={selectedRepository.risk_score} size="lg" />
                      <p className="text-xs text-muted-foreground mt-2">Risk Score</p>
                    </div>
                    <div className="text-center p-4 rounded-xl border bg-card">
                      <p className="text-2xl font-bold">{selectedRepository.findings_summary.total}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total Findings</p>
                    </div>
                    <div className="text-center p-4 rounded-xl border bg-card">
                      <p className="text-2xl font-bold text-red-500">
                        {selectedRepository.findings_summary.by_severity.critical + selectedRepository.findings_summary.by_severity.high}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Critical/High</p>
                    </div>
                    <div className="text-center p-4 rounded-xl border bg-card">
                      <p className="text-2xl font-bold text-blue-500">{selectedRepository.components_summary?.total || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Components</p>
                    </div>
                  </div>

                  {/* Findings Breakdown */}
                  <div className="rounded-xl border bg-card">
                    <div className="px-4 py-3 border-b">
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        Findings by Severity
                      </h4>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        {[
                          { key: "critical", label: "Critical", color: "bg-red-500" },
                          { key: "high", label: "High", color: "bg-orange-500" },
                          { key: "medium", label: "Medium", color: "bg-yellow-500" },
                          { key: "low", label: "Low", color: "bg-blue-500" },
                          { key: "info", label: "Info", color: "bg-gray-400" },
                        ].map(({ key, label, color }) => {
                          const count = selectedRepository.findings_summary.by_severity[key as keyof typeof selectedRepository.findings_summary.by_severity];
                          const total = selectedRepository.findings_summary.total || 1;
                          const percentage = (count / total) * 100;
                          return (
                            <TooltipProvider key={key}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn("h-8 rounded-md transition-all cursor-pointer hover:opacity-80", color)}
                                    style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%`, minWidth: count > 0 ? "32px" : 0 }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">{label}: {count}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-3 text-xs">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Critical: {selectedRepository.findings_summary.by_severity.critical}</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> High: {selectedRepository.findings_summary.by_severity.high}</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Medium: {selectedRepository.findings_summary.by_severity.medium}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Repository Info */}
                  <div className="rounded-xl border bg-card">
                    <div className="px-4 py-3 border-b">
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <FileCode className="h-4 w-4" />
                        Repository Information
                      </h4>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Visibility</p>
                          <p className="flex items-center gap-1.5 font-medium">
                            {selectedRepository.visibility === "private" ? (
                              <><Lock className="h-3.5 w-3.5 text-muted-foreground" /> Private</>
                            ) : selectedRepository.visibility === "internal" ? (
                              <><Users className="h-3.5 w-3.5 text-blue-500" /> Internal</>
                            ) : (
                              <><Globe className="h-3.5 w-3.5 text-green-500" /> Public</>
                            )}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Language</p>
                          <Badge variant="secondary">{selectedRepository.primary_language || "-"}</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Default Branch</p>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{selectedRepository.default_branch}</code>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Criticality</p>
                          <CriticalityBadge criticality={selectedRepository.criticality} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Compliance</p>
                          <ComplianceBadge status={selectedRepository.compliance_status} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Repository</p>
                          <p className="font-mono text-xs truncate">{selectedRepository.scm_organization}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="rounded-xl border bg-card">
                    <div className="px-4 py-3 border-b">
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4" />
                        Security Features
                      </h4>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {selectedRepository.security_features && Object.entries(selectedRepository.security_features).map(([key, enabled]) => (
                          <div key={key} className={cn(
                            "flex items-center gap-2.5 p-2.5 rounded-lg border text-sm",
                            enabled ? "bg-green-500/5 border-green-500/20" : "bg-muted/30"
                          )}>
                            {enabled ? (
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={cn("text-xs", !enabled && "text-muted-foreground")}>
                              {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                          </div>
                        ))}
                        {!selectedRepository.security_features && (
                          <p className="text-sm text-muted-foreground col-span-2">No security features configured</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scan Settings */}
                  <div className="rounded-xl border bg-card">
                    <div className="px-4 py-3 border-b">
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        <Settings className="h-4 w-4" />
                        Scan Configuration
                      </h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Enabled Scanners</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedRepository.scan_settings.enabled_scanners.map((scanner) => (
                            <Badge key={scanner} className="text-xs uppercase">
                              {scanner}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          {selectedRepository.scan_settings.auto_scan ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>Auto Scan</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedRepository.scan_settings.scan_on_push ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>On Push</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedRepository.scan_settings.scan_on_pr ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>On PR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedRepository.tags && selectedRepository.tags.length > 0 && (
                    <div className="rounded-xl border bg-card">
                      <div className="px-4 py-3 border-b">
                        <h4 className="font-semibold flex items-center gap-2 text-sm">
                          Tags
                        </h4>
                      </div>
                      <div className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {selectedRepository.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
                    {selectedRepository.last_scanned_at && (
                      <p className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5" />
                        Last scanned: {new Date(selectedRepository.last_scanned_at).toLocaleString()}
                      </p>
                    )}
                    {selectedRepository.lastSeen && (
                      <p className="flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Last seen: {new Date(selectedRepository.lastSeen).toLocaleString()}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Created: {new Date(selectedRepository.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Repositories
            </DialogTitle>
            <DialogDescription>
              Import repositories from your connected SCM providers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select SCM Connection</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a connection" />
                </SelectTrigger>
                <SelectContent>
                  {scmConnections
                    .filter((c) => c.status === "connected")
                    .map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        <div className="flex items-center gap-2">
                          <ProviderIcon provider={conn.provider} className="h-4 w-4" />
                          {conn.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                After selecting a connection, you can choose which repositories to import
                and configure default scan settings.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.info("Import wizard coming soon");
              setImportDialogOpen(false);
            }}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repository</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{repositoryToDelete?.name}</strong>? This action cannot be undone.
              All associated scan data and findings will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
