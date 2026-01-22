"use client";

import { useState, useMemo } from "react";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { PageHeader } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  History,
  Search as SearchIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShieldAlert,
  ShieldX,
  User,
  Users,
  Settings,
  Key,
  Mail,
  Building,
  Calendar,
  Activity,
  Loader2,
} from "lucide-react";
import {
  useAuditLogs,
  useAuditStats,
  type AuditLog,
  type AuditLogFilters,
  type AuditResult,
  type AuditSeverity,
  RESULT_DISPLAY,
  SEVERITY_DISPLAY,
  formatAction,
  getActionCategory,
} from "@/features/organization";
import { Permission, useHasPermission } from "@/lib/permissions";

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

const getActionIcon = (action: string) => {
  const category = getActionCategory(action);
  switch (category) {
    case "user":
      return User;
    case "member":
      return Users;
    case "invitation":
      return Mail;
    case "tenant":
      return Building;
    case "settings":
      return Settings;
    case "auth":
      return Key;
    case "permission":
      return ShieldAlert;
    default:
      return Activity;
  }
};

const getResultIcon = (result: AuditResult) => {
  switch (result) {
    case "success":
      return CheckCircle;
    case "failure":
      return XCircle;
    case "denied":
      return ShieldAlert;
    default:
      return AlertCircle;
  }
};

export default function AuditLogPage() {
  // Permission check
  const hasAuditPermission = useHasPermission(Permission.AuditRead);

  // Filters state
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 0,
    per_page: 20,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Build filters with search
  const activeFilters = useMemo(() => ({
    ...filters,
    search: searchTerm || undefined,
  }), [filters, searchTerm]);

  // Fetch data (tenant is extracted from JWT token by backend)
  // Only fetch if user has permission
  const { logs, total, page, totalPages, isLoading, isError, mutate } = useAuditLogs(
    hasAuditPermission ? activeFilters : undefined
  );
  const { stats, isLoading: statsLoading } = useAuditStats();

  // Access denied page
  if (!hasAuditPermission) {
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
              <ShieldX className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You don&apos;t have permission to view audit logs. Please contact your administrator to request access.
            </p>
          </div>
        </Main>
      </>
    );
  }

  // Filter options
  const resultOptions: AuditResult[] = ["success", "failure", "denied"];
  const severityOptions: AuditSeverity[] = ["info", "low", "medium", "high", "critical"];

  // Active filters count
  const activeFiltersCount = [
    filters.result?.length,
    filters.severity?.length,
    filters.action?.length,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ page: 0, per_page: 20 });
    setSearchTerm("");
  };

  // Pagination
  const goToPage = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
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
          title="Audit Log"
          description="View activity history and security events"
        >
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Total Events (7 days)
              </CardDescription>
              <CardTitle className="text-3xl">
                {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.total_logs ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Successful
              </CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.logs_by_result?.success ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Failed
              </CardDescription>
              <CardTitle className="text-3xl text-red-500">
                {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.logs_by_result?.failure ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-500" />
                Denied
              </CardDescription>
              <CardTitle className="text-3xl text-orange-500">
                {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.logs_by_result?.denied ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Audit Log Table */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Activity History</CardTitle>
                <CardDescription>
                  {total} events found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by actor, action, resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Result Filter */}
                <Select
                  value={filters.result?.[0] || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      result: value === "all" ? undefined : [value as AuditResult],
                      page: 0
                    })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    {resultOptions.map((result) => (
                      <SelectItem key={result} value={result}>
                        {RESULT_DISPLAY[result].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Severity Filter */}
                <Select
                  value={filters.severity?.[0] || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      severity: value === "all" ? undefined : [value as AuditSeverity],
                      page: 0
                    })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    {severityOptions.map((severity) => (
                      <SelectItem key={severity} value={severity}>
                        {SEVERITY_DISPLAY[severity].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error State */}
            {isError && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="h-12 w-12 text-red-400" />
                <p className="text-muted-foreground">Failed to load audit logs</p>
                <Button variant="outline" onClick={() => mutate()}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Table */}
            {!isLoading && !isError && (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Time</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead className="w-[100px]">Result</TableHead>
                        <TableHead className="w-[100px]">Severity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => {
                          const ActionIcon = getActionIcon(log.action);
                          const ResultIcon = getResultIcon(log.result);
                          const resultDisplay = RESULT_DISPLAY[log.result];
                          const severityDisplay = SEVERITY_DISPLAY[log.severity];

                          return (
                            <TableRow
                              key={log.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedLog(log)}
                            >
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {formatRelativeTime(log.timestamp)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(log.timestamp)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-xs">
                                      {log.actor_email?.substring(0, 2).toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm truncate max-w-[150px]">
                                    {log.actor_email || "System"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap items-center gap-2">
                                  <ActionIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{formatAction(log.action)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-sm">{log.resource_name || log.resource_id}</span>
                                  <span className="text-xs text-muted-foreground">{log.resource_type}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${resultDisplay.bgColor} ${resultDisplay.color} border-0 gap-1`}>
                                  <ResultIcon className="h-3 w-3" />
                                  {resultDisplay.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${severityDisplay.bgColor} ${severityDisplay.color} border-0`}>
                                  {severityDisplay.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {logs.length} of {total} events
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(0)}
                      disabled={page === 0}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page + 1} of {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Main>

      {/* Audit Log Detail Sheet */}
      <Sheet open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <VisuallyHidden>
            <SheetTitle>Audit Log Details</SheetTitle>
          </VisuallyHidden>
          {selectedLog && (
            <>
              {/* Header */}
              <div className={`-mx-6 -mt-6 px-6 py-6 ${
                selectedLog.result === "success" ? "bg-gradient-to-r from-green-500/20 to-green-500/5" :
                selectedLog.result === "failure" ? "bg-gradient-to-r from-red-500/20 to-red-500/5" :
                "bg-gradient-to-r from-orange-500/20 to-orange-500/5"
              }`}>
                <SheetHeader className="text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${RESULT_DISPLAY[selectedLog.result].bgColor} ${RESULT_DISPLAY[selectedLog.result].color} border-0`}>
                      {RESULT_DISPLAY[selectedLog.result].label}
                    </Badge>
                    <Badge className={`${SEVERITY_DISPLAY[selectedLog.severity].bgColor} ${SEVERITY_DISPLAY[selectedLog.severity].color} border-0`}>
                      {SEVERITY_DISPLAY[selectedLog.severity].label}
                    </Badge>
                  </div>
                  <h2 className="text-lg font-semibold">{formatAction(selectedLog.action)}</h2>
                  <p className="text-sm text-muted-foreground">{selectedLog.message}</p>
                </SheetHeader>
              </div>

              <div className="space-y-6 mt-6">
                {/* Actor Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Actor</h4>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {selectedLog.actor_email?.substring(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedLog.actor_email || "System"}</p>
                      {selectedLog.actor_ip && (
                        <p className="text-xs text-muted-foreground">IP: {selectedLog.actor_ip}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resource Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Resource</h4>
                  <div className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant="outline">{selectedLog.resource_type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ID</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{selectedLog.resource_id}</code>
                    </div>
                    {selectedLog.resource_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="text-sm font-medium">{selectedLog.resource_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Timestamp</h4>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{formatDate(selectedLog.timestamp)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(selectedLog.timestamp)}</p>
                    </div>
                  </div>
                </div>

                {/* Changes */}
                {selectedLog.changes?.field_changes && Object.keys(selectedLog.changes.field_changes).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Changes</h4>
                    <div className="p-3 rounded-lg border space-y-2">
                      {Object.entries(selectedLog.changes.field_changes).map(([field, change]) => (
                        <div key={field} className="text-sm">
                          <span className="font-medium">{field}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded line-through">
                              {String(change.old)}
                            </code>
                            <span className="text-muted-foreground">→</span>
                            <code className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                              {String(change.new)}
                            </code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Metadata</h4>
                    <div className="p-3 rounded-lg border">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Request ID */}
                {selectedLog.request_id && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Request ID</h4>
                    <code className="block text-xs bg-muted px-3 py-2 rounded overflow-x-auto">
                      {selectedLog.request_id}
                    </code>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
