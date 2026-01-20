# Workers Management UI Guide

> **Last Updated**: January 21, 2026
> **Status**: Production Ready

## Overview

The Workers UI provides a comprehensive interface for managing distributed workers that execute security scans. Workers are agents deployed on tenant infrastructure that poll for commands and execute scanning tasks.

## Component Architecture

```
Workers Page
├── UnifiedWorkersSection (main container)
│   ├── Stats Cards (total, online, offline, error, active jobs)
│   ├── Filter Tabs (All, Daemon, CI/CD, Collectors)
│   ├── Search Input
│   ├── Bulk Actions Dropdown
│   └── UnifiedWorkerTable
│       └── Table rows with actions
│
├── Dialogs
│   ├── AddWorkerDialog (create new worker)
│   ├── EditWorkerDialog (update existing)
│   ├── RegenerateKeyDialog (regenerate API key)
│   ├── WorkerConfigDialog (view config templates)
│   └── AlertDialog (delete confirmation)
│
└── WorkerDetailSheet (side panel)
    ├── Overview Tab (stats, tools)
    ├── Capabilities Tab (capabilities list)
    └── Details Tab (metadata, delete)
```

## File Structure

```
ui/src/features/workers/
├── components/
│   ├── unified-workers-section.tsx  # Main container component
│   ├── unified-worker-table.tsx     # Data table with monitoring
│   ├── add-worker-dialog.tsx        # Create worker form
│   ├── edit-worker-dialog.tsx       # Edit worker form
│   ├── regenerate-key-dialog.tsx    # API key regeneration
│   ├── worker-config-dialog.tsx     # Config template viewer
│   ├── worker-detail-sheet.tsx      # Detail side panel
│   ├── worker-stats-cards.tsx       # Stats cards component
│   ├── worker-type-icon.tsx         # Icon/label utilities
│   └── index.ts                     # Barrel exports
├── schemas/
│   └── worker-schema.ts             # Zod validation schemas
├── hooks/
│   └── use-worker-form-options.ts   # Dynamic form options
└── index.ts                         # Feature barrel export
```

## API Integration

### Hooks (`lib/api/worker-hooks.ts`)

```typescript
// Data fetching
useWorkers(filters?)       // List workers with optional filters
useWorker(workerId)        // Get single worker

// Mutations
useCreateWorker()          // Create new worker
useUpdateWorker(id)        // Update worker
useDeleteWorker(id)        // Delete single worker
useBulkDeleteWorkers()     // Delete multiple workers
useRegenerateWorkerKey(id) // Regenerate API key
useActivateWorker(id)      // Set status to active
useDeactivateWorker(id)    // Set status to inactive

// Cache utilities
invalidateWorkersCache()   // Refresh all workers data
```

### API Endpoints

```
GET    /api/v1/workers                    # List workers
GET    /api/v1/workers/{id}               # Get worker
POST   /api/v1/workers                    # Create worker
PUT    /api/v1/workers/{id}               # Update worker
DELETE /api/v1/workers/{id}               # Delete worker
POST   /api/v1/workers/{id}/regenerate-key  # Regenerate API key
POST   /api/v1/workers/{id}/activate      # Activate worker
POST   /api/v1/workers/{id}/deactivate    # Deactivate worker
```

## Worker Types

| Type | Description | Use Case |
|------|-------------|----------|
| `scanner` | Security scanner | SAST, DAST, SCA scans |
| `agent` | Autonomous agent | Complex multi-step analysis |
| `collector` | Data collector | Cloud inventory, vulnerability feeds |
| `worker` | General worker | Custom automation |

## Execution Modes

| Mode | Description |
|------|-------------|
| `daemon` | Runs continuously, polls for commands |
| `standalone` | One-shot execution (CI/CD pipelines) |

## UI Features

### Stats Cards

Displays real-time statistics:
- **Total Workers**: Count of all workers
- **Online**: Workers with active heartbeat (< 5 minutes)
- **Offline**: Workers without recent heartbeat
- **Error**: Workers in error state
- **Active Jobs**: Currently running commands (daemon workers)

### Filter Tabs

- **All Workers**: Show all workers
- **Daemon**: Filter by `execution_mode = 'daemon'`
- **CI/CD**: Filter by `execution_mode = 'standalone'`
- **Collectors**: Filter by `type = 'collector'`

### Search

Client-side filtering by:
- Worker name
- Description
- Hostname
- IP address

### Bulk Actions

Select multiple workers for batch operations:
- Bulk delete with confirmation dialog
- Selection persists across page changes

### Worker Table Columns

| Column | Description |
|--------|-------------|
| Worker | Name, hostname, icon |
| Type | scanner, agent, collector, worker (with colored badges) |
| Status | online/offline badge based on heartbeat (< 5 min = online) |
| Active Jobs | Current command count with lightning icon (from heartbeat) |
| CPU | Usage percentage with progress bar (from heartbeat) |
| Memory | Usage percentage with progress bar (from heartbeat) |
| Version | Worker agent version |
| Region | Deployment region (from config/env or auto-detected) |
| Actions | Dropdown menu |

**Note:** CPU, Memory, Active Jobs, and Region are collected via worker heartbeat. Workers must be running in daemon mode and have heartbeat enabled to report these metrics.

### Row Actions

- **View Details**: Open detail sheet
- **Edit**: Open edit dialog
- **View Config**: Show configuration templates
- **Regenerate Key**: Generate new API key
- **Activate/Deactivate**: Toggle worker status
- **Delete**: Remove worker

## Add Worker Flow

```
1. Click "Add Worker" button
2. Fill form:
   - Type (required): Scanner, Agent, Collector, Worker
   - Name (required): Display name
   - Description (optional): Purpose description
   - Execution Mode: Standalone or Daemon
   - Capabilities: Security capabilities (Recon, SAST, etc.)
   - Tools: Security tools (Nuclei, Semgrep, etc.)
3. Submit form
4. Success dialog shows:
   - New API key (one-time display)
   - Copy button
   - View Config button
5. Close dialog to refresh list
```

## Config Templates

Worker configuration templates for different deployment methods:

### YAML Config
```yaml
agent:
  name: Worker Name
  region: ap-southeast-1  # Optional: deployment region for monitoring
  enable_commands: true
  command_poll_interval: 30s
  heartbeat_interval: 1m

server:
  base_url: http://api.example.com:8080
  api_key: <YOUR_API_KEY>
  worker_id: <WORKER_UUID>

scanners:
  - name: nuclei
    enabled: true
```

### Environment Variables
```bash
export API_URL=http://api.example.com:8080
export API_KEY=<YOUR_API_KEY>
export WORKER_ID=<WORKER_UUID>
export REGION=ap-southeast-1  # Optional: deployment region
# Auto-detection: AWS_REGION, GOOGLE_CLOUD_REGION, AZURE_REGION
```

### Docker Command
```bash
docker run -d \
  --name worker-name \
  -v /path/to/scan:/code:ro \
  -e API_URL=http://api.example.com:8080 \
  -e API_KEY=<YOUR_API_KEY> \
  -e WORKER_ID=<WORKER_UUID> \
  -e REGION=ap-southeast-1 \
  rediverio/agent:latest \
  -daemon -config /app/agent.yaml
```

### CLI Commands
```bash
# One-shot scan
./agent -tool nuclei -target /path/to/project -push

# Daemon mode
./agent -daemon -config agent.yaml
```

## Environment Configuration

### API URL

The config templates use API URL from:
1. `NEXT_PUBLIC_API_URL` environment variable (preferred)
2. Fallback: Current origin with port 8080

```typescript
// worker-config-dialog.tsx
const baseUrl = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? window.location.origin.replace(/:\d+$/, ":8080")
    : "http://localhost:8080");
```

Set in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Error Handling

### Form Validation

Uses Zod schemas for validation:
```typescript
// worker-schema.ts
export const createWorkerSchema = z.object({
  type: z.enum(["scanner", "agent", "collector", "worker"]),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  execution_mode: z.enum(["standalone", "daemon"]),
  capabilities: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
});
```

### API Errors

Handled by SWR with automatic retry:
- 4xx errors: No retry (client errors)
- 5xx errors: Retry up to 3 times
- Toast notifications for user feedback

## State Management

### Component State

```typescript
// UnifiedWorkersSection
const [addDialogOpen, setAddDialogOpen] = useState(false);
const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
const [activeTab, setActiveTab] = useState<TabFilter>('all');
const [searchQuery, setSearchQuery] = useState('');
const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
```

### Data Fetching

```typescript
// SWR for data fetching
const { data, error, isLoading, mutate } = useWorkers(filters);

// Mutations with SWRMutation
const { trigger: deleteWorker, isMutating } = useDeleteWorker(id);
```

## Best Practices

### 1. Cache Invalidation

Always invalidate cache after mutations:
```typescript
await deleteWorker();
await invalidateWorkersCache();
```

### 2. Optimistic Updates

For immediate UI feedback, use SWR's mutate:
```typescript
mutate(newData, false); // Update cache without revalidation
```

### 3. Error Boundaries

Wrap sections with error handling:
```typescript
if (error) {
  return <ErrorDisplay error={error} onRetry={handleRefresh} />;
}
```

### 4. Loading States

Show skeletons during loading:
```typescript
if (isLoading) {
  return <WorkerTableSkeleton />;
}
```

## Troubleshooting

### Worker Shows Offline

1. Check heartbeat interval (should be < 5 minutes)
2. Verify API key is correct
3. Check network connectivity
4. Review worker logs

### API Key Not Showing

API keys are only displayed once after creation/regeneration.
If lost, regenerate a new key.

### Tools Not Loading in Form

1. Check `/api/v1/tools` endpoint is accessible
2. Verify tenant context is set
3. Check browser console for errors

### Bulk Delete Not Working

1. Ensure workers are selected (checkbox checked)
2. Wait for all delete operations to complete
3. Check for permission errors

## Related Documentation

- [Scan Orchestration](../api/docs/architecture/scan-orchestration.md)
- [Architecture Overview](../api/docs/architecture/overview.md)
- [API Patterns](patterns.md)
