/**
 * Targets Step
 *
 * Step 2: Select scan targets (Asset Groups, Individual Assets, or Custom)
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { NewScanFormData, TargetType, ScanTargets } from "../../types";
import { mockAssetGroups } from "@/features/asset-groups";

interface TargetsStepProps {
  data: NewScanFormData;
  onChange: (data: Partial<NewScanFormData>) => void;
}

export function TargetsStep({ data, onChange }: TargetsStepProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleTargetTypeChange = (type: TargetType) => {
    onChange({
      targets: {
        ...data.targets,
        type,
      },
    });
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    const newGroupIds = checked
      ? [...data.targets.assetGroupIds, groupId]
      : data.targets.assetGroupIds.filter((id) => id !== groupId);

    onChange({
      targets: {
        ...data.targets,
        assetGroupIds: newGroupIds,
      },
    });
  };

  const handleCustomTargetsChange = (value: string) => {
    const targets = value
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    onChange({
      targets: {
        ...data.targets,
        customTargets: targets,
      },
    });
  };

  // Calculate total selected targets
  const calculateSelectedCount = (): number => {
    switch (data.targets.type) {
      case "asset_groups":
        return mockAssetGroups
          .filter((g) => data.targets.assetGroupIds.includes(g.id))
          .reduce((acc, g) => acc + g.assetCount, 0);
      case "individual":
        return data.targets.assetIds.length;
      case "custom":
        return data.targets.customTargets.length;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <Label>Select Targets</Label>
        <p className="text-muted-foreground text-sm">
          Choose which assets to include in this scan
        </p>
      </div>

      <RadioGroup
        value={data.targets.type}
        onValueChange={(value: TargetType) => handleTargetTypeChange(value)}
        className="space-y-4"
      >
        {/* Asset Groups */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="asset_groups" id="target-groups" />
            <Label htmlFor="target-groups" className="cursor-pointer font-medium">
              Asset Groups
            </Label>
          </div>

          {data.targets.type === "asset_groups" && (
            <div className="ml-6 space-y-2 rounded-lg border p-3">
              {mockAssetGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={data.targets.assetGroupIds.includes(group.id)}
                      onCheckedChange={(checked) =>
                        handleGroupToggle(group.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`group-${group.id}`}
                      className="cursor-pointer"
                    >
                      {group.name}
                    </Label>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {group.assetCount} assets
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Individual Assets */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individual" id="target-individual" />
            <Label htmlFor="target-individual" className="cursor-pointer font-medium">
              Individual Assets
            </Label>
          </div>

          {data.targets.type === "individual" && (
            <div className="ml-6 space-y-2 rounded-lg border p-3">
              <div className="relative">
                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-muted-foreground py-4 text-center text-sm">
                Search for assets to add to the scan
              </p>
            </div>
          )}
        </div>

        {/* Custom Targets */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="target-custom" />
            <Label htmlFor="target-custom" className="cursor-pointer font-medium">
              Custom Targets
            </Label>
          </div>

          {data.targets.type === "custom" && (
            <div className="ml-6 space-y-2 rounded-lg border p-3">
              <Label htmlFor="custom-targets" className="text-sm">
                Enter domains, IPs, or CIDR ranges (one per line)
              </Label>
              <Textarea
                id="custom-targets"
                placeholder="example.com&#10;192.168.1.0/24&#10;10.0.0.1"
                rows={5}
                value={data.targets.customTargets.join("\n")}
                onChange={(e) => handleCustomTargetsChange(e.target.value)}
              />
            </div>
          )}
        </div>
      </RadioGroup>

      {/* Selected count */}
      <div className="bg-muted/50 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Selected Targets</span>
          <Badge variant="default">{calculateSelectedCount()} targets</Badge>
        </div>
      </div>
    </div>
  );
}
