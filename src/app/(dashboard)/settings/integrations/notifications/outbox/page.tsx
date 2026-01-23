'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  Bell,
  RefreshCw,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Inbox,
} from 'lucide-react'
import { toast } from 'sonner'

import { Header, Main } from '@/components/layout'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/features/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Can, Permission } from '@/lib/permissions'

import {
  useNotificationOutboxApi,
  useNotificationOutboxStatsApi,
  useRetryOutboxEntryApi,
  useDeleteOutboxEntryApi,
  invalidateNotificationOutboxCache,
  invalidateNotificationOutboxStatsCache,
} from '@/features/notifications/api/use-notification-outbox-api'
import {
  type OutboxEntry,
  type OutboxStatus,
  OUTBOX_STATUS_CONFIG,
  OUTBOX_SEVERITY_CONFIG,
} from '@/features/notifications/types/notification-outbox.types'

// Status icon mapping
const STATUS_ICONS: Record<OutboxStatus, React.ElementType> = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle,
  failed: XCircle,
  dead: AlertTriangle,
}

export default function NotificationOutboxPage() {
  // State
  const [statusFilter, setStatusFilter] = useState<OutboxStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<OutboxEntry | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Fetch data
  const {
    data: statsData,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useNotificationOutboxStatsApi()
  const {
    data: entriesData,
    isLoading: entriesLoading,
    mutate: mutateEntries,
  } = useNotificationOutboxApi({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: 20,
  })

  // Mutations
  const { trigger: retryEntry, isMutating: isRetrying } = useRetryOutboxEntryApi(
    selectedEntry?.id || ''
  )
  const { trigger: deleteEntry, isMutating: isDeleting } = useDeleteOutboxEntryApi(
    selectedEntry?.id || ''
  )

  const entries = entriesData?.data ?? []
  const stats = statsData ?? {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    dead: 0,
    total: 0,
  }

  // Handlers
  const handleRefresh = async () => {
    await Promise.all([mutateStats(), mutateEntries()])
    toast.success('Data refreshed')
  }

  const handleRetry = async (entry: OutboxEntry) => {
    if (actionInProgress) return
    setActionInProgress(entry.id)
    setSelectedEntry(entry)

    try {
      await retryEntry()
      await invalidateNotificationOutboxCache()
      await invalidateNotificationOutboxStatsCache()
      await Promise.all([mutateStats(), mutateEntries()])
      toast.success('Entry scheduled for retry')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to retry entry')
    } finally {
      setActionInProgress(null)
      setSelectedEntry(null)
    }
  }

  const handleDeleteClick = (entry: OutboxEntry) => {
    setSelectedEntry(entry)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedEntry || actionInProgress) return
    setActionInProgress(selectedEntry.id)

    try {
      await deleteEntry()
      await invalidateNotificationOutboxCache()
      await invalidateNotificationOutboxStatsCache()
      await Promise.all([mutateStats(), mutateEntries()])
      toast.success('Entry deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete entry')
    } finally {
      setActionInProgress(null)
      setSelectedEntry(null)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <Header>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-2 flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings/integrations/notifications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Channels
            </Link>
          </Button>
        </div>

        <PageHeader
          title="Notification Queue"
          description="Monitor and manage your notification delivery queue"
        >
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </CardDescription>
              <CardTitle className="text-3xl">
                {statsLoading ? <Skeleton className="h-9 w-12" /> : stats.pending}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Loader2 className="h-4 w-4" />
                Processing
              </CardDescription>
              <CardTitle className="text-3xl">
                {statsLoading ? <Skeleton className="h-9 w-12" /> : stats.processing}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Completed
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {statsLoading ? <Skeleton className="h-9 w-12" /> : stats.completed}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Failed
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {statsLoading ? <Skeleton className="h-9 w-12" /> : stats.failed}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gray-600" />
                Dead
              </CardDescription>
              <CardTitle className="text-3xl text-gray-600">
                {statsLoading ? <Skeleton className="h-9 w-12" /> : stats.dead}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Total
              </CardDescription>
              <CardTitle className="text-3xl">
                {statsLoading ? <Skeleton className="h-9 w-12" /> : stats.total}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as OutboxStatus | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="dead">Dead</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Entries Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Queue Entries</CardTitle>
            <CardDescription>
              {entriesData?.total ?? 0} entries found
              {statusFilter !== 'all' && ` (filtered by ${statusFilter})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entriesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No entries found</h3>
                <p className="mt-2 text-muted-foreground">
                  {statusFilter !== 'all'
                    ? `No ${statusFilter} entries in the queue`
                    : 'The notification queue is empty'}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Retries</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => {
                        const StatusIcon = STATUS_ICONS[entry.status]
                        const statusConfig = OUTBOX_STATUS_CONFIG[entry.status]
                        const severityConfig = OUTBOX_SEVERITY_CONFIG[entry.severity]
                        const canRetry = entry.status === 'failed' || entry.status === 'dead'

                        return (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{entry.event_type}</span>
                                <span className="text-xs text-muted-foreground">
                                  {entry.aggregate_type}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="max-w-[250px]">
                                      <p className="truncate font-medium">{entry.title}</p>
                                      {entry.body && (
                                        <p className="truncate text-xs text-muted-foreground">
                                          {entry.body}
                                        </p>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[400px]">
                                    <p className="font-medium">{entry.title}</p>
                                    {entry.body && <p className="mt-1 text-sm">{entry.body}</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${severityConfig.bgColor} ${severityConfig.color}`}
                              >
                                {severityConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <StatusIcon
                                  className={`h-4 w-4 ${statusConfig.color} ${
                                    entry.status === 'processing' ? 'animate-spin' : ''
                                  }`}
                                />
                                <Badge
                                  variant="outline"
                                  className={`${statusConfig.bgColor} ${statusConfig.textColor}`}
                                >
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              {entry.last_error && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="mt-1 max-w-[150px] truncate text-xs text-red-600">
                                        {entry.last_error}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[400px]">
                                      <p className="text-sm text-red-600">{entry.last_error}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {entry.retry_count} / {entry.max_retries}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(entry.scheduled_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    disabled={actionInProgress === entry.id}
                                  >
                                    {actionInProgress === entry.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {entry.url && (
                                    <DropdownMenuItem asChild>
                                      <a href={entry.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        View Source
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  <Can permission={Permission.NotificationsWrite}>
                                    {canRetry && (
                                      <DropdownMenuItem
                                        onClick={() => handleRetry(entry)}
                                        disabled={isRetrying}
                                      >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Retry
                                      </DropdownMenuItem>
                                    )}
                                  </Can>
                                  <Can permission={Permission.NotificationsDelete}>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-500"
                                      onClick={() => handleDeleteClick(entry)}
                                      disabled={isDeleting}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </Can>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {entriesData && entriesData.total_pages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {entriesData.page} of {entriesData.total_pages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(entriesData.total_pages, p + 1))}
                        disabled={page === entriesData.total_pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this notification entry? This action cannot be
                undone.
                {selectedEntry && (
                  <span className="mt-2 block font-medium">{selectedEntry.title}</span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </>
  )
}
