"use client";

import { Bot, Scan, Database, Cog, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkerType } from "@/lib/api/worker-types";

interface WorkerTypeIconProps {
  type: WorkerType;
  className?: string;
}

const WORKER_TYPE_ICONS: Record<WorkerType, LucideIcon> = {
  agent: Bot,
  scanner: Scan,
  collector: Database,
  worker: Cog,
};

export function WorkerTypeIcon({ type, className }: WorkerTypeIconProps) {
  const Icon = WORKER_TYPE_ICONS[type] || Cog;
  return <Icon className={cn("h-4 w-4", className)} />;
}

export const WORKER_TYPE_COLORS: Record<WorkerType, string> = {
  agent: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  scanner: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  collector: "bg-green-500/10 text-green-600 border-green-500/30",
  worker: "bg-orange-500/10 text-orange-600 border-orange-500/30",
};

export const WORKER_TYPE_LABELS: Record<WorkerType, string> = {
  agent: "Agent",
  scanner: "Scanner",
  collector: "Collector",
  worker: "Worker",
};
