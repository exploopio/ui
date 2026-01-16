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
  agent: "bg-purple-600 text-white",
  scanner: "bg-blue-600 text-white",
  collector: "bg-green-600 text-white",
  worker: "bg-gray-600 text-white",
};

export const WORKER_TYPE_LABELS: Record<WorkerType, string> = {
  agent: "Agent",
  scanner: "Scanner",
  collector: "Collector",
  worker: "Worker",
};
