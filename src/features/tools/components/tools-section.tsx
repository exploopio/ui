'use client';

import { useState, useMemo, useCallback } from 'react';
import { SortingState } from '@tanstack/react-table';
import {
  Plus,
  Wrench,
  AlertCircle,
  RefreshCw,
  Loader2,
  Search,
  LayoutGrid,
  TableIcon,
  Download,
  Trash2,
} from 'lucide-react';
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

import { AddToolDialog } from './add-tool-dialog';
import { ToolCard } from './tool-card';
import { ToolTable } from './tool-table';
import { ToolStatsCards } from './tool-stats-cards';
import { ToolDetailSheet } from './tool-detail-sheet';
import { ToolCategoryIcon } from './tool-category-icon';
import { CATEGORY_OPTIONS } from '../schemas/tool-schema';

import {
  useTools,
  useDeleteTool,
  useActivateTool,
  useDeactivateTool,
  invalidateToolsCache,
} from '@/lib/api/tool-hooks';
import type { Tool, ToolCategory, ToolListFilters } from '@/lib/api/tool-types';

type ViewMode = 'grid' | 'table';
type TabFilter = 'all' | ToolCategory;

interface ToolsSectionProps {
  onToolSelect?: (toolId: string | null) => void;
  selectedToolId?: string | null;
}

export function ToolsSection({ onToolSelect, selectedToolId }: ToolsSectionProps) {
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Selected tool for dialogs
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  // View and filter states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [statsFilter, setStatsFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<ToolListFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // API data
  const { data: toolsData, error, isLoading, mutate } = useTools(filters);
  const tools: Tool[] = toolsData?.items ?? [];

  // Delete mutation
  const { trigger: deleteTool, isMutating: isDeleting } = useDeleteTool(
    selectedTool?.id || ''
  );

  // Activate/Deactivate mutations
  const { trigger: activateTool, isMutating: _isActivating } = useActivateTool(
    selectedTool?.id || ''
  );
  const { trigger: deactivateTool, isMutating: _isDeactivating } = useDeactivateTool(
    selectedTool?.id || ''
  );

  // Filter tools based on tab and stats filter
  const filteredTools = useMemo(() => {
    let result = [...tools];

    // Filter by tab (category)
    if (activeTab !== 'all') {
      result = result.filter((t) => t.category === activeTab);
    }

    // Filter by stats card click
    if (statsFilter) {
      const [filterType, filterValue] = statsFilter.split(':');
      if (filterType === 'status') {
        result = result.filter((t) =>
          filterValue === 'active' ? t.is_active : !t.is_active
        );
      } else if (filterType === 'has_update') {
        result = result.filter((t) => t.has_update);
      } else if (filterType === 'type') {
        result = result.filter((t) =>
          filterValue === 'builtin' ? t.is_builtin : !t.is_builtin
        );
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.display_name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tools, activeTab, statsFilter, searchQuery]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    await invalidateToolsCache();
    await mutate();
    toast.success('Tools refreshed');
  }, [mutate]);

  const handleCategoryFilter = useCallback(
    (value: string) => {
      if (value === 'all') {
        const { category: _category, ...rest } = filters;
        setFilters(rest);
      } else {
        setFilters({ ...filters, category: value as ToolCategory });
      }
    },
    [filters]
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const handleViewTool = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    setDetailSheetOpen(true);
  }, []);

  const handleEditTool = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    setDetailSheetOpen(false);
    // TODO: Open edit dialog
    toast.info('Edit tool dialog coming soon');
  }, []);

  const handleDeleteClick = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    setDetailSheetOpen(false);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedTool) return;
    try {
      await deleteTool();
      toast.success(`Tool "${selectedTool.display_name}" deleted`);
      await invalidateToolsCache();
      setDeleteDialogOpen(false);
      setSelectedTool(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete tool');
    }
  }, [selectedTool, deleteTool]);

  const handleActivateTool = useCallback(
    async (tool: Tool) => {
      setSelectedTool(tool);
      try {
        await activateTool();
        toast.success(`Tool "${tool.display_name}" activated`);
        await invalidateToolsCache();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to activate tool');
      }
    },
    [activateTool]
  );

  const handleDeactivateTool = useCallback(
    async (tool: Tool) => {
      setSelectedTool(tool);
      try {
        await deactivateTool();
        toast.success(`Tool "${tool.display_name}" deactivated`);
        await invalidateToolsCache();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to deactivate tool');
      }
    },
    [deactivateTool]
  );

  const handleExport = useCallback(() => {
    const csv = [
      ['Name', 'Display Name', 'Category', 'Install Method', 'Version', 'Active', 'Built-in'].join(','),
      ...tools.map((t) =>
        [
          t.name,
          t.display_name,
          t.category,
          t.install_method,
          t.current_version || '',
          t.is_active ? 'Yes' : 'No',
          t.is_builtin ? 'Yes' : 'No',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tools.csv';
    link.click();
    toast.success('Tools exported');
  }, [tools]);

  // Stats
  const activeCount = tools.filter((t) => t.is_active).length;
  const updateCount = tools.filter((t) => t.has_update).length;

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Failed to load tools</span>
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
        {!isLoading && tools.length > 0 && (
          <ToolStatsCards
            tools={tools}
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
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Tool Registry</CardTitle>
                  <CardDescription>
                    Manage security scanning tools
                  </CardDescription>
                </div>
                {!isLoading && tools.length > 0 && (
                  <div className="ml-2 flex items-center gap-1.5">
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {tools.length}
                    </Badge>
                    {activeCount > 0 && (
                      <Badge
                        variant="outline"
                        className="h-5 border-green-500/30 px-1.5 text-xs text-green-500"
                      >
                        {activeCount} active
                      </Badge>
                    )}
                    {updateCount > 0 && (
                      <Badge
                        variant="outline"
                        className="h-5 border-amber-500/30 px-1.5 text-xs text-amber-500"
                      >
                        {updateCount} updates
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
                  Add Tool
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
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="all">All Tools</TabsTrigger>
                  {CATEGORY_OPTIONS.slice(0, 4).map((cat) => (
                    <TabsTrigger key={cat.value} value={cat.value} className="gap-1.5">
                      <ToolCategoryIcon category={cat.value} className="h-3.5 w-3.5" />
                      {cat.label}
                    </TabsTrigger>
                  ))}
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
            </Tabs>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </form>
              <div className="flex gap-2">
                <Select
                  value={filters.category || 'all'}
                  onValueChange={handleCategoryFilter}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <ToolCategoryIcon
                            category={option.value}
                            className="h-4 w-4"
                          />
                          {option.label}
                        </div>
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
            ) : filteredTools.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      selected={selectedToolId === tool.id}
                      onSelect={() =>
                        onToolSelect?.(selectedToolId === tool.id ? null : tool.id)
                      }
                      onView={handleViewTool}
                      onEdit={handleEditTool}
                      onDelete={handleDeleteClick}
                      onActivate={handleActivateTool}
                      onDeactivate={handleDeactivateTool}
                    />
                  ))}
                </div>
              ) : (
                <ToolTable
                  tools={filteredTools}
                  sorting={sorting}
                  onSortingChange={setSorting}
                  globalFilter={searchQuery}
                  rowSelection={rowSelection}
                  onRowSelectionChange={setRowSelection}
                  onViewTool={handleViewTool}
                  onEditTool={handleEditTool}
                  onDeleteTool={handleDeleteClick}
                  onActivateTool={handleActivateTool}
                  onDeactivateTool={handleDeactivateTool}
                />
              )
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Wrench className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-1 font-medium">No Tools Found</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {searchQuery || filters.category || statsFilter
                    ? 'No tools match your search criteria. Try adjusting your filters.'
                    : 'Add a tool to start scanning and collecting data.'}
                </p>
                {!searchQuery && !filters.category && !statsFilter && (
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Tool
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddToolDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleRefresh}
      />

      {selectedTool && (
        <ToolDetailSheet
          tool={selectedTool}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          onEdit={handleEditTool}
          onDelete={handleDeleteClick}
          onActivate={handleActivateTool}
          onDeactivate={handleDeactivateTool}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedTool?.display_name}</strong>?
              This action cannot be undone.
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
