"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Trash2,
  KeyRound,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Activity,
  AlertTriangle,
  FileCode,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { WorkerTypeIcon, WORKER_TYPE_COLORS, WORKER_TYPE_LABELS } from "./worker-type-icon";
import { EditWorkerDialog } from "./edit-worker-dialog";
import { RegenerateKeyDialog } from "./regenerate-key-dialog";
import { WorkerConfigDialog } from "./worker-config-dialog";
import type { Worker } from "@/lib/api/worker-types";
import {
  useDeleteWorker,
  useActivateWorker,
  useDeactivateWorker,
  invalidateWorkersCache,
} from "@/lib/api/worker-hooks";

// Status configuration - defined outside component to prevent recreation
const STATUS_CONFIG = {
  active: {
    color: "text-green-500",
    label: "Active",
  },
  inactive: {
    color: "text-gray-400",
    label: "Inactive",
  },
  error: {
    color: "text-red-500",
    label: "Error",
  },
} as const;

// Status icons - factory function to prevent recreation
function getStatusIcon(status: string) {
  switch (status) {
    case "active":
      return <CheckCircle className="h-3.5 w-3.5" />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5" />;
    default:
      return <XCircle className="h-3.5 w-3.5" />;
  }
}

interface WorkerCardProps {
  worker: Worker;
  onSelect?: () => void;
  selected?: boolean;
}

export function WorkerCard({
  worker,
  onSelect,
  selected = false,
}: WorkerCardProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [regenerateKeyDialogOpen, setRegenerateKeyDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const { trigger: deleteWorker, isMutating: isDeleting } = useDeleteWorker(worker.id);
  const { trigger: activateWorker, isMutating: isActivating } = useActivateWorker(worker.id);
  const { trigger: deactivateWorker, isMutating: isDeactivating } = useDeactivateWorker(worker.id);

  const handleActivate = async () => {
    try {
      await activateWorker();
      toast.success(`Worker "${worker.name}" activated`);
      await invalidateWorkersCache();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to activate worker");
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateWorker();
      toast.success(`Worker "${worker.name}" deactivated`);
      await invalidateWorkersCache();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to deactivate worker");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWorker();
      toast.success(`Worker "${worker.name}" deleted`);
      await invalidateWorkersCache();
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete worker");
    }
  };

  // Get status config - memoized to prevent unnecessary calculations
  const status = useMemo(() => {
    const config = STATUS_CONFIG[worker.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.inactive;
    return {
      ...config,
      icon: getStatusIcon(worker.status),
    };
  }, [worker.status]);

  // Format last seen time
  const formatLastSeen = (lastSeenAt?: string) => {
    if (!lastSeenAt) return "Never";
    const date = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <>
      <Card
        className={cn(
          "transition-all cursor-pointer hover:border-primary/50",
          selected && "border-primary ring-1 ring-primary",
          worker.status === "error" && "border-red-500/30"
        )}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  WORKER_TYPE_COLORS[worker.type]
                )}
              >
                <WorkerTypeIcon type={worker.type} className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{worker.name}</CardTitle>
                <CardDescription className="text-xs">
                  {WORKER_TYPE_LABELS[worker.type]}
                  {worker.tools.length > 0 && ` | ${worker.tools.slice(0, 2).join(", ")}${worker.tools.length > 2 ? "..." : ""}`}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setConfigDialogOpen(true)}>
                  <FileCode className="mr-2 h-4 w-4" />
                  View Config
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Worker
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRegenerateKeyDialogOpen(true)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Regenerate API Key
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {worker.status === "inactive" || worker.status === "revoked" ? (
                  <DropdownMenuItem
                    onClick={handleActivate}
                    disabled={isActivating}
                    className="text-green-500"
                  >
                    {isActivating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Power className="mr-2 h-4 w-4" />
                    )}
                    Activate
                  </DropdownMenuItem>
                ) : worker.status === "active" ? (
                  <DropdownMenuItem
                    onClick={handleDeactivate}
                    disabled={isDeactivating}
                    className="text-amber-500"
                  >
                    {isDeactivating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PowerOff className="mr-2 h-4 w-4" />
                    )}
                    Deactivate
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <TooltipProvider>
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn("flex items-center gap-1", status.color)}>
                    {status.icon}
                    {status.label}
                  </span>
                </TooltipTrigger>
                {worker.status === "error" && (
                  <TooltipContent className="max-w-xs">
                    <p className="text-red-400">Worker has encountered errors</p>
                  </TooltipContent>
                )}
              </Tooltip>
              {worker.last_seen_at && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatLastSeen(worker.last_seen_at)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Last seen: {new Date(worker.last_seen_at).toLocaleString()}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {worker.total_scans.toLocaleString()}
                </span>
              </TooltipTrigger>
              <TooltipContent>Total scans</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "flex items-center gap-1 cursor-pointer transition-colors",
                    worker.total_findings > 0
                      ? "text-amber-500 hover:text-amber-400"
                      : "hover:text-foreground"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (worker.total_findings > 0) {
                      router.push(`/findings?source=${worker.id}`);
                    }
                  }}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {worker.total_findings.toLocaleString()}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {worker.total_findings > 0
                  ? "Click to view findings"
                  : "No findings"}
              </TooltipContent>
            </Tooltip>
            {worker.error_count > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="h-3 w-3" />
                    {worker.error_count.toLocaleString()}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Error count</TooltipContent>
              </Tooltip>
            )}
            {worker.capabilities.length > 0 && (
              <Badge variant="secondary" className="text-xs h-5">
                {worker.capabilities.length} capabilities
              </Badge>
            )}
          </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{worker.name}</strong>?
              This action cannot be undone and will invalidate the worker&apos;s API key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditWorkerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        worker={worker}
      />

      <RegenerateKeyDialog
        open={regenerateKeyDialogOpen}
        onOpenChange={setRegenerateKeyDialogOpen}
        worker={worker}
      />

      <WorkerConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        worker={worker}
      />
    </>
  );
}
