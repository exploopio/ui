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
  Cloud,
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
  RefreshCw,
  Server,
  Database,
  HardDrive,
  Network,
  Container,
  Globe,
  MapPin,
} from "lucide-react";
import { getCloudAssets, type Asset } from "@/features/assets";
import { mockAssetGroups } from "@/features/asset-groups";
import type { Status } from "@/features/shared/types";

// Filter types
type StatusFilter = Status | "all";
type ProviderFilter = "all" | "aws" | "gcp" | "azure";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

// Provider styling
const providerStyles: Record<string, { bg: string; text: string; icon: string }> = {
  aws: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    icon: "text-orange-500",
  },
  gcp: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    icon: "text-blue-500",
  },
  azure: {
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    text: "text-cyan-700 dark:text-cyan-300",
    icon: "text-cyan-500",
  },
};

// Regions by provider
const regionsByProvider: Record<string, string[]> = {
  aws: [
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
    "ap-southeast-1",
    "ap-southeast-2",
    "ap-northeast-1",
    "eu-west-1",
    "eu-central-1",
  ],
  gcp: [
    "us-central1",
    "us-east1",
    "us-west1",
    "asia-southeast1",
    "asia-east1",
    "europe-west1",
  ],
  azure: [
    "East US",
    "West US",
    "Southeast Asia",
    "East Asia",
    "West Europe",
    "North Europe",
  ],
};

// Resource types by provider
const resourceTypesByProvider: Record<string, string[]> = {
  aws: ["EC2", "S3 Bucket", "RDS", "Lambda", "VPC", "EKS", "ECS", "CloudFront"],
  gcp: ["GCE", "GCS Bucket", "Cloud SQL", "GKE Cluster", "VPC", "Cloud Run", "BigQuery"],
  azure: ["VM", "Blob Storage", "SQL Server", "AKS", "VNet", "Functions", "Cosmos DB"],
};

// Empty form state
const emptyCloudForm = {
  name: "",
  description: "",
  groupId: "",
  cloudProvider: "aws" as "aws" | "gcp" | "azure",
  region: "",
  resourceType: "",
  tags: "",
};

export default function CloudPage() {
  const [cloudAssets, setCloudAssets] = useState<Asset[]>(getCloudAssets());
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [rowSelection, setRowSelection] = useState({});

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Form state
  const [formData, setFormData] = useState(emptyCloudForm);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...cloudAssets];
    if (statusFilter !== "all") {
      data = data.filter((a) => a.status === statusFilter);
    }
    if (providerFilter !== "all") {
      data = data.filter((a) => a.metadata.cloudProvider === providerFilter);
    }
    return data;
  }, [cloudAssets, statusFilter, providerFilter]);

  // Status counts
  const statusCounts = useMemo(
    () => ({
      all: cloudAssets.length,
      active: cloudAssets.filter((a) => a.status === "active").length,
      inactive: cloudAssets.filter((a) => a.status === "inactive").length,
      pending: cloudAssets.filter((a) => a.status === "pending").length,
    }),
    [cloudAssets]
  );

  // Provider counts
  const providerCounts = useMemo(
    () => ({
      aws: cloudAssets.filter((a) => a.metadata.cloudProvider === "aws").length,
      gcp: cloudAssets.filter((a) => a.metadata.cloudProvider === "gcp").length,
      azure: cloudAssets.filter((a) => a.metadata.cloudProvider === "azure").length,
    }),
    [cloudAssets]
  );

  // Get resource type icon
  const getResourceIcon = (resourceType?: string) => {
    const type = resourceType?.toLowerCase() || "";
    if (type.includes("ec2") || type.includes("vm") || type.includes("gce")) {
      return <Server className="h-4 w-4" />;
    }
    if (type.includes("sql") || type.includes("rds") || type.includes("database")) {
      return <Database className="h-4 w-4" />;
    }
    if (type.includes("s3") || type.includes("bucket") || type.includes("storage") || type.includes("blob")) {
      return <HardDrive className="h-4 w-4" />;
    }
    if (type.includes("vpc") || type.includes("vnet") || type.includes("network")) {
      return <Network className="h-4 w-4" />;
    }
    if (type.includes("eks") || type.includes("aks") || type.includes("gke") || type.includes("kubernetes") || type.includes("container")) {
      return <Container className="h-4 w-4" />;
    }
    return <Cloud className="h-4 w-4" />;
  };

  // Get provider badge
  const getProviderBadge = (provider?: string) => {
    const style = providerStyles[provider || ""] || providerStyles.aws;
    return (
      <Badge className={`${style.bg} ${style.text} border-0 uppercase font-semibold`}>
        {provider}
      </Badge>
    );
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
          Resource
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
            providerStyles[row.original.metadata.cloudProvider || ""]?.bg || "bg-muted"
          }`}>
            {getResourceIcon(row.original.metadata.resourceType)}
          </div>
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
      accessorKey: "metadata.cloudProvider",
      header: "Provider",
      cell: ({ row }) => getProviderBadge(row.original.metadata.cloudProvider),
    },
    {
      accessorKey: "metadata.region",
      header: "Region",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          {row.original.metadata.region}
        </span>
      ),
    },
    {
      accessorKey: "metadata.resourceType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.metadata.resourceType}</Badge>
      ),
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
          <Badge variant={count > 3 ? "destructive" : "secondary"}>{count}</Badge>
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
        const asset = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedAsset(asset)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEdit(asset)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenConsole(asset)}>
                <Globe className="mr-2 h-4 w-4" />
                Open Console
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400"
                onClick={() => {
                  setAssetToDelete(asset);
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
  const handleOpenConsole = (asset: Asset) => {
    const provider = asset.metadata.cloudProvider;
    let url = "";
    switch (provider) {
      case "aws":
        url = "https://console.aws.amazon.com";
        break;
      case "gcp":
        url = "https://console.cloud.google.com";
        break;
      case "azure":
        url = "https://portal.azure.com";
        break;
    }
    window.open(url, "_blank");
    toast.info(`Opening ${provider?.toUpperCase()} Console`);
  };

  const handleOpenEdit = (asset: Asset) => {
    setFormData({
      name: asset.name,
      description: asset.description || "",
      groupId: asset.groupId,
      cloudProvider: (asset.metadata.cloudProvider as "aws" | "gcp" | "azure") || "aws",
      region: asset.metadata.region || "",
      resourceType: asset.metadata.resourceType || "",
      tags: asset.tags?.join(", ") || "",
    });
    setSelectedAsset(asset);
    setEditDialogOpen(true);
  };

  const handleAddAsset = () => {
    if (!formData.name || !formData.groupId || !formData.region || !formData.resourceType) {
      toast.error("Please fill in required fields");
      return;
    }

    const newAsset: Asset = {
      id: `cloud-${Date.now()}`,
      type: "cloud",
      name: formData.name,
      description: formData.description,
      status: "active",
      riskScore: 0,
      findingCount: 0,
      groupId: formData.groupId,
      groupName: mockAssetGroups.find((g) => g.id === formData.groupId)?.name,
      metadata: {
        cloudProvider: formData.cloudProvider,
        region: formData.region,
        resourceType: formData.resourceType,
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

    setCloudAssets([newAsset, ...cloudAssets]);
    setFormData(emptyCloudForm);
    setAddDialogOpen(false);
    toast.success("Cloud asset added successfully");
  };

  const handleEditAsset = () => {
    if (!selectedAsset || !formData.name || !formData.groupId) {
      toast.error("Please fill in required fields");
      return;
    }

    const updatedAssets = cloudAssets.map((a) =>
      a.id === selectedAsset.id
        ? {
            ...a,
            name: formData.name,
            description: formData.description,
            groupId: formData.groupId,
            groupName: mockAssetGroups.find((g) => g.id === formData.groupId)?.name,
            metadata: {
              ...a.metadata,
              cloudProvider: formData.cloudProvider,
              region: formData.region,
              resourceType: formData.resourceType,
            },
            tags: formData.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            updatedAt: new Date().toISOString(),
          }
        : a
    );

    setCloudAssets(updatedAssets);
    setFormData(emptyCloudForm);
    setEditDialogOpen(false);
    setSelectedAsset(null);
    toast.success("Cloud asset updated successfully");
  };

  const handleDeleteAsset = () => {
    if (!assetToDelete) return;
    setCloudAssets(cloudAssets.filter((a) => a.id !== assetToDelete.id));
    setDeleteDialogOpen(false);
    setAssetToDelete(null);
    toast.success("Cloud asset deleted successfully");
  };

  const handleBulkDelete = () => {
    const selectedIds = Object.keys(rowSelection);
    const selectedAssetIds = table.getSelectedRowModel().rows.map((r) => r.original.id);
    setCloudAssets(cloudAssets.filter((a) => !selectedAssetIds.includes(a.id)));
    setRowSelection({});
    toast.success(`Deleted ${selectedIds.length} cloud assets`);
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Provider", "Region", "Type", "Status", "Risk Score", "Findings"].join(","),
      ...cloudAssets.map((a) =>
        [
          a.name,
          a.metadata.cloudProvider || "",
          a.metadata.region || "",
          a.metadata.resourceType || "",
          a.status,
          a.riskScore,
          a.findingCount,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cloud-assets.csv";
    link.click();
    toast.success("Cloud assets exported");
  };

  // Reset region and resourceType when provider changes
  const handleProviderChange = (provider: "aws" | "gcp" | "azure") => {
    setFormData({
      ...formData,
      cloudProvider: provider,
      region: "",
      resourceType: "",
    });
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
          title="Cloud Assets"
          description={`${cloudAssets.length} cloud resources across AWS, GCP, and Azure`}
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => {
                setFormData(emptyCloudForm);
                setAddDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Cloud Asset
            </Button>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setProviderFilter("all")}
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Total Assets
              </CardDescription>
              <CardTitle className="text-3xl">{statusCounts.all}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-orange-500 transition-colors ${providerFilter === "aws" ? "border-orange-500" : ""}`}
            onClick={() =>
              setProviderFilter(providerFilter === "aws" ? "all" : "aws")
            }
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-orange-500" />
                AWS
              </CardDescription>
              <CardTitle className="text-3xl text-orange-500">
                {providerCounts.aws}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-blue-500 transition-colors ${providerFilter === "gcp" ? "border-blue-500" : ""}`}
            onClick={() =>
              setProviderFilter(providerFilter === "gcp" ? "all" : "gcp")
            }
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-500" />
                GCP
              </CardDescription>
              <CardTitle className="text-3xl text-blue-500">
                {providerCounts.gcp}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={`cursor-pointer hover:border-cyan-500 transition-colors ${providerFilter === "azure" ? "border-cyan-500" : ""}`}
            onClick={() =>
              setProviderFilter(providerFilter === "azure" ? "all" : "azure")
            }
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-cyan-500" />
                Azure
              </CardDescription>
              <CardTitle className="text-3xl text-cyan-500">
                {providerCounts.azure}
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
                {cloudAssets.filter((a) => a.findingCount > 0).length}
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
                  <Cloud className="h-5 w-5" />
                  All Cloud Assets
                </CardTitle>
                <CardDescription>
                  Manage your cloud infrastructure resources
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
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cloud assets..."
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
                    <SelectItem value="aws">AWS</SelectItem>
                    <SelectItem value="gcp">GCP</SelectItem>
                    <SelectItem value="azure">Azure</SelectItem>
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
                        onClick={() => toast.info("Scanning selected assets...")}
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
                          if (
                            (e.target as HTMLElement).closest('[role="checkbox"]') ||
                            (e.target as HTMLElement).closest("button")
                          ) {
                            return;
                          }
                          setSelectedAsset(row.original);
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
                        No cloud assets found.
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

      {/* Cloud Asset Details Sheet */}
      <Sheet
        open={!!selectedAsset && !editDialogOpen}
        onOpenChange={() => setSelectedAsset(null)}
      >
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
          <VisuallyHidden>
            <SheetTitle>Cloud Asset Details</SheetTitle>
          </VisuallyHidden>
          {selectedAsset && (
            <>
              {/* Header */}
              <div className={`px-6 pt-6 pb-4 bg-gradient-to-br ${
                selectedAsset.metadata.cloudProvider === "aws"
                  ? "from-orange-500/20 via-orange-500/10"
                  : selectedAsset.metadata.cloudProvider === "gcp"
                  ? "from-blue-500/20 via-blue-500/10"
                  : "from-cyan-500/20 via-cyan-500/10"
              } to-transparent`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    providerStyles[selectedAsset.metadata.cloudProvider || ""]?.bg || "bg-muted"
                  }`}>
                    {getResourceIcon(selectedAsset.metadata.resourceType)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{selectedAsset.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedAsset.groupName}
                    </p>
                  </div>
                  <StatusBadge status={selectedAsset.status} />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenEdit(selectedAsset)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenConsole(selectedAsset)}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Console
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
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-2 ${
                          providerStyles[selectedAsset.metadata.cloudProvider || ""]?.bg || "bg-muted"
                        }`}>
                          <Cloud className={`h-5 w-5 ${
                            providerStyles[selectedAsset.metadata.cloudProvider || ""]?.icon || ""
                          }`} />
                        </div>
                        <p className="text-xs font-bold uppercase">
                          {selectedAsset.metadata.cloudProvider}
                        </p>
                        <p className="text-xs text-muted-foreground">Provider</p>
                      </div>
                    </div>
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                          <Shield className="h-5 w-5 text-orange-500" />
                        </div>
                        <p className="text-xl font-bold">{selectedAsset.riskScore}</p>
                        <p className="text-xs text-muted-foreground">Risk</p>
                      </div>
                    </div>
                    <div className="rounded-xl border p-4 bg-card">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <p className="text-xl font-bold">{selectedAsset.findingCount}</p>
                        <p className="text-xs text-muted-foreground">Findings</p>
                      </div>
                    </div>
                  </div>

                  {/* Resource Info */}
                  <div className="rounded-xl border p-4 bg-card space-y-3">
                    <h4 className="text-sm font-medium">Resource Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Provider</p>
                        {getProviderBadge(selectedAsset.metadata.cloudProvider)}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Region</p>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedAsset.metadata.region}
                        </span>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Resource Type</p>
                        <Badge variant="outline">
                          {selectedAsset.metadata.resourceType}
                        </Badge>
                      </div>
                    </div>
                    {selectedAsset.description && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">Description</p>
                        <p className="text-sm">{selectedAsset.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                    <div className="rounded-xl border p-4 bg-card">
                      <h4 className="text-sm font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedAsset.tags.map((tag) => (
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
                            {new Date(selectedAsset.firstSeen).toLocaleString()}
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
                            {new Date(selectedAsset.lastSeen).toLocaleString()}
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
                          {selectedAsset.id}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium">Cloud</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Group ID</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {selectedAsset.groupId}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-xl border border-red-500/30 p-4 bg-red-500/5">
                    <h4 className="text-sm font-medium text-red-500 mb-2">Danger Zone</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Permanently delete this cloud asset from your inventory.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setAssetToDelete(selectedAsset);
                        setDeleteDialogOpen(true);
                        setSelectedAsset(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Asset
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Cloud Asset Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Add Cloud Asset
            </DialogTitle>
            <DialogDescription>Add a new cloud resource to your asset inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Resource Name *</Label>
              <Input
                id="name"
                placeholder="e.g., aws-prod-ec2-main"
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
              <Label htmlFor="provider">Cloud Provider *</Label>
              <Select
                value={formData.cloudProvider}
                onValueChange={(value) => handleProviderChange(value as "aws" | "gcp" | "azure")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws">AWS</SelectItem>
                  <SelectItem value="gcp">GCP</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regionsByProvider[formData.cloudProvider]?.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resourceType">Resource Type *</Label>
                <Select
                  value={formData.resourceType}
                  onValueChange={(value) => setFormData({ ...formData, resourceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypesByProvider[formData.cloudProvider]?.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                placeholder="production, critical, database"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAsset}>
              <Plus className="mr-2 h-4 w-4" />
              Add Cloud Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cloud Asset Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Cloud Asset
            </DialogTitle>
            <DialogDescription>Update cloud resource information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Resource Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., aws-prod-ec2-main"
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
              <Label htmlFor="edit-provider">Cloud Provider *</Label>
              <Select
                value={formData.cloudProvider}
                onValueChange={(value) => handleProviderChange(value as "aws" | "gcp" | "azure")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws">AWS</SelectItem>
                  <SelectItem value="gcp">GCP</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-region">Region *</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regionsByProvider[formData.cloudProvider]?.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-resourceType">Resource Type *</Label>
                <Select
                  value={formData.resourceType}
                  onValueChange={(value) => setFormData({ ...formData, resourceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypesByProvider[formData.cloudProvider]?.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                placeholder="production, critical, database"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAsset}>
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
            <AlertDialogTitle>Delete Cloud Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{assetToDelete?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDeleteAsset}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
