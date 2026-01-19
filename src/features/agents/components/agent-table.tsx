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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Eye,
  Globe,
  MoreHorizontal,
  Pause,
  Pencil,
  Trash2,
  Zap,
} from 'lucide-react';

import type { Agent, AgentStatus } from '../types';
import { AgentStatusBadge } from './agent-status-badge';
import { AgentTypeIcon, AgentTypeBadge } from './agent-type-icon';
import { CpuUsageCell, MemoryUsageCell } from './agent-metrics-display';

interface AgentTableProps {
  agents: Agent[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  globalFilter: string;
  onGlobalFilterChange: (filter: string) => void;
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: (selection: Record<string, boolean>) => void;
  onViewAgent: (agent: Agent) => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agent: Agent) => void;
  onPauseAgent: (agent: Agent) => void;
  onResumeAgent: (agent: Agent) => void;
  onCopyToken: (agent: Agent) => void;
}

export function AgentTable({
  agents,
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  rowSelection,
  onRowSelectionChange,
  onViewAgent,
  onEditAgent,
  onDeleteAgent,
  onPauseAgent,
  onResumeAgent: _onResumeAgent,
  onCopyToken,
}: AgentTableProps) {
  const columns: ColumnDef<Agent>[] = useMemo(
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
            Agent
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const agent = row.original;
          return (
            <div className="flex items-center gap-3">
              <AgentTypeIcon type={agent.deployment_type} />
              <div>
                <p className="font-medium">{agent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {agent.ip_address || 'No IP'}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'deployment_type',
        header: 'Type',
        cell: ({ row }) => (
          <AgentTypeBadge type={row.original.deployment_type} />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status: AgentStatus =
            row.original.status === 'active' ? 'online' : 'offline';
          return <AgentStatusBadge status={status} />;
        },
      },
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
        accessorFn: (row) => row.metrics?.active_jobs ?? 0,
        cell: ({ row }) => {
          const activeJobs = row.original.metrics?.active_jobs ?? 0;
          return (
            <div className="flex items-center gap-2">
              <Zap
                className={`h-4 w-4 shrink-0 ${
                  activeJobs > 0 ? 'text-yellow-500' : 'text-muted-foreground'
                }`}
              />
              <span>{activeJobs}</span>
            </div>
          );
        },
      },
      {
        id: 'cpuUsage',
        header: 'CPU',
        accessorFn: (row) => row.metrics?.cpu_usage ?? 0,
        cell: ({ row }) => (
          <CpuUsageCell value={row.original.metrics?.cpu_usage ?? 0} />
        ),
      },
      {
        id: 'memoryUsage',
        header: 'Memory',
        accessorFn: (row) => row.metrics?.memory_usage ?? 0,
        cell: ({ row }) => (
          <MemoryUsageCell value={row.original.metrics?.memory_usage ?? 0} />
        ),
      },
      {
        accessorKey: 'version',
        header: 'Version',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">
            v{row.original.version || 'unknown'}
          </span>
        ),
      },
      {
        accessorKey: 'region',
        header: 'Region',
        cell: ({ row }) => (
          <span className="flex items-center gap-1 text-sm">
            <Globe className="h-3 w-3 text-muted-foreground" />
            {row.original.region || 'N/A'}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const agent = row.original;
          const status: AgentStatus =
            agent.status === 'active' ? 'online' : 'offline';

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewAgent(agent)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditAgent(agent)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopyToken(agent)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Token
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {status === 'online' && (
                  <DropdownMenuItem onClick={() => onPauseAgent(agent)}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-400"
                  onClick={() => onDeleteAgent(agent)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Agent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onViewAgent, onEditAgent, onDeleteAgent, onPauseAgent, onCopyToken]
  );

  const table = useReactTable({
    data: agents,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(newSorting);
    },
    onGlobalFilterChange: onGlobalFilterChange,
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
                    if (
                      (e.target as HTMLElement).closest('[role="checkbox"]') ||
                      (e.target as HTMLElement).closest('button')
                    ) {
                      return;
                    }
                    onViewAgent(row.original);
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
                  No agents found.
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
