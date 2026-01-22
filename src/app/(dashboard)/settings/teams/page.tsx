"use client";

import { useState, useMemo, useCallback } from "react";
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
  Users,
  Plus,
  MoreHorizontal,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search as SearchIcon,
  Eye,
  Pencil,
  Loader2,
  AlertCircle,
  FolderKey,
  ShieldCheck,
  Box,
  Building2,
  Briefcase,
  Globe,
} from "lucide-react";
import { useSWRConfig } from "swr";
import {
  useGroups,
  useCreateGroup,
  useDeleteGroup,
  type Group,
  type GroupType,
  generateSlug,
} from "@/features/access-control";
import { GroupDetailSheet } from "@/features/access-control/components/group-detail-sheet";
import { Can, Permission } from "@/lib/permissions";

// Team type configuration - maps to backend group_type
const TeamTypeConfig: Record<string, { label: string; color: string; bgColor: string; description: string; icon: typeof Users }> = {
  security_team: {
    label: "Security",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    description: "Security teams with specialized access to security features",
    icon: ShieldCheck,
  },
  team: {
    label: "Development",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    description: "Development teams owning code repositories and applications",
    icon: Briefcase,
  },
  department: {
    label: "Department",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950",
    description: "Organizational departments for company structure",
    icon: Building2,
  },
  project: {
    label: "Project",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    description: "Project-based teams for specific initiatives",
    icon: Box,
  },
  external: {
    label: "External",
    color: "text-slate-600",
    bgColor: "bg-slate-50 dark:bg-slate-900",
    description: "External contractors, vendors, or auditors",
    icon: Globe,
  },
};

// Get team type from group - backend may use group_type field
function getTeamType(group: Group): string {
  // Check for group_type field first
  if (group.group_type && TeamTypeConfig[group.group_type]) {
    return group.group_type;
  }
  // Default to 'team'
  return "team";
}

type TypeFilter = "all" | string;

const _typeFilters: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All Teams" },
  { value: "security_team", label: "Security" },
  { value: "team", label: "Development" },
  { value: "department", label: "Department" },
  { value: "project", label: "Project" },
  { value: "external", label: "External" },
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function TeamsPage() {
  const { mutate } = useSWRConfig();

  // API Hooks - using groups API
  const { groups: teams, isLoading, isError, mutate: mutateTeams } = useGroups();
  const { createGroup: createTeam, isCreating } = useCreateGroup();

  // UI State
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Group | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [rowSelection, setRowSelection] = useState({});
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    group_type: "team" as GroupType,
  });

  // Delete hook
  const { deleteGroup: deleteTeam, isDeleting } = useDeleteGroup(teamToDelete?.id || null);

  // Refresh data
  const refreshData = useCallback(() => {
    mutateTeams();
  }, [mutateTeams]);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...teams];

    if (typeFilter !== "all") {
      data = data.filter((team) => getTeamType(team) === typeFilter);
    }

    return data;
  }, [teams, typeFilter]);

  // Type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: teams.length };
    Object.keys(TeamTypeConfig).forEach((type) => {
      counts[type] = teams.filter((t) => getTeamType(t) === type).length;
    });
    return counts;
  }, [teams]);

  // Table columns
  const columns: ColumnDef<Group>[] = [
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
          Team
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const teamType = getTeamType(row.original);
        const typeConfig = TeamTypeConfig[teamType] || TeamTypeConfig.team;
        const IconComponent = typeConfig.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
              <IconComponent className={`h-4 w-4 ${typeConfig.color}`} />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              {row.original.description && (
                <p className="text-muted-foreground text-xs line-clamp-1">{row.original.description}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "group_type",
      header: "Type",
      cell: ({ row }) => {
        const teamType = getTeamType(row.original);
        const typeConfig = TeamTypeConfig[teamType] || TeamTypeConfig.team;
        return (
          <Badge className={`${typeConfig.bgColor} ${typeConfig.color} border-0`}>
            {typeConfig.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "member_count",
      header: "Members",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.member_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "asset_count",
      header: "Assets",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.asset_count || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const team = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedTeamId(team.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <Can permission={Permission.GroupsWrite}>
                <DropdownMenuItem onClick={() => setSelectedTeamId(team.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Team
                </DropdownMenuItem>
              </Can>
              <Can permission={Permission.GroupsDelete}>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    setTeamToDelete(team);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Team
                </DropdownMenuItem>
              </Can>
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
  const handleCreateTeam = async () => {
    if (!createForm.name) {
      toast.error("Please enter a team name");
      return;
    }

    try {
      await createTeam({
        slug: generateSlug(createForm.name),
        name: createForm.name,
        description: createForm.description || undefined,
        group_type: createForm.group_type,
      });
      toast.success(`Team "${createForm.name}" created successfully`);
      setCreateDialogOpen(false);
      setCreateForm({ name: "", description: "", group_type: "team" });
      refreshData();
    } catch (error) {
      toast.error(`Failed to create team: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      await deleteTeam();
      toast.success(`Team "${teamToDelete.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
      mutate((key: string) => typeof key === 'string' && key.startsWith('/api/v1/groups'), undefined, { revalidate: true });
      refreshData();
    } catch (error) {
      toast.error(`Failed to delete team: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const clearFilters = () => {
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
          title="Teams"
          description="Organize users into teams and control what data they can access"
        >
          <Can permission={Permission.GroupsWrite} mode="disable">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </Can>
        </PageHeader>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-6 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="mt-6 flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-muted-foreground">Failed to load teams</p>
            <Button variant="outline" onClick={refreshData}>
              Try Again
            </Button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && (
          <>
            {/* Stats Cards */}
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
              <Card
                className={`cursor-pointer hover:border-primary transition-colors ${typeFilter === "all" ? "border-primary" : ""}`}
                onClick={() => setTypeFilter("all")}
              >
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <FolderKey className="h-4 w-4" />
                    Total
                  </CardDescription>
                  <CardTitle className="text-2xl">{typeCounts.all}</CardTitle>
                </CardHeader>
              </Card>
              {Object.entries(TeamTypeConfig).map(([type, config]) => {
                const IconComponent = config.icon;
                return (
                  <Card
                    key={type}
                    className={`cursor-pointer hover:border-primary transition-colors ${typeFilter === type ? "border-primary" : ""}`}
                    onClick={() => setTypeFilter(type)}
                  >
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <IconComponent className={`h-4 w-4 ${config.color}`} />
                        {config.label}
                      </CardDescription>
                      <CardTitle className={`text-2xl ${config.color}`}>{typeCounts[type] || 0}</CardTitle>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Teams Table */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">All Teams</CardTitle>
                    <CardDescription>Manage teams and their data access</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search teams..."
                      value={globalFilter}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {typeFilter !== "all" && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    )}

                    {Object.keys(rowSelection).length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            {Object.keys(rowSelection).length} selected
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => toast.info("Bulk delete not implemented yet")}
                          >
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
                              if ((e.target as HTMLElement).closest('[role="checkbox"]') ||
                                (e.target as HTMLElement).closest('button')) {
                                return;
                              }
                              setSelectedTeamId(row.original.id);
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
                            {teams.length === 0 ? (
                              <div className="flex flex-col items-center gap-2">
                                <FolderKey className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-muted-foreground">No teams yet</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCreateDialogOpen(true)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create your first team
                                </Button>
                              </div>
                            ) : (
                              "No teams found."
                            )}
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
                  <div className="flex flex-wrap items-center gap-2">
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
                      Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
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
          </>
        )}
      </Main>

      {/* Team Detail Sheet - uses GroupDetailSheet internally */}
      <GroupDetailSheet
        groupId={selectedTeamId}
        open={!!selectedTeamId}
        onOpenChange={(open) => !open && setSelectedTeamId(null)}
        onUpdate={refreshData}
      />

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              Create Team
            </DialogTitle>
            <DialogDescription>
              Create a new team to organize users and control their data access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g., Security Team, DevOps, Infrastructure"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="team-description">Description (optional)</Label>
              <Textarea
                id="team-description"
                placeholder="Describe what this team is responsible for..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Team Type</Label>
              <Select
                value={createForm.group_type}
                onValueChange={(value: GroupType) => setCreateForm({ ...createForm, group_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TeamTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${config.bgColor} ${config.color} border-0`}>
                          {config.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TeamTypeConfig[createForm.group_type]?.description}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={isCreating || !createForm.name}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              Delete Team
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the team &quot;{teamToDelete?.name}&quot;?
              This action cannot be undone. All members will lose their team-based data access.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTeamToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
