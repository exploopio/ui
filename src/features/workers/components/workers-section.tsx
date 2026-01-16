"use client";

import { useState } from "react";
import { Plus, Bot, AlertCircle, RefreshCw, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { AddWorkerDialog } from "./add-worker-dialog";
import { WorkerCard } from "./worker-card";
import { WorkerTypeIcon } from "./worker-type-icon";
import { useWorkers, invalidateWorkersCache } from "@/lib/api/worker-hooks";
import type { WorkerType, WorkerStatus, WorkerListFilters, Worker } from "@/lib/api/worker-types";
import { WORKER_TYPE_OPTIONS, WORKER_STATUS_OPTIONS } from "../schemas/worker-schema";

interface WorkersSectionProps {
  onWorkerSelect?: (workerId: string | null) => void;
  selectedWorkerId?: string | null;
}

export function WorkersSection({
  onWorkerSelect,
  selectedWorkerId,
}: WorkersSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState<WorkerListFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  const { data: workersData, error, isLoading, mutate } = useWorkers(filters);

  // Get workers array from response
  const workers: Worker[] = workersData?.items ?? [];

  const handleRefresh = async () => {
    await invalidateWorkersCache();
    await mutate();
  };

  const handleTypeFilter = (value: string) => {
    if (value === "all") {
      const { type: _type, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, type: value as WorkerType });
    }
  };

  const handleStatusFilter = (value: string) => {
    if (value === "all") {
      const { status: _status, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, status: value as WorkerStatus });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFilters({ ...filters, search: searchQuery.trim() });
    } else {
      const { search: _search, ...rest } = filters;
      setFilters(rest);
    }
  };

  // Filter workers by search query client-side for instant feedback
  const filteredWorkers = searchQuery
    ? workers.filter(
        (w: Worker) =>
          w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : workers;

  // Compute stats
  const activeCount = workers.filter((w: Worker) => w.status === "active").length;
  const errorCount = workers.filter((w: Worker) => w.status === "error").length;

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Failed to load workers</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : "An unexpected error occurred"}
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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Workers</h2>
              <p className="text-sm text-muted-foreground">
                Manage scanners, agents, and collectors
              </p>
            </div>
            {!isLoading && workers.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {workers.length}
                </Badge>
                {activeCount > 0 && (
                  <Badge variant="outline" className="h-5 px-1.5 text-xs text-green-500 border-green-500/30">
                    {activeCount} active
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="outline" className="h-5 px-1.5 text-xs text-red-500 border-red-500/30">
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
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
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
            <Select
              value={filters.type || "all"}
              onValueChange={handleTypeFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {WORKER_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <WorkerTypeIcon type={option.value as WorkerType} className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status || "all"}
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

        {/* Workers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorkers.map((worker: Worker) => (
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
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Bot className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">No Workers Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || filters.type || filters.status
                ? "No workers match your search criteria. Try adjusting your filters."
                : "Create a worker to start scanning and collecting data."}
            </p>
            {!searchQuery && !filters.type && !filters.status && (
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Worker
              </Button>
            )}
          </div>
        )}
      </div>

      <AddWorkerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleRefresh}
      />
    </>
  );
}
