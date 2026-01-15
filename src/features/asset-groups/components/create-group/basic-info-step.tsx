/**
 * Basic Info Step
 *
 * First step for entering group name, description, environment, criticality,
 * and business context (CTEM Scoping)
 */

"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, User, Mail, Tags, X } from "lucide-react";
import type { CreateGroupFormData } from "./types";
import type { Environment, Criticality } from "@/features/shared/types";

interface BasicInfoStepProps {
  data: CreateGroupFormData;
  onChange: (data: Partial<CreateGroupFormData>) => void;
}

const ENVIRONMENTS: { value: Environment; label: string }[] = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
  { value: "testing", label: "Testing" },
];

const CRITICALITIES: { value: Criticality; label: string; description: string }[] = [
  { value: "critical", label: "Critical", description: "Business critical systems" },
  { value: "high", label: "High", description: "Important business functions" },
  { value: "medium", label: "Medium", description: "Standard business operations" },
  { value: "low", label: "Low", description: "Non-essential systems" },
];

const SUGGESTED_BUSINESS_UNITS = [
  "Technology & Engineering",
  "Platform Engineering",
  "Infrastructure & Operations",
  "Digital Commerce",
  "Finance",
  "Human Resources",
  "Sales & Marketing",
  "Customer Support",
  "Legal & Compliance",
  "Research & Development",
];

const SUGGESTED_TAGS = [
  "tier-1",
  "tier-2",
  "tier-3",
  "customer-facing",
  "internal",
  "pci-dss",
  "gdpr",
  "hipaa",
  "soc2",
  "infrastructure",
  "application",
  "database",
  "api",
  "legacy",
];

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = useCallback(
    (tag: string) => {
      const normalizedTag = tag.trim().toLowerCase();
      if (normalizedTag && !data.tags.includes(normalizedTag)) {
        onChange({ tags: [...data.tags, normalizedTag] });
      }
      setTagInput("");
    },
    [data.tags, onChange]
  );

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      onChange({ tags: data.tags.filter((t) => t !== tagToRemove) });
    },
    [data.tags, onChange]
  );

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        handleAddTag(tagInput);
      }
    },
    [tagInput, handleAddTag]
  );

  return (
    <div className="space-y-6 p-6">
      {/* Group Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Group Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Enter group name"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          A descriptive name for this asset group
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter description (optional)"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
        />
      </div>

      {/* Environment & Criticality */}
      <div className="grid grid-cols-2 gap-4">
        {/* Environment */}
        <div className="space-y-2">
          <Label>
            Environment <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.environment}
            onValueChange={(v) => onChange({ environment: v as Environment })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              {ENVIRONMENTS.map((env) => (
                <SelectItem key={env.value} value={env.value}>
                  {env.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Criticality */}
        <div className="space-y-2">
          <Label>
            Criticality <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.criticality}
            onValueChange={(v) => onChange({ criticality: v as Criticality })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select criticality" />
            </SelectTrigger>
            <SelectContent>
              {CRITICALITIES.map((crit) => (
                <SelectItem key={crit.value} value={crit.value}>
                  <div className="flex flex-col">
                    <span>{crit.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {crit.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Business Context Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Business Context
        </div>

        {/* Business Unit */}
        <div className="space-y-2">
          <Label htmlFor="businessUnit" className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            Business Unit
          </Label>
          <Select
            value={data.businessUnit || "_custom"}
            onValueChange={(v) => {
              if (v === "_custom") {
                onChange({ businessUnit: "" });
              } else {
                onChange({ businessUnit: v });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select or enter business unit" />
            </SelectTrigger>
            <SelectContent>
              {SUGGESTED_BUSINESS_UNITS.map((bu) => (
                <SelectItem key={bu} value={bu}>
                  {bu}
                </SelectItem>
              ))}
              <SelectItem value="_custom">Other (enter manually)</SelectItem>
            </SelectContent>
          </Select>
          {(data.businessUnit === "" || !SUGGESTED_BUSINESS_UNITS.includes(data.businessUnit)) && data.businessUnit !== undefined && (
            <Input
              placeholder="Enter custom business unit"
              value={data.businessUnit}
              onChange={(e) => onChange({ businessUnit: e.target.value })}
              className="mt-2"
            />
          )}
        </div>

        {/* Owner & Email */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="owner" className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Owner
            </Label>
            <Input
              id="owner"
              placeholder="e.g., Nguyen Van A"
              value={data.owner}
              onChange={(e) => onChange({ owner: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerEmail" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              Owner Email
            </Label>
            <Input
              id="ownerEmail"
              type="email"
              placeholder="e.g., a.nguyen@company.vn"
              value={data.ownerEmail}
              onChange={(e) => onChange({ ownerEmail: e.target.value })}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tags className="h-3.5 w-3.5" />
            Tags
          </Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {data.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <Input
            placeholder="Type a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-muted-foreground mr-1">Suggested:</span>
            {SUGGESTED_TAGS.filter((t) => !data.tags.includes(t))
              .slice(0, 8)
              .map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-xs"
                  onClick={() => handleAddTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
