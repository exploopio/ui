"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Header, Main } from "@/components/layout";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  History,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useNotificationIntegrationsApi,
  useNotificationHistoryApi,
  invalidateNotificationHistoryCache,
} from "@/features/integrations/api/use-integrations-api";
import type {
  NotificationHistoryEntry,
  NotificationHistoryStatus,
} from "@/features/integrations/types/integration.types";

// Status configuration
const STATUS_CONFIG: Record<
  NotificationHistoryStatus,
  { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }
> = {
  success: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    label: "Sent",
  },
  failed: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    label: "Failed",
  },
  pending: {
    icon: Clock,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    label: "Pending",
  },
};

// Severity configuration
const SEVERITY_CONFIG: Record<
  string,
  { icon: typeof AlertCircle; color: string; bgColor: string }
> = {
  critical: {
    icon: AlertCircle,
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  medium: {
    icon: AlertTriangle,
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  low: {
    icon: Info,
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
};

// History item component
function HistoryItem({ entry }: { entry: NotificationHistoryEntry }) {
  const statusConfig = STATUS_CONFIG[entry.status];
  const severityConfig = SEVERITY_CONFIG[entry.severity] || SEVERITY_CONFIG.medium;
  const StatusIcon = statusConfig.icon;
  const SeverityIcon = severityConfig.icon;

  return (
    <div className={cn(
      "flex items-start gap-4 p-4 rounded-lg border transition-colors",
      statusConfig.bgColor
    )}>
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header: Title, Severity, Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{entry.title}</h4>
            {entry.body && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {entry.body}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={cn("text-xs", severityConfig.color, severityConfig.bgColor)}
            >
              <SeverityIcon className="h-3 w-3 mr-1" />
              {entry.severity}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", statusConfig.color)}
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Error message if failed */}
        {entry.status === "failed" && entry.error_message && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded px-2 py-1">
            <span className="font-medium">Error:</span> {entry.error_message}
          </div>
        )}

        {/* Footer: Time, URL, Message ID */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(entry.sent_at), { addSuffix: true })}
          </span>
          {entry.url && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline text-primary"
              >
                View Link
                <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
          {entry.message_id && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <span className="font-mono opacity-60">
                ID: {entry.message_id.length > 12 ? `${entry.message_id.slice(0, 12)}...` : entry.message_id}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// History list component with Load More pagination
const PAGE_SIZE = 20;

function HistoryList({ integrationId }: { integrationId: string }) {
  const [allEntries, setAllEntries] = useState<NotificationHistoryEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, error, isLoading, mutate } = useNotificationHistoryApi(
    integrationId,
    { limit: PAGE_SIZE, offset }
  );

  // Update entries when data changes
  useEffect(() => {
    if (data) {
      setTotal(data.total);
      if (offset === 0) {
        // Initial load or refresh - replace entries
        setAllEntries(data.data);
      } else {
        // Load more - append entries (avoid duplicates)
        setAllEntries((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEntries = data.data.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newEntries];
        });
      }
      setIsLoadingMore(false);
    }
  }, [data, offset]);

  // Reset when integration changes
  useEffect(() => {
    setAllEntries([]);
    setOffset(0);
    setTotal(0);
  }, [integrationId]);

  const handleRefresh = useCallback(async () => {
    setOffset(0);
    setAllEntries([]);
    await invalidateNotificationHistoryCache(integrationId);
    mutate();
    toast.success("History refreshed");
  }, [integrationId, mutate]);

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    setOffset((prev) => prev + PAGE_SIZE);
  }, []);

  if (isLoading && allEntries.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error && allEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-500">Failed to load notification history</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (allEntries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No notifications sent yet</p>
        <p className="text-sm mt-2">
          Send a test notification to see it here
        </p>
      </div>
    );
  }

  // Calculate stats from loaded entries
  const successCount = allEntries.filter((h) => h.status === "success").length;
  const failedCount = allEntries.filter((h) => h.status === "failed").length;
  const hasMore = allEntries.length < total;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Showing: <span className="font-medium text-foreground">{allEntries.length}</span>
            {total > 0 && (
              <span className="text-muted-foreground"> of {total}</span>
            )}
          </span>
          <span className="text-green-600 dark:text-green-400">
            Sent: <span className="font-medium">{successCount}</span>
          </span>
          {failedCount > 0 && (
            <span className="text-red-600 dark:text-red-400">
              Failed: <span className="font-medium">{failedCount}</span>
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* History list */}
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {allEntries.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} />
          ))}

          {/* Load More button */}
          {hasMore && (
            <div className="pt-4 pb-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore || isLoading}
              >
                {isLoadingMore || isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More ({total - allEntries.length} remaining)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("integration") || "";

  const [selectedId, setSelectedId] = useState(initialId);

  const { data: integrationsData, isLoading: loadingIntegrations } =
    useNotificationIntegrationsApi();
  const integrations = integrationsData?.data ?? [];

  // Find selected integration
  const selectedIntegration = integrations.find((i) => i.id === selectedId);

  return (
    <>
      {/* Header row with back button and channel selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2"
            onClick={() => router.push("/settings/integrations/notifications")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-xl font-semibold">Notification History</h1>
          </div>
        </div>

        {/* Channel selector inline */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Channel:</span>
          {loadingIntegrations ? (
            <Skeleton className="h-9 w-[200px]" />
          ) : integrations.length === 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/settings/integrations/notifications")}
            >
              Add Channel
            </Button>
          ) : (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select channel..." />
              </SelectTrigger>
              <SelectContent>
                {integrations.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    <div className="flex items-center gap-2">
                      <span>{i.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {i.provider}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* History Log Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            History Log
            {selectedIntegration && (
              <Badge variant="secondary" className="ml-2 font-normal">
                {selectedIntegration.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedId ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Select a channel to view its notification history</p>
            </div>
          ) : (
            <HistoryList integrationId={selectedId} />
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function NotificationHistoryPage() {
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
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <HistoryContent />
        </Suspense>
      </Main>
    </>
  );
}
