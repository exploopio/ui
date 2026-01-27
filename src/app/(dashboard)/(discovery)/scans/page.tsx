'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Main } from '@/components/layout'
import { PageHeader, StatusBadge } from '@/features/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { toast } from 'sonner'
import {
  Plus,
  SearchIcon,
  Filter,
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  XCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Radar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  Target,
  Shield,
  Calendar,
  Layers,
  Copy,
  Tag,
  Settings,
  Cloud,
  Server,
} from 'lucide-react'
import { Can, Permission } from '@/lib/permissions'
import { useScanConfigs, useScanConfigStats } from '@/lib/api/scan-hooks'
// Note: useAssetGroups can be imported when CreateConfigDialog is implemented
// import { useAssetGroups } from "@/lib/api/security-hooks";
import {
  SCAN_TYPE_LABELS,
  SCHEDULE_TYPE_LABELS,
  SCAN_CONFIG_STATUS_LABELS,
} from '@/lib/api/scan-types'
import type { ScanConfig, ScanConfigStatus, ScanType as ApiScanType } from '@/lib/api/scan-types'
// Mock data for Runs tab
import { mockScans, getScanStats } from '@/features/scans/lib/mock-data'
import { SCAN_TYPE_CONFIG, AGENT_TYPE_CONFIG } from '@/features/scans/types'
import { PlatformUsageCard } from '@/features/scans/components'
import type { Scan, ScanType as MockScanType } from '@/features/scans/types'

// ============================================
// CONFIGURATIONS TAB TYPES
// ============================================

type ConfigStatusFilter = ScanConfigStatus | 'all'
type ConfigTypeFilter = ApiScanType | 'all'

const configStatusFilters: { value: ConfigStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'disabled', label: 'Disabled' },
]

const configTypeFilters: { value: ConfigTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'single', label: 'Single Scanner' },
]

// ============================================
// RUNS TAB TYPES
// ============================================

type RunStatusFilter = 'all' | 'active' | 'completed' | 'pending' | 'failed'
type RunTypeFilter = MockScanType | 'all'

const runStatusFilters: { value: RunStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

const runTypeFilters: { value: RunTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'full', label: 'Full Scan' },
  { value: 'quick', label: 'Quick Scan' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'custom', label: 'Custom' },
]

// ============================================
// UTILS
// ============================================

function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ScansPage() {
  const [mainTab, setMainTab] = useState<'configurations' | 'runs'>('configurations')
  const [_dialogOpen, setDialogOpen] = useState(false)

  // Mock stats for Runs tab (computed once)
  const mockStats = useMemo(() => getScanStats(), [])

  return (
    <>
      <Main>
        <PageHeader
          title="Scan Management"
          description={
            mainTab === 'configurations'
              ? 'Manage scheduled and recurring scan configurations'
              : `${mockStats.totalScans} runs - ${mockStats.activeScans} active`
          }
        >
          <Can permission={Permission.ScansWrite} mode="disable">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {mainTab === 'configurations' ? 'New Configuration' : 'New Scan'}
            </Button>
          </Can>
        </PageHeader>

        {/* Main Tabs: Configurations vs Runs */}
        <Tabs
          value={mainTab}
          onValueChange={(v) => setMainTab(v as 'configurations' | 'runs')}
          className="mt-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="configurations" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurations
            </TabsTrigger>
            <TabsTrigger value="runs" className="gap-2">
              <Play className="h-4 w-4" />
              Runs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configurations" className="mt-6">
            <ConfigurationsTab />
          </TabsContent>

          <TabsContent value="runs" className="mt-6">
            <RunsTab />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

// ============================================
// CONFIG ACTIONS CELL (simplified - no hooks to prevent re-renders)
// ============================================

interface ConfigActionsCellProps {
  config: ScanConfig
  onViewDetails: (config: ScanConfig) => void
  onAction: (action: 'trigger' | 'pause' | 'activate' | 'delete', config: ScanConfig) => void
}

function ConfigActionsCell({ config, onViewDetails, onAction }: ConfigActionsCellProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(config)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('trigger', config)}>
          <Play className="mr-2 h-4 w-4" />
          Trigger Scan
        </DropdownMenuItem>
        {config.status === 'active' && (
          <DropdownMenuItem onClick={() => onAction('pause', config)}>
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </DropdownMenuItem>
        )}
        {config.status === 'paused' && (
          <DropdownMenuItem onClick={() => onAction('activate', config)}>
            <Play className="mr-2 h-4 w-4" />
            Resume
          </DropdownMenuItem>
        )}
        <Can permission={Permission.ScansDelete}>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-400" onClick={() => onAction('delete', config)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================
// CONFIGURATIONS TAB
// ============================================

function ConfigurationsTab() {
  const [selectedConfig, setSelectedConfig] = useState<ScanConfig | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<ConfigStatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<ConfigTypeFilter>('all')
  const [rowSelection, setRowSelection] = useState({})

  // Memoize filter object to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      scan_type: typeFilter !== 'all' ? typeFilter : undefined,
      search: globalFilter || undefined,
    }),
    [statusFilter, typeFilter, globalFilter]
  )

  // API hooks with stable configuration
  const swrConfig = useMemo(
    () => ({
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
      dedupingInterval: 5000,
    }),
    []
  )

  const { data: configsResponse, isLoading: isLoadingConfigs } = useScanConfigs(filters, swrConfig)
  const { data: stats, isLoading: isLoadingStats } = useScanConfigStats(swrConfig)

  // Memoize configs array with stable reference
  const configs = useMemo((): ScanConfig[] => {
    return configsResponse?.items ?? []
  }, [configsResponse?.items])

  // Status counts from stats - memoized with individual deps
  const statusCounts = useMemo(
    () => ({
      all: stats?.total ?? 0,
      active: stats?.active ?? 0,
      paused: stats?.paused ?? 0,
      disabled: stats?.disabled ?? 0,
    }),
    [stats?.total, stats?.active, stats?.paused, stats?.disabled]
  )

  // Calculate progress for a config - memoized
  const getProgress = useCallback((config: ScanConfig) => {
    if (config.total_runs === 0) return 0
    return Math.round((config.successful_runs / config.total_runs) * 100)
  }, [])

  // Memoized handlers
  const handleViewDetails = useCallback((config: ScanConfig) => {
    setSelectedConfig(config)
  }, [])

  const handleAction = useCallback(
    (action: 'trigger' | 'pause' | 'activate' | 'delete', config: ScanConfig) => {
      // Just show toast for now - actual mutations will be done via direct API call
      toast.success(`Action "${action}" triggered for: ${config.name}`)
      if (action === 'delete') {
        setSelectedConfig(null)
      }
    },
    []
  )

  // Table columns - memoized to prevent infinite re-renders
  const columns: ColumnDef<ScanConfig>[] = useMemo(
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
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.description && (
              <p className="text-muted-foreground max-w-[300px] truncate text-xs">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'scan_type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="outline">{SCAN_TYPE_LABELS[row.original.scan_type]}</Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            status={
              row.original.status === 'active'
                ? 'active'
                : row.original.status === 'paused'
                  ? 'pending'
                  : 'inactive'
            }
          />
        ),
      },
      {
        accessorKey: 'progress',
        header: 'Progress',
        cell: ({ row }) => {
          const progress = getProgress(row.original)
          const isActive = row.original.status === 'active'
          return (
            <div className="flex items-center gap-2">
              <Progress
                value={progress}
                className={`h-2 w-20 shrink-0 ${isActive ? '[&>div]:animate-pulse' : ''}`}
              />
              <span className="text-muted-foreground text-xs w-10 shrink-0">{progress}%</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'total_runs',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Runs
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span className="text-sm">{row.original.total_runs}</span>,
      },
      {
        accessorKey: 'findings',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Results
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const config = row.original
          if (config.total_runs === 0) return <span className="text-muted-foreground">-</span>
          return (
            <div className="flex items-center gap-1">
              {config.successful_runs > 0 && (
                <Badge className="bg-green-500 px-1 text-xs">{config.successful_runs}</Badge>
              )}
              {config.failed_runs > 0 && (
                <Badge className="bg-red-500 px-1 text-xs">{config.failed_runs}</Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'schedule_type',
        header: 'Schedule',
        cell: ({ row }) => (
          <span className="text-sm">{SCHEDULE_TYPE_LABELS[row.original.schedule_type]}</span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <ConfigActionsCell
            config={row.original}
            onViewDetails={handleViewDetails}
            onAction={handleAction}
          />
        ),
      },
    ],
    [getProgress, handleViewDetails, handleAction]
  )

  const table = useReactTable({
    data: configs,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Active filters count
  const activeFiltersCount = [statusFilter !== 'all', typeFilter !== 'all'].filter(Boolean).length

  const clearFilters = () => {
    setStatusFilter('all')
    setTypeFilter('all')
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {isLoadingStats ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setStatusFilter('all')}
            >
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Radar className="h-4 w-4" />
                  Total Configs
                </CardDescription>
                <CardTitle className="text-3xl">{statusCounts.all}</CardTitle>
              </CardHeader>
            </Card>
            <Card
              className={`cursor-pointer hover:border-blue-500 transition-colors ${statusFilter === 'active' ? 'border-blue-500' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Active
                </CardDescription>
                <CardTitle className="text-3xl text-blue-500">{statusCounts.active}</CardTitle>
              </CardHeader>
            </Card>
            <Card
              className={`cursor-pointer hover:border-yellow-500 transition-colors ${statusFilter === 'paused' ? 'border-yellow-500' : ''}`}
              onClick={() => setStatusFilter('paused')}
            >
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Pause className="h-4 w-4 text-yellow-500" />
                  Paused
                </CardDescription>
                <CardTitle className="text-3xl text-yellow-500">{statusCounts.paused}</CardTitle>
              </CardHeader>
            </Card>
            <Card
              className={`cursor-pointer hover:border-gray-500 transition-colors ${statusFilter === 'disabled' ? 'border-gray-500' : ''}`}
              onClick={() => setStatusFilter('disabled')}
            >
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-500" />
                  Disabled
                </CardDescription>
                <CardTitle className="text-3xl text-gray-500">{statusCounts.disabled}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Total Runs
                </CardDescription>
                <CardTitle className="text-3xl">
                  {configs.reduce((sum, c) => sum + c.total_runs, 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      {/* Table Card */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scan Configurations</CardTitle>
              <CardDescription>Manage scheduled and recurring scans</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Filter Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ConfigStatusFilter)}
            className="mb-4"
          >
            <TabsList>
              {configStatusFilters.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value} className="gap-1.5">
                  {filter.label}
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {statusCounts[filter.value as keyof typeof statusCounts]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search configurations..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 sm:w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filters</h4>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-muted-foreground hover:text-foreground"
                          onClick={clearFilters}
                        >
                          Clear all
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase">Scan Type</Label>
                      <div className="flex flex-wrap gap-2">
                        {configTypeFilters.map((filter) => (
                          <Badge
                            key={filter.value}
                            variant={typeFilter === filter.value ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => setTypeFilter(filter.value)}
                          >
                            {filter.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {Object.keys(rowSelection).length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {Object.keys(rowSelection).length} selected
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.success('Triggered selected scans')}>
                      <Play className="mr-2 h-4 w-4" />
                      Trigger Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.success('Paused selected scans')}>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-400"
                      onClick={() => toast.success('Deleted selected scans')}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {typeFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Type: {configTypeFilters.find((f) => f.value === typeFilter)?.label}
                  <button
                    onClick={() => setTypeFilter('all')}
                    className="ml-1 hover:text-foreground"
                  >
                    x
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoadingConfigs ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
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
                          return
                        }
                        setSelectedConfig(row.original)
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
                      No configurations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
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
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
        </CardContent>
      </Card>

      {/* Config Details Sheet */}
      <Sheet open={!!selectedConfig} onOpenChange={() => setSelectedConfig(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
          <VisuallyHidden>
            <SheetTitle>Configuration Details</SheetTitle>
          </VisuallyHidden>
          {selectedConfig && (
            <ConfigDetailSheet config={selectedConfig} onClose={() => setSelectedConfig(null)} />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

// ============================================
// CONFIG DETAIL SHEET
// ============================================

interface ConfigDetailSheetProps {
  config: ScanConfig
  onClose: () => void
}

function ConfigDetailSheet({ config, onClose }: ConfigDetailSheetProps) {
  const [isTriggering, setIsTriggering] = useState(false)

  // Calculate progress
  const progress = useMemo(() => {
    if (config.total_runs === 0) return 0
    return Math.round((config.successful_runs / config.total_runs) * 100)
  }, [config.total_runs, config.successful_runs])

  // Simplified action handlers - just show toast
  const handleTriggerScan = () => {
    setIsTriggering(true)
    setTimeout(() => {
      toast.success(`Scan triggered: ${config.name}`)
      setIsTriggering(false)
    }, 500)
  }

  const handlePauseConfig = () => {
    toast.success(`Paused: ${config.name}`)
  }

  const handleActivateConfig = () => {
    toast.success(`Activated: ${config.name}`)
  }

  const handleDeleteConfig = () => {
    toast.success(`Deleted: ${config.name}`)
    onClose()
  }

  return (
    <>
      {/* Hero Header */}
      <div
        className={`px-6 pt-6 pb-4 ${config.status === 'active'
            ? 'bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent'
            : config.status === 'paused'
              ? 'bg-gradient-to-br from-yellow-500/20 via-yellow-500/10 to-transparent'
              : 'bg-gradient-to-br from-gray-500/20 via-gray-500/10 to-transparent'
          }`}
      >
        {/* Status & Type Row */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="font-medium">
            {SCAN_TYPE_LABELS[config.scan_type]}
          </Badge>
          <StatusBadge
            status={
              config.status === 'active'
                ? 'active'
                : config.status === 'paused'
                  ? 'pending'
                  : 'inactive'
            }
          />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-1">{config.name}</h2>
        {config.description && (
          <p className="text-sm text-muted-foreground">{config.description}</p>
        )}

        {/* Progress Bar */}
        <div className="mt-4 p-4 rounded-xl bg-background/80 backdrop-blur border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Success Rate</span>
            <span
              className={`text-2xl font-bold ${progress >= 80
                  ? 'text-green-500'
                  : progress >= 50
                    ? 'text-yellow-500'
                    : progress === 0
                      ? 'text-muted-foreground'
                      : 'text-red-500'
                }`}
            >
              {progress}%
            </span>
          </div>
          <Progress
            value={progress}
            className={`h-3 ${config.status === 'active'
                ? '[&>div]:animate-pulse [&>div]:bg-blue-500'
                : progress >= 80
                  ? '[&>div]:bg-green-500'
                  : progress >= 50
                    ? '[&>div]:bg-yellow-500'
                    : '[&>div]:bg-red-500'
              }`}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{config.total_runs} total runs</span>
            <span>{SCAN_CONFIG_STATUS_LABELS[config.status]}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          {config.status === 'active' && (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleTriggerScan}
                disabled={isTriggering}
              >
                {isTriggering ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Trigger
              </Button>
              <Button size="sm" variant="secondary" className="flex-1" onClick={handlePauseConfig}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            </>
          )}
          {config.status === 'paused' && (
            <>
              <Button size="sm" className="flex-1" onClick={handleActivateConfig}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={handleTriggerScan}
                disabled={isTriggering}
              >
                {isTriggering ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Trigger
              </Button>
            </>
          )}
          {config.status === 'disabled' && (
            <Button size="sm" className="flex-1" onClick={handleActivateConfig}>
              <Play className="mr-2 h-4 w-4" />
              Enable
            </Button>
          )}
        </div>
      </div>

      {/* Content with Tabs */}
      <Tabs defaultValue="overview" className="px-6 pb-6">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-4 bg-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{config.total_runs}</p>
                  <p className="text-xs text-muted-foreground">Total Runs</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{config.successful_runs}</p>
                  <p className="text-xs text-muted-foreground">Successful</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Breakdown */}
          {config.total_runs > 0 && (
            <div className="rounded-xl border p-4 bg-card">
              <h4 className="text-sm font-medium mb-3">Run Results</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm flex-1">Successful</span>
                  <span className="font-bold text-green-500">{config.successful_runs}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm flex-1">Failed</span>
                  <span className="font-bold text-red-500">{config.failed_runs}</span>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border p-4 bg-card">
            <h4 className="text-sm font-medium mb-3">Timeline</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">{formatDate(config.created_at)}</p>
                </div>
              </div>
              {config.last_run_at && (
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                    <Play className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Last Run</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(config.last_run_at)}
                    </p>
                  </div>
                </div>
              )}
              {config.next_run_at && (
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex items-center justify-center mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Next Scheduled</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(config.next_run_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4 mt-0">
          {/* Scan Type & Schedule */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-4 bg-card">
              <p className="text-xs text-muted-foreground mb-1">Scan Type</p>
              <p className="font-medium">{SCAN_TYPE_LABELS[config.scan_type]}</p>
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <p className="text-xs text-muted-foreground mb-1">Schedule</p>
              <p className="font-medium capitalize">{SCHEDULE_TYPE_LABELS[config.schedule_type]}</p>
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="rounded-xl border p-4 bg-card">
            <h4 className="text-sm font-medium mb-3">Schedule Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Frequency</span>
                </div>
                <span className="text-sm font-medium">
                  {SCHEDULE_TYPE_LABELS[config.schedule_type]}
                </span>
              </div>
              {config.schedule_time && (
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Time</span>
                  </div>
                  <span className="text-sm font-medium">{config.schedule_time}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Timezone</span>
                </div>
                <span className="text-sm font-medium">{config.schedule_timezone}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {config.tags && config.tags.length > 0 && (
            <div className="rounded-xl border p-4 bg-card">
              <h4 className="text-sm font-medium mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {config.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-0">
          {/* Created By */}
          <div className="rounded-xl border p-4 bg-card">
            <h4 className="text-sm font-medium mb-3">Created By</h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{config.created_by || 'System'}</p>
                <p className="text-xs text-muted-foreground">{formatDate(config.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Scan ID */}
          <div className="rounded-xl border p-4 bg-card">
            <h4 className="text-sm font-medium mb-3">Technical Details</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Config ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[150px]">
                    {config.id}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText(config.id)
                      toast.success('ID copied to clipboard')
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Asset Group</span>
                <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[150px]">
                  {config.asset_group_id}
                </code>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <Can permission={Permission.ScansDelete}>
            <div className="rounded-xl border border-red-500/30 p-4 bg-red-500/5">
              <h4 className="text-sm font-medium text-red-500 mb-2">Danger Zone</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Permanently delete this configuration and all associated data.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDeleteConfig}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Configuration
              </Button>
            </div>
          </Can>
        </TabsContent>
      </Tabs>
    </>
  )
}

// ============================================
// RUN ACTIONS CELL (extracted to prevent re-renders)
// ============================================

interface RunActionsCellProps {
  run: Scan
  setSelectedRun: (run: Scan | null) => void
}

function RunActionsCell({ run, setSelectedRun }: RunActionsCellProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setSelectedRun(run)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {run.status === 'active' && (
          <>
            <DropdownMenuItem onClick={() => toast.success(`Paused: ${run.name}`)}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success(`Stopped: ${run.name}`)}>
              <XCircle className="mr-2 h-4 w-4" />
              Stop
            </DropdownMenuItem>
          </>
        )}
        {run.status === 'pending' && (
          <DropdownMenuItem onClick={() => toast.success(`Started: ${run.name}`)}>
            <Play className="mr-2 h-4 w-4" />
            Start Now
          </DropdownMenuItem>
        )}
        {run.status === 'failed' && (
          <DropdownMenuItem onClick={() => toast.success(`Retrying: ${run.name}`)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </DropdownMenuItem>
        )}
        <Can permission={Permission.ScansDelete}>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-400"
            onClick={() => toast.success(`Deleted: ${run.name}`)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================
// RUNS TAB
// ============================================

function RunsTab() {
  const [selectedRun, setSelectedRun] = useState<Scan | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<RunStatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<RunTypeFilter>('all')
  const [rowSelection, setRowSelection] = useState({})

  // Use mock data
  const stats = useMemo(() => getScanStats(), [])
  const scans = useMemo(() => {
    let filtered = [...mockScans]
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter)
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter((s) => s.type === typeFilter)
    }
    if (globalFilter) {
      const search = globalFilter.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search) || s.description?.toLowerCase().includes(search)
      )
    }
    return filtered
  }, [statusFilter, typeFilter, globalFilter])

  // Status counts
  const statusCounts = useMemo(
    () => ({
      all: mockScans.length,
      active: mockScans.filter((s) => s.status === 'active').length,
      completed: mockScans.filter((s) => s.status === 'completed').length,
      pending: mockScans.filter((s) => s.status === 'pending').length,
      failed: mockScans.filter((s) => s.status === 'failed').length,
    }),
    []
  )

  // Table columns - memoized to prevent infinite re-renders
  const columns: ColumnDef<Scan>[] = useMemo(
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
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.description && (
              <p className="text-muted-foreground max-w-[300px] truncate text-xs">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.type === 'full'
                ? 'border-blue-500 text-blue-500'
                : row.original.type === 'quick'
                  ? 'border-green-500 text-green-500'
                  : row.original.type === 'compliance'
                    ? 'border-purple-500 text-purple-500'
                    : 'border-orange-500 text-orange-500'
            }
          >
            {SCAN_TYPE_CONFIG[row.original.type].label}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'progress',
        header: 'Progress',
        cell: ({ row }) => {
          const scan = row.original
          const isActive = scan.status === 'active'
          return (
            <div className="flex items-center gap-2">
              <Progress
                value={scan.progress}
                className={`h-2 w-20 shrink-0 ${isActive ? '[&>div]:animate-pulse' : ''}`}
              />
              <span className="text-muted-foreground text-xs w-10 shrink-0">{scan.progress}%</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'targetCount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Targets
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span className="text-sm">{row.original.targetCount}</span>,
      },
      {
        accessorKey: 'findingsCount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Findings
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const scan = row.original
          if (scan.findingsCount === 0) return <span className="text-muted-foreground">-</span>
          return (
            <div className="flex items-center gap-1">
              {scan.criticalCount > 0 && (
                <Badge className="bg-red-600 px-1.5 text-xs">C {scan.criticalCount}</Badge>
              )}
              {scan.highCount > 0 && (
                <Badge className="bg-orange-500 px-1.5 text-xs">H {scan.highCount}</Badge>
              )}
              {(scan.mediumCount > 0 || scan.lowCount > 0) && (
                <Badge variant="secondary" className="px-1.5 text-xs">
                  +{scan.mediumCount + scan.lowCount}
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'agentType',
        header: 'Agent',
        cell: ({ row }) => {
          const scan = row.original
          const isPlatform = scan.agentType === 'platform'
          const hasPendingQueue = scan.queuePosition !== undefined && scan.status === 'pending'

          if (hasPendingQueue) {
            return (
              <div className="flex items-center gap-1.5">
                <Cloud className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Queue #{scan.queuePosition}</span>
              </div>
            )
          }

          if (!scan.agentType) {
            return <span className="text-muted-foreground text-xs">-</span>
          }

          return (
            <div className="flex items-center gap-1.5">
              {isPlatform ? (
                <Cloud className="h-4 w-4 text-purple-500" />
              ) : (
                <Server className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-xs truncate max-w-[100px]">
                {scan.agentName || AGENT_TYPE_CONFIG[scan.agentType].label}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'createdByName',
        header: 'Created By',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {row.original.createdByName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate max-w-[100px]">{row.original.createdByName}</span>
          </div>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => <RunActionsCell run={row.original} setSelectedRun={setSelectedRun} />,
      },
    ],
    []
  )

  const table = useReactTable({
    data: scans,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Active filters count
  const activeFiltersCount = [statusFilter !== 'all', typeFilter !== 'all'].filter(Boolean).length

  const clearFilters = () => {
    setStatusFilter('all')
    setTypeFilter('all')
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => setStatusFilter('all')}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Radar className="h-4 w-4" />
              Total Runs
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalScans}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer hover:border-blue-500 transition-colors ${statusFilter === 'active' ? 'border-blue-500' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Active
            </CardDescription>
            <CardTitle className="text-3xl text-blue-500">{stats.activeScans}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer hover:border-green-500 transition-colors ${statusFilter === 'completed' ? 'border-green-500' : ''}`}
          onClick={() => setStatusFilter('completed')}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed
            </CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats.completedScans}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer hover:border-red-500 transition-colors ${statusFilter === 'failed' ? 'border-red-500' : ''}`}
          onClick={() => setStatusFilter('failed')}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Failed
            </CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats.failedScans}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Total Findings
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalFindings}</CardTitle>
          </CardHeader>
        </Card>
        <PlatformUsageCard variant="compact" />
      </div>

      {/* Table Card */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scan Runs</CardTitle>
              <CardDescription>Monitor and manage scan executions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Filter Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as RunStatusFilter)}
            className="mb-4"
          >
            <TabsList>
              {runStatusFilters.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value} className="gap-1.5">
                  {filter.label}
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {statusCounts[filter.value as keyof typeof statusCounts]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search runs..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 sm:w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filters</h4>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-muted-foreground hover:text-foreground"
                          onClick={clearFilters}
                        >
                          Clear all
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase">Scan Type</Label>
                      <div className="flex flex-wrap gap-2">
                        {runTypeFilters.map((filter) => (
                          <Badge
                            key={filter.value}
                            variant={typeFilter === filter.value ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => setTypeFilter(filter.value)}
                          >
                            {filter.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {Object.keys(rowSelection).length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {Object.keys(rowSelection).length} selected
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.success('Paused selected scans')}>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.success('Stopped selected scans')}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Stop Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-400"
                      onClick={() => toast.success('Deleted selected scans')}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {typeFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Type: {runTypeFilters.find((f) => f.value === typeFilter)?.label}
                  <button
                    onClick={() => setTypeFilter('all')}
                    className="ml-1 hover:text-foreground"
                  >
                    x
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
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
                          return
                        }
                        setSelectedRun(row.original)
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
                      No runs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
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
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
        </CardContent>
      </Card>

      {/* Run Details Sheet */}
      <Sheet open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
          <VisuallyHidden>
            <SheetTitle>Run Details</SheetTitle>
          </VisuallyHidden>
          {selectedRun && <RunDetailSheet run={selectedRun} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

// ============================================
// RUN DETAIL SHEET
// ============================================

interface RunDetailSheetProps {
  run: Scan
}

function RunDetailSheet({ run }: RunDetailSheetProps) {
  return (
    <>
      {/* Hero Header */}
      <div
        className={`px-6 pt-6 pb-4 ${run.status === 'active'
            ? 'bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent'
            : run.status === 'completed'
              ? 'bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent'
              : run.status === 'pending'
                ? 'bg-gradient-to-br from-yellow-500/20 via-yellow-500/10 to-transparent'
                : 'bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent'
          }`}
      >
        {/* Status & Type Row */}
        <div className="flex items-center justify-between mb-3">
          <Badge
            variant="outline"
            className={
              run.type === 'full'
                ? 'border-blue-500 text-blue-500'
                : run.type === 'quick'
                  ? 'border-green-500 text-green-500'
                  : run.type === 'compliance'
                    ? 'border-purple-500 text-purple-500'
                    : 'border-orange-500 text-orange-500'
            }
          >
            {SCAN_TYPE_CONFIG[run.type].label}
          </Badge>
          <StatusBadge status={run.status} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-1">{run.name}</h2>
        {run.description && <p className="text-sm text-muted-foreground">{run.description}</p>}

        {/* Progress Bar */}
        <div className="mt-4 p-4 rounded-xl bg-background/80 backdrop-blur border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span
              className={`text-2xl font-bold ${run.progress === 100
                  ? 'text-green-500'
                  : run.status === 'failed'
                    ? 'text-red-500'
                    : 'text-blue-500'
                }`}
            >
              {run.progress}%
            </span>
          </div>
          <Progress
            value={run.progress}
            className={`h-3 ${run.status === 'active'
                ? '[&>div]:animate-pulse [&>div]:bg-blue-500'
                : run.progress === 100
                  ? '[&>div]:bg-green-500'
                  : run.status === 'failed'
                    ? '[&>div]:bg-red-500'
                    : '[&>div]:bg-yellow-500'
              }`}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{run.targetCount} targets</span>
            <span>{run.duration ? formatDuration(run.duration) : 'In progress'}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          {run.status === 'active' && (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => toast.success('Paused')}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => toast.success('Stopped')}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}
          {run.status === 'pending' && (
            <Button size="sm" className="flex-1" onClick={() => toast.success('Started')}>
              <Play className="mr-2 h-4 w-4" />
              Start Now
            </Button>
          )}
          {run.status === 'failed' && (
            <Button size="sm" className="flex-1" onClick={() => toast.success('Retrying')}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
          {run.status === 'completed' && (
            <Button size="sm" className="flex-1" onClick={() => toast.success('Viewing report')}>
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
          )}
        </div>
      </div>

      {/* Content with Tabs */}
      <Tabs defaultValue="overview" className="px-6 pb-6">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-4 bg-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{run.targetCount}</p>
                  <p className="text-xs text-muted-foreground">Targets</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{run.findingsCount}</p>
                  <p className="text-xs text-muted-foreground">Findings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Findings Breakdown */}
          {run.findingsCount > 0 && (
            <div className="rounded-xl border p-4 bg-card">
              <h4 className="text-sm font-medium mb-3">Findings by Severity</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-600" />
                  <span className="text-sm flex-1">Critical</span>
                  <span className="font-bold text-red-600">{run.criticalCount}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-sm flex-1">High</span>
                  <span className="font-bold text-orange-500">{run.highCount}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm flex-1">Medium</span>
                  <span className="font-bold text-yellow-500">{run.mediumCount}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm flex-1">Low</span>
                  <span className="font-bold text-blue-500">{run.lowCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border p-4 bg-card">
            <h4 className="text-sm font-medium mb-3">Timeline</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">{formatDate(run.createdAt)}</p>
                </div>
              </div>
              {run.startedAt && (
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                    <Play className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Started</p>
                    <p className="text-xs text-muted-foreground">{formatDate(run.startedAt)}</p>
                  </div>
                </div>
              )}
              {run.completedAt && (
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-xs text-muted-foreground">{formatDate(run.completedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4 mt-0">
          {run.findingsCount > 0 ? (
            <div className="rounded-xl border p-4 bg-card">
              <h4 className="text-sm font-medium mb-3">Findings Summary</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {run.findingsCount} vulnerabilities detected across {run.targetCount} targets.
              </p>
              <Button className="w-full" onClick={() => toast.success('Navigating to findings')}>
                View All Findings
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border p-8 bg-card text-center">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h4 className="font-medium mb-1">No Findings</h4>
              <p className="text-sm text-muted-foreground">
                {run.status === 'completed'
                  ? 'Great news! No vulnerabilities were detected.'
                  : 'Scan is still in progress or has not started yet.'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-0">
          {/* Created By */}
          <div className="rounded-xl border p-4 bg-card">
            <h4 className="text-sm font-medium mb-3">Created By</h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{run.createdByName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{run.createdByName}</p>
                <p className="text-xs text-muted-foreground">{formatDate(run.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Agent Info */}
          <div className="rounded-xl border p-4 bg-card">
            <h4 className="text-sm font-medium mb-3">Agent Information</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preference</span>
                <Badge variant="outline" className="capitalize">
                  {run.agentPreference}
                </Badge>
              </div>
              {run.agentType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Agent Type</span>
                  <div className="flex items-center gap-1.5">
                    {run.agentType === 'platform' ? (
                      <Cloud className="h-4 w-4 text-purple-500" />
                    ) : (
                      <Server className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-sm font-medium">
                      {AGENT_TYPE_CONFIG[run.agentType].label}
                    </span>
                  </div>
                </div>
              )}
              {run.agentName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Agent Name</span>
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {run.agentName}
                  </span>
                </div>
              )}
              {run.queuePosition !== undefined && run.status === 'pending' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Queue Position</span>
                  <Badge className="bg-purple-500">#{run.queuePosition}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Technical Details */}
          <div className="rounded-xl border p-4 bg-card">
            <h4 className="text-sm font-medium mb-3">Technical Details</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Run ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[150px]">
                    {run.id}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText(run.id)
                      toast.success('ID copied to clipboard')
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Intensity</span>
                <Badge variant="outline" className="capitalize">
                  {run.intensity}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Max Concurrent</span>
                <span className="text-sm font-medium">{run.maxConcurrent}</span>
              </div>
              {run.duration && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{formatDuration(run.duration)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <Can permission={Permission.ScansDelete}>
            <div className="rounded-xl border border-red-500/30 p-4 bg-red-500/5">
              <h4 className="text-sm font-medium text-red-500 mb-2">Danger Zone</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Permanently delete this scan run and all associated data.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => toast.success('Deleted')}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Run
              </Button>
            </div>
          </Can>
        </TabsContent>
      </Tabs>
    </>
  )
}
