'use client';

import { useState, useMemo, useCallback } from 'react';
import { SortingState } from '@tanstack/react-table';
import {
  Plus,
  Bot,
  AlertCircle,
  RefreshCw,
  Loader2,
  Search,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Zap,
  Server,
  Play,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { AddWorkerDialog } from './add-worker-dialog';
import { EditWorkerDialog } from './edit-worker-dialog';
import { RegenerateKeyDialog } from './regenerate-key-dialog';
import { WorkerConfigDialog } from './worker-config-dialog';
import { WorkerDetailSheet } from './worker-detail-sheet';
import { UnifiedWorkerTable } from './unified-worker-table';
import {
  useWorkers,
  useDeleteWorker,
  useBulkDeleteWorkers,
  useActivateWorker,
  useDeactivateWorker,
  invalidateWorkersCache,
} from '@/lib/api/worker-hooks';
import type { WorkerListFilters, Worker } from '@/lib/api/worker-types';

type TabFilter = 'all' | 'daemon' | 'standalone' | 'collector';

interface UnifiedWorkerStats {
  total: number;
  online: number;
  offline: number;
  error: number;
  activeJobs: number;
  byMode: {
    daemon: number;
    standalone: number;
  };
  byType: {
    collector: number;
  };
}

// Calculate online status from last_seen_at (within 5 minutes)
function isWorkerOnline(worker: Worker): boolean {
  if (worker.status !== 'active') return false;
  if (!worker.last_seen_at) return false;
  const lastSeen = new Date(worker.last_seen_at);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const fiveMinutes = 5 * 60 * 1000;
  return diffMs <= fiveMinutes;
}

// Get mock metrics for a worker (until backend supports)
function getWorkerMetrics(worker: Worker) {
  if (worker.status !== 'active' || !isWorkerOnline(worker)) {
    return { cpu: 0, memory: 0, activeJobs: 0 };
  }
  // Generate consistent mock data based on worker id
  const hash = worker.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return {
    cpu: (hash % 60) + 20,
    memory: (hash % 50) + 30,
    activeJobs: (hash % 5) + 1,
  };
}

function calculateStats(workers: Worker[]): UnifiedWorkerStats {
  const daemonWorkers = workers.filter((w) => w.execution_mode === 'daemon');
  const onlineWorkers = workers.filter(isWorkerOnline);

  // Calculate total active jobs from online daemon workers
  const totalActiveJobs = daemonWorkers
    .filter(isWorkerOnline)
    .reduce((sum, w) => sum + getWorkerMetrics(w).activeJobs, 0);

  return {
    total: workers.length,
    online: onlineWorkers.length,
    offline: workers.filter((w) => w.status === 'active' && !isWorkerOnline(w)).length +
             workers.filter((w) => w.status === 'inactive').length,
    error: workers.filter((w) => w.status === 'error').length,
    activeJobs: totalActiveJobs,
    byMode: {
      daemon: daemonWorkers.length,
      standalone: workers.filter((w) => w.execution_mode === 'standalone').length,
    },
    byType: {
      collector: workers.filter((w) => w.type === 'collector').length,
    },
  };
}

export function UnifiedWorkersSection() {
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [regenerateKeyDialogOpen, setRegenerateKeyDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Selected worker for dialogs
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // View and filter states
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [_filters] = useState<WorkerListFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // API data
  const { data: workersData, error, isLoading, mutate } = useWorkers(_filters);
  const workers: Worker[] = useMemo(() => workersData?.items ?? [], [workersData?.items]);

  // Mutations
  const { trigger: deleteWorker, isMutating: isDeleting } = useDeleteWorker(
    selectedWorker?.id || ''
  );
  const { trigger: bulkDeleteWorkers, isMutating: isBulkDeleting } = useBulkDeleteWorkers();
  const { trigger: activateWorker } = useActivateWorker(selectedWorker?.id || '');
  const { trigger: deactivateWorker } = useDeactivateWorker(selectedWorker?.id || '');

  // Calculate stats
  const stats = useMemo(() => calculateStats(workers), [workers]);

  // Filter workers based on tab and search
  const filteredWorkers = useMemo(() => {
    let result = [...workers];

    // Filter by tab
    if (activeTab === 'daemon') {
      result = result.filter((w) => w.execution_mode === 'daemon');
    } else if (activeTab === 'standalone') {
      result = result.filter((w) => w.execution_mode === 'standalone');
    } else if (activeTab === 'collector') {
      result = result.filter((w) => w.type === 'collector');
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.description?.toLowerCase().includes(query) ||
          w.hostname?.toLowerCase().includes(query) ||
          w.ip_address?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [workers, activeTab, searchQuery]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    await invalidateWorkersCache();
    await mutate();
    toast.success('Workers refreshed');
  }, [mutate]);

  const handleViewWorker = useCallback((worker: Worker) => {
    setSelectedWorker(worker);
    setDetailSheetOpen(true);
  }, []);

  const handleEditWorker = useCallback((worker: Worker) => {
    setSelectedWorker(worker);
    setDetailSheetOpen(false);
    setEditDialogOpen(true);
  }, []);

  const handleRegenerateKey = useCallback((worker: Worker) => {
    setSelectedWorker(worker);
    setDetailSheetOpen(false);
    setRegenerateKeyDialogOpen(true);
  }, []);

  const handleViewConfig = useCallback((worker: Worker) => {
    setSelectedWorker(worker);
    setDetailSheetOpen(false);
    setConfigDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((worker: Worker) => {
    setSelectedWorker(worker);
    setDetailSheetOpen(false);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedWorker) return;
    try {
      await deleteWorker();
      toast.success(`Worker "${selectedWorker.name}" deleted`);
      await invalidateWorkersCache();
      setDeleteDialogOpen(false);
      setSelectedWorker(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete worker');
    }
  }, [selectedWorker, deleteWorker]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    const selectedIds = Object.keys(rowSelection).filter((key) => rowSelection[key]);
    if (selectedIds.length === 0) return;

    try {
      const results = await bulkDeleteWorkers(selectedIds);
      const successCount = results?.filter((r) => r.success).length || 0;
      const failCount = results?.filter((r) => !r.success).length || 0;

      if (failCount === 0) {
        toast.success(`${successCount} worker(s) deleted successfully`);
      } else if (successCount > 0) {
        toast.warning(`${successCount} deleted, ${failCount} failed`);
      } else {
        toast.error('Failed to delete workers');
      }

      await invalidateWorkersCache();
      setBulkDeleteDialogOpen(false);
      setRowSelection({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete workers');
    }
  }, [rowSelection, bulkDeleteWorkers]);

  const handleActivateWorker = useCallback(async (worker: Worker) => {
    setSelectedWorker(worker);
    try {
      await activateWorker();
      toast.success(`Worker "${worker.name}" activated`);
      await invalidateWorkersCache();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate worker');
    }
  }, [activateWorker]);

  const handleDeactivateWorker = useCallback(async (worker: Worker) => {
    setSelectedWorker(worker);
    try {
      await deactivateWorker();
      toast.success(`Worker "${worker.name}" deactivated`);
      await invalidateWorkersCache();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate worker');
    }
  }, [deactivateWorker]);

  const handleExport = useCallback(() => {
    const csv = [
      ['Name', 'Type', 'Status', 'Mode', 'Scans', 'Findings', 'Last Seen'].join(','),
      ...workers.map((w) =>
        [
          w.name,
          w.type,
          w.status,
          w.execution_mode,
          w.total_scans,
          w.total_findings,
          w.last_seen_at || 'Never',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workers.csv';
    link.click();
    toast.success('Workers exported');
  }, [workers]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Failed to load workers</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        {!isLoading && workers.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="cursor-default">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Total Workers
                </CardDescription>
                <CardTitle className="text-2xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-green-500/50" onClick={() => setActiveTab('daemon')}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Online
                </CardDescription>
                <CardTitle className="text-2xl text-green-500">{stats.online}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="cursor-default">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-400" />
                  Offline
                </CardDescription>
                <CardTitle className="text-2xl text-gray-400">{stats.offline}</CardTitle>
              </CardHeader>
            </Card>

            <Card className={`cursor-default ${stats.error > 0 ? 'border-red-500/30' : ''}`}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Error
                </CardDescription>
                <CardTitle className={`text-2xl ${stats.error > 0 ? 'text-red-500' : ''}`}>
                  {stats.error}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="cursor-default">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Active Jobs
                </CardDescription>
                <CardTitle className="text-2xl text-yellow-500">{stats.activeJobs}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Main Content Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Workers</CardTitle>
                  <CardDescription>
                    {stats.total} workers - {stats.activeJobs} active jobs
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Worker
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as TabFilter)}
              className="mb-4"
            >
              <TabsList>
                <TabsTrigger value="all">
                  All Workers
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {stats.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="daemon" className="gap-1.5">
                  <Server className="h-3.5 w-3.5" />
                  Daemon
                  {stats.byMode.daemon > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-blue-500/10 text-blue-500">
                      {stats.byMode.daemon}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="standalone" className="gap-1.5">
                  <Play className="h-3.5 w-3.5" />
                  CI/CD
                  {stats.byMode.standalone > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-purple-500/10 text-purple-500">
                      {stats.byMode.standalone}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="collector" className="gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  Collectors
                  {stats.byType.collector > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-orange-500/10 text-orange-500">
                      {stats.byType.collector}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search workers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Bulk Actions */}
              {Object.keys(rowSelection).filter((k) => rowSelection[k]).length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {Object.keys(rowSelection).filter((k) => rowSelection[k]).length} selected
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => setBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredWorkers.length > 0 ? (
              <UnifiedWorkerTable
                workers={filteredWorkers}
                sorting={sorting}
                onSortingChange={setSorting}
                globalFilter={searchQuery}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                onViewWorker={handleViewWorker}
                onEditWorker={handleEditWorker}
                onActivateWorker={handleActivateWorker}
                onDeactivateWorker={handleDeactivateWorker}
                onDeleteWorker={handleDeleteClick}
                onRegenerateKey={handleRegenerateKey}
              />
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Bot className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-1 font-medium">No Workers Found</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {searchQuery
                    ? 'No workers match your search. Try adjusting your search.'
                    : 'Create a worker to start scanning and collecting data.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Worker
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddWorkerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleRefresh}
      />

      {selectedWorker && (
        <>
          <EditWorkerDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            worker={selectedWorker}
          />

          <RegenerateKeyDialog
            open={regenerateKeyDialogOpen}
            onOpenChange={setRegenerateKeyDialogOpen}
            worker={selectedWorker}
          />

          <WorkerConfigDialog
            open={configDialogOpen}
            onOpenChange={setConfigDialogOpen}
            worker={selectedWorker}
          />

          <WorkerDetailSheet
            worker={selectedWorker}
            open={detailSheetOpen}
            onOpenChange={setDetailSheetOpen}
            onEdit={handleEditWorker}
            onRegenerateKey={handleRegenerateKey}
            onViewConfig={handleViewConfig}
            onDelete={handleDeleteClick}
            onActivate={handleActivateWorker}
            onDeactivate={handleDeactivateWorker}
          />
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedWorker?.name}</strong>?
              This action cannot be undone and will invalidate the worker&apos;s API key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Workers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{Object.keys(rowSelection).filter((k) => rowSelection[k]).length}</strong>{' '}
              worker(s)? This action cannot be undone and will invalidate all their API keys.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete All
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
