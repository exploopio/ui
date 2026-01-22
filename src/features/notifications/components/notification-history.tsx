'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useNotificationHistoryApi, invalidateNotificationHistoryCache } from '@/features/integrations/api/use-integrations-api'
import type { NotificationHistoryEntry, NotificationHistoryStatus } from '@/features/integrations/types/integration.types'

interface NotificationHistoryProps {
  integrationId: string
  limit?: number
}

const STATUS_CONFIG: Record<
  NotificationHistoryStatus,
  { icon: typeof CheckCircle2; color: string; label: string }
> = {
  success: {
    icon: CheckCircle2,
    color: 'text-green-500',
    label: 'Sent',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    label: 'Failed',
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    label: 'Pending',
  },
}

const SEVERITY_CONFIG: Record<string, { icon: typeof AlertCircle; color: string; bgColor: string }> = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  low: {
    icon: Info,
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
}

function NotificationHistoryItem({ entry }: { entry: NotificationHistoryEntry }) {
  const statusConfig = STATUS_CONFIG[entry.status]
  const severityConfig = SEVERITY_CONFIG[entry.severity] || SEVERITY_CONFIG.medium
  const StatusIcon = statusConfig.icon
  const SeverityIcon = severityConfig.icon

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title and Severity */}
        <div className="flex items-start gap-2">
          <span className="font-medium text-sm truncate flex-1">{entry.title}</span>
          <Badge
            variant="outline"
            className={cn('text-xs flex-shrink-0', severityConfig.color, severityConfig.bgColor)}
          >
            <SeverityIcon className="h-3 w-3 mr-1" />
            {entry.severity}
          </Badge>
        </div>

        {/* Body preview */}
        {entry.body && (
          <p className="text-xs text-muted-foreground line-clamp-2">{entry.body}</p>
        )}

        {/* Error message if failed */}
        {entry.status === 'failed' && entry.error_message && (
          <p className="text-xs text-red-500 line-clamp-2">
            Error: {entry.error_message}
          </p>
        )}

        {/* Footer: time and URL */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDistanceToNow(new Date(entry.sent_at), { addSuffix: true })}</span>
          {entry.url && (
            <>
              <span>|</span>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline text-primary"
              >
                View Link
                <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
          {entry.message_id && (
            <>
              <span>|</span>
              <span className="font-mono text-xs opacity-60">ID: {entry.message_id.slice(0, 8)}...</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function NotificationHistory({ integrationId, limit = 10 }: NotificationHistoryProps) {
  const { data, error, isLoading, mutate } = useNotificationHistoryApi(integrationId, { limit })

  const handleRefresh = async () => {
    await invalidateNotificationHistoryCache(integrationId)
    mutate()
  }

  const history = data?.data || []

  return (
    <Collapsible defaultOpen={false} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto font-medium">
            <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
            Notification History
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {history.length}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            handleRefresh()
          }}
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
        </Button>
      </div>

      <CollapsibleContent className="space-y-2">
        <div className="border rounded-md">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading history...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">
              Failed to load history
            </div>
          ) : history.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications sent yet
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="p-2">
                {history.map((entry) => (
                  <NotificationHistoryItem key={entry.id} entry={entry} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
