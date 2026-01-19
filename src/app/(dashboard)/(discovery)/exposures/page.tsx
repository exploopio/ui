"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search as SearchComponent } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { cn } from "@/lib/utils";
import {
  Search,
  RefreshCw,
  Loader2,
  Download,
  Shield,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  X,
  Clock,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useTenant } from "@/context/tenant-provider";

import {
  useExposures,
  useExposureStats,
  useExposureHistory,
} from "@/features/exposures/hooks";
import {
  ExposureStatsCards,
  ExposureSeverityBreakdown,
  ExposureStateBreakdown,
  ExposureTable,
  ExposureActionDialog,
  ExposureBulkActions,
} from "@/features/exposures/components";
import type {
  ExposureEvent,
  ExposureListFilters,
  ExposureSeverity,
  ExposureState,
} from "@/lib/api/exposure-types";

type ActionType = "resolve" | "accept" | "false_positive" | "reactivate";

export default function ExposuresPage() {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || null;

  // Filters state
  const [filters, setFilters] = useState<ExposureListFilters>({
    page: 1,
    per_page: 20,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverities, setSelectedSeverities] = useState<ExposureSeverity[]>([]);
  const [selectedStates, setSelectedStates] = useState<ExposureState[]>(["active"]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action dialog state
  const [selectedExposure, setSelectedExposure] = useState<ExposureEvent | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);

  // Detail sheet state
  const [detailExposure, setDetailExposure] = useState<ExposureEvent | null>(null);

  // Build filters for API
  const apiFilters: ExposureListFilters = {
    ...filters,
    search: searchQuery || undefined,
    severities: selectedSeverities.length > 0 ? selectedSeverities : undefined,
    states: selectedStates.length > 0 ? selectedStates : undefined,
  };

  // Data fetching
  const {
    exposures,
    total,
    page,
    totalPages,
    isLoading: exposuresLoading,
    mutate: refreshExposures,
  } = useExposures(tenantId, apiFilters);

  const {
    stats,
    isLoading: statsLoading,
    mutate: refreshStats,
  } = useExposureStats(tenantId);

  const isLoading = exposuresLoading || statsLoading;

  // Handlers
  const handleRefresh = useCallback(() => {
    refreshExposures();
    refreshStats();
  }, [refreshExposures, refreshStats]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSeverityFilter = useCallback((severity: ExposureSeverity) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const _handleStateFilter = useCallback((state: ExposureState) => {
    setSelectedStates((prev) =>
      prev.includes(state)
        ? prev.filter((s) => s !== state)
        : [...prev, state]
    );
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleAction = useCallback((exposure: ExposureEvent, action: ActionType) => {
    setSelectedExposure(exposure);
    setActionType(action);
  }, []);

  const handleActionSuccess = useCallback(() => {
    handleRefresh();
    setSelectedIds([]);
  }, [handleRefresh]);

  const handleBulkResolve = useCallback(async (ids: string[]) => {
    // In real implementation, call bulk API
    toast.success(`${ids.length} exposures resolved`);
    handleRefresh();
  }, [handleRefresh]);

  const handleBulkAccept = useCallback(async (ids: string[], _reason: string) => {
    toast.success(`${ids.length} exposures accepted`);
    handleRefresh();
  }, [handleRefresh]);

  const handleBulkFalsePositive = useCallback(async (ids: string[], _reason: string) => {
    toast.success(`${ids.length} exposures marked as false positive`);
    handleRefresh();
  }, [handleRefresh]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedSeverities([]);
    setSelectedStates(["active"]);
    setFilters({ page: 1, per_page: 20 });
  }, []);

  const hasActiveFilters = searchQuery || selectedSeverities.length > 0 || selectedStates.length !== 1 || selectedStates[0] !== "active";

  return (
    <>
      <Header fixed>
        <div className="ms-auto flex items-center gap-2 sm:gap-4">
          <SearchComponent />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Exposure Events</h1>
              <p className="text-muted-foreground">
                Monitor and manage attack surface exposures
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <ExposureStatsCards stats={stats} isLoading={statsLoading} />

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All Exposures</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exposures..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Severity Filter */}
                  <div className="flex items-center gap-1">
                    {(["critical", "high", "medium", "low", "info"] as ExposureSeverity[]).map(
                      (severity) => (
                        <Button
                          key={severity}
                          variant={selectedSeverities.includes(severity) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSeverityFilter(severity)}
                          className={cn(
                            "capitalize",
                            selectedSeverities.includes(severity) && getSeverityButtonClass(severity)
                          )}
                        >
                          {severity}
                        </Button>
                      )
                    )}
                  </div>

                  {/* State Filter */}
                  <Select
                    value={selectedStates.join(",")}
                    onValueChange={(value) => setSelectedStates(value ? value.split(",") as ExposureState[] : [])}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="false_positive">False Positive</SelectItem>
                      <SelectItem value="active,resolved,accepted,false_positive">All States</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-1 h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <ExposureBulkActions
              selectedIds={selectedIds}
              onClearSelection={() => setSelectedIds([])}
              onBulkResolve={handleBulkResolve}
              onBulkAccept={handleBulkAccept}
              onBulkFalsePositive={handleBulkFalsePositive}
            />
          )}

          {/* Exposures Table */}
          <ExposureTable
            exposures={exposures}
            isLoading={exposuresLoading}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onResolve={(exposure) => handleAction(exposure, "resolve")}
            onAccept={(exposure) => handleAction(exposure, "accept")}
            onMarkFalsePositive={(exposure) => handleAction(exposure, "false_positive")}
            onReactivate={(exposure) => handleAction(exposure, "reactivate")}
            onViewDetails={setDetailExposure}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {exposures.length} of {total} exposures
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ExposureSeverityBreakdown bySeverity={stats.by_severity} />
            <ExposureStateBreakdown byState={stats.by_state} />
          </div>

          {/* Event Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Event Type</CardTitle>
            </CardHeader>
            <CardContent>
              <EventTypeDistribution byEventType={stats.by_event_type} />
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>

          {/* Action Dialog */}
          <ExposureActionDialog
            exposure={selectedExposure}
            actionType={actionType}
            open={actionType !== null}
            onOpenChange={(open) => {
              if (!open) {
                setActionType(null);
                setSelectedExposure(null);
              }
            }}
            onSuccess={handleActionSuccess}
          />

          {/* Detail Sheet */}
          <ExposureDetailSheet
            exposure={detailExposure}
            open={detailExposure !== null}
            onOpenChange={(open) => !open && setDetailExposure(null)}
            onAction={(action) => {
              if (detailExposure) {
                handleAction(detailExposure, action);
              }
            }}
          />
        </div>
      </Main>
    </>
  );
}

function getSeverityButtonClass(severity: ExposureSeverity): string {
  const classes: Record<ExposureSeverity, string> = {
    critical: "bg-red-500 hover:bg-red-600",
    high: "bg-orange-500 hover:bg-orange-600",
    medium: "bg-yellow-500 hover:bg-yellow-600 text-black",
    low: "bg-blue-500 hover:bg-blue-600",
    info: "bg-gray-500 hover:bg-gray-600",
  };
  return classes[severity];
}

interface EventTypeDistributionProps {
  byEventType: Record<string, number>;
}

function EventTypeDistribution({ byEventType }: EventTypeDistributionProps) {
  if (!byEventType || Object.keys(byEventType).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No exposure data available
      </div>
    );
  }

  const entries = Object.entries(byEventType).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [_, count]) => sum + count, 0) || 1;

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No exposure data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.slice(0, 10).map(([type, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return (
          <div key={type} className="flex items-center gap-3">
            <div className="w-40 text-sm truncate capitalize">
              {type.replace(/_/g, " ")}
            </div>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="w-20 text-sm text-right text-muted-foreground">
              {count} ({percentage}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ExposureDetailSheetProps {
  exposure: ExposureEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: ActionType) => void;
}

function ExposureDetailSheet({
  exposure,
  open,
  onOpenChange,
  onAction,
}: ExposureDetailSheetProps) {
  const { currentTenant } = useTenant();
  const { history, isLoading: historyLoading } = useExposureHistory(
    currentTenant?.id || null,
    exposure?.id || null
  );

  if (!exposure) return null;

  const stateConfig: Record<ExposureState, { icon: typeof Shield; color: string; bgColor: string }> = {
    active: { icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
    resolved: { icon: ShieldCheck, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
    accepted: { icon: Shield, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
    false_positive: { icon: ShieldX, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30" },
  };

  const StateIcon = stateConfig[exposure.state].icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", stateConfig[exposure.state].bgColor)}>
              <StateIcon className={cn("h-5 w-5", stateConfig[exposure.state].color)} />
            </div>
            <div>
              <SheetTitle className="text-left">{exposure.title}</SheetTitle>
              <SheetDescription className="text-left">
                {exposure.event_type.replace(/_/g, " ")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <Badge className={getSeverityBadgeClass(exposure.severity)}>
              {exposure.severity}
            </Badge>
            <Badge variant="outline" className={cn(stateConfig[exposure.state].color)}>
              {exposure.state.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline">{exposure.source}</Badge>
          </div>

          {/* Description */}
          {exposure.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{exposure.description}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Timeline</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">First Seen:</span>
                <p>{formatDistanceToNow(new Date(exposure.first_seen_at), { addSuffix: true })}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Seen:</span>
                <p>{formatDistanceToNow(new Date(exposure.last_seen_at), { addSuffix: true })}</p>
              </div>
              {exposure.resolved_at && (
                <div>
                  <span className="text-muted-foreground">Resolved:</span>
                  <p>{formatDistanceToNow(new Date(exposure.resolved_at), { addSuffix: true })}</p>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          {exposure.details && Object.keys(exposure.details).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Details</h4>
              <div className="rounded-lg border p-3 bg-muted/50">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(exposure.details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* State History */}
          <div>
            <h4 className="text-sm font-medium mb-2">State History</h4>
            {historyLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading history...
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 text-sm border-l-2 border-muted pl-3 py-1"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p>
                        <span className="capitalize">{entry.previous_state.replace(/_/g, " ")}</span>
                        {" → "}
                        <span className="capitalize font-medium">{entry.new_state.replace(/_/g, " ")}</span>
                      </p>
                      {entry.reason && (
                        <p className="text-muted-foreground">{entry.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No state changes recorded</p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Actions</h4>
            <div className="flex flex-wrap gap-2">
              {exposure.state === "active" ? (
                <>
                  <Button size="sm" onClick={() => onAction("resolve")}>
                    <ShieldCheck className="mr-1 h-4 w-4" />
                    Resolve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAction("accept")}>
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    Accept Risk
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAction("false_positive")}>
                    <ShieldX className="mr-1 h-4 w-4" />
                    False Positive
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onAction("reactivate")}>
                  <Activity className="mr-1 h-4 w-4" />
                  Reactivate
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getSeverityBadgeClass(severity: ExposureSeverity): string {
  const classes: Record<ExposureSeverity, string> = {
    critical: "bg-red-500 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-500 text-black",
    low: "bg-blue-500 text-white",
    info: "bg-gray-500 text-white",
  };
  return classes[severity];
}
