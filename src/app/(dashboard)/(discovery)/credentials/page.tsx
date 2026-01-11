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
import { PageHeader, StatusBadge, RiskScoreBadge } from "@/features/shared";
import {
  AssetDetailSheet,
  StatCard,
  StatsGrid,
  MetadataGrid,
  MetadataRow,
  SectionTitle,
  ClassificationBadges,
} from "@/features/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import {
  Plus,
  KeyRound,
  Search as SearchIcon,
  MoreHorizontal,
  Eye,
  Pencil,
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
  Clock,
  Copy,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { getCredentials, getAssetRelationships, type Asset } from "@/features/assets";
import { mockAssetGroups } from "@/features/asset-groups";
import type { Status } from "@/features/shared/types";

// Filter types
type StatusFilter = Status | "all";
type SourceFilter = "all" | "darkweb" | "github" | "phishing" | "breach" | "internal" | "other";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Resolved" },
  { value: "inactive", label: "Inactive" },
];

const sourceFilters: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "All Sources" },
  { value: "darkweb", label: "Dark Web" },
  { value: "github", label: "GitHub/GitLab" },
  { value: "phishing", label: "Phishing" },
  { value: "breach", label: "Data Breach" },
  { value: "internal", label: "Internal" },
  { value: "other", label: "Other" },
];

// Empty form state
const emptyCredentialForm = {
  name: "",
  description: "",
  groupId: "",
  source: "",
  username: "",
  leakDate: "",
  tags: "",
};

// Source categorization helper
const categorizeSource = (source: string): SourceFilter => {
  const s = source.toLowerCase();
  if (s.includes("dark") || s.includes("darkweb")) return "darkweb";
  if (s.includes("github") || s.includes("gitlab") || s.includes("gist") || s.includes("commit")) return "github";
  if (s.includes("phishing")) return "phishing";
  if (s.includes("breach") || s.includes("dump") || s.includes("compilation")) return "breach";
  if (s.includes("internal") || s.includes("confluence") || s.includes("email")) return "internal";
  return "other";
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Asset[]>(getCredentials());
  const [selectedCredential, setSelectedCredential] = useState<Asset | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [rowSelection, setRowSelection] = useState({});

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<Asset | null>(null);

  // Form state
  const [formData, setFormData] = useState(emptyCredentialForm);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...credentials];
    if (statusFilter !== "all") {
      data = data.filter((c) => c.status === statusFilter);
    }
    if (sourceFilter !== "all") {
      data = data.filter((c) => {
        const source = c.metadata.source || "";
        return categorizeSource(source) === sourceFilter;
      });
    }
    return data;
  }, [credentials, statusFilter, sourceFilter]);

  // Status counts
  const statusCounts = useMemo(() => ({
    all: credentials.length,
    active: credentials.filter((c) => c.status === "active").length,
    pending: credentials.filter((c) => c.status === "pending").length,
    completed: credentials.filter((c) => c.status === "completed").length,
    inactive: credentials.filter((c) => c.status === "inactive").length,
  }), [credentials]);

  // Risk stats
  const riskStats = useMemo(() => {
    const active = credentials.filter((c) => c.status === "active");
    return {
      critical: active.filter((c) => c.riskScore >= 90).length,
      high: active.filter((c) => c.riskScore >= 70 && c.riskScore < 90).length,
      medium: active.filter((c) => c.riskScore >= 40 && c.riskScore < 70).length,
      low: active.filter((c) => c.riskScore < 40).length,
    };
  }, [credentials]);

  // Table columns
  const columns: ColumnDef<Asset>[] = [
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
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Credential
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-red-500" />
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-muted-foreground text-xs">{row.original.description}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "metadata.source",
      header: "Source",
      cell: ({ row }) => {
        const source = row.original.metadata.source || "-";
        const category = categorizeSource(source);
        const categoryColors: Record<SourceFilter, string> = {
          all: "",
          darkweb: "bg-red-500/10 text-red-600 border-red-500/20",
          github: "bg-purple-500/10 text-purple-600 border-purple-500/20",
          phishing: "bg-orange-500/10 text-orange-600 border-orange-500/20",
          breach: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
          internal: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          other: "bg-slate-500/10 text-slate-600 border-slate-500/20",
        };
        return (
          <Badge variant="outline" className={categoryColors[category]}>
            {source}
          </Badge>
        );
      },
    },
    {
      accessorKey: "metadata.username",
      header: "Username",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-mono">{row.original.metadata.username || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "metadata.leakDate",
      header: "Leak Date",
      cell: ({ row }) => {
        const date = row.original.metadata.leakDate;
        if (!date) return <span className="text-muted-foreground">-</span>;
        const leakDate = new Date(date);
        const now = new Date();
        const daysAgo = Math.ceil((now.getTime() - leakDate.getTime()) / (1000 * 60 * 60 * 24));
        const isRecent = daysAgo <= 30;
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className={isRecent ? "text-red-500 font-medium" : ""}>
              {leakDate.toLocaleDateString()}
            </span>
            {isRecent && <Badge variant="destructive" className="ml-1 text-xs">Recent</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "classification",
      header: "Classification",
      cell: ({ row }) => (
        <ClassificationBadges
          scope={row.original.scope}
          exposure={row.original.exposure}
          size="sm"
          showTooltips
        />
      ),
    },
    {
      accessorKey: "riskScore",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Risk
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <RiskScoreBadge score={row.original.riskScore} size="sm" />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const credential = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedCredential(credential)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEdit(credential)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyCredential(credential)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Name
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  setCredentialToDelete(credential);
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
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Handlers
  const handleOpenEdit = (credential: Asset) => {
    setFormData({
      name: credential.name,
      description: credential.description || "",
      groupId: credential.groupId || "",
      source: credential.metadata.source || "",
      username: credential.metadata.username || "",
      leakDate: credential.metadata.leakDate || "",
      tags: credential.tags?.join(", ") || "",
    });
    setSelectedCredential(credential);
    setEditDialogOpen(true);
  };

  const handleAddCredential = () => {
    if (!formData.name || !formData.source) {
      toast.error("Please fill in required fields");
      return;
    }

    const newCredential: Asset = {
      id: `cred-${Date.now()}`,
      type: "credential",
      name: formData.name,
      description: formData.description,
      status: "active",
      scope: "internal",
      exposure: "isolated",
      riskScore: 75,
      findingCount: 1,
      groupId: formData.groupId || undefined,
      groupName: formData.groupId
        ? mockAssetGroups.find((g) => g.id === formData.groupId)?.name
        : undefined,
      metadata: {
        source: formData.source,
        username: formData.username,
        leakDate: formData.leakDate || new Date().toISOString().split("T")[0],
      },
      tags: formData.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCredentials([newCredential, ...credentials]);
    setFormData(emptyCredentialForm);
    setAddDialogOpen(false);
    toast.success("Credential leak added successfully");
  };

  const handleUpdateCredential = () => {
    if (!selectedCredential || !formData.name || !formData.source) {
      toast.error("Please fill in required fields");
      return;
    }

    const updated = credentials.map((c) =>
      c.id === selectedCredential.id
        ? {
            ...c,
            name: formData.name,
            description: formData.description,
            groupId: formData.groupId || undefined,
            groupName: formData.groupId
              ? mockAssetGroups.find((g) => g.id === formData.groupId)?.name
              : undefined,
            metadata: {
              ...c.metadata,
              source: formData.source,
              username: formData.username,
              leakDate: formData.leakDate,
            },
            tags: formData.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            updatedAt: new Date().toISOString(),
          }
        : c
    );

    setCredentials(updated);
    setFormData(emptyCredentialForm);
    setEditDialogOpen(false);
    setSelectedCredential(null);
    toast.success("Credential updated successfully");
  };

  const handleDeleteCredential = () => {
    if (!credentialToDelete) return;

    setCredentials(credentials.filter((c) => c.id !== credentialToDelete.id));
    setDeleteDialogOpen(false);
    setCredentialToDelete(null);
    toast.success("Credential deleted successfully");
  };

  const handleCopyCredential = (credential: Asset) => {
    navigator.clipboard.writeText(credential.name);
    toast.success("Credential name copied to clipboard");
  };

  const handleMarkResolved = (credential: Asset) => {
    const updated = credentials.map((c) =>
      c.id === credential.id
        ? { ...c, status: "completed" as Status, updatedAt: new Date().toISOString() }
        : c
    );
    setCredentials(updated);
    toast.success("Credential marked as resolved");
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
        <div className="flex items-center justify-between">
          <PageHeader
            title="Credential Leaks"
            description={`${credentials.length} leaked credentials detected`}
          />
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Credential
          </Button>
        </div>

        {/* Warning Banner */}
        {statusCounts.active > 0 && (
          <Card className="mt-6 border-red-500/50 bg-red-50 dark:bg-red-950/20">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  Active Credential Leaks Detected
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {statusCounts.active} active credential leaks require immediate attention.
                  {riskStats.critical > 0 && ` ${riskStats.critical} are critical risk.`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Leaks</p>
                  <p className="text-2xl font-bold text-red-600">{statusCounts.active}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Risk</p>
                  <p className="text-2xl font-bold text-red-600">{riskStats.critical}</p>
                </div>
                <Shield className="h-8 w-8 text-red-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  All Credential Leaks
                </CardTitle>
                <CardDescription>
                  {filteredData.length} of {credentials.length} credentials
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search credentials..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilters.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label} ({statusCounts[f.value as keyof typeof statusCounts] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sourceFilter}
                onValueChange={(v) => setSourceFilter(v as SourceFilter)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {sourceFilters.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
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
                        onClick={() => setSelectedCredential(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            onClick={(e) => {
                              if (
                                cell.column.id === "select" ||
                                cell.column.id === "actions"
                              ) {
                                e.stopPropagation();
                              }
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No credential leaks found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
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
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
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

      {/* Detail Sheet */}
      <AssetDetailSheet
        asset={selectedCredential}
        open={!!selectedCredential && !editDialogOpen}
        onOpenChange={(open) => !open && setSelectedCredential(null)}
        icon={KeyRound}
        iconColor="text-red-500"
        gradientFrom="from-red-500/20"
        onEdit={() => selectedCredential && handleOpenEdit(selectedCredential)}
        onDelete={() => {
          if (selectedCredential) {
            setCredentialToDelete(selectedCredential);
            setDeleteDialogOpen(true);
          }
        }}
        assetTypeName="Credential"
        relationships={selectedCredential ? getAssetRelationships(selectedCredential.id) : []}
        quickActions={
          selectedCredential?.status === "active" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                handleMarkResolved(selectedCredential);
                setSelectedCredential(null);
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Resolved
            </Button>
          ) : null
        }
        statsContent={
          selectedCredential && (
            <StatsGrid columns={3}>
              <StatCard
                icon={AlertTriangle}
                iconBg={
                  selectedCredential.riskScore >= 80
                    ? "bg-red-100 dark:bg-red-900/30"
                    : selectedCredential.riskScore >= 50
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : "bg-green-100 dark:bg-green-900/30"
                }
                iconColor={
                  selectedCredential.riskScore >= 80
                    ? "text-red-600"
                    : selectedCredential.riskScore >= 50
                    ? "text-yellow-600"
                    : "text-green-600"
                }
                label="Risk Score"
                value={selectedCredential.riskScore}
              />
              <StatCard
                icon={FileText}
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600"
                label="Findings"
                value={selectedCredential.findingCount}
              />
              <StatCard
                icon={Clock}
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-600"
                label="Days Since Leak"
                value={
                  selectedCredential.metadata.leakDate
                    ? Math.ceil(
                        (new Date().getTime() -
                          new Date(selectedCredential.metadata.leakDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : "-"
                }
              />
            </StatsGrid>
          )
        }
        overviewContent={
          selectedCredential && (
            <>
              <SectionTitle>Leak Details</SectionTitle>
              <MetadataGrid>
                <MetadataRow label="Source" value={selectedCredential.metadata.source} />
                <MetadataRow label="Username" value={selectedCredential.metadata.username} />
                <MetadataRow
                  label="Leak Date"
                  value={
                    selectedCredential.metadata.leakDate
                      ? new Date(selectedCredential.metadata.leakDate).toLocaleDateString()
                      : "-"
                  }
                />
                <MetadataRow label="Group" value={selectedCredential.groupName || "Ungrouped"} />
              </MetadataGrid>
            </>
          )
        }
      />

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Credential Leak</DialogTitle>
            <DialogDescription>
              Add a new credential leak to track
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Credential Name *</Label>
              <Input
                id="name"
                placeholder="e.g., admin@company.com"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the credential leak..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Input
                id="source"
                placeholder="e.g., Data breach - DarkWeb"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Username or identifier"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leakDate">Leak Date</Label>
              <Input
                id="leakDate"
                type="date"
                value={formData.leakDate}
                onChange={(e) => setFormData({ ...formData, leakDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select
                value={formData.groupId}
                onValueChange={(v) => setFormData({ ...formData, groupId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {mockAssetGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="critical, credential-leak, etc."
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCredential}>Add Credential</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Credential</DialogTitle>
            <DialogDescription>Update credential leak details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Credential Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-source">Source *</Label>
              <Input
                id="edit-source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-leakDate">Leak Date</Label>
              <Input
                id="edit-leakDate"
                type="date"
                value={formData.leakDate}
                onChange={(e) => setFormData({ ...formData, leakDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-group">Group</Label>
              <Select
                value={formData.groupId}
                onValueChange={(v) => setFormData({ ...formData, groupId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {mockAssetGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCredential}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credential?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{credentialToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCredential}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
