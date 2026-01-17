"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Settings, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  updateWorkerSchema,
  type UpdateWorkerFormData,
  WORKER_STATUS_OPTIONS,
  EXECUTION_MODE_OPTIONS,
} from "../schemas/worker-schema";
import { useWorkerFormOptions } from "../hooks";
import { useUpdateWorker, invalidateWorkersCache } from "@/lib/api/worker-hooks";
import type { Worker } from "@/lib/api/worker-types";

interface EditWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker;
  onSuccess?: () => void;
}

export function EditWorkerDialog({
  open,
  onOpenChange,
  worker,
  onSuccess,
}: EditWorkerDialogProps) {
  // Fetch dynamic tool and capability options from API
  const {
    toolOptions,
    capabilityOptions,
    isLoading: isLoadingOptions,
    error: optionsError,
    getCapabilitiesForTools,
  } = useWorkerFormOptions();

  const { trigger: updateWorker, isMutating } = useUpdateWorker(worker.id);

  const form = useForm<UpdateWorkerFormData>({
    resolver: zodResolver(updateWorkerSchema),
    defaultValues: {
      name: worker.name,
      description: worker.description || "",
      capabilities: worker.capabilities,
      tools: worker.tools,
      execution_mode: worker.execution_mode,
      status: worker.status,
    },
  });

  // Auto-add capabilities when tools are selected
  const handleToolChange = useCallback(
    (toolName: string, checked: boolean) => {
      const currentTools = form.getValues("tools") || [];
      const currentCapabilities = form.getValues("capabilities") || [];

      let newTools: string[];
      if (checked) {
        newTools = [...currentTools, toolName];
      } else {
        newTools = currentTools.filter((t) => t !== toolName);
      }

      form.setValue("tools", newTools);

      // Auto-add capabilities from selected tools
      if (checked) {
        const toolCapabilities = getCapabilitiesForTools([toolName]);
        const newCapabilities = [...new Set([...currentCapabilities, ...toolCapabilities])];
        form.setValue("capabilities", newCapabilities);
      }
    },
    [form, getCapabilitiesForTools]
  );

  // Reset form when dialog opens or worker changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: worker.name,
        description: worker.description || "",
        capabilities: worker.capabilities,
        tools: worker.tools,
        execution_mode: worker.execution_mode,
        status: worker.status,
      });
    }
  }, [open, worker, form]);

  const onSubmit = async (data: UpdateWorkerFormData) => {
    try {
      await updateWorker({
        name: data.name,
        description: data.description,
        capabilities: data.capabilities as never[],
        tools: data.tools as never[],
        execution_mode: data.execution_mode,
        status: data.status,
      });

      toast.success(`Worker "${data.name || worker.name}" updated successfully`);
      await invalidateWorkersCache();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update worker"
      );
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Worker
          </DialogTitle>
          <DialogDescription>
            Update the configuration for {worker.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Production Scanner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this worker does..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WORKER_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set the operational status of this worker
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Execution Mode */}
            <FormField
              control={form.control}
              name="execution_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Execution Mode</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select execution mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXECUTION_MODE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Standalone runs on-demand, Daemon runs continuously
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capabilities */}
            <FormField
              control={form.control}
              name="capabilities"
              render={() => (
                <FormItem>
                  <FormLabel>Capabilities</FormLabel>
                  <FormDescription className="mb-2">
                    Select the security scanning capabilities (auto-added when selecting tools)
                  </FormDescription>
                  {isLoadingOptions ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : optionsError ? (
                    <div className="flex items-center gap-2 text-sm text-destructive p-3 border border-destructive/30 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      Failed to load capabilities
                    </div>
                  ) : capabilityOptions.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-3 border rounded-md">
                      No capabilities available
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {capabilityOptions.map((capability) => (
                        <FormField
                          key={capability.value}
                          control={form.control}
                          name="capabilities"
                          render={({ field }) => (
                            <FormItem
                              className={cn(
                                "flex flex-row items-start space-x-2 space-y-0 rounded-md border p-2",
                                field.value?.includes(capability.value) &&
                                  "border-primary bg-primary/5"
                              )}
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(capability.value)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, capability.value]);
                                    } else {
                                      field.onChange(
                                        currentValue.filter((v) => v !== capability.value)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-0.5 leading-none flex-1">
                                <div className="flex items-center justify-between">
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {capability.label}
                                  </FormLabel>
                                  <Badge variant="secondary" className="text-xs h-5">
                                    {capability.toolCount}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {capability.description}
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tools */}
            <FormField
              control={form.control}
              name="tools"
              render={() => (
                <FormItem>
                  <FormLabel>Tools</FormLabel>
                  <FormDescription className="mb-2">
                    Select the security tools this worker will use (capabilities will be auto-added)
                  </FormDescription>
                  {isLoadingOptions ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : optionsError ? (
                    <div className="flex items-center gap-2 text-sm text-destructive p-3 border border-destructive/30 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      Failed to load tools
                    </div>
                  ) : toolOptions.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-3 border rounded-md">
                      No tools available. Please add tools in the Tool Registry first.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {toolOptions.map((tool) => (
                        <FormField
                          key={tool.value}
                          control={form.control}
                          name="tools"
                          render={({ field }) => (
                            <FormItem
                              className={cn(
                                "flex flex-row items-start space-x-2 space-y-0 rounded-md border p-2",
                                field.value?.includes(tool.value) &&
                                  "border-primary bg-primary/5"
                              )}
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(tool.value)}
                                  onCheckedChange={(checked) => {
                                    handleToolChange(tool.value, !!checked);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-0.5 leading-none flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <FormLabel className="text-sm font-normal cursor-pointer truncate">
                                    {tool.label}
                                  </FormLabel>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] h-4 px-1 shrink-0"
                                  >
                                    {tool.category.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {tool.description}
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
