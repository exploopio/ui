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
  StatCardCentered,
  StatsGrid,
  SectionTitle,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus,
  GitBranch,
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
  Copy,
  RefreshCw,
  Lock,
  Globe,
  Star,
  ExternalLink,
  Github,
  GitlabIcon,
} from "lucide-react";
import {
  useAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  bulkDeleteAssets,
  getAssetRelationships,
  ClassificationBadges,
  type Asset
} from "@/features/assets";
import { mockAssetGroups } from "@/features/asset-groups";
import type { Status } from "@/features/shared/types";
import {
  ScopeBadgeSimple,
  ScopeCoverageCard,
  getScopeMatchesForAsset,
  calculateScopeCoverage,
  getActiveScopeTargets,
  getActiveScopeExclusions,
} from "@/features/scope";

// Filter types
type StatusFilter = Status | "all";
type VisibilityFilter = "all" | "public" | "private";
type ProviderFilter = "all" | "github" | "gitlab" | "bitbucket";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

// Common languages
const commonLanguages = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "C#",
  "C++",
  "Swift",
  "Kotlin",
];

// Empty form state
const emptyProjectForm = {
  name: "",
  description: "",
  groupId: "",
  provider: "github" as "github" | "gitlab" | "bitbucket",
  visibility: "private" as "public" | "private",
  language: "",
  stars: "",
  tags: "",
};

export default function ProjectsPage() {
  // Fetch projects from API
  const { assets: projects, isLoading, isError, error: fetchError, mutate } = useAssets({
    types: ['project'],
  });

  const [selectedProject, setSelectedProject] = useState<Asset | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [rowSelection, setRowSelection] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Asset | null>(null);

  // Form state
  const [formData, setFormData] = useState(emptyProjectForm);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...projects];
    if (statusFilter !== "all") {
      data = data.filter((p) => p.status === statusFilter);
    }
    if (visibilityFilter !== "all") {
      data = data.filter((p) => p.metadata.visibility === visibilityFilter);
    }
    if (providerFilter !== "all") {
      data = data.filter((p) => p.metadata.projectProvider === providerFilter);
    }
    return data;
  }, [projects, statusFilter, visibilityFilter, providerFilter]);

  // Status counts
  const statusCounts = useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((p) => p.status === "active").length,
      inactive: projects.filter((p) => p.status === "inactive").length,
      pending: projects.filter((p) => p.status === "pending").length,
    }),
    [projects]
  );

  // Visibility counts
  const visibilityCounts = useMemo(
    () => ({
      public: projects.filter((p) => p.metadata.visibility === "public").length,
      private: projects.filter((p) => p.metadata.visibility === "private").length,
    }),
    [projects]
  );

  // Scope computation
  const scopeTargets = useMemo(() => getActiveScopeTargets(), []);
  const scopeExclusions = useMemo(() => getActiveScopeExclusions(), []);

  const scopeMatchesMap = useMemo(() => {
    const map: Record<string, { inScope: boolean; excluded: boolean }> = {};
    projects.forEach((project) => {
      const match = getScopeMatchesForAsset(
        { id: project.id, type: "project", name: project.name, metadata: project.metadata as unknown as Record<string, unknown> },
        scopeTargets,
        scopeExclusions
      );
      map[project.id] = {
        inScope: match.inScope,
        excluded: match.matchedExclusions.length > 0,
      };
    });
    return map;
  }, [projects, scopeTargets, scopeExclusions]);

  const scopeCoverage = useMemo(
    () =>
      calculateScopeCoverage(
        projects.map((p) => ({ id: p.id, type: "project", name: p.name, metadata: p.metadata as unknown as Record<string, unknown> })),
        scopeTargets,
        scopeExclusions
      ),
    [projects, scopeTargets, scopeExclusions]
  );

  // Provider icon
  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case "github":
        return <Github className="h-4 w-4" />;
      case "gitlab":
        return <GitlabIcon className="h-4 w-4" />;
      default:
        return <GitBranch className="h-4 w-4" />;
    }
  };

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
          Project
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getProviderIcon(row.original.metadata.projectProvider)}
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-muted-foreground text-xs truncate max-w-[200px]">
              {row.original.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "metadata.projectProvider",
      header: "Provider",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.metadata.projectProvider}
        </Badge>
      ),
    },
    {
      accessorKey: "metadata.visibility",
      header: "Visibility",
      cell: ({ row }) =>
        row.original.metadata.visibility === "private" ? (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="h-3 w-3" /> Private
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm text-green-500">
            <Globe className="h-3 w-3" /> Public
          </span>
        ),
    },
    {
      accessorKey: "metadata.language",
      header: "Language",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.metadata.language || "-"}</Badge>
      ),
    },
    {
      accessorKey: "metadata.stars",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Stars
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stars = row.original.metadata.stars;
        if (!stars) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="flex items-center gap-1 text-sm">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            {stars.toLocaleString()}
          </span>
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
      id: "scope",
      header: "Scope",
      cell: ({ row }) => {
        const scopeMatch = scopeMatchesMap[row.original.id];
        return (
          <ScopeBadgeSimple
            inScope={scopeMatch?.inScope ?? false}
            excluded={scopeMatch?.excluded}
          />
        );
      },
    },
    {
      accessorKey: "findingCount",
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
        const count = row.original.findingCount;
        if (count === 0) return <span className="text-muted-foreground">0</span>;
        return (
          <Badge variant={count > 5 ? "destructive" : "secondary"}>{count}</Badge>
        );
      },
    },
    {
      accessorKey: "riskScore",
      header: "Risk",
      cell: ({ row }) => (
        <RiskScoreBadge score={row.original.riskScore} size="sm" />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedProject(project); }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(project); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyProject(project); }}>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenExternal(project); }}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Browser
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToDelete(project);
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
  const handleCopyProject = (project: Asset) => {
    const url = getProjectUrl(project);
    navigator.clipboard.writeText(url);
    toast.success("Project URL copied to clipboard");
  };

  const handleOpenExternal = (project: Asset) => {
    const url = getProjectUrl(project);
    window.open(url, "_blank");
  };

  const getProjectUrl = (project: Asset) => {
    const provider = project.metadata.projectProvider;
    const name = project.name;
    switch (provider) {
      case "github":
        return `https://github.com/${name}`;
      case "gitlab":
        return `https://gitlab.com/${name}`;
      case "bitbucket":
        return `https://bitbucket.org/${name}`;
      default:
        return `https://github.com/${name}`;
    }
  };

  const handleOpenEdit = (project: Asset) => {
    setFormData({
      name: project.name,
      description: project.description || "",
      groupId: project.groupId || "",
      provider: (project.metadata.projectProvider as "github" | "gitlab" | "bitbucket") || "github",
      visibility: (project.metadata.visibility as "public" | "private") || "private",
      language: project.metadata.language || "",
      stars: String(project.metadata.stars || ""),
      tags: project.tags?.join(", ") || "",
    });
    setSelectedProject(project);
    setEditDialogOpen(true);
  };

  const handleAddProject = async () => {
    if (!formData.name) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAsset({
        name: formData.name,
        type: "project",
        description: formData.description,
        criticality: "medium",
        scope: "internal",
        exposure: "restricted",
        tags: formData.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        metadata: {
          projectProvider: formData.provider,
          visibility: formData.visibility,
          language: formData.language || undefined,
          stars: formData.stars ? parseInt(formData.stars) : undefined,
        },
      });
      await mutate();
      setFormData(emptyProjectForm);
      setAddDialogOpen(false);
      toast.success("Project added successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject || !formData.name) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAsset(selectedProject.id, {
        name: formData.name,
        description: formData.description,
        tags: formData.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        metadata: {
          ...selectedProject.metadata,
          projectProvider: formData.provider,
          visibility: formData.visibility,
          language: formData.language || undefined,
          stars: formData.stars ? parseInt(formData.stars) : undefined,
        },
      });
      await mutate();
      setFormData(emptyProjectForm);
      setEditDialogOpen(false);
      setSelectedProject(null);
      toast.success("Project updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteAsset(projectToDelete.id);
      await mutate();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      toast.success("Project deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    const selectedProjectIds = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (selectedProjectIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await bulkDeleteAssets(selectedProjectIds);
      await mutate();
      setRowSelection({});
      toast.success(`Deleted ${selectedProjectIds.length} projects`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete projects");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Provider", "Visibility", "Language", "Stars", "Status", "Risk Score", "Findings"].join(","),
      ...projects.map((p) =>
        [
          p.name,
          p.metadata.projectProvider || "",
          p.metadata.visibility || "",
          p.metadata.language || "",
          p.metadata.stars || 0,
          p.status,
          p.riskScore,
          p.findingCount,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "projects.csv";
    a.click();
    toast.success("Projects exported");
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
          title="Project Assets"
          description={`${projects.length} projects in your organization`}
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => {
                setFormData(emptyProjectForm);
                setAddDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setStatusFilter("all")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Total Projects
              </CardDescription>
              <CardTitle className="text-3xl">{statusCounts.all}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-green-500 transition-colors ${visibilityFilter === "public" ? "border-green-500" : ""}`}
            onClick={() =>
              setVisibilityFilter(visibilityFilter === "public" ? "all" : "public")
            }
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-500" />
                Public
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {visibilityCounts.public}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-gray-500 transition-colors ${visibilityFilter === "private" ? "border-gray-500" : ""}`}
            onClick={() =>
              setVisibilityFilter(visibilityFilter === "private" ? "all" : "private")
            }
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                Private
              </CardDescription>
              <CardTitle className="text-3xl text-gray-500">
                {visibilityCounts.private}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                With Findings
              </CardDescription>
              <CardTitle className="text-3xl text-orange-500">
                {projects.filter((p) => p.findingCount > 0).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Scope Coverage Card */}
        <div className="mt-4">
          <ScopeCoverageCard coverage={scopeCoverage} showBreakdown={false} />
        </div>

        {/* Table Card */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  All Projects
                </CardTitle>
                <CardDescription>
                  Manage your source code projects
                </CardDescription>
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
                      {statusCounts[filter.value as keyof typeof statusCounts] || 0}
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
                  placeholder="Search projects..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Provider filter */}
                <Select
                  value={providerFilter}
                  onValueChange={(v) => setProviderFilter(v as ProviderFilter)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="bitbucket">Bitbucket</SelectItem>
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
                      <DropdownMenuItem
                        onClick={() => toast.info("Scanning selected projects...")}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Rescan Selected
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
                          if (
                            (e.target as HTMLElement).closest('[role="checkbox"]') ||
                            (e.target as HTMLElement).closest("button")
                          ) {
                            return;
                          }
                          setSelectedProject(row.original);
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
                        No projects found.
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

      {/* Project Details Sheet */}
      <AssetDetailSheet
        asset={selectedProject}
        open={!!selectedProject && !editDialogOpen}
        onOpenChange={() => setSelectedProject(null)}
        icon={GitBranch}
        iconColor="text-purple-500"
        gradientFrom="from-purple-500/20"
        gradientVia="via-purple-500/10"
        assetTypeName="Project"
        relationships={selectedProject ? getAssetRelationships(selectedProject.id) : []}
        onEdit={() => selectedProject && handleOpenEdit(selectedProject)}
        onDelete={() => {
          if (selectedProject) {
            setProjectToDelete(selectedProject);
            setDeleteDialogOpen(true);
            setSelectedProject(null);
          }
        }}
        quickActions={
          selectedProject && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenExternal(selectedProject)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyProject(selectedProject)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </>
          )
        }
        statsContent={
          selectedProject && (
            <StatsGrid columns={3}>
              <StatCardCentered
                icon={Star}
                iconBg="bg-yellow-500/10"
                iconColor="text-yellow-500"
                value={selectedProject.metadata.stars?.toLocaleString() || 0}
                label="Stars"
              />
              <StatCardCentered
                icon={Shield}
                iconBg="bg-orange-500/10"
                iconColor="text-orange-500"
                value={selectedProject.riskScore}
                label="Risk"
              />
              <StatCardCentered
                icon={AlertTriangle}
                iconBg="bg-red-500/10"
                iconColor="text-red-500"
                value={selectedProject.findingCount}
                label="Findings"
              />
            </StatsGrid>
          )
        }
        overviewContent={
          selectedProject && (
            <div className="rounded-xl border p-4 bg-card space-y-3">
              <SectionTitle>Project Information</SectionTitle>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Provider</p>
                  <Badge variant="outline" className="capitalize">
                    {selectedProject.metadata.projectProvider}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Visibility</p>
                  <span className="flex items-center gap-1">
                    {selectedProject.metadata.visibility === "private" ? (
                      <>
                        <Lock className="h-3 w-3" /> Private
                      </>
                    ) : (
                      <>
                        <Globe className="h-3 w-3" /> Public
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Language</p>
                  <Badge variant="secondary">
                    {selectedProject.metadata.language || "-"}
                  </Badge>
                </div>
              </div>
              {selectedProject.description && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Description</p>
                  <p className="text-sm">{selectedProject.description}</p>
                </div>
              )}
            </div>
          )
        }
      />

      {/* Add Project Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Add Project
            </DialogTitle>
            <DialogDescription>Add a new project to your asset inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="org/project-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupId">Asset Group *</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => setFormData({ ...formData, groupId: value })}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      provider: value as "github" | "gitlab" | "bitbucket",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="bitbucket">Bitbucket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) =>
                    setFormData({ ...formData, visibility: value as "public" | "private" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stars">Stars</Label>
                <Input
                  id="stars"
                  type="number"
                  placeholder="0"
                  value={formData.stars}
                  onChange={(e) => setFormData({ ...formData, stars: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="production, critical"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProject}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Project
            </DialogTitle>
            <DialogDescription>Update project information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name *</Label>
              <Input
                id="edit-name"
                placeholder="org/project-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-groupId">Asset Group *</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => setFormData({ ...formData, groupId: value })}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      provider: value as "github" | "gitlab" | "bitbucket",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="bitbucket">Bitbucket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) =>
                    setFormData({ ...formData, visibility: value as "public" | "private" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stars">Stars</Label>
                <Input
                  id="edit-stars"
                  type="number"
                  placeholder="0"
                  value={formData.stars}
                  onChange={(e) => setFormData({ ...formData, stars: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                placeholder="production, critical"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProject}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{projectToDelete?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDeleteProject}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
