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
import { PageHeader, StatusBadge } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import {
  Plus,
  SearchIcon,
  Filter,
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  XCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Radar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  Target,
  Shield,
  Calendar,
  Layers,
} from "lucide-react";
import {
  mockScans,
  getScanStats,
  SCAN_TYPE_LABELS,
  NewScanDialog,
  type Scan,
  type ScanType,
} from "@/features/scans";
import type { Status } from "@/features/shared/types";

// Filter Types
type StatusFilter = Status | "all";
type TypeFilter = ScanType | "all";

const statusFilters: { value: StatusFilter; label: string; count?: number }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Scheduled" },
];

const typeFilters: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "full", label: "Full Scan" },
  { value: "quick", label: "Quick Scan" },
  { value: "compliance", label: "Compliance" },
  { value: "custom", label: "Custom" },
];

// Duration formatter
function formatDuration(seconds?: number): string {
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Date formatter
function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ScansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [rowSelection, setRowSelection] = useState({});

  const stats = getScanStats();

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...mockScans];

    // Status filter
    if (statusFilter !== "all") {
      data = data.filter((scan) => scan.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      data = data.filter((scan) => scan.type === typeFilter);
    }

    return data;
  }, [statusFilter, typeFilter]);

  // Table columns
  const columns: ColumnDef<Scan>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
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
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.description && (
            <p className="text-muted-foreground max-w-[300px] truncate text-xs">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{SCAN_TYPE_LABELS[row.original.type]}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const isActive = row.original.status === "active";
        return (
          <div className="flex items-center gap-2">
            <Progress
              value={row.original.progress}
              className={`h-2 w-20 ${isActive ? "[&>div]:animate-pulse" : ""}`}
            />
            <span className="text-muted-foreground text-xs w-10">
              {row.original.progress}%
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "targetCount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Targets
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.targetCount}</span>
      ),
    },
    {
      accessorKey: "findingsCount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Findings
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const scan = row.original;
        if (scan.findingsCount === 0) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-1">
            <span>{scan.findingsCount}</span>
            {scan.criticalCount > 0 && (
              <Badge className="bg-red-500 px-1 text-xs">{scan.criticalCount}C</Badge>
            )}
            {scan.highCount > 0 && (
              <Badge className="bg-orange-500 px-1 text-xs">{scan.highCount}H</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdByName",
      header: "Created By",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.createdByName}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const scan = row.original;
        const isActive = scan.status === "active";
        const isFailed = scan.status === "failed";
        const isCompleted = scan.status === "completed";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedScan(scan)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {isActive && (
                <>
                  <DropdownMenuItem onClick={() => handlePauseScan(scan)}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Scan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCancelScan(scan)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Scan
                  </DropdownMenuItem>
                </>
              )}
              {(isCompleted || isFailed) && (
                <DropdownMenuItem onClick={() => handleRerunScan(scan)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rerun Scan
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400"
                onClick={() => handleDeleteScan(scan)}
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
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Actions
  const handlePauseScan = (scan: Scan) => {
    toast.success(`Paused scan: ${scan.name}`);
  };

  const handleCancelScan = (scan: Scan) => {
    toast.success(`Cancelled scan: ${scan.name}`);
  };

  const handleRerunScan = (scan: Scan) => {
    toast.success(`Rerunning scan: ${scan.name}`);
  };

  const handleDeleteScan = (scan: Scan) => {
    toast.success(`Deleted scan: ${scan.name}`);
  };

  // Count for each status
  const statusCounts = useMemo(() => ({
    all: mockScans.length,
    active: mockScans.filter((s) => s.status === "active").length,
    completed: mockScans.filter((s) => s.status === "completed").length,
    failed: mockScans.filter((s) => s.status === "failed").length,
    pending: mockScans.filter((s) => s.status === "pending").length,
  }), []);

  // Active filters count
  const activeFiltersCount = [statusFilter !== "all", typeFilter !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
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
          title="Scan Management"
          description={`${stats.totalScans} total scans - ${stats.activeScans} active`}
        >
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Scan
          </Button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setStatusFilter("all")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Radar className="h-4 w-4" />
                Total Scans
              </CardDescription>
              <CardTitle className="text-3xl">{stats.totalScans}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-blue-500 transition-colors ${statusFilter === "active" ? "border-blue-500" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Running
              </CardDescription>
              <CardTitle className="text-3xl text-blue-500">
                {stats.activeScans}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-green-500 transition-colors ${statusFilter === "completed" ? "border-green-500" : ""}`}
            onClick={() => setStatusFilter("completed")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Completed
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {stats.completedScans}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-red-500 transition-colors ${statusFilter === "failed" ? "border-red-500" : ""}`}
            onClick={() => setStatusFilter("failed")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Failed
              </CardDescription>
              <CardTitle className="text-3xl text-red-500">
                {stats.failedScans}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Total Findings
              </CardDescription>
              <CardTitle className="text-3xl">{stats.totalFindings}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Scans</CardTitle>
                <CardDescription>Manage and monitor security scans</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Quick Filter Tabs */}
            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              className="mb-4"
            >
              <TabsList>
                {statusFilters.map((filter) => (
                  <TabsTrigger key={filter.value} value={filter.value} className="gap-1.5">
                    {filter.label}
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {statusCounts[filter.value as keyof typeof statusCounts]}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scans..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 sm:w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filters</h4>
                        {activeFiltersCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-muted-foreground hover:text-foreground"
                            onClick={clearFilters}
                          >
                            Clear all
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase">Scan Type</Label>
                        <div className="flex flex-wrap gap-2">
                          {typeFilters.map((filter) => (
                            <Badge
                              key={filter.value}
                              variant={typeFilter === filter.value ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => setTypeFilter(filter.value)}
                            >
                              {filter.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {Object.keys(rowSelection).length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {Object.keys(rowSelection).length} selected
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.success("Cancelled selected scans")}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.success("Rerunning selected scans")}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Rerun Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400"
                        onClick={() => toast.success("Deleted selected scans")}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {typeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {typeFilters.find((f) => f.value === typeFilter)?.label}
                    <button
                      onClick={() => setTypeFilter("all")}
                      className="ml-1 hover:text-foreground"
                    >
                      x
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
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
                          // Don't open sheet if clicking checkbox or action button
                          if ((e.target as HTMLElement).closest('[role="checkbox"]') ||
                              (e.target as HTMLElement).closest('button')) {
                            return;
                          }
                          setSelectedScan(row.original);
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
                        No scans found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Main>

      {/* Scan Details Sheet */}
      <Sheet open={!!selectedScan} onOpenChange={() => setSelectedScan(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
          <VisuallyHidden>
            <SheetTitle>Scan Details</SheetTitle>
          </VisuallyHidden>
          {selectedScan && (
            <>
              {/* Hero Header */}
              <div className={`px-6 pt-6 pb-4 ${
                selectedScan.status === "active" ? "bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent" :
                selectedScan.status === "completed" ? "bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent" :
                selectedScan.status === "failed" ? "bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent" :
                "bg-gradient-to-br from-yellow-500/20 via-yellow-500/10 to-transparent"
              }`}>
                {/* Status & Type Row */}
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="font-medium">
                    {SCAN_TYPE_LABELS[selectedScan.type]}
                  </Badge>
                  <StatusBadge status={selectedScan.status} />
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-1">{selectedScan.name}</h2>
                {selectedScan.description && (
                  <p className="text-sm text-muted-foreground">{selectedScan.description}</p>
                )}

                {/* Progress Bar - Prominent */}
                <div className="mt-4 p-4 rounded-xl bg-background/80 backdrop-blur border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Scan Progress</span>
                    <span className={`text-2xl font-bold ${
                      selectedScan.status === "completed" ? "text-green-500" :
                      selectedScan.status === "failed" ? "text-red-500" :
                      selectedScan.status === "active" ? "text-blue-500" :
                      "text-yellow-500"
                    }`}>
                      {selectedScan.progress}%
                    </span>
                  </div>
                  <Progress
                    value={selectedScan.progress}
                    className={`h-3 ${
                      selectedScan.status === "active" ? "[&>div]:animate-pulse [&>div]:bg-blue-500" :
                      selectedScan.status === "completed" ? "[&>div]:bg-green-500" :
                      selectedScan.status === "failed" ? "[&>div]:bg-red-500" :
                      "[&>div]:bg-yellow-500"
                    }`}
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{selectedScan.targetCount} targets</span>
                    <span>
                      {selectedScan.status === "active" ? "Scanning..." :
                       selectedScan.status === "completed" ? "Completed" :
                       selectedScan.status === "failed" ? "Failed" : "Scheduled"}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  {selectedScan.status === "active" && (
                    <>
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => handlePauseScan(selectedScan)}>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleCancelScan(selectedScan)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  )}
                  {(selectedScan.status === "completed" || selectedScan.status === "failed") && (
                    <>
                      <Button size="sm" className="flex-1" onClick={() => handleRerunScan(selectedScan)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Rerun Scan
                      </Button>
                      {selectedScan.findingsCount > 0 && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.info("View findings")}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Findings
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Content with Tabs */}
              <Tabs defaultValue="overview" className="px-6 pb-6">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-0">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{selectedScan.targetCount}</p>
                          <p className="text-xs text-muted-foreground">Total Targets</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{selectedScan.findingsCount}</p>
                          <p className="text-xs text-muted-foreground">Findings Found</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Findings Breakdown */}
                  {selectedScan.findingsCount > 0 && (
                    <div className="rounded-xl border p-4 bg-card">
                      <h4 className="text-sm font-medium mb-3">Findings by Severity</h4>
                      <div className="space-y-2">
                        {selectedScan.criticalCount > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-sm flex-1">Critical</span>
                            <span className="font-bold text-red-500">{selectedScan.criticalCount}</span>
                          </div>
                        )}
                        {selectedScan.highCount > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                            <span className="text-sm flex-1">High</span>
                            <span className="font-bold text-orange-500">{selectedScan.highCount}</span>
                          </div>
                        )}
                        {selectedScan.mediumCount > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            <span className="text-sm flex-1">Medium</span>
                            <span className="font-bold text-yellow-500">{selectedScan.mediumCount}</span>
                          </div>
                        )}
                        {selectedScan.lowCount > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-sm flex-1">Low</span>
                            <span className="font-bold text-blue-500">{selectedScan.lowCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="rounded-xl border p-4 bg-card">
                    <h4 className="text-sm font-medium mb-3">Timeline</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Created</p>
                          <p className="text-xs text-muted-foreground">{formatDate(selectedScan.createdAt)}</p>
                        </div>
                      </div>
                      {selectedScan.startedAt && (
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                            <Play className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Started</p>
                            <p className="text-xs text-muted-foreground">{formatDate(selectedScan.startedAt)}</p>
                          </div>
                        </div>
                      )}
                      {selectedScan.completedAt && (
                        <div className="flex items-start gap-3">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center mt-0.5 ${
                            selectedScan.status === "completed" ? "bg-green-500/20" : "bg-red-500/20"
                          }`}>
                            {selectedScan.status === "completed" ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {selectedScan.status === "completed" ? "Completed" : "Failed"}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(selectedScan.completedAt)}</p>
                            {selectedScan.duration && (
                              <p className="text-xs text-muted-foreground">Duration: {formatDuration(selectedScan.duration)}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Configuration Tab */}
                <TabsContent value="config" className="space-y-4 mt-0">
                  {/* Scan Type & Intensity */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border p-4 bg-card">
                      <p className="text-xs text-muted-foreground mb-1">Scan Type</p>
                      <p className="font-medium">{SCAN_TYPE_LABELS[selectedScan.type]}</p>
                    </div>
                    <div className="rounded-xl border p-4 bg-card">
                      <p className="text-xs text-muted-foreground mb-1">Intensity</p>
                      <p className="font-medium capitalize">{selectedScan.intensity}</p>
                    </div>
                  </div>

                  {/* Scan Modules */}
                  <div className="rounded-xl border p-4 bg-card">
                    <h4 className="text-sm font-medium mb-3">Scan Modules</h4>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {Object.entries(selectedScan.options).map(([key, value]) => (
                        <div
                          key={key}
                          className={`flex items-center gap-2 rounded-lg p-2.5 text-sm ${
                            value ? "bg-green-500/10" : "bg-muted/50"
                          }`}
                        >
                          {value ? (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className={`text-xs ${!value && "text-muted-foreground"}`}>
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="rounded-xl border p-4 bg-card">
                    <h4 className="text-sm font-medium mb-3">Schedule Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Frequency</span>
                        </div>
                        <span className="text-sm font-medium">
                          {selectedScan.schedule.runImmediately
                            ? "Run immediately"
                            : `${selectedScan.schedule.frequency || "Once"}`}
                        </span>
                      </div>
                      {!selectedScan.schedule.runImmediately && selectedScan.schedule.time && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Time</span>
                          </div>
                          <span className="text-sm font-medium">{selectedScan.schedule.time}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Max Concurrent</span>
                        </div>
                        <span className="text-sm font-medium">{selectedScan.maxConcurrent}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4 mt-0">
                  {/* Created By */}
                  <div className="rounded-xl border p-4 bg-card">
                    <h4 className="text-sm font-medium mb-3">Created By</h4>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{selectedScan.createdByName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedScan.createdByName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(selectedScan.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Scan ID */}
                  <div className="rounded-xl border p-4 bg-card">
                    <h4 className="text-sm font-medium mb-3">Technical Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Scan ID</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{selectedScan.id}</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Target Type</span>
                        <span className="text-sm font-medium capitalize">{selectedScan.targets.type.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-xl border border-red-500/30 p-4 bg-red-500/5">
                    <h4 className="text-sm font-medium text-red-500 mb-2">Danger Zone</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Permanently delete this scan and all associated data.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        handleDeleteScan(selectedScan);
                        setSelectedScan(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Scan
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Scan Dialog */}
      <NewScanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(data) => {
          console.log("New scan data:", data);
          toast.success("Scan created successfully");
        }}
      />
    </>
  );
}
