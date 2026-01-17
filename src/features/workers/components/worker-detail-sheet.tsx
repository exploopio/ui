'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Settings,
  KeyRound,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  AlertTriangle,
  FileCode,
  Server,
  Play,
  Power,
  PowerOff,
} from 'lucide-react';
import Link from 'next/link';

import type { Worker } from '@/lib/api/worker-types';
import { WorkerTypeIcon, WORKER_TYPE_LABELS, WORKER_TYPE_COLORS } from './worker-type-icon';

interface WorkerDetailSheetProps {
  worker: Worker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (worker: Worker) => void;
  onRegenerateKey: (worker: Worker) => void;
  onViewConfig: (worker: Worker) => void;
  onDelete: (worker: Worker) => void;
  onActivate?: (worker: Worker) => void;
  onDeactivate?: (worker: Worker) => void;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  active: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    label: 'Active',
  },
  inactive: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400',
    label: 'Inactive',
  },
  pending: {
    icon: <Clock className="h-3.5 w-3.5" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    label: 'Pending',
  },
  error: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    label: 'Error',
  },
  revoked: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500',
    label: 'Revoked',
  },
};

export function WorkerDetailSheet({
  worker,
  open,
  onOpenChange,
  onEdit,
  onRegenerateKey,
  onViewConfig,
  onDelete,
  onActivate,
  onDeactivate,
}: WorkerDetailSheetProps) {
  if (!worker) return null;

  const status = statusConfig[worker.status] || statusConfig.inactive;
  const isDaemon = worker.execution_mode === 'daemon';

  const gradientClass =
    worker.status === 'active'
      ? 'from-green-500/20 via-green-500/10'
      : worker.status === 'error'
        ? 'from-red-500/20 via-red-500/10'
        : 'from-gray-500/20 via-gray-500/10';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto p-0 sm:max-w-xl">
        <VisuallyHidden>
          <SheetTitle>Worker Details</SheetTitle>
        </VisuallyHidden>

        {/* Header */}
        <div
          className={`bg-gradient-to-br px-6 pb-4 pt-6 ${gradientClass} to-transparent`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${WORKER_TYPE_COLORS[worker.type]}`}
            >
              <WorkerTypeIcon type={worker.type} className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{worker.name}</h2>
              <p className="text-sm text-muted-foreground">
                {worker.description || WORKER_TYPE_LABELS[worker.type]}
              </p>
            </div>
            <Badge className={`${status.bgColor} text-white gap-1`}>
              {status.icon}
              {status.label}
            </Badge>
          </div>

          {/* Execution Mode Badge */}
          <div className="mb-4 flex items-center gap-2">
            {isDaemon ? (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                <Server className="mr-1 h-3 w-3" />
                Daemon Mode
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
                <Play className="mr-1 h-3 w-3" />
                Standalone Mode
              </Badge>
            )}
            <Badge variant="outline">{WORKER_TYPE_LABELS[worker.type]}</Badge>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => onEdit(worker)}>
              <Settings className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onViewConfig(worker)}>
              <FileCode className="mr-2 h-4 w-4" />
              View Config
            </Button>
            <Button size="sm" variant="outline" onClick={() => onRegenerateKey(worker)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Regenerate Key
            </Button>
            {(worker.status === 'inactive' || worker.status === 'revoked') && onActivate && (
              <Button
                size="sm"
                variant="outline"
                className="border-green-500/30 text-green-500 hover:bg-green-500/10"
                onClick={() => onActivate(worker)}
              >
                <Power className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
            {worker.status === 'active' && onDeactivate && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                onClick={() => onDeactivate(worker)}
              >
                <PowerOff className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
            )}
            {isDaemon && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/runners">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View in Agents
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="overview" className="px-6 pb-6">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-card p-4 text-center">
                <Activity className="mx-auto mb-2 h-5 w-5 text-blue-500" />
                <p className="text-2xl font-bold">{worker.total_scans.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Scans</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <AlertTriangle
                  className={`mx-auto mb-2 h-5 w-5 ${
                    worker.total_findings > 0 ? 'text-amber-500' : 'text-muted-foreground'
                  }`}
                />
                <p className="text-2xl font-bold">
                  {worker.total_findings.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Findings</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <AlertCircle
                  className={`mx-auto mb-2 h-5 w-5 ${
                    worker.error_count > 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}
                />
                <p className="text-2xl font-bold">{worker.error_count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>

            {/* Tools */}
            {worker.tools.length > 0 && (
              <div className="rounded-xl border bg-card p-4">
                <h4 className="mb-2 text-sm font-medium">Tools</h4>
                <div className="flex flex-wrap gap-1">
                  {worker.tools.map((tool) => (
                    <Badge key={tool} variant="secondary">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Labels */}
            {worker.labels && Object.keys(worker.labels).length > 0 && (
              <div className="rounded-xl border bg-card p-4">
                <h4 className="mb-2 text-sm font-medium">Labels</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(worker.labels).map(([key, value]) => (
                    <Badge key={key} variant="outline">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status Message */}
            {worker.status_message && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <h4 className="mb-1 text-sm font-medium text-amber-500">Status Message</h4>
                <p className="text-sm text-muted-foreground">{worker.status_message}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="capabilities" className="mt-0 space-y-4">
            {/* Capabilities */}
            <div className="rounded-xl border bg-card p-4">
              <h4 className="mb-3 text-sm font-medium">Capabilities</h4>
              {worker.capabilities.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {worker.capabilities.map((cap) => (
                    <div
                      key={cap}
                      className="flex items-center gap-2 rounded-lg bg-muted/50 p-2"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium uppercase">{cap}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No capabilities configured</p>
              )}
            </div>

            {/* API Key */}
            <div className="rounded-xl border bg-card p-4">
              <h4 className="mb-2 text-sm font-medium">API Key</h4>
              <div className="flex items-center justify-between">
                <code className="rounded bg-muted px-2 py-1 text-xs">
                  {worker.api_key_prefix}...
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRegenerateKey(worker)}
                >
                  <KeyRound className="mr-2 h-3 w-3" />
                  Regenerate
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-0 space-y-4">
            {/* Worker Information */}
            <div className="rounded-xl border bg-card p-4">
              <h4 className="mb-3 text-sm font-medium">Worker Information</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline">{WORKER_TYPE_LABELS[worker.type]}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Execution Mode</span>
                  <span className="text-sm">
                    {worker.execution_mode === 'daemon' ? 'Daemon' : 'Standalone'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="font-mono text-sm">
                    {worker.version || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hostname</span>
                  <span className="text-sm">{worker.hostname || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">IP Address</span>
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    {worker.ip_address || 'N/A'}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Seen</span>
                  <span className="text-sm">
                    {worker.last_seen_at
                      ? new Date(worker.last_seen_at).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {new Date(worker.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <h4 className="mb-2 text-sm font-medium text-red-500">Danger Zone</h4>
              <p className="mb-3 text-xs text-muted-foreground">
                Permanently delete this worker and invalidate its API key.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  onDelete(worker);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Worker
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
