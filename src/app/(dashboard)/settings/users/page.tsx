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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  SheetHeader,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Shield,
  Clock,
  CheckCircle,
  Mail,
  MoreHorizontal,
  Link,
  Trash2,
  Send,
  Ban,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search as SearchIcon,
  Filter,
  Eye,
  Pencil,
  History,
  Activity,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTenant } from "@/context/tenant-provider";
import {
  useMembers,
  useMemberStats,
  useInvitations,
  useCreateInvitation,
  getMembersKey,
  getMemberStatsKey,
  getInvitationsKey,
  type MemberWithUser,
  type MemberRole,
  ROLE_DISPLAY,
  STATUS_DISPLAY,
  INVITABLE_ROLES,
} from "@/features/organization";
import { mutate } from "swr";
import { fetcherWithOptions } from "@/lib/api/client";
import { tenantEndpoints } from "@/lib/api/endpoints";

type StatusFilter = "all" | "active" | "pending" | "inactive";
type RoleFilter = "all" | MemberRole;

// Static config
const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
];

const roleFilters: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

// Helper functions
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatLastActive = (lastLoginAt?: string) => {
  if (!lastLoginAt) return "Never";
  const date = new Date(lastLoginAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(lastLoginAt);
};

export default function UsersPage() {
  const { currentTenant } = useTenant();
  const tenantSlug = currentTenant?.slug;

  // API Hooks
  const { members, isLoading: membersLoading, isError: membersError, mutate: mutateMembers } = useMembers(tenantSlug);
  const { stats, isLoading: statsLoading, mutate: mutateStats } = useMemberStats(tenantSlug);
  const { invitations, mutate: mutateInvitations } = useInvitations(tenantSlug);
  const { createInvitation, isCreating } = useCreateInvitation(tenantSlug);

  // UI State
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [rowSelection, setRowSelection] = useState({});
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member" as MemberRole,
  });

  // Refresh all data
  const refreshData = useCallback(() => {
    if (tenantSlug) {
      mutateMembers();
      mutateStats();
      mutateInvitations();
    }
  }, [tenantSlug, mutateMembers, mutateStats, mutateInvitations]);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...members];

    if (statusFilter !== "all") {
      data = data.filter((member) => member.status === statusFilter);
    }

    if (roleFilter !== "all") {
      data = data.filter((member) => member.role === roleFilter);
    }

    return data;
  }, [members, statusFilter, roleFilter]);

  // Status counts from members
  const statusCounts = useMemo(() => ({
    all: members.length,
    active: members.filter((m) => m.status === "active").length,
    pending: invitations.length,
    inactive: members.filter((m) => m.status === "inactive").length,
  }), [members, invitations]);

  // Table columns
  const columns: ColumnDef<MemberWithUser>[] = [
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
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials(row.original.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-muted-foreground text-xs">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const roleDisplay = ROLE_DISPLAY[row.original.role];
        return (
          <Badge className={`${roleDisplay?.color || "bg-gray-500/20 text-gray-400"} border-0`}>
            {roleDisplay?.label || row.original.role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "joined_at",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{formatDate(row.original.joined_at)}</span>
      ),
    },
    {
      accessorKey: "last_login_at",
      header: "Last Active",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{formatLastActive(row.original.last_login_at)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusDisplay = STATUS_DISPLAY[row.original.status];
        return (
          <Badge className={`${statusDisplay?.bgColor || "bg-gray-500/20"} ${statusDisplay?.color || "text-gray-400"} border-0`}>
            {statusDisplay?.label || row.original.status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original;
        const isOwner = member.role === "owner";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedMember(member)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {!isOwner && (
                <>
                  <DropdownMenuItem onClick={() => handleEditRole(member)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Change Role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-400"
                    onClick={() => handleRemoveMember(member)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Member
                  </DropdownMenuItem>
                </>
              )}
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
  const handleEditRole = async (member: MemberWithUser) => {
    toast.info(`Edit role for: ${member.name}`);
    // TODO: Open role edit dialog
  };

  const handleRemoveMember = async (member: MemberWithUser) => {
    if (!tenantSlug) return;

    try {
      await fetcherWithOptions(tenantEndpoints.removeMember(tenantSlug, member.id), {
        method: "DELETE",
      });
      toast.success(`Removed ${member.name} from the team`);
      refreshData();
    } catch (error) {
      toast.error(`Failed to remove member: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.email) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      await createInvitation({
        email: inviteForm.email,
        role: inviteForm.role,
      });
      toast.success(`Invitation sent to ${inviteForm.email}`);
      setInviteDialogOpen(false);
      setInviteForm({ email: "", role: "member" });
      refreshData();
    } catch (error) {
      toast.error(`Failed to send invitation: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Active filters count
  const activeFiltersCount = [roleFilter !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
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
          title="User Management"
          description="Manage team members and access permissions"
        >
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </PageHeader>

        {/* Loading State */}
        {membersLoading && (
          <div className="mt-6 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {membersError && !membersLoading && (
          <div className="mt-6 flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-muted-foreground">Failed to load members</p>
            <Button variant="outline" onClick={refreshData}>
              Try Again
            </Button>
          </div>
        )}

        {/* Stats */}
        {!membersLoading && !membersError && (
        <>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setStatusFilter("all")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Members
              </CardDescription>
              <CardTitle className="text-3xl">
                {statsLoading ? <Skeleton className="h-9 w-12" /> : (stats?.total_members ?? members.length)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-green-500 transition-colors ${statusFilter === "active" ? "border-green-500" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Active
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {statsLoading ? <Skeleton className="h-9 w-12" /> : (stats?.active_members ?? statusCounts.active)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-yellow-500 transition-colors ${statusFilter === "pending" ? "border-yellow-500" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending Invites
              </CardDescription>
              <CardTitle className="text-3xl text-yellow-500">
                {statsLoading ? <Skeleton className="h-9 w-12" /> : (stats?.pending_invites ?? invitations.length)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles
              </CardDescription>
              <CardTitle className="text-3xl">
                {statsLoading ? <Skeleton className="h-9 w-12" /> : Object.keys(stats?.role_counts ?? {}).length || 4}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Pending Invitations Banner - shown only when there are pending invites */}
        {invitations.length > 0 && (
          <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-500/20 p-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium">
                    {invitations.length} pending invitation{invitations.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {invitations.map(inv => inv.email).slice(0, 2).join(", ")}
                    {invitations.length > 2 && ` and ${invitations.length - 2} more`}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const section = document.getElementById("pending-invitations");
                  section?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View All
              </Button>
            </div>
          </div>
        )}

        {/* Users Table - Primary Content */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Team Members</CardTitle>
                <CardDescription>Manage user access and permissions</CardDescription>
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
                      {statusCounts[filter.value]}
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
                  placeholder="Search users..."
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
                        <Label className="text-muted-foreground text-xs uppercase">Role</Label>
                        <div className="flex flex-wrap gap-2">
                          {roleFilters.map((filter) => (
                            <Badge
                              key={filter.value}
                              variant={roleFilter === filter.value ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => setRoleFilter(filter.value)}
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
                      <DropdownMenuItem onClick={() => toast.success("Resent invites")}>
                        <Send className="mr-2 h-4 w-4" />
                        Resend Invites
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.success("Deactivated users")}>
                        <Ban className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400"
                        onClick={() => toast.success("Deleted users")}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
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
                {roleFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Role: {roleFilter}
                    <button
                      onClick={() => setRoleFilter("all")}
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
                          if ((e.target as HTMLElement).closest('[role="checkbox"]') ||
                              (e.target as HTMLElement).closest('button')) {
                            return;
                          }
                          setSelectedMember(row.original);
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
                        No users found.
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

        {/* Roles & Pending Invitations Section */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Roles */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Roles</CardTitle>
                  <CardDescription>Permission groups</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["owner", "admin", "member", "viewer"] as MemberRole[]).map((role) => {
                const roleDisplay = ROLE_DISPLAY[role];
                const count = stats?.role_counts?.[role] ?? 0;
                return (
                  <div
                    key={role}
                    className="rounded-lg border p-3 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setRoleFilter(role)}
                  >
                    <div className="flex items-center justify-between">
                      <Badge className={`${roleDisplay.color} border-0`}>
                        {roleDisplay.label}
                      </Badge>
                      <span className="text-muted-foreground text-xs">{count} users</span>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">{roleDisplay.description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card className="lg:col-span-2" id="pending-invitations">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Pending Invitations</CardTitle>
                  <CardDescription>Invitations waiting to be accepted</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No pending invitations</p>
                  <p className="text-xs text-muted-foreground mt-1">Invite someone to join your team</p>
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm bg-yellow-500/20 text-yellow-500">
                          {invitation.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`${ROLE_DISPLAY[invitation.role]?.color || "bg-gray-500/20 text-gray-400"} border-0 text-xs`}>
                            {ROLE_DISPLAY[invitation.role]?.label || invitation.role}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            Expires {formatDate(invitation.expires_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        title="Copy invitation link"
                        onClick={async () => {
                          if (!invitation.token) {
                            toast.error("Invitation token not available");
                            return;
                          }
                          const inviteLink = `${window.location.origin}/invitations/${invitation.token}`;
                          try {
                            await navigator.clipboard.writeText(inviteLink);
                            toast.success("Invitation link copied to clipboard");
                          } catch {
                            toast.error("Failed to copy link");
                          }
                        }}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        onClick={async () => {
                          if (!tenantSlug) return;
                          try {
                            await fetcherWithOptions(tenantEndpoints.deleteInvitation(tenantSlug, invitation.id), {
                              method: "DELETE",
                            });
                            toast.success("Invitation cancelled");
                            refreshData();
                          } catch (error) {
                            toast.error("Failed to cancel invitation");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        </>
        )}
      </Main>

      {/* User Details Sheet - Redesigned */}
      <Sheet open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <SheetContent className="sm:max-w-md p-0 overflow-y-auto">
          <VisuallyHidden>
            <SheetTitle>Member Details</SheetTitle>
          </VisuallyHidden>
          {selectedMember && (
            <div className="flex flex-col h-full">
              {/* Header - Clean Design */}
              <div className="relative px-6 pt-8 pb-6 bg-gradient-to-b from-muted/50 to-background">
                {/* Status Indicator */}
                <div className="absolute top-4 right-4">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_DISPLAY[selectedMember.status]?.bgColor} ${STATUS_DISPLAY[selectedMember.status]?.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      selectedMember.status === "active" ? "bg-green-400" :
                      selectedMember.status === "pending" ? "bg-yellow-400" : "bg-gray-400"
                    }`} />
                    {STATUS_DISPLAY[selectedMember.status]?.label}
                  </div>
                </div>

                {/* Avatar & Basic Info */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {getInitials(selectedMember.name)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    {selectedMember.status === "active" && (
                      <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-background" />
                    )}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">{selectedMember.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                  <Badge className={`mt-3 ${ROLE_DISPLAY[selectedMember.role]?.color || "bg-gray-500/20 text-gray-400"} border-0`}>
                    {ROLE_DISPLAY[selectedMember.role]?.label || selectedMember.role}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 px-6 py-6 space-y-6">
                {/* Quick Stats - 2 Column */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="text-sm font-semibold mt-0.5">{formatDate(selectedMember.joined_at)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Activity className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Last Active</p>
                    <p className="text-sm font-semibold mt-0.5">{formatLastActive(selectedMember.last_login_at)}</p>
                  </div>
                </div>

                {/* Role & Permissions Card */}
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Role & Permissions</h4>
                    {selectedMember.role !== "owner" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => handleEditRole(selectedMember)}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Change
                      </Button>
                    )}
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${ROLE_DISPLAY[selectedMember.role]?.color || "bg-gray-500/20"}`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{ROLE_DISPLAY[selectedMember.role]?.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ROLE_DISPLAY[selectedMember.role]?.description}
                      </p>
                    </div>
                  </div>

                  {/* Permission Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t">
                    {selectedMember.role === "owner" && (
                      <>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">Full Access</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">Billing</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">Delete Team</span>
                      </>
                    )}
                    {selectedMember.role === "admin" && (
                      <>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-400">Manage Members</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-400">Settings</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-400">Full CRUD</span>
                      </>
                    )}
                    {selectedMember.role === "member" && (
                      <>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400">Read/Write</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400">Create</span>
                      </>
                    )}
                    {selectedMember.role === "viewer" && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/10 text-gray-400">Read Only</span>
                    )}
                  </div>
                </div>

                {/* Member ID */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-muted-foreground">Member ID</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {selectedMember.id.substring(0, 8)}...
                  </code>
                </div>
              </div>

              {/* Footer Actions */}
              {selectedMember.role !== "owner" && (
                <div className="px-6 py-4 border-t bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => {
                      handleRemoveMember(selectedMember);
                      setSelectedMember(null);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove from Team
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Invite User Dialog - Improved Design */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new member to your team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Role Selection - Card Style */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Role</Label>
              <div className="space-y-2">
                {INVITABLE_ROLES.map((role) => {
                  const roleDisplay = ROLE_DISPLAY[role];
                  const isSelected = inviteForm.role === role;
                  return (
                    <div
                      key={role}
                      onClick={() => setInviteForm({ ...inviteForm, role })}
                      className={`
                        relative flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                        }
                      `}
                    >
                      {/* Radio indicator */}
                      <div className={`
                        mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? "border-primary" : "border-muted-foreground/30"}
                      `}>
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{roleDisplay.label}</span>
                          <Badge className={`${roleDisplay.color} border-0 text-xs`}>
                            {role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {roleDisplay.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setInviteDialogOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={isCreating || !inviteForm.email}
              className="flex-1 sm:flex-none"
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
