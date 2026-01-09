/**
 * Select Assets Step
 *
 * Step for selecting existing ungrouped assets to add to the group
 */

"use client";

import * as React from "react";
import { Search, Check, X, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Asset, AssetType } from "@/features/assets/types";
import { ASSET_TYPE_LABELS } from "@/features/assets/types";
import type { CreateGroupFormData } from "./types";

interface SelectAssetsStepProps {
  data: CreateGroupFormData;
  onChange: (data: Partial<CreateGroupFormData>) => void;
  ungroupedAssets: Asset[];
}

const ASSET_TYPE_COLORS: Record<AssetType, { bg: string; text: string }> = {
  domain: { bg: "bg-blue-500/20", text: "text-blue-500" },
  website: { bg: "bg-green-500/20", text: "text-green-500" },
  service: { bg: "bg-purple-500/20", text: "text-purple-500" },
  repository: { bg: "bg-orange-500/20", text: "text-orange-500" },
  cloud: { bg: "bg-cyan-500/20", text: "text-cyan-500" },
  credential: { bg: "bg-red-500/20", text: "text-red-500" },
  host: { bg: "bg-slate-500/20", text: "text-slate-500" },
  container: { bg: "bg-indigo-500/20", text: "text-indigo-500" },
  database: { bg: "bg-yellow-500/20", text: "text-yellow-500" },
  mobile: { bg: "bg-pink-500/20", text: "text-pink-500" },
  api: { bg: "bg-emerald-500/20", text: "text-emerald-500" },
};

export function SelectAssetsStep({
  data,
  onChange,
  ungroupedAssets,
}: SelectAssetsStepProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<AssetType | "all">("all");

  // Get unique asset types from ungrouped assets
  const availableTypes = React.useMemo(() => {
    const types = new Set(ungroupedAssets.map((a) => a.type));
    return Array.from(types);
  }, [ungroupedAssets]);

  // Filter assets
  const filteredAssets = React.useMemo(() => {
    let result = ungroupedAssets;

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter((asset) => asset.type === typeFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [ungroupedAssets, typeFilter, searchQuery]);

  // Toggle asset selection
  const toggleAsset = (assetId: string) => {
    const isSelected = data.selectedAssetIds.includes(assetId);
    if (isSelected) {
      onChange({
        selectedAssetIds: data.selectedAssetIds.filter((id) => id !== assetId),
      });
    } else {
      onChange({
        selectedAssetIds: [...data.selectedAssetIds, assetId],
      });
    }
  };

  // Select all filtered assets
  const selectAll = () => {
    const filteredIds = filteredAssets.map((a) => a.id);
    const newSelection = new Set([...data.selectedAssetIds, ...filteredIds]);
    onChange({ selectedAssetIds: Array.from(newSelection) });
  };

  // Deselect all
  const deselectAll = () => {
    onChange({ selectedAssetIds: [] });
  };

  // Get selected assets details
  const selectedAssets = React.useMemo(
    () => ungroupedAssets.filter((a) => data.selectedAssetIds.includes(a.id)),
    [ungroupedAssets, data.selectedAssetIds]
  );

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      {/* Header with selection count */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Select Existing Assets</h3>
          <p className="text-xs text-muted-foreground">
            {ungroupedAssets.length} ungrouped assets available
          </p>
        </div>
        <Badge variant="secondary">
          {data.selectedAssetIds.length} selected
        </Badge>
      </div>

      {/* Search and filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as AssetType | "all")}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {ASSET_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selection actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={selectAll}
          disabled={filteredAssets.length === 0}
        >
          <Check className="h-3 w-3 mr-1" />
          Select All ({filteredAssets.length})
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={deselectAll}
          disabled={data.selectedAssetIds.length === 0}
        >
          <X className="h-3 w-3 mr-1" />
          Clear Selection
        </Button>
      </div>

      {/* Asset list */}
      <ScrollArea className="flex-1 min-h-[200px] max-h-[280px] rounded-lg border">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <FolderOpen className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">No ungrouped assets found</p>
            <p className="text-xs">
              {searchQuery || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "All assets are already in groups"}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredAssets.map((asset) => {
              const isSelected = data.selectedAssetIds.includes(asset.id);
              const colors = ASSET_TYPE_COLORS[asset.type];

              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggleAsset(asset.id)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-accent/50"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    className="pointer-events-none"
                  />
                  <div
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      colors.bg
                    )}
                  >
                    <span className={cn("text-xs font-bold", colors.text)}>
                      {asset.type.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ASSET_TYPE_LABELS[asset.type]}
                      {asset.description && ` - ${asset.description}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {asset.status}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Selected assets preview */}
      {selectedAssets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Selected assets:</p>
          <div className="flex flex-wrap gap-1">
            {selectedAssets.slice(0, 10).map((asset) => (
              <Badge
                key={asset.id}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleAsset(asset.id)}
              >
                {asset.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {selectedAssets.length > 10 && (
              <Badge variant="outline">+{selectedAssets.length - 10} more</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
