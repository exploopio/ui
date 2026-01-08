/**
 * Basic Info Step
 *
 * Step 1: Scan name, mode (single/workflow) and type selection
 */

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Radar, GitBranch, Clock, Layers, ChevronRight } from "lucide-react";
import type { ScanType, ScanMode, NewScanFormData } from "../../types";
import { SCAN_TYPE_CONFIG, SCAN_MODE_CONFIG, mockWorkflows } from "../../types";

interface BasicInfoStepProps {
  data: NewScanFormData;
  onChange: (data: Partial<NewScanFormData>) => void;
}

const categoryColors: Record<string, string> = {
  recon: "bg-blue-500/20 text-blue-400",
  vuln: "bg-orange-500/20 text-orange-400",
  compliance: "bg-purple-500/20 text-purple-400",
  full: "bg-green-500/20 text-green-400",
};

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const selectedWorkflow = mockWorkflows.find((w) => w.id === data.workflowId);

  return (
    <div className="space-y-6 p-4">
      {/* Scan Name */}
      <div className="space-y-2">
        <Label htmlFor="scan-name">
          Scan Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="scan-name"
          placeholder="e.g., Production Security Scan"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      {/* Scan Mode Selection */}
      <div className="space-y-3">
        <Label>
          Scan Mode <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={data.mode}
          onValueChange={(value: ScanMode) =>
            onChange({
              mode: value,
              workflowId: value === "single" ? undefined : data.workflowId,
            })
          }
          className="grid grid-cols-2 gap-3"
        >
          <div
            className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer ${
              data.mode === "single"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value="single" id="mode-single" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Radar className="h-4 w-4 text-primary" />
                <Label htmlFor="mode-single" className="cursor-pointer font-medium">
                  {SCAN_MODE_CONFIG.single.label}
                </Label>
              </div>
              <p className="text-muted-foreground text-xs mt-1">
                {SCAN_MODE_CONFIG.single.description}
              </p>
            </div>
          </div>
          <div
            className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer ${
              data.mode === "workflow"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value="workflow" id="mode-workflow" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <Label htmlFor="mode-workflow" className="cursor-pointer font-medium">
                  {SCAN_MODE_CONFIG.workflow.label}
                </Label>
              </div>
              <p className="text-muted-foreground text-xs mt-1">
                {SCAN_MODE_CONFIG.workflow.description}
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Single Scan: Scan Type Selection */}
      {data.mode === "single" && (
        <div className="space-y-3">
          <Label>
            Scan Type <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={data.type}
            onValueChange={(value: ScanType) => onChange({ type: value })}
            className="space-y-3"
          >
            {(Object.keys(SCAN_TYPE_CONFIG) as ScanType[]).map((type) => (
              <div
                key={type}
                className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                  data.type === type
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={type} id={`type-${type}`} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={`type-${type}`} className="cursor-pointer font-medium">
                    {SCAN_TYPE_CONFIG[type].label}
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    {SCAN_TYPE_CONFIG[type].description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Workflow Scan: Workflow Selection */}
      {data.mode === "workflow" && (
        <div className="space-y-3">
          <Label>
            Select Workflow <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.workflowId || ""}
            onValueChange={(value) => onChange({ workflowId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a predefined workflow" />
            </SelectTrigger>
            <SelectContent>
              {mockWorkflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  <div className="flex items-center gap-2">
                    <span>{workflow.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${categoryColors[workflow.category]}`}
                    >
                      {workflow.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selected Workflow Details */}
          {selectedWorkflow && (
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedWorkflow.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedWorkflow.description}
                  </p>
                </div>
                <Badge className={categoryColors[selectedWorkflow.category]}>
                  {selectedWorkflow.category}
                </Badge>
              </div>

              {/* Estimated Duration */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Estimated duration: {selectedWorkflow.estimatedDuration}</span>
              </div>

              {/* Workflow Steps */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Layers className="h-4 w-4" />
                  <span>Workflow Steps ({selectedWorkflow.steps.length})</span>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex flex-wrap items-center gap-1">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <Badge variant="secondary" className="text-xs">
                          {step.order}. {step.tool}
                        </Badge>
                        {index < selectedWorkflow.steps.length - 1 && (
                          <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
