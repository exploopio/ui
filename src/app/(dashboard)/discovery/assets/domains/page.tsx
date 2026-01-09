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
  Globe,
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
} from "lucide-react";
import { getDomains, getAssetRelationships, type Asset } from "@/features/assets";
import { mockAssetGroups } from "@/features/asset-groups";
import type { Status } from "@/features/shared/types";

// Filter types
type StatusFilter = Status | "all";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

// Empty form state
const emptyDomainForm = {
  name: "",
  description: "",
  groupId: "",
  registrar: "",
  expiryDate: "",
  nameservers: "",
  tags: "",
};

export default function DomainsPage() {
  const [domains, setDomains] = useState<Asset[]>(getDomains());
  const [selectedDomain, setSelectedDomain] = useState<Asset | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rowSelection, setRowSelection] = useState({});

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Asset | null>(null);

  // Form state
  const [formData, setFormData] = useState(emptyDomainForm);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...domains];
    if (statusFilter !== "all") {
      data = data.filter((d) => d.status === statusFilter);
    }
    return data;
  }, [domains, statusFilter]);

  // Status counts
  const statusCounts = useMemo(() => ({
    all: domains.length,
    active: domains.filter((d) => d.status === "active").length,
    inactive: domains.filter((d) => d.status === "inactive").length,
    pending: domains.filter((d) => d.status === "pending").length,
  }), [domains]);

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
          Domain
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-muted-foreground text-xs">{row.original.groupName}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "metadata.registrar",
      header: "Registrar",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.metadata.registrar || "-"}</span>
      ),
    },
    {
      accessorKey: "metadata.expiryDate",
      header: "Expiry",
      cell: ({ row }) => {
        const date = row.original.metadata.expiryDate;
        if (!date) return <span className="text-muted-foreground">-</span>;
        const expiry = new Date(date);
        const now = new Date();
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysLeft <= 30;
        return (
          <div className="flex items-center gap-1">
            <span className={isExpiringSoon ? "text-orange-500" : ""}>
              {expiry.toLocaleDateString()}
            </span>
            {isExpiringSoon && <AlertTriangle className="h-3 w-3 text-orange-500" />}
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
      cell: ({ row }) => <RiskScoreBadge score={row.original.riskScore} size="sm" />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const domain = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedDomain(domain)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEdit(domain)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyDomain(domain)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`https://${domain.name}`, "_blank")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Browser
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400"
                onClick={() => {
                  setDomainToDelete(domain);
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
  const handleCopyDomain = (domain: Asset) => {
    navigator.clipboard.writeText(domain.name);
    toast.success("Domain copied to clipboard");
  };

  const handleOpenEdit = (domain: Asset) => {
    setFormData({
      name: domain.name,
      description: domain.description || "",
      groupId: domain.groupId || "",
      registrar: domain.metadata.registrar || "",
      expiryDate: domain.metadata.expiryDate || "",
      nameservers: domain.metadata.nameservers?.join(", ") || "",
      tags: domain.tags?.join(", ") || "",
    });
    setSelectedDomain(domain);
    setEditDialogOpen(true);
  };

  const handleAddDomain = () => {
    if (!formData.name || !formData.groupId) {
      toast.error("Please fill in required fields");
      return;
    }

    const newDomain: Asset = {
      id: `dom-${Date.now()}`,
      type: "domain",
      name: formData.name,
      description: formData.description,
      status: "active",
      riskScore: 0,
      findingCount: 0,
      groupId: formData.groupId,
      groupName: mockAssetGroups.find((g) => g.id === formData.groupId)?.name,
      metadata: {
        registrar: formData.registrar,
        expiryDate: formData.expiryDate,
        nameservers: formData.nameservers.split(",").map((s) => s.trim()).filter(Boolean),
      },
      tags: formData.tags.split(",").map((s) => s.trim()).filter(Boolean),
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDomains([newDomain, ...domains]);
    setFormData(emptyDomainForm);
    setAddDialogOpen(false);
    toast.success("Domain added successfully");
  };

  const handleEditDomain = () => {
    if (!selectedDomain || !formData.name || !formData.groupId) {
      toast.error("Please fill in required fields");
      return;
    }

    const updatedDomains = domains.map((d) =>
      d.id === selectedDomain.id
        ? {
            ...d,
            name: formData.name,
            description: formData.description,
            groupId: formData.groupId,
            groupName: mockAssetGroups.find((g) => g.id === formData.groupId)?.name,
            metadata: {
              ...d.metadata,
              registrar: formData.registrar,
              expiryDate: formData.expiryDate,
              nameservers: formData.nameservers.split(",").map((s) => s.trim()).filter(Boolean),
            },
            tags: formData.tags.split(",").map((s) => s.trim()).filter(Boolean),
            updatedAt: new Date().toISOString(),
          }
        : d
    );

    setDomains(updatedDomains);
    setFormData(emptyDomainForm);
    setEditDialogOpen(false);
    setSelectedDomain(null);
    toast.success("Domain updated successfully");
  };

  const handleDeleteDomain = () => {
    if (!domainToDelete) return;
    setDomains(domains.filter((d) => d.id !== domainToDelete.id));
    setDeleteDialogOpen(false);
    setDomainToDelete(null);
    toast.success("Domain deleted successfully");
  };

  const handleBulkDelete = () => {
    const selectedIds = Object.keys(rowSelection);
    const selectedDomainIds = table.getSelectedRowModel().rows.map((r) => r.original.id);
    setDomains(domains.filter((d) => !selectedDomainIds.includes(d.id)));
    setRowSelection({});
    toast.success(`Deleted ${selectedIds.length} domains`);
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Registrar", "Expiry", "Status", "Risk Score", "Findings"].join(","),
      ...domains.map((d) =>
        [
          d.name,
          d.metadata.registrar || "",
          d.metadata.expiryDate || "",
          d.status,
          d.riskScore,
          d.findingCount,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "domains.csv";
    a.click();
    toast.success("Domains exported");
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
          title="Domain Assets"
          description={`${domains.length} domains in your attack surface`}
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => {
              setFormData(emptyDomainForm);
              setAddDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("all")}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Total Domains
              </CardDescription>
              <CardTitle className="text-3xl">{statusCounts.all}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={`cursor-pointer hover:border-green-500 transition-colors ${statusFilter === "active" ? "border-green-500" : ""}`} onClick={() => setStatusFilter("active")}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Active
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">{statusCounts.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={`cursor-pointer hover:border-gray-500 transition-colors ${statusFilter === "inactive" ? "border-gray-500" : ""}`} onClick={() => setStatusFilter("inactive")}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Inactive
              </CardDescription>
              <CardTitle className="text-3xl text-gray-500">{statusCounts.inactive}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                With Findings
              </CardDescription>
              <CardTitle className="text-3xl text-orange-500">
                {domains.filter((d) => d.findingCount > 0).length}
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
                  <Globe className="h-5 w-5" />
                  All Domains
                </CardTitle>
                <CardDescription>Manage your domain assets</CardDescription>
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
                  placeholder="Search domains..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                {Object.keys(rowSelection).length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {Object.keys(rowSelection).length} selected
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.info("Scanning selected domains...")}>
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
                          if ((e.target as HTMLElement).closest('[role="checkbox"]') ||
                              (e.target as HTMLElement).closest('button')) {
                            return;
                          }
                          setSelectedDomain(row.original);
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
                        No domains found.
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

      {/* Domain Details Sheet */}
      <AssetDetailSheet
        asset={selectedDomain}
        open={!!selectedDomain && !editDialogOpen}
        onOpenChange={() => setSelectedDomain(null)}
        icon={Globe}
        iconColor="text-blue-500"
        gradientFrom="from-blue-500/20"
        gradientVia="via-blue-500/10"
        assetTypeName="Domain"
        relationships={selectedDomain ? getAssetRelationships(selectedDomain.id) : []}
        onEdit={() => selectedDomain && handleOpenEdit(selectedDomain)}
        onDelete={() => {
          if (selectedDomain) {
            setDomainToDelete(selectedDomain);
            setDeleteDialogOpen(true);
            setSelectedDomain(null);
          }
        }}
        quickActions={
          selectedDomain && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`https://${selectedDomain.name}`, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyDomain(selectedDomain)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </>
          )
        }
        statsContent={
          selectedDomain && (
            <StatsGrid>
              <StatCard
                icon={Shield}
                iconBg="bg-orange-500/10"
                iconColor="text-orange-500"
                value={selectedDomain.riskScore}
                label="Risk Score"
              />
              <StatCard
                icon={AlertTriangle}
                iconBg="bg-red-500/10"
                iconColor="text-red-500"
                value={selectedDomain.findingCount}
                label="Findings"
              />
            </StatsGrid>
          )
        }
        overviewContent={
          selectedDomain && (
            <div className="rounded-xl border p-4 bg-card space-y-3">
              <SectionTitle>Domain Information</SectionTitle>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Registrar</p>
                  <p className="font-medium">{selectedDomain.metadata.registrar || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">
                    {selectedDomain.metadata.expiryDate
                      ? new Date(selectedDomain.metadata.expiryDate).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
              {selectedDomain.metadata.nameservers && selectedDomain.metadata.nameservers.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Nameservers</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDomain.metadata.nameservers.map((ns) => (
                      <Badge key={ns} variant="outline" className="text-xs">{ns}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }
      />

      {/* Add Domain Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Add Domain
            </DialogTitle>
            <DialogDescription>
              Add a new domain to your asset inventory
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Domain Name *</Label>
              <Input
                id="name"
                placeholder="example.com"
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
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registrar">Registrar</Label>
                <Input
                  id="registrar"
                  placeholder="GoDaddy, Cloudflare..."
                  value={formData.registrar}
                  onChange={(e) => setFormData({ ...formData, registrar: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameservers">Nameservers (comma separated)</Label>
              <Input
                id="nameservers"
                placeholder="ns1.example.com, ns2.example.com"
                value={formData.nameservers}
                onChange={(e) => setFormData({ ...formData, nameservers: e.target.value })}
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
            <Button onClick={handleAddDomain}>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Domain Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Domain
            </DialogTitle>
            <DialogDescription>
              Update domain information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Domain Name *</Label>
              <Input
                id="edit-name"
                placeholder="example.com"
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
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-registrar">Registrar</Label>
                <Input
                  id="edit-registrar"
                  placeholder="GoDaddy, Cloudflare..."
                  value={formData.registrar}
                  onChange={(e) => setFormData({ ...formData, registrar: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expiryDate">Expiry Date</Label>
                <Input
                  id="edit-expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nameservers">Nameservers (comma separated)</Label>
              <Input
                id="edit-nameservers"
                placeholder="ns1.example.com, ns2.example.com"
                value={formData.nameservers}
                onChange={(e) => setFormData({ ...formData, nameservers: e.target.value })}
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
            <Button onClick={handleEditDomain}>
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
            <AlertDialogTitle>Delete Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{domainToDelete?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteDomain}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
