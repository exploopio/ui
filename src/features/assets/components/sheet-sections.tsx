/**
 * Asset Detail Sheet - Helper Section Components
 *
 * Reusable UI sections for asset detail sheets
 */

import * as React from "react";
import { CheckCircle, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Asset, AssetType, ASSET_TYPE_LABELS } from "../types/asset.types";

// ============================================
// Stat Card
// ============================================

interface StatCardProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  className,
}: StatCardProps) {
  return (
    <div className={cn("rounded-xl border p-4 bg-card", className)}>
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Centered variant for website-style stats
export function StatCardCentered({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  className,
}: StatCardProps) {
  return (
    <div className={cn("rounded-xl border p-4 bg-card", className)}>
      <div className="flex flex-col items-center text-center">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-2", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ============================================
// Stats Grid
// ============================================

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3;
  className?: string;
}

export function StatsGrid({ children, columns = 2, className }: StatsGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// Timeline Section
// ============================================

interface TimelineSectionProps {
  firstSeen: string;
  lastSeen: string;
}

export function TimelineSection({ firstSeen, lastSeen }: TimelineSectionProps) {
  return (
    <div className="rounded-xl border p-4 bg-card">
      <h4 className="text-sm font-medium mb-3">Timeline</h4>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium">First Seen</p>
            <p className="text-xs text-muted-foreground">
              {new Date(firstSeen).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Last Seen</p>
            <p className="text-xs text-muted-foreground">
              {new Date(lastSeen).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Technical Details Section
// ============================================

interface TechnicalDetailsSectionProps {
  id: string;
  type: AssetType;
  groupId?: string; // Optional - asset can be ungrouped
}

export function TechnicalDetailsSection({ id, type, groupId }: TechnicalDetailsSectionProps) {
  const typeLabels: Record<AssetType, string> = {
    domain: "Domain",
    website: "Website",
    service: "Service",
    repository: "Repository",
    cloud: "Cloud Resource",
    credential: "Credential",
    host: "Host",
    container: "Container",
    database: "Database",
    mobile: "Mobile App",
    api: "API",
  };

  return (
    <div className="rounded-xl border p-4 bg-card">
      <h4 className="text-sm font-medium mb-3">Technical Details</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">ID</span>
          <code className="text-xs bg-muted px-2 py-1 rounded">{id}</code>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Type</span>
          <span className="font-medium">{typeLabels[type]}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Group</span>
          {groupId ? (
            <code className="text-xs bg-muted px-2 py-1 rounded">{groupId}</code>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Ungrouped
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Danger Zone Section
// ============================================

interface DangerZoneSectionProps {
  onDelete: () => void;
  assetTypeName: string;
}

export function DangerZoneSection({ onDelete, assetTypeName }: DangerZoneSectionProps) {
  return (
    <div className="rounded-xl border border-red-500/30 p-4 bg-red-500/5">
      <h4 className="text-sm font-medium text-red-500 mb-2">Danger Zone</h4>
      <p className="text-xs text-muted-foreground mb-3">
        Permanently delete this {assetTypeName.toLowerCase()} from your inventory.
      </p>
      <Button
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={onDelete}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete {assetTypeName}
      </Button>
    </div>
  );
}

// ============================================
// Metadata Grid
// ============================================

interface MetadataGridProps {
  children: React.ReactNode;
  columns?: 1 | 2;
  className?: string;
}

export function MetadataGrid({ children, columns = 2, className }: MetadataGridProps) {
  return (
    <div className={cn("rounded-xl border p-4 bg-card", className)}>
      <div
        className={cn(
          "grid gap-4 text-sm",
          columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================
// Metadata Row
// ============================================

interface MetadataRowProps {
  label: string;
  value?: string | number | null;
  children?: React.ReactNode;
  colSpan?: 1 | 2;
}

export function MetadataRow({ label, value, children, colSpan }: MetadataRowProps) {
  if (!value && !children) return null;

  return (
    <div className={colSpan === 2 ? "sm:col-span-2" : undefined}>
      <p className="text-muted-foreground">{label}</p>
      {children || <p className="font-medium">{value}</p>}
    </div>
  );
}

// ============================================
// Tags Section
// ============================================

interface TagsSectionProps {
  tags?: string[];
  className?: string;
}

export function TagsSection({ tags, className }: TagsSectionProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn("rounded-xl border p-4 bg-card", className)}>
      <h4 className="text-sm font-medium mb-2">Tags</h4>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Section Title
// ============================================

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h4 className={cn("text-sm font-medium mb-2", className)}>{children}</h4>
  );
}
