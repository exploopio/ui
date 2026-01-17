'use client';

import { useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Eye,
  Settings,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Power,
  PowerOff,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { Worker } from '@/lib/api/worker-types';
import { WorkerTypeIcon, WORKER_TYPE_LABELS } from './worker-type-icon';

interface UnifiedWorkerTableProps {
  workers: Worker[];
  showMonitoring: boolean; // Show CPU/Memory columns for daemon workers
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  globalFilter: string;
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: (selection: Record<string, boolean>) => void;
  onViewWorker: (worker: Worker) => void;
  onEditWorker: (worker: Worker) => void;
  onActivateWorker: (worker: Worker) => void;
  onDeactivateWorker: (worker: Worker) => void;
  onDeleteWorker: (worker: Worker) => void;
  onCopyToken: (worker: Worker) => void;
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

// Get deployment type from labels or derive from IP
function getDeploymentType(worker: Worker): 'cloud' | 'self-hosted' | 'hybrid' {
  const env = worker.labels?.env?.toLowerCase() || '';
  const ip = worker.ip_address || '';

  if (worker.labels?.deployment_type) {
    return worker.labels.deployment_type as 'cloud' | 'self-hosted' | 'hybrid';
  }

  // Derive from IP address
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return 'self-hosted';
  }
  if (env === 'production' || env === 'prod') {
    return 'cloud';
  }
  return 'self-hosted';
}

const deploymentConfig = {
  cloud: { label: 'Cloud', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  'self-hosted': { label: 'Self-Hosted', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
  hybrid: { label: 'Hybrid', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
};

export function UnifiedWorkerTable({
  workers,
  showMonitoring,
  sorting,
  onSortingChange,
  globalFilter,
  rowSelection,
  onRowSelectionChange,
  onViewWorker,
  onEditWorker,
  onActivateWorker,
  onDeactivateWorker,
  onDeleteWorker,
  onCopyToken,
}: UnifiedWorkerTableProps) {
  const columns: ColumnDef<Worker>[] = useMemo(() => {
    const baseColumns: ColumnDef<Worker>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
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
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Worker
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const worker = row.original;
          return (
            <div className="flex items-center gap-3">
              <WorkerTypeIcon type={worker.type} className="h-5 w-5" />
              <div>
                <p className="font-medium">{worker.name}</p>
                <p className="text-xs text-muted-foreground">
                  {worker.ip_address || worker.hostname || 'No host info'}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const worker = row.original;
          const deployType = getDeploymentType(worker);
          const config = deploymentConfig[deployType];

          return showMonitoring && worker.execution_mode === 'daemon' ? (
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
          ) : (
            <Badge variant="outline">{WORKER_TYPE_LABELS[worker.type]}</Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const worker = row.original;
          const online = isWorkerOnline(worker);

          if (worker.status === 'error') {
            return (
              <Badge className="bg-red-500 text-white gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Error
              </Badge>
            );
          }

          if (worker.status === 'inactive' || worker.status === 'revoked') {
            return (
              <Badge className="bg-gray-500 text-white gap-1">
                <XCircle className="h-3.5 w-3.5" />
                Inactive
              </Badge>
            );
          }

          // For active workers, show online/offline based on heartbeat
          return online ? (
            <Badge className="bg-green-500 text-white gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Online
            </Badge>
          ) : (
            <Badge className="bg-gray-400 text-white gap-1">
              <XCircle className="h-3.5 w-3.5" />
              Offline
            </Badge>
          );
        },
      },
    ];

    // Add monitoring columns for daemon workers
    if (showMonitoring) {
      baseColumns.push(
        {
          id: 'activeJobs',
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              Active Jobs
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          accessorFn: (row) => {
            if (row.execution_mode !== 'daemon') return -1;
            return getWorkerMetrics(row).activeJobs;
          },
          cell: ({ row }) => {
            const worker = row.original;
            if (worker.execution_mode !== 'daemon') {
              return <span className="text-muted-foreground">—</span>;
            }
            const { activeJobs } = getWorkerMetrics(worker);
            return (
              <div className="flex items-center gap-2">
                <Zap
                  className={cn(
                    'h-4 w-4 shrink-0',
                    activeJobs > 0 ? 'text-yellow-500' : 'text-muted-foreground'
                  )}
                />
                <span>{activeJobs}</span>
              </div>
            );
          },
        },
        {
          id: 'cpuUsage',
          header: 'CPU',
          accessorFn: (row) => {
            if (row.execution_mode !== 'daemon') return -1;
            return getWorkerMetrics(row).cpu;
          },
          cell: ({ row }) => {
            const worker = row.original;
            if (worker.execution_mode !== 'daemon') {
              return <span className="text-muted-foreground">—</span>;
            }
            const { cpu } = getWorkerMetrics(worker);
            const online = isWorkerOnline(worker);

            if (!online) {
              return (
                <div className="flex items-center gap-2 w-24">
                  <span className="text-xs text-muted-foreground">0%</span>
                  <Progress value={0} className="h-1.5 flex-1" />
                </div>
              );
            }

            return (
              <div className="flex items-center gap-2 w-24">
                <span className="text-xs w-8">{cpu}%</span>
                <Progress
                  value={cpu}
                  className={cn(
                    'h-1.5 flex-1',
                    cpu > 80 && '[&>div]:bg-red-500',
                    cpu > 60 && cpu <= 80 && '[&>div]:bg-yellow-500'
                  )}
                />
              </div>
            );
          },
        },
        {
          id: 'memoryUsage',
          header: 'Memory',
          accessorFn: (row) => {
            if (row.execution_mode !== 'daemon') return -1;
            return getWorkerMetrics(row).memory;
          },
          cell: ({ row }) => {
            const worker = row.original;
            if (worker.execution_mode !== 'daemon') {
              return <span className="text-muted-foreground">—</span>;
            }
            const { memory } = getWorkerMetrics(worker);
            const online = isWorkerOnline(worker);

            if (!online) {
              return (
                <div className="flex items-center gap-2 w-24">
                  <span className="text-xs text-muted-foreground">0%</span>
                  <Progress value={0} className="h-1.5 flex-1" />
                </div>
              );
            }

            return (
              <div className="flex items-center gap-2 w-24">
                <span className="text-xs w-8">{memory}%</span>
                <Progress
                  value={memory}
                  className={cn(
                    'h-1.5 flex-1',
                    memory > 80 && '[&>div]:bg-red-500',
                    memory > 60 && memory <= 80 && '[&>div]:bg-yellow-500'
                  )}
                />
              </div>
            );
          },
        }
      );
    }

    // Add remaining columns
    baseColumns.push(
      {
        accessorKey: 'version',
        header: 'Version',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">
            {row.original.version ? `v${row.original.version}` : '—'}
          </span>
        ),
      },
      {
        id: 'region',
        header: 'Region',
        cell: ({ row }) => {
          const worker = row.original;
          const region = worker.labels?.region || worker.labels?.env || 'local';
          return (
            <span className="flex items-center gap-1 text-sm">
              <Globe className="h-3 w-3 text-muted-foreground" />
              {region}
            </span>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const worker = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewWorker(worker)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditWorker(worker)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopyToken(worker)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Token
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {worker.status === 'inactive' || worker.status === 'revoked' ? (
                  <DropdownMenuItem
                    onClick={() => onActivateWorker(worker)}
                    className="text-green-500"
                  >
                    <Power className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                ) : worker.status === 'active' ? (
                  <DropdownMenuItem
                    onClick={() => onDeactivateWorker(worker)}
                    className="text-amber-500"
                  >
                    <PowerOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => onDeleteWorker(worker)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      }
    );

    return baseColumns;
  }, [showMonitoring, onViewWorker, onEditWorker, onActivateWorker, onDeactivateWorker, onDeleteWorker, onCopyToken]);

  const table = useReactTable({
    data: workers,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(newSorting);
    },
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      onRowSelectionChange(newSelection);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer"
                  onClick={(e) => {
                    // Don't trigger row click for checkboxes, buttons, menu items, or links
                    if (
                      (e.target as HTMLElement).closest('[role="checkbox"]') ||
                      (e.target as HTMLElement).closest('[role="menuitem"]') ||
                      (e.target as HTMLElement).closest('[data-radix-collection-item]') ||
                      (e.target as HTMLElement).closest('button') ||
                      (e.target as HTMLElement).closest('a')
                    ) {
                      return;
                    }
                    onViewWorker(row.original);
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
                  No workers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected
        </p>
        <div className="flex flex-wrap items-center gap-2">
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
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
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
    </div>
  );
}
