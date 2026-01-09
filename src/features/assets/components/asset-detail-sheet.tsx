/**
 * Asset Detail Sheet
 *
 * Reusable sheet component for viewing asset details
 * Supports customization via render props for type-specific content
 */

"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/features/shared";
import { AssetFindings } from "./asset-findings";
import {
  TimelineSection,
  TechnicalDetailsSection,
  DangerZoneSection,
  TagsSection,
} from "./sheet-sections";
import type { Asset, AssetType } from "../types/asset.types";

// ============================================
// Types
// ============================================

interface AssetDetailSheetProps<T extends Asset> {
  /** The asset to display (null when sheet is closed) */
  asset: T | null;

  /** Whether the sheet is open */
  open: boolean;

  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;

  /** Icon component to display in header */
  icon: React.ElementType;

  /** Icon color class (e.g., "text-blue-500") */
  iconColor: string;

  /** Gradient start color class (e.g., "from-blue-500/20") */
  gradientFrom: string;

  /** Gradient via color class (optional, e.g., "via-blue-500/10") */
  gradientVia?: string;

  /** Callback when Edit button is clicked */
  onEdit: () => void;

  /** Callback when Delete is clicked from danger zone */
  onDelete: () => void;

  /** Additional quick action buttons (rendered after Edit button) */
  quickActions?: React.ReactNode;

  /** Custom stats section content */
  statsContent?: React.ReactNode;

  /** Custom overview section content (rendered after stats) */
  overviewContent?: React.ReactNode;

  /** Optional subtitle (shown below name, defaults to groupName) */
  subtitle?: string;

  /** Asset type label for display (e.g., "Domain", "Website") */
  assetTypeName: string;

  /** Whether to show the Details tab (default: true) */
  showDetailsTab?: boolean;

  /** Custom tabs to insert between Overview and Findings */
  extraTabs?: Array<{
    value: string;
    label: string;
    content: React.ReactNode;
  }>;
}

// ============================================
// Component
// ============================================

export function AssetDetailSheet<T extends Asset>({
  asset,
  open,
  onOpenChange,
  icon: Icon,
  iconColor,
  gradientFrom,
  gradientVia = "via-transparent",
  onEdit,
  onDelete,
  quickActions,
  statsContent,
  overviewContent,
  subtitle,
  assetTypeName,
  showDetailsTab = true,
  extraTabs,
}: AssetDetailSheetProps<T>) {
  if (!asset) return null;

  // Calculate icon background color from text color
  const iconBgColor = iconColor.replace("text-", "bg-").replace(/(\d+)$/, "$1/20");

  // Calculate total number of tabs
  const tabCount = 2 + (showDetailsTab ? 1 : 0) + (extraTabs?.length || 0);
  const tabGridClass =
    tabCount === 2 ? "grid-cols-2" :
    tabCount === 3 ? "grid-cols-3" :
    tabCount === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto p-0">
        <VisuallyHidden>
          <SheetTitle>{assetTypeName} Details</SheetTitle>
        </VisuallyHidden>

        {/* Header */}
        <div
          className={cn(
            "px-6 pt-6 pb-4 bg-gradient-to-br to-transparent",
            gradientFrom,
            gradientVia
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center",
                iconBgColor
              )}
            >
              <Icon className={cn("h-6 w-6", iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{asset.name}</h2>
              <p className="text-sm text-muted-foreground truncate">
                {subtitle || asset.groupName}
              </p>
            </div>
            <StatusBadge status={asset.status} />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" variant="secondary" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {quickActions}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="px-6 pb-6">
          <TabsList className={cn("grid w-full mb-4", tabGridClass)}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {extraTabs?.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
            <TabsTrigger value="findings">Findings</TabsTrigger>
            {showDetailsTab && (
              <TabsTrigger value="details">Details</TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-0">
            {statsContent}
            {overviewContent}
            <TagsSection tags={asset.tags} />
          </TabsContent>

          {/* Extra Tabs */}
          {extraTabs?.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {tab.content}
            </TabsContent>
          ))}

          {/* Findings Tab */}
          <TabsContent value="findings" className="mt-0">
            <AssetFindings assetId={asset.id} assetName={asset.name} />
          </TabsContent>

          {/* Details Tab */}
          {showDetailsTab && (
            <TabsContent value="details" className="space-y-4 mt-0">
              <TimelineSection
                firstSeen={asset.firstSeen}
                lastSeen={asset.lastSeen}
              />
              <TechnicalDetailsSection
                id={asset.id}
                type={asset.type}
                groupId={asset.groupId}
              />
              <DangerZoneSection
                onDelete={onDelete}
                assetTypeName={assetTypeName}
              />
            </TabsContent>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
