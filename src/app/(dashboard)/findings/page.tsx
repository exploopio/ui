"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  PageHeader,
  SeverityBadge,
  DataTable,
  DataTableColumnHeader,
} from "@/features/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  RefreshCw,
  MoreHorizontal,
  UserPlus,
  Flag,
  CheckCircle,
  ExternalLink,
  Trash2,
  Copy,
  Link2,
  Plus,
} from "lucide-react";
import {
  mockFindings,
  getFindingStats,
  FindingStatusBadge,
  FindingDetailDrawer,
  FINDING_STATUS_CONFIG,
  SEVERITY_CONFIG,
} from "@/features/findings";
import type { Finding, FindingStatus, FindingUser } from "@/features/findings";
import type { Severity } from "@/features/shared/types";
import { toast } from "sonner";

export default function FindingsPage() {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const stats = getFindingStats();

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Findings refreshed");
    }, 1000);
  };

  const handleExport = (format: string) => {
    toast.success(`Exporting findings as ${format}...`, {
      description: "File will be downloaded shortly",
    });
  };

  const handleBulkAssign = () => {
    toast.success(`Assigning ${selectedCount} findings...`);
    setRowSelection({});
  };

  const handleBulkStatusChange = (status: string) => {
    toast.success(`Updating ${selectedCount} findings to ${status}`);
    setRowSelection({});
  };

  const filterBySeverity = (severity?: Severity) => {
    if (!severity) return mockFindings;
    return mockFindings.filter((f) => f.severity === severity);
  };

  const handleRowClick = (finding: Finding) => {
    setSelectedFinding(finding);
    setDrawerOpen(true);
  };

  const handleStatusChange = (findingId: string, status: FindingStatus) => {
    const statusConfig = FINDING_STATUS_CONFIG[status];
    toast.success(`Status updated to "${statusConfig.label}"`, {
      description: `Finding ${findingId}`,
    });
  };

  const handleSeverityChange = (findingId: string, severity: Severity) => {
    const severityConfig = SEVERITY_CONFIG[severity];
    toast.success(`Severity updated to "${severityConfig.label}"`, {
      description: `Finding ${findingId}`,
    });
  };

  const handleAssigneeChange = (findingId: string, assignee: FindingUser | null) => {
    if (assignee) {
      toast.success(`Assigned to ${assignee.name}`, {
        description: `Finding ${findingId}`,
      });
    } else {
      toast.info("Finding unassigned", {
        description: `Finding ${findingId}`,
      });
    }
  };

  const handleAddComment = (findingId: string, comment: string) => {
    toast.success("Comment added", {
      description: comment.slice(0, 50) + (comment.length > 50 ? "..." : ""),
    });
  };

  const handleRowAction = (action: string, finding: Finding) => {
    switch (action) {
      case "view":
        handleRowClick(finding);
        break;
      case "copy_id":
        navigator.clipboard.writeText(finding.id);
        toast.success("Finding ID copied to clipboard");
        break;
      case "copy_link":
        navigator.clipboard.writeText(`${window.location.origin}/findings/${finding.id}`);
        toast.success("Link copied to clipboard");
        break;
      default:
        toast.info(`Action: ${action}`, { description: finding.title });
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<Finding>[] = useMemo(
    () => [
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
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Title" />
        ),
        cell: ({ row }) => (
          <div
            className="cursor-pointer"
            onClick={() => handleRowClick(row.original)}
          >
            <p className="font-medium">{row.getValue("title")}</p>
            {row.original.cve && (
              <p className="text-muted-foreground text-xs">{row.original.cve}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "severity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Severity" />
        ),
        cell: ({ row }) => <SeverityBadge severity={row.getValue("severity")} />,
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "cvss",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="CVSS" />
        ),
        cell: ({ row }) => (
          <span className="font-mono">{row.getValue("cvss")}</span>
        ),
      },
      {
        id: "asset",
        accessorFn: (row) => row.assets[0]?.name || "-",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Asset" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("asset")}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => <FindingStatusBadge status={row.getValue("status")} />,
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        id: "assignee",
        accessorFn: (row) => row.assignee?.name || "-",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Assignee" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("assignee")}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {new Date(row.getValue("createdAt")).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const finding = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRowAction("view", finding)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRowAction("assign", finding)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRowAction("status", finding)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Change Status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRowAction("copy_id", finding)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRowAction("copy_link", finding)}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-400"
                  onClick={() => handleRowAction("false_positive", finding)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Mark as False Positive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

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
          title="Security Findings"
          description={`${stats.total} total findings - ${stats.overdueCount} overdue`}
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("CSV")}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("JSON")}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("PDF")}>
                  Export as PDF Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Finding
            </Button>
          </div>
        </PageHeader>

        {/* Bulk Actions Bar - Shows when items selected */}
        {selectedCount > 0 && (
          <Card className="mt-4 border-primary">
            <CardContent className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">
                {selectedCount} finding(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkAssign}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Flag className="mr-2 h-4 w-4" />
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("open")}>
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("in_progress")}>
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("resolved")}>
                      Resolved
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("false_positive")}>
                      False Positive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => setRowSelection({})}>
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Critical</CardDescription>
              <CardTitle className="text-3xl text-red-500">
                {stats.bySeverity.critical}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>High</CardDescription>
              <CardTitle className="text-3xl text-orange-500">
                {stats.bySeverity.high}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Medium</CardDescription>
              <CardTitle className="text-3xl text-yellow-500">
                {stats.bySeverity.medium}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Low</CardDescription>
              <CardTitle className="text-3xl text-blue-500">
                {stats.bySeverity.low}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg CVSS</CardDescription>
              <CardTitle className="text-3xl">{stats.averageCvss}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs with DataTable */}
        <Tabs defaultValue="all" className="mt-6">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="critical">
              Critical ({stats.bySeverity.critical})
            </TabsTrigger>
            <TabsTrigger value="high">High ({stats.bySeverity.high})</TabsTrigger>
            <TabsTrigger value="medium">
              Medium ({stats.bySeverity.medium})
            </TabsTrigger>
            <TabsTrigger value="low">Low ({stats.bySeverity.low})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card className="mt-4">
              <CardContent className="pt-6">
                <DataTable
                  columns={columns}
                  data={filterBySeverity()}
                  searchPlaceholder="Search findings..."
                  emptyMessage="No findings found"
                  emptyDescription="No security findings match your search criteria"
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="critical">
            <Card className="mt-4">
              <CardContent className="pt-6">
                <DataTable
                  columns={columns}
                  data={filterBySeverity("critical")}
                  searchPlaceholder="Search critical findings..."
                  emptyMessage="No critical findings"
                  emptyDescription="Great! No critical security findings found"
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="high">
            <Card className="mt-4">
              <CardContent className="pt-6">
                <DataTable
                  columns={columns}
                  data={filterBySeverity("high")}
                  searchPlaceholder="Search high severity findings..."
                  emptyMessage="No high severity findings"
                  emptyDescription="No high severity findings match your criteria"
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="medium">
            <Card className="mt-4">
              <CardContent className="pt-6">
                <DataTable
                  columns={columns}
                  data={filterBySeverity("medium")}
                  searchPlaceholder="Search medium severity findings..."
                  emptyMessage="No medium severity findings"
                  emptyDescription="No medium severity findings match your criteria"
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="low">
            <Card className="mt-4">
              <CardContent className="pt-6">
                <DataTable
                  columns={columns}
                  data={filterBySeverity("low")}
                  searchPlaceholder="Search low severity findings..."
                  emptyMessage="No low severity findings"
                  emptyDescription="No low severity findings match your criteria"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>

      {/* Finding Quick View Drawer */}
      <FindingDetailDrawer
        finding={selectedFinding}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusChange={handleStatusChange}
        onSeverityChange={handleSeverityChange}
        onAssigneeChange={handleAssigneeChange}
        onAddComment={handleAddComment}
      />
    </>
  );
}
