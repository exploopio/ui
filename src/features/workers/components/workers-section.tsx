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
  LayoutGrid,
  TableIcon,
  Download,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { AddWorkerDialog } from './add-worker-dialog';
import { EditWorkerDialog } from './edit-worker-dialog';
import { RegenerateKeyDialog } from './regenerate-key-dialog';
import { WorkerConfigDialog } from './worker-config-dialog';
import { WorkerCard } from './worker-card';
import { WorkerTable } from './worker-table';
import { WorkerStatsCards } from './worker-stats-cards';
import { WorkerDetailSheet } from './worker-detail-sheet';
import { WorkerTypeIcon } from './worker-type-icon';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useWorkers,
  useDeleteWorker,
  useActivateWorker,
  useDeactivateWorker,
  invalidateWorkersCache,
} from '@/lib/api/worker-hooks';
import type { WorkerType, WorkerStatus, WorkerListFilters, Worker } from '@/lib/api/worker-types';
import { WORKER_TYPE_OPTIONS, WORKER_STATUS_OPTIONS } from '../schemas/worker-schema';

type ViewMode = 'grid' | 'table';
type TabFilter = 'all' | 'daemon' | 'standalone' | 'collector';

interface WorkersSectionProps {
  onWorkerSelect?: (workerId: string | null) => void;
  selectedWorkerId?: string | null;
}

export function WorkersSection({
  onWorkerSelect,
  selectedWorkerId,
}: WorkersSectionProps) {
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [regenerateKeyDialogOpen, setRegenerateKeyDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Selected worker for dialogs
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // View and filter states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [statsFilter, setStatsFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<WorkerListFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // API data
  const { data: workersData, error, isLoading, mutate } = useWorkers(filters);
  const workers: Worker[] = workersData?.items ?? [];

  // Delete mutation
  const { trigger: deleteWorker, isMutating: isDeleting } = useDeleteWorker(
    selectedWorker?.id || ''
  );

  // Activate/Deactivate mutations
  const { trigger: activateWorker, isMutating: isActivating } = useActivateWorker(
    selectedWorker?.id || ''
  );
  const { trigger: deactivateWorker, isMutating: isDeactivating } = useDeactivateWorker(
    selectedWorker?.id || ''
  );

  // Filter workers based on tab and stats filter
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

    // Filter by stats card click
    if (statsFilter) {
      const [filterType, filterValue] = statsFilter.split(':');
      if (filterType === 'status') {
        result = result.filter((w) => w.status === filterValue);
      } else if (filterType === 'mode') {
        result = result.filter((w) => w.execution_mode === filterValue);
      } else if (filterType === 'type') {
        result = result.filter((w) => w.type === filterValue);
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [workers, activeTab, statsFilter, searchQuery]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    await invalidateWorkersCache();
    await mutate();
    toast.success('Workers refreshed');
  }, [mutate]);

  const handleTypeFilter = useCallback(
    (value: string) => {
      if (value === 'all') {
        const { type: _type, ...rest } = filters;
        setFilters(rest);
      } else {
        setFilters({ ...filters, type: value as WorkerType });
      }
    },
    [filters]
  );

  const handleStatusFilter = useCallback(
    (value: string) => {
      if (value === 'all') {
        const { status: _status, ...rest } = filters;
        setFilters(rest);
      } else {
        setFilters({ ...filters, status: value as WorkerStatus });
      }
    },
    [filters]
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const handleViewWorker = useCallback((worker: Worker) => {
    setSelectedWorker(worker);
    setDetailSheetOpen(true);
  }, []);

  const handleEditWorker = useCallback((worker: Worker) => {
    setSelectedWorker(worker);
    setDetailSheetOpen(false); // Close detail sheet when opening edit dialog
    setEditDialogOpen(true);
  }, []);

  const handleRegenerateKey = useCallback((worker: Worker) => {
    setSelectedWorker(worker);
    setDetailSheetOpen(false); // Close detail sheet when opening regenerate key dialog
    setRegenerateKeyDialogOpen(true);
  }, []);

  const handleViewConfig = useCallback((worker: Worker) => {
    setSelectedWorker(worker);
    setDetailSheetOpen(false); // Close detail sheet when opening config dialog
    setConfigDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((worker: Worker) => {
    setSelectedWorker(worker);
    setDetailSheetOpen(false); // Close detail sheet when opening delete dialog
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

  // Stats
  const activeCount = workers.filter((w) => w.status === 'active').length;
  const errorCount = workers.filter((w) => w.status === 'error').length;
  const daemonCount = workers.filter((w) => w.execution_mode === 'daemon').length;

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
          <WorkerStatsCards
            workers={workers}
            activeFilter={statsFilter}
            onFilterChange={setStatsFilter}
          />
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
                    Manage scanners, agents, and collectors
                  </CardDescription>
                </div>
                {!isLoading && workers.length > 0 && (
                  <div className="ml-2 flex items-center gap-1.5">
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {workers.length}
                    </Badge>
                    {activeCount > 0 && (
                      <Badge
                        variant="outline"
                        className="h-5 border-green-500/30 px-1.5 text-xs text-green-500"
                      >
                        {activeCount} active
                      </Badge>
                    )}
                    {errorCount > 0 && (
                      <Badge
                        variant="outline"
                        className="h-5 border-red-500/30 px-1.5 text-xs text-red-500"
                      >
                        {errorCount} error
                      </Badge>
                    )}
                  </div>
                )}
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
                  <TabsTrigger value="all">All Workers</TabsTrigger>
                  <TabsTrigger value="daemon" className="gap-1.5">
                    Daemon
                    {daemonCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {daemonCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="standalone">CI/CD</TabsTrigger>
                  <TabsTrigger value="collector">Collectors</TabsTrigger>
                </TabsList>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Daemon Tab Info */}
              {activeTab === 'daemon' && daemonCount > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <p className="text-sm text-blue-500">
                    Daemon workers can be monitored in real-time on the Agents page.
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/runners">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Agents
                    </Link>
                  </Button>
                </div>
              )}
            </Tabs>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search workers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </form>
              <div className="flex gap-2">
                <Select value={filters.type || 'all'} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {WORKER_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <WorkerTypeIcon
                            type={option.value as WorkerType}
                            className="h-4 w-4"
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={handleStatusFilter}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {WORKER_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {Object.keys(rowSelection).length > 0 && (
              <div className="mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {Object.keys(rowSelection).length} selected
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => toast.info('Bulk delete coming soon')}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Content */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredWorkers.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredWorkers.map((worker) => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      selected={selectedWorkerId === worker.id}
                      onSelect={() =>
                        onWorkerSelect?.(
                          selectedWorkerId === worker.id ? null : worker.id
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <WorkerTable
                  workers={filteredWorkers}
                  sorting={sorting}
                  onSortingChange={setSorting}
                  globalFilter={searchQuery}
                  rowSelection={rowSelection}
                  onRowSelectionChange={setRowSelection}
                  onViewWorker={handleViewWorker}
                  onEditWorker={handleEditWorker}
                  onRegenerateKey={handleRegenerateKey}
                  onDeleteWorker={handleDeleteClick}
                  onActivateWorker={handleActivateWorker}
                  onDeactivateWorker={handleDeactivateWorker}
                />
              )
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Bot className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-1 font-medium">No Workers Found</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {searchQuery || filters.type || filters.status || statsFilter
                    ? 'No workers match your search criteria. Try adjusting your filters.'
                    : 'Create a worker to start scanning and collecting data.'}
                </p>
                {!searchQuery && !filters.type && !filters.status && !statsFilter && (
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
              This action cannot be undone and will invalidate the worker&apos;s API
              key.
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
    </>
  );
}
