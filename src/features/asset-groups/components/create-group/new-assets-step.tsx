/**
 * New Assets Step
 *
 * Step for creating new assets to add to the group
 */

"use client";

import * as React from "react";
import { Plus, Trash2, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { AssetType } from "@/features/assets/types";
import {
  ASSET_TYPE_LABELS,
  ASSET_TYPE_COLORS,
} from "@/features/assets/types";
import type { CreateGroupFormData, NewAssetFormData } from "./types";

interface NewAssetsStepProps {
  data: CreateGroupFormData;
  onChange: (data: Partial<CreateGroupFormData>) => void;
}

// Common asset types for group creation (subset of all types)
const ASSET_TYPES: { value: AssetType; label: string; description: string }[] = [
  { value: "domain", label: "Domain", description: "Root domain or subdomain" },
  { value: "website", label: "Website", description: "Web application or site" },
  { value: "api", label: "API", description: "API endpoint collection" },
  { value: "project", label: "Project", description: "Code project/repository" },
  { value: "cloud_account", label: "Cloud Account", description: "Cloud subscription or project" },
  { value: "compute", label: "Compute", description: "VM or instance" },
  { value: "storage", label: "Storage", description: "S3/Blob/GCS bucket" },
  { value: "host", label: "Host", description: "Server or workstation" },
  { value: "container", label: "Container", description: "Docker/K8s container" },
  { value: "database", label: "Database", description: "Database instance" },
  { value: "mobile_app", label: "Mobile App", description: "Mobile application" },
  { value: "certificate", label: "Certificate", description: "SSL/TLS certificate" },
  { value: "ip_address", label: "IP Address", description: "IP address" },
];

// Generate unique ID for new assets
function generateId(): string {
  return `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Create empty asset
function createEmptyAsset(): NewAssetFormData {
  return {
    id: generateId(),
    type: "domain",
    name: "",
    description: "",
    tags: [],
  };
}

// Asset form component
function AssetForm({
  asset,
  onChange,
  onDelete,
}: {
  asset: NewAssetFormData;
  onChange: (updates: Partial<NewAssetFormData>) => void;
  onDelete: () => void;
}) {
  const [tagInput, setTagInput] = React.useState("");
  const colors = ASSET_TYPE_COLORS[asset.type];

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !asset.tags.includes(tag)) {
      onChange({ tags: [...asset.tags, tag] });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange({ tags: asset.tags.filter((t) => t !== tagToRemove) });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
              colors.bg
            )}
          >
            <span className={cn("text-sm font-bold", colors.text)}>
              {asset.type.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium">
              {asset.name || "New Asset"}
            </p>
            <p className="text-xs text-muted-foreground">
              {ASSET_TYPE_LABELS[asset.type]}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Asset Type */}
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={asset.type}
            onValueChange={(v) => onChange({ type: v as AssetType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span>{type.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {type.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Asset Name */}
        <div className="space-y-2">
          <Label>
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="Enter asset name"
            value={asset.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Enter description (optional)"
          value={asset.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Add tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="pl-9"
            />
          </div>
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {asset.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => removeTag(tag)}
              >
                {tag}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NewAssetsStep({ data, onChange }: NewAssetsStepProps) {
  const [expandedIds, setExpandedIds] = React.useState<string[]>([]);

  // Add new asset
  const addAsset = () => {
    const newAsset = createEmptyAsset();
    onChange({ newAssets: [...data.newAssets, newAsset] });
    setExpandedIds([...expandedIds, newAsset.id]);
  };

  // Update asset
  const updateAsset = (id: string, updates: Partial<NewAssetFormData>) => {
    onChange({
      newAssets: data.newAssets.map((asset) =>
        asset.id === id ? { ...asset, ...updates } : asset
      ),
    });
  };

  // Delete asset
  const deleteAsset = (id: string) => {
    onChange({
      newAssets: data.newAssets.filter((asset) => asset.id !== id),
    });
    setExpandedIds(expandedIds.filter((eid) => eid !== id));
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Create New Assets</h3>
          <p className="text-xs text-muted-foreground">
            Add new assets to be created with this group
          </p>
        </div>
        <Badge variant="secondary">{data.newAssets.length} new assets</Badge>
      </div>

      {/* Add button */}
      <Button
        type="button"
        variant="outline"
        onClick={addAsset}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Asset
      </Button>

      {/* Asset forms */}
      <ScrollArea className="flex-1 min-h-[200px] max-h-[320px]">
        {data.newAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground border rounded-lg border-dashed">
            <Plus className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">No new assets</p>
            <p className="text-xs">Click above to add new assets</p>
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={expandedIds}
            onValueChange={setExpandedIds}
            className="space-y-2"
          >
            {data.newAssets.map((asset, index) => {
              const colors = ASSET_TYPE_COLORS[asset.type];
              return (
                <AccordionItem
                  key={asset.id}
                  value={asset.id}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                          colors.bg
                        )}
                      >
                        <span className={cn("text-xs font-bold", colors.text)}>
                          {asset.type.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          {asset.name || `New Asset ${index + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ASSET_TYPE_LABELS[asset.type]}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <AssetForm
                      asset={asset}
                      onChange={(updates) => updateAsset(asset.id, updates)}
                      onDelete={() => deleteAsset(asset.id)}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </ScrollArea>

      {/* Summary by type */}
      {data.newAssets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Summary by type:</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(
              data.newAssets.reduce(
                (acc, asset) => {
                  acc[asset.type] = (acc[asset.type] || 0) + 1;
                  return acc;
                },
                {} as Record<AssetType, number>
              )
            ).map(([type, count]) => (
              <Badge key={type} variant="outline">
                {ASSET_TYPE_LABELS[type as AssetType]}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
