/**
 * Basic Info Step
 *
 * First step for entering group name, description, environment, and criticality
 */

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
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
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Brief description of the purpose and contents of this group
        </p>
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
    </div>
  );
}
