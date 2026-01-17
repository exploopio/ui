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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  Power,
  PowerOff,
} from 'lucide-react';
import Link from 'next/link';

import type { Worker } from '@/lib/api/worker-types';
import { WorkerTypeIcon, WORKER_TYPE_LABELS } from './worker-type-icon';

interface WorkerTableProps {
  workers: Worker[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  globalFilter: string;
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: (selection: Record<string, boolean>) => void;
  onViewWorker: (worker: Worker) => void;
  onEditWorker: (worker: Worker) => void;
  onRegenerateKey: (worker: Worker) => void;
  onDeleteWorker: (worker: Worker) => void;
  onActivateWorker: (worker: Worker) => void;
  onDeactivateWorker: (worker: Worker) => void;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  active: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    color: 'text-green-500 bg-green-500',
    label: 'Active',
  },
  inactive: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'text-gray-400 bg-gray-400',
    label: 'Inactive',
  },
  pending: {
    icon: <Clock className="h-3.5 w-3.5" />,
    color: 'text-yellow-500 bg-yellow-500',
    label: 'Pending',
  },
  error: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: 'text-red-500 bg-red-500',
    label: 'Error',
  },
  revoked: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'text-gray-500 bg-gray-500',
    label: 'Revoked',
  },
};

export function WorkerTable({
  workers,
  sorting,
  onSortingChange,
  globalFilter,
  rowSelection,
  onRowSelectionChange,
  onViewWorker,
  onEditWorker,
  onRegenerateKey,
  onDeleteWorker,
  onActivateWorker,
  onDeactivateWorker,
}: WorkerTableProps) {
  const columns: ColumnDef<Worker>[] = useMemo(
    () => [
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
                  {worker.description || WORKER_TYPE_LABELS[worker.type]}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="outline">{WORKER_TYPE_LABELS[row.original.type]}</Badge>
        ),
      },
      {
        accessorKey: 'execution_mode',
        header: 'Mode',
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={
              row.original.execution_mode === 'daemon'
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-purple-500/10 text-purple-500'
            }
          >
            {row.original.execution_mode === 'daemon' ? 'Daemon' : 'Standalone'}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const config = statusConfig[row.original.status] || statusConfig.inactive;
          return (
            <Badge className={`${config.color.split(' ')[1]} text-white gap-1`}>
              {config.icon}
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'total_scans',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Scans
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                {row.original.total_scans.toLocaleString()}
              </span>
            </TooltipTrigger>
            <TooltipContent>Total scans completed</TooltipContent>
          </Tooltip>
        ),
      },
      {
        accessorKey: 'total_findings',
        header: 'Findings',
        cell: ({ row }) => (
          <span
            className={
              row.original.total_findings > 0 ? 'text-amber-500' : 'text-muted-foreground'
            }
          >
            {row.original.total_findings.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'last_seen_at',
        header: 'Last Seen',
        cell: ({ row }) => {
          const lastSeen = row.original.last_seen_at;
          if (!lastSeen) return <span className="text-muted-foreground">Never</span>;

          const date = new Date(lastSeen);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);

          let display: string;
          if (diffMins < 1) display = 'Just now';
          else if (diffMins < 60) display = `${diffMins}m ago`;
          else if (diffMins < 1440) display = `${Math.floor(diffMins / 60)}h ago`;
          else display = `${Math.floor(diffMins / 1440)}d ago`;

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground">{display}</span>
              </TooltipTrigger>
              <TooltipContent>{date.toLocaleString()}</TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const worker = row.original;
          const isDaemon = worker.execution_mode === 'daemon';

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
                  Regenerate Key
                </DropdownMenuItem>
                {isDaemon && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/runners" className="flex items-center">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View in Agents
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
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
      },
    ],
    [onViewWorker, onEditWorker, onRegenerateKey, onDeleteWorker, onActivateWorker, onDeactivateWorker]
  );

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
    <TooltipProvider>
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
    </TooltipProvider>
  );
}
