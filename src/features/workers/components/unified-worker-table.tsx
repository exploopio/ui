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
  KeyRound,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Power,
  PowerOff,
  Globe,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { Worker } from '@/lib/api/worker-types';
import { WorkerTypeIcon, WORKER_TYPE_LABELS, WORKER_TYPE_COLORS } from './worker-type-icon';

interface UnifiedWorkerTableProps {
  workers: Worker[];
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
  onRegenerateKey: (worker: Worker) => void;
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

export function UnifiedWorkerTable({
  workers,
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
  onRegenerateKey,
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
          return (
            <Badge variant="outline" className={WORKER_TYPE_COLORS[worker.type]}>
              {WORKER_TYPE_LABELS[worker.type]}
            </Badge>
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

    // Add remaining columns
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
        cell: ({ row }) => {
          const worker = row.original;
          const activeJobs = worker.active_jobs || 0;
          return (
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Zap
                className={cn(
                  'h-4 w-4',
                  activeJobs > 0
                    ? 'text-amber-500 fill-amber-500/20'
                    : 'text-gray-400'
                )}
              />
              {activeJobs}
            </span>
          );
        },
      },
      {
        id: 'cpuUsage',
        header: 'CPU',
        cell: ({ row }) => {
          const worker = row.original;
          const cpuPercent = worker.cpu_percent || 0;
          return (
            <div className="flex items-center gap-2 w-24">
              <span className="text-xs w-8">{cpuPercent.toFixed(0)}%</span>
              <Progress value={cpuPercent} className="h-1.5 flex-1" />
            </div>
          );
        },
      },
      {
        id: 'memoryUsage',
        header: 'Memory',
        cell: ({ row }) => {
          const worker = row.original;
          const memoryPercent = worker.memory_percent || 0;
          return (
            <div className="flex items-center gap-2 w-24">
              <span className="text-xs w-8">{memoryPercent.toFixed(0)}%</span>
              <Progress value={memoryPercent} className="h-1.5 flex-1" />
            </div>
          );
        },
      },
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
          const region = worker.region || worker.labels?.region || worker.labels?.env || 'local';
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
                <DropdownMenuItem onClick={() => onRegenerateKey(worker)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Regenerate API Key
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
  }, [onViewWorker, onEditWorker, onActivateWorker, onDeactivateWorker, onDeleteWorker, onRegenerateKey]);

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
