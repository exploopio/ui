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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Shield,
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
  Wrench,
  Box,
} from "lucide-react";
import { useSWRConfig } from "swr";
import {
  useGroups,
  useCreateGroup,
  useDeleteGroup,
  type Group,
  type GroupType,
  GroupTypeConfig,
  generateSlug,
  getGroupType,
} from "@/features/access-control";
import { GroupDetailSheet } from "@/features/access-control/components/group-detail-sheet";
import { Can, Permission } from "@/lib/permissions";

type TypeFilter = "all" | GroupType;

const typeFilters: { value: TypeFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All Groups", icon: <Users className="h-4 w-4" /> },
  { value: "security_team", label: "Security Teams", icon: <ShieldCheck className="h-4 w-4" /> },
  { value: "asset_owner", label: "Asset Owners", icon: <Box className="h-4 w-4" /> },
  { value: "custom", label: "Custom", icon: <Wrench className="h-4 w-4" /> },
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};



export default function GroupsPage() {
  const { mutate } = useSWRConfig();

  // API Hooks
  const { groups, isLoading, isError, mutate: mutateGroups } = useGroups();
  const { createGroup, isCreating } = useCreateGroup();

  // UI State
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [rowSelection, setRowSelection] = useState({});
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    group_type: "custom" as GroupType,
  });

  // Delete hook - need to pass groupId
  const { deleteGroup, isDeleting } = useDeleteGroup(groupToDelete?.id || null);

  // Refresh data
  const refreshData = useCallback(() => {
    mutateGroups();
  }, [mutateGroups]);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...groups];

    if (typeFilter !== "all") {
      data = data.filter((group) => getGroupType(group) === typeFilter);
    }

    return data;
  }, [groups, typeFilter]);

  // Type counts
  const typeCounts = useMemo(() => ({
    all: groups.length,
    security_team: groups.filter((g) => getGroupType(g) === "security_team").length,
    asset_owner: groups.filter((g) => getGroupType(g) === "asset_owner").length,
    team: groups.filter((g) => getGroupType(g) === "team").length,
    department: groups.filter((g) => getGroupType(g) === "department").length,
    project: groups.filter((g) => getGroupType(g) === "project").length,
    external: groups.filter((g) => getGroupType(g) === "external").length,
    custom: groups.filter((g) => getGroupType(g) === "custom").length,
  }), [groups]);

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
          Group
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const groupType = getGroupType(row.original);
        const typeConfig = GroupTypeConfig[groupType] || GroupTypeConfig.custom;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
              {groupType === "security_team" && <ShieldCheck className={`h-4 w-4 ${typeConfig.color}`} />}
              {groupType === "asset_owner" && <Box className={`h-4 w-4 ${typeConfig.color}`} />}
              {(!groupType || groupType === "custom") && <Wrench className={`h-4 w-4 ${typeConfig.color}`} />}
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
        const groupType = getGroupType(row.original);
        const typeConfig = GroupTypeConfig[groupType] || GroupTypeConfig.custom;
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
      accessorKey: "permission_set_count",
      header: "Permissions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.permission_set_count}</span>
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
        const group = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedGroupId(group.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <Can permission={Permission.GroupsWrite}>
                <DropdownMenuItem onClick={() => setSelectedGroupId(group.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Group
                </DropdownMenuItem>
              </Can>
              <Can permission={Permission.GroupsDelete}>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-400"
                  onClick={() => {
                    setGroupToDelete(group);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
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
  const handleCreateGroup = async () => {
    if (!createForm.name) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      await createGroup({
        slug: generateSlug(createForm.name),
        name: createForm.name,
        description: createForm.description || undefined,
        group_type: createForm.group_type,
      });
      toast.success(`Group "${createForm.name}" created successfully`);
      setCreateDialogOpen(false);
      setCreateForm({ name: "", description: "", group_type: "custom" });
      refreshData();
    } catch (error) {
      toast.error(`Failed to create group: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      await deleteGroup();
      toast.success(`Group "${groupToDelete.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      // Invalidate all group-related caches
      mutate((key: string) => typeof key === 'string' && key.startsWith('/api/v1/groups'), undefined, { revalidate: true });
      refreshData();
    } catch (error) {
      toast.error(`Failed to delete group: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Active filters count
  const activeFiltersCount = [typeFilter !== "all"].filter(Boolean).length;

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
          title="Groups"
          description="Manage access control groups and their permissions"
        >
          <Can permission={Permission.GroupsWrite} mode="disable">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
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
            <p className="text-muted-foreground">Failed to load groups</p>
            <Button variant="outline" onClick={refreshData}>
              Try Again
            </Button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && (
          <>
            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Card
                className={`cursor-pointer hover:border-primary transition-colors ${typeFilter === "all" ? "border-primary" : ""}`}
                onClick={() => setTypeFilter("all")}
              >
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <FolderKey className="h-4 w-4" />
                    Total Groups
                  </CardDescription>
                  <CardTitle className="text-3xl">{typeCounts.all}</CardTitle>
                </CardHeader>
              </Card>
              <Card
                className={`cursor-pointer hover:border-purple-500 transition-colors ${typeFilter === "security_team" ? "border-purple-500" : ""}`}
                onClick={() => setTypeFilter("security_team")}
              >
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-purple-500" />
                    Security Teams
                  </CardDescription>
                  <CardTitle className="text-3xl text-purple-500">{typeCounts.security_team}</CardTitle>
                </CardHeader>
              </Card>
              <Card
                className={`cursor-pointer hover:border-blue-500 transition-colors ${typeFilter === "asset_owner" ? "border-blue-500" : ""}`}
                onClick={() => setTypeFilter("asset_owner")}
              >
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-blue-500" />
                    Asset Owners
                  </CardDescription>
                  <CardTitle className="text-3xl text-blue-500">{typeCounts.asset_owner}</CardTitle>
                </CardHeader>
              </Card>
              <Card
                className={`cursor-pointer hover:border-gray-500 transition-colors ${typeFilter === "custom" ? "border-gray-500" : ""}`}
                onClick={() => setTypeFilter("custom")}
              >
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Custom Groups
                  </CardDescription>
                  <CardTitle className="text-3xl">{typeCounts.custom}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Groups Table */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">All Groups</CardTitle>
                    <CardDescription>Manage groups and their members</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Quick Filter Tabs */}
                <Tabs
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v as TypeFilter)}
                  className="mb-4"
                >
                  <TabsList>
                    {typeFilters.map((filter) => (
                      <TabsTrigger key={filter.value} value={filter.value} className="gap-1.5">
                        {filter.icon}
                        {filter.label}
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {typeCounts[filter.value]}
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
                      placeholder="Search groups..."
                      value={globalFilter}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {activeFiltersCount > 0 && (
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
                            className="text-red-400"
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
                              setSelectedGroupId(row.original.id);
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
                            {groups.length === 0 ? (
                              <div className="flex flex-col items-center gap-2">
                                <FolderKey className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-muted-foreground">No groups yet</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCreateDialogOpen(true)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create your first group
                                </Button>
                              </div>
                            ) : (
                              "No groups found."
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

      {/* Group Detail Sheet */}
      <GroupDetailSheet
        groupId={selectedGroupId}
        open={!!selectedGroupId}
        onOpenChange={(open) => !open && setSelectedGroupId(null)}
        onUpdate={refreshData}
      />

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              Create Group
            </DialogTitle>
            <DialogDescription>
              Create a new group to organize team members and assign permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Security Team, DevOps"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="group-description">Description (optional)</Label>
              <Textarea
                id="group-description"
                placeholder="Describe the purpose of this group..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Group Type</Label>
              <Select
                value={createForm.group_type}
                onValueChange={(value: GroupType) => setCreateForm({ ...createForm, group_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GroupTypeConfig).map(([type, config]) => (
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
                {GroupTypeConfig[createForm.group_type].description}
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
              onClick={handleCreateGroup}
              disabled={isCreating || !createForm.name}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Group
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
              Delete Group
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the group &quot;{groupToDelete?.name}&quot;?
              This action cannot be undone. All members will lose their group-based permissions.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false);
                setGroupToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
