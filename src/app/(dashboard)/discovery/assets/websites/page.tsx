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
  MonitorSmartphone,
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
  ExternalLink,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Zap,
  Lock,
} from "lucide-react";
import { getWebsites, type Asset } from "@/features/assets";
import { mockAssetGroups } from "@/features/asset-groups";
import type { Status } from "@/features/shared/types";

// Filter types
type StatusFilter = Status | "all";
type SSLFilter = "all" | "secure" | "insecure";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

// Common technologies for select
const commonTechnologies = [
  "React",
  "Vue.js",
  "Angular",
  "Next.js",
  "Node.js",
  "PHP",
  "Laravel",
  "WordPress",
  "Django",
  "Flask",
  "Ruby on Rails",
  "ASP.NET",
  "Spring Boot",
  "Express.js",
  "Nginx",
  "Apache",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "AWS",
  "Cloudflare",
  "jQuery",
  "Bootstrap",
  "Tailwind CSS",
];

// Empty form state
const emptyWebsiteForm = {
  name: "",
  description: "",
  groupId: "",
  technology: "",
  ssl: true,
  httpStatus: "200",
  responseTime: "",
  server: "",
  tags: "",
};

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Asset[]>(getWebsites());
  const [selectedWebsite, setSelectedWebsite] = useState<Asset | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sslFilter, setSSLFilter] = useState<SSLFilter>("all");
  const [rowSelection, setRowSelection] = useState({});

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState<Asset | null>(null);

  // Form state
  const [formData, setFormData] = useState(emptyWebsiteForm);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...websites];
    if (statusFilter !== "all") {
      data = data.filter((w) => w.status === statusFilter);
    }
    if (sslFilter !== "all") {
      data = data.filter((w) =>
        sslFilter === "secure" ? w.metadata.ssl : !w.metadata.ssl
      );
    }
    return data;
  }, [websites, statusFilter, sslFilter]);

  // Status counts
  const statusCounts = useMemo(
    () => ({
      all: websites.length,
      active: websites.filter((w) => w.status === "active").length,
      inactive: websites.filter((w) => w.status === "inactive").length,
      pending: websites.filter((w) => w.status === "pending").length,
    }),
    [websites]
  );

  // SSL counts
  const sslCounts = useMemo(
    () => ({
      secure: websites.filter((w) => w.metadata.ssl).length,
      insecure: websites.filter((w) => !w.metadata.ssl).length,
    }),
    [websites]
  );

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
          Website
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium truncate max-w-[200px]">
              {row.original.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {row.original.groupName}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "technology",
      header: "Technology",
      cell: ({ row }) => {
        const tech = row.original.metadata.technology || [];
        return (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {tech.slice(0, 2).map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
            {tech.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tech.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "ssl",
      header: "SSL",
      cell: ({ row }) =>
        row.original.metadata.ssl ? (
          <div className="flex items-center gap-1 text-green-500">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs">Secure</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-500">
            <ShieldX className="h-4 w-4" />
            <span className="text-xs">Insecure</span>
          </div>
        ),
    },
    {
      id: "httpStatus",
      header: "Status Code",
      cell: ({ row }) => {
        const status = row.original.metadata.httpStatus || 200;
        const statusClass =
          status >= 200 && status < 300
            ? "text-green-500 bg-green-500/10"
            : status >= 300 && status < 400
              ? "text-blue-500 bg-blue-500/10"
              : status >= 400 && status < 500
                ? "text-orange-500 bg-orange-500/10"
                : "text-red-500 bg-red-500/10";
        return (
          <Badge variant="outline" className={statusClass}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
        if (count === 0)
          return <span className="text-muted-foreground">0</span>;
        return (
          <Badge variant={count > 5 ? "destructive" : "secondary"}>
            {count}
          </Badge>
        );
      },
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
      cell: ({ row }) => (
        <RiskScoreBadge score={row.original.riskScore} size="sm" />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const website = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedWebsite(website)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEdit(website)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyURL(website)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(website.name, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Browser
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400"
                onClick={() => {
                  setWebsiteToDelete(website);
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
  const handleCopyURL = (website: Asset) => {
    navigator.clipboard.writeText(website.name);
    toast.success("URL copied to clipboard");
  };

  const handleOpenEdit = (website: Asset) => {
    setFormData({
      name: website.name,
      description: website.description || "",
      groupId: website.groupId,
      technology: website.metadata.technology?.join(", ") || "",
      ssl: website.metadata.ssl ?? true,
      httpStatus: String(website.metadata.httpStatus || 200),
      responseTime: String(website.metadata.responseTime || ""),
      server: website.metadata.server || "",
      tags: website.tags?.join(", ") || "",
    });
    setSelectedWebsite(website);
    setEditDialogOpen(true);
  };

  const handleAddWebsite = () => {
    if (!formData.name || !formData.groupId) {
      toast.error("Please fill in required fields");
      return;
    }

    const newWebsite: Asset = {
      id: `web-${Date.now()}`,
      type: "website",
      name: formData.name,
      description: formData.description,
      status: "active",
      riskScore: 0,
      findingCount: 0,
      groupId: formData.groupId,
      groupName: mockAssetGroups.find((g) => g.id === formData.groupId)?.name,
      metadata: {
        technology: formData.technology
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        ssl: formData.ssl,
        httpStatus: parseInt(formData.httpStatus) || 200,
        responseTime: formData.responseTime
          ? parseInt(formData.responseTime)
          : undefined,
        server: formData.server || undefined,
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

    setWebsites([newWebsite, ...websites]);
    setFormData(emptyWebsiteForm);
    setAddDialogOpen(false);
    toast.success("Website added successfully");
  };

  const handleEditWebsite = () => {
    if (!selectedWebsite || !formData.name || !formData.groupId) {
      toast.error("Please fill in required fields");
      return;
    }

    const updatedWebsites = websites.map((w) =>
      w.id === selectedWebsite.id
        ? {
            ...w,
            name: formData.name,
            description: formData.description,
            groupId: formData.groupId,
            groupName: mockAssetGroups.find((g) => g.id === formData.groupId)
              ?.name,
            metadata: {
              ...w.metadata,
              technology: formData.technology
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              ssl: formData.ssl,
              httpStatus: parseInt(formData.httpStatus) || 200,
              responseTime: formData.responseTime
                ? parseInt(formData.responseTime)
                : undefined,
              server: formData.server || undefined,
            },
            tags: formData.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            updatedAt: new Date().toISOString(),
          }
        : w
    );

    setWebsites(updatedWebsites);
    setFormData(emptyWebsiteForm);
    setEditDialogOpen(false);
    setSelectedWebsite(null);
    toast.success("Website updated successfully");
  };

  const handleDeleteWebsite = () => {
    if (!websiteToDelete) return;
    setWebsites(websites.filter((w) => w.id !== websiteToDelete.id));
    setDeleteDialogOpen(false);
    setWebsiteToDelete(null);
    toast.success("Website deleted successfully");
  };

  const handleBulkDelete = () => {
    const selectedIds = Object.keys(rowSelection);
    const selectedWebsiteIds = table
      .getSelectedRowModel()
      .rows.map((r) => r.original.id);
    setWebsites(websites.filter((w) => !selectedWebsiteIds.includes(w.id)));
    setRowSelection({});
    toast.success(`Deleted ${selectedIds.length} websites`);
  };

  const handleExport = () => {
    const csv = [
      [
        "URL",
        "Technology",
        "SSL",
        "HTTP Status",
        "Status",
        "Risk Score",
        "Findings",
      ].join(","),
      ...websites.map((w) =>
        [
          w.name,
          (w.metadata.technology || []).join(";"),
          w.metadata.ssl ? "Yes" : "No",
          w.metadata.httpStatus || 200,
          w.status,
          w.riskScore,
          w.findingCount,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "websites.csv";
    a.click();
    toast.success("Websites exported");
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
          title="Website Assets"
          description={`${websites.length} websites in your attack surface`}
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => {
                setFormData(emptyWebsiteForm);
                setAddDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Website
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
                <MonitorSmartphone className="h-4 w-4" />
                Total Websites
              </CardDescription>
              <CardTitle className="text-3xl">{statusCounts.all}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-green-500 transition-colors ${sslFilter === "secure" ? "border-green-500" : ""}`}
            onClick={() =>
              setSSLFilter(sslFilter === "secure" ? "all" : "secure")
            }
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                SSL Secure
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {sslCounts.secure}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-red-500 transition-colors ${sslFilter === "insecure" ? "border-red-500" : ""}`}
            onClick={() =>
              setSSLFilter(sslFilter === "insecure" ? "all" : "insecure")
            }
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ShieldX className="h-4 w-4 text-red-500" />
                SSL Insecure
              </CardDescription>
              <CardTitle className="text-3xl text-red-500">
                {sslCounts.insecure}
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
                {websites.filter((w) => w.findingCount > 0).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MonitorSmartphone className="h-5 w-5" />
                  All Websites
                </CardTitle>
                <CardDescription>
                  Manage your web application assets
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
                  <TabsTrigger
                    key={filter.value}
                    value={filter.value}
                    className="gap-1.5"
                  >
                    {filter.label}
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {statusCounts[filter.value as keyof typeof statusCounts] ||
                        0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search and Actions */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search websites..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* SSL Filter Button */}
                <Button
                  variant={sslFilter !== "all" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSSLFilter("all")}
                >
                  {sslFilter === "all" ? (
                    <Lock className="mr-2 h-4 w-4" />
                  ) : sslFilter === "secure" ? (
                    <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <ShieldX className="mr-2 h-4 w-4 text-red-500" />
                  )}
                  {sslFilter === "all"
                    ? "All SSL"
                    : sslFilter === "secure"
                      ? "Secure Only"
                      : "Insecure Only"}
                </Button>

                {Object.keys(rowSelection).length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {Object.keys(rowSelection).length} selected
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          toast.info("Scanning selected websites...")
                        }
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Rescan Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400"
                        onClick={handleBulkDelete}
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
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest(
                              '[role="checkbox"]'
                            ) ||
                            (e.target as HTMLElement).closest("button")
                          ) {
                            return;
                          }
                          setSelectedWebsite(row.original);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
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
                        No websites found.
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

      {/* Website Details Sheet */}
      <Sheet
        open={!!selectedWebsite && !editDialogOpen}
        onOpenChange={() => setSelectedWebsite(null)}
      >
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
          <VisuallyHidden>
            <SheetTitle>Website Details</SheetTitle>
          </VisuallyHidden>
          {selectedWebsite && (
            <>
              {/* Header */}
              <div
                className={`px-6 pt-6 pb-4 bg-gradient-to-br ${selectedWebsite.metadata.ssl ? "from-green-500/20 via-green-500/10" : "from-red-500/20 via-red-500/10"} to-transparent`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`h-12 w-12 rounded-xl ${selectedWebsite.metadata.ssl ? "bg-green-500/20" : "bg-red-500/20"} flex items-center justify-center`}
                  >
                    {selectedWebsite.metadata.ssl ? (
                      <ShieldCheck className="h-6 w-6 text-green-500" />
                    ) : (
                      <ShieldX className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold truncate">
                      {selectedWebsite.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedWebsite.groupName}
                    </p>
                  </div>
                  <StatusBadge status={selectedWebsite.status} />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenEdit(selectedWebsite)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(selectedWebsite.name, "_blank")
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyURL(selectedWebsite)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Content */}
              <Tabs defaultValue="overview" className="px-6 pb-6">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-0">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                          <Shield className="h-5 w-5 text-orange-500" />
                        </div>
                        <p className="text-xl font-bold">
                          {selectedWebsite.riskScore}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Risk Score
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <p className="text-xl font-bold">
                          {selectedWebsite.findingCount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Findings
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                          <Zap className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="text-xl font-bold">
                          {selectedWebsite.metadata.responseTime || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Response (ms)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Website Info */}
                  <div className="rounded-xl border p-4 bg-card space-y-3">
                    <h4 className="text-sm font-medium">Website Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">HTTP Status</p>
                        <Badge
                          variant="outline"
                          className={
                            (selectedWebsite.metadata.httpStatus || 200) < 400
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {selectedWebsite.metadata.httpStatus || 200}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">SSL Certificate</p>
                        <p className="font-medium">
                          {selectedWebsite.metadata.ssl ? "Valid" : "Invalid/Missing"}
                        </p>
                      </div>
                      {selectedWebsite.metadata.server && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Server</p>
                          <p className="font-medium">
                            {selectedWebsite.metadata.server}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Technology Stack */}
                  {selectedWebsite.metadata.technology &&
                    selectedWebsite.metadata.technology.length > 0 && (
                      <div className="rounded-xl border p-4 bg-card">
                        <h4 className="text-sm font-medium mb-2">
                          Technology Stack
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedWebsite.metadata.technology.map((tech) => (
                            <Badge key={tech} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Tags */}
                  {selectedWebsite.tags && selectedWebsite.tags.length > 0 && (
                    <div className="rounded-xl border p-4 bg-card">
                      <h4 className="text-sm font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedWebsite.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-0">
                  {/* Timeline */}
                  <div className="rounded-xl border p-4 bg-card">
                    <h4 className="text-sm font-medium mb-3">Timeline</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">First Seen</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedWebsite.firstSeen).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Last Seen</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedWebsite.lastSeen).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="rounded-xl border p-4 bg-card">
                    <h4 className="text-sm font-medium mb-3">Technical Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">ID</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {selectedWebsite.id}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium">Website</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Group ID</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {selectedWebsite.groupId}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-xl border border-red-500/30 p-4 bg-red-500/5">
                    <h4 className="text-sm font-medium text-red-500 mb-2">
                      Danger Zone
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Permanently delete this website from your inventory.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setWebsiteToDelete(selectedWebsite);
                        setDeleteDialogOpen(true);
                        setSelectedWebsite(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Website
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Website Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5" />
              Add Website
            </DialogTitle>
            <DialogDescription>
              Add a new website to your asset inventory
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">URL *</Label>
              <Input
                id="name"
                placeholder="https://example.com"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupId">Asset Group *</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) =>
                  setFormData({ ...formData, groupId: value })
                }
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technology">Technology (comma separated)</Label>
              <Input
                id="technology"
                placeholder="React, Node.js, PostgreSQL"
                value={formData.technology}
                onChange={(e) =>
                  setFormData({ ...formData, technology: e.target.value })
                }
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {commonTechnologies.slice(0, 6).map((tech) => (
                  <Button
                    key={tech}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      const current = formData.technology
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (!current.includes(tech)) {
                        setFormData({
                          ...formData,
                          technology: [...current, tech].join(", "),
                        });
                      }
                    }}
                  >
                    + {tech}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="httpStatus">HTTP Status Code</Label>
                <Input
                  id="httpStatus"
                  type="number"
                  placeholder="200"
                  value={formData.httpStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, httpStatus: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responseTime">Response Time (ms)</Label>
                <Input
                  id="responseTime"
                  type="number"
                  placeholder="150"
                  value={formData.responseTime}
                  onChange={(e) =>
                    setFormData({ ...formData, responseTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="server">Server</Label>
              <Input
                id="server"
                placeholder="nginx/1.21.0"
                value={formData.server}
                onChange={(e) =>
                  setFormData({ ...formData, server: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ssl"
                checked={formData.ssl}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ssl: !!checked })
                }
              />
              <Label htmlFor="ssl" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                SSL/TLS Enabled
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="production, critical"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWebsite}>
              <Plus className="mr-2 h-4 w-4" />
              Add Website
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Website Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Website
            </DialogTitle>
            <DialogDescription>Update website information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-name">URL *</Label>
              <Input
                id="edit-name"
                placeholder="https://example.com"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-groupId">Asset Group *</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) =>
                  setFormData({ ...formData, groupId: value })
                }
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-technology">
                Technology (comma separated)
              </Label>
              <Input
                id="edit-technology"
                placeholder="React, Node.js, PostgreSQL"
                value={formData.technology}
                onChange={(e) =>
                  setFormData({ ...formData, technology: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-httpStatus">HTTP Status Code</Label>
                <Input
                  id="edit-httpStatus"
                  type="number"
                  placeholder="200"
                  value={formData.httpStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, httpStatus: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-responseTime">Response Time (ms)</Label>
                <Input
                  id="edit-responseTime"
                  type="number"
                  placeholder="150"
                  value={formData.responseTime}
                  onChange={(e) =>
                    setFormData({ ...formData, responseTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-server">Server</Label>
              <Input
                id="edit-server"
                placeholder="nginx/1.21.0"
                value={formData.server}
                onChange={(e) =>
                  setFormData({ ...formData, server: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-ssl"
                checked={formData.ssl}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ssl: !!checked })
                }
              />
              <Label htmlFor="edit-ssl" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                SSL/TLS Enabled
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                placeholder="production, critical"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditWebsite}>
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
            <AlertDialogTitle>Delete Website</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{websiteToDelete?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteWebsite}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
