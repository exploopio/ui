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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Key,
  UserCog,
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
  Target,
  Activity,
  Calendar,
  Building,
  AlertCircle,
} from "lucide-react";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "pending" | "inactive";
  lastActive: string;
  assignedFindings: number;
  joinedAt: string;
  completedTasks: number;
  pendingTasks: number;
}

type StatusFilter = "all" | "active" | "pending" | "inactive";
type RoleFilter = "all" | "Admin" | "Manager" | "Security Analyst" | "Security Engineer" | "Viewer";

// Mock data
const userStats = {
  totalUsers: 12,
  active: 10,
  pending: 2,
  roles: 5,
};

const users: User[] = [
  {
    id: "usr-001",
    name: "Nguyen Van An",
    email: "an.nguyen@techcombank.com.vn",
    role: "Admin",
    department: "Security Operations",
    status: "active",
    lastActive: "Just now",
    assignedFindings: 8,
    joinedAt: "2023-06-15",
    completedTasks: 45,
    pendingTasks: 3,
  },
  {
    id: "usr-002",
    name: "Tran Thi Binh",
    email: "binh.tran@techcombank.com.vn",
    role: "Security Analyst",
    department: "Security Operations",
    status: "active",
    lastActive: "5 mins ago",
    assignedFindings: 12,
    joinedAt: "2023-08-20",
    completedTasks: 89,
    pendingTasks: 5,
  },
  {
    id: "usr-003",
    name: "Le Van Cuong",
    email: "cuong.le@techcombank.com.vn",
    role: "Security Engineer",
    department: "Engineering",
    status: "active",
    lastActive: "1 hour ago",
    assignedFindings: 6,
    joinedAt: "2023-09-10",
    completedTasks: 56,
    pendingTasks: 2,
  },
  {
    id: "usr-004",
    name: "Pham Thi Dung",
    email: "dung.pham@techcombank.com.vn",
    role: "Security Analyst",
    department: "Security Operations",
    status: "active",
    lastActive: "2 hours ago",
    assignedFindings: 10,
    joinedAt: "2023-10-05",
    completedTasks: 72,
    pendingTasks: 4,
  },
  {
    id: "usr-005",
    name: "Hoang Van Em",
    email: "em.hoang@techcombank.com.vn",
    role: "Manager",
    department: "Security Operations",
    status: "active",
    lastActive: "3 hours ago",
    assignedFindings: 3,
    joinedAt: "2023-05-01",
    completedTasks: 128,
    pendingTasks: 1,
  },
  {
    id: "usr-006",
    name: "Vu Thi Phuong",
    email: "phuong.vu@techcombank.com.vn",
    role: "Viewer",
    department: "Compliance",
    status: "active",
    lastActive: "1 day ago",
    assignedFindings: 0,
    joinedAt: "2024-01-15",
    completedTasks: 0,
    pendingTasks: 0,
  },
  {
    id: "usr-007",
    name: "Dao Van Giang",
    email: "giang.dao@techcombank.com.vn",
    role: "Security Analyst",
    department: "Security Operations",
    status: "pending",
    lastActive: "Never",
    assignedFindings: 0,
    joinedAt: "2025-01-05",
    completedTasks: 0,
    pendingTasks: 0,
  },
  {
    id: "usr-008",
    name: "Bui Thi Hoa",
    email: "hoa.bui@techcombank.com.vn",
    role: "Security Engineer",
    department: "Engineering",
    status: "pending",
    lastActive: "Never",
    assignedFindings: 0,
    joinedAt: "2025-01-06",
    completedTasks: 0,
    pendingTasks: 0,
  },
];

const roles = [
  {
    name: "Admin",
    description: "Full access to all features and settings",
    users: 1,
    permissions: ["All permissions"],
  },
  {
    name: "Manager",
    description: "Manage team, assign tasks, view reports",
    users: 1,
    permissions: ["Manage users", "Assign findings", "View reports", "Export data"],
  },
  {
    name: "Security Analyst",
    description: "Analyze findings, manage remediation",
    users: 4,
    permissions: ["View findings", "Update status", "Add comments", "View assets"],
  },
  {
    name: "Security Engineer",
    description: "Configure scans, manage integrations",
    users: 3,
    permissions: ["Configure scans", "Manage integrations", "View findings"],
  },
  {
    name: "Viewer",
    description: "Read-only access to dashboards and reports",
    users: 3,
    permissions: ["View dashboards", "View reports"],
  },
];

const recentActivity = [
  { user: "Nguyen Van An", action: "Updated finding status", time: "5 mins ago" },
  { user: "Tran Thi Binh", action: "Assigned finding to Cuong", time: "15 mins ago" },
  { user: "Le Van Cuong", action: "Added comment on CVE-2024-1234", time: "1 hour ago" },
  { user: "Pham Thi Dung", action: "Generated security report", time: "2 hours ago" },
  { user: "Hoang Van Em", action: "Approved remediation task", time: "3 hours ago" },
];

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  active: { color: "text-green-400", bgColor: "bg-green-500/20" },
  pending: { color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  inactive: { color: "text-gray-400", bgColor: "bg-gray-500/20" },
};

const roleConfig: Record<string, string> = {
  Admin: "bg-red-500/20 text-red-400",
  Manager: "bg-purple-500/20 text-purple-400",
  "Security Analyst": "bg-blue-500/20 text-blue-400",
  "Security Engineer": "bg-green-500/20 text-green-400",
  Viewer: "bg-gray-500/20 text-gray-400",
};

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
];

const roleFilters: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "Admin", label: "Admin" },
  { value: "Manager", label: "Manager" },
  { value: "Security Analyst", label: "Security Analyst" },
  { value: "Security Engineer", label: "Security Engineer" },
  { value: "Viewer", label: "Viewer" },
];

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [rowSelection, setRowSelection] = useState({});
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "Security Analyst",
    department: "",
  });

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

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...users];

    if (statusFilter !== "all") {
      data = data.filter((user) => user.status === statusFilter);
    }

    if (roleFilter !== "all") {
      data = data.filter((user) => user.role === roleFilter);
    }

    return data;
  }, [statusFilter, roleFilter]);

  // Status counts
  const statusCounts = useMemo(() => ({
    all: users.length,
    active: users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending").length,
    inactive: users.filter((u) => u.status === "inactive").length,
  }), []);

  // Table columns
  const columns: ColumnDef<User>[] = [
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
      cell: ({ row }) => (
        <Badge className={`${roleConfig[row.original.role]} border-0`}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.department}</span>
      ),
    },
    {
      accessorKey: "assignedFindings",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Assigned
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        if (row.original.assignedFindings === 0) {
          return <span className="text-muted-foreground">--</span>;
        }
        return <Badge variant="secondary">{row.original.assignedFindings} findings</Badge>;
      },
    },
    {
      accessorKey: "lastActive",
      header: "Last Active",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.lastActive}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = statusConfig[row.original.status];
        return (
          <Badge className={`${status.bgColor} ${status.color} border-0`}>
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const isPending = user.status === "pending";
        const isActive = user.status === "active";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              {isPending && (
                <DropdownMenuItem onClick={() => handleResendInvite(user)}>
                  <Send className="mr-2 h-4 w-4" />
                  Resend Invite
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {isActive && (
                <DropdownMenuItem onClick={() => handleDeactivate(user)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-400"
                onClick={() => handleDeleteUser(user)}
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
  const handleEditUser = (user: User) => {
    toast.info(`Edit user: ${user.name}`);
  };

  const handleResendInvite = (user: User) => {
    toast.success(`Invite resent to ${user.email}`);
  };

  const handleDeactivate = (user: User) => {
    toast.success(`Deactivated user: ${user.name}`);
  };

  const handleDeleteUser = (user: User) => {
    toast.success(`Deleted user: ${user.name}`);
  };

  const handleInviteUser = () => {
    if (!inviteForm.email) {
      toast.error("Please enter an email address");
      return;
    }
    toast.success(`Invitation sent to ${inviteForm.email}`);
    setInviteDialogOpen(false);
    setInviteForm({ email: "", role: "Security Analyst", department: "" });
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
        <div className="ms-auto flex items-center space-x-4">
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

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setStatusFilter("all")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardDescription>
              <CardTitle className="text-3xl">{userStats.totalUsers}</CardTitle>
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
              <CardTitle className="text-3xl text-green-500">{userStats.active}</CardTitle>
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
              <CardTitle className="text-3xl text-yellow-500">{userStats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles
              </CardDescription>
              <CardTitle className="text-3xl">{userStats.roles}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Roles */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Roles</CardTitle>
                  <CardDescription>Permission groups</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Key className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.name}
                  className="rounded-lg border p-3 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setRoleFilter(role.name as RoleFilter)}
                >
                  <div className="flex items-center justify-between">
                    <Badge className={`${roleConfig[role.name]} border-0`}>
                      {role.name}
                    </Badge>
                    <span className="text-muted-foreground text-xs">{role.users} users</span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">{role.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>User actions and events</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <History className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-xs">{activity.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
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
            <div className="flex items-center justify-between gap-4 mb-4">
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
                  <PopoverContent className="w-80" align="end">
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
            <div className="rounded-md border">
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
                          setSelectedUser(row.original);
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
      </Main>

      {/* User Details Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <VisuallyHidden>
            <SheetTitle>User Details</SheetTitle>
          </VisuallyHidden>
          {selectedUser && (
            <>
              {/* Header */}
              <div className={`-mx-6 -mt-6 px-6 py-6 ${
                selectedUser.status === "active" ? "bg-gradient-to-r from-green-500/20 to-green-500/5" :
                selectedUser.status === "pending" ? "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5" :
                "bg-gradient-to-r from-gray-500/20 to-gray-500/5"
              }`}>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl">{getInitials(selectedUser.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <SheetHeader className="text-left">
                      <h2 className="text-xl font-semibold">{selectedUser.name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </SheetHeader>
                    <div className="flex gap-2 mt-2">
                      <Badge className={`${roleConfig[selectedUser.role]} border-0`}>
                        {selectedUser.role}
                      </Badge>
                      <Badge className={`${statusConfig[selectedUser.status].bgColor} ${statusConfig[selectedUser.status].color} border-0`}>
                        {selectedUser.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEditUser(selectedUser)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {selectedUser.status === "pending" && (
                    <Button size="sm" onClick={() => handleResendInvite(selectedUser)}>
                      <Send className="mr-2 h-4 w-4" />
                      Resend Invite
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-6 mt-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{selectedUser.assignedFindings}</p>
                    <p className="text-xs text-muted-foreground">Assigned</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-bold">{selectedUser.completedTasks}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                    <p className="text-lg font-bold">{selectedUser.pendingTasks}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>

                {/* Task Progress */}
                {(selectedUser.completedTasks > 0 || selectedUser.pendingTasks > 0) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground">Task Completion</Label>
                      <span className="text-sm font-medium">
                        {Math.round((selectedUser.completedTasks / (selectedUser.completedTasks + selectedUser.pendingTasks)) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(selectedUser.completedTasks / (selectedUser.completedTasks + selectedUser.pendingTasks)) * 100}
                      className="h-2"
                    />
                  </div>
                )}

                <Separator />

                {/* User Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{selectedUser.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="text-sm font-medium">{formatDate(selectedUser.joinedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Active</p>
                      <p className="text-sm font-medium">{selectedUser.lastActive}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Role Permissions */}
                <div className="space-y-3">
                  <Label className="text-muted-foreground">Role Permissions</Label>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium mb-2">{selectedUser.role}</p>
                    <div className="flex flex-wrap gap-1">
                      {roles.find((r) => r.name === selectedUser.role)?.permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Danger Zone */}
                <div className="rounded-lg border border-red-500/30 p-4 bg-red-500/5">
                  <h4 className="font-medium text-red-500 mb-2">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete this user and revoke all access.
                  </p>
                  <div className="flex gap-2">
                    {selectedUser.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleDeactivate(selectedUser);
                          setSelectedUser(null);
                        }}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Deactivate
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        handleDeleteUser(selectedUser);
                        setSelectedUser(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite User
            </DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.name} value={role.name}>
                      <div>
                        <p>{role.name}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input
                id="department"
                placeholder="e.g., Security Operations"
                value={inviteForm.department}
                onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser}>
              <Send className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
