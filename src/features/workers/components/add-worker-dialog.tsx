"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Bot, Copy, Check, Eye, EyeOff, AlertCircle } from "lucide-react";
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

import { WorkerTypeIcon } from "./worker-type-icon";
import {
  createWorkerSchema,
  type CreateWorkerFormData,
  WORKER_TYPE_OPTIONS,
  EXECUTION_MODE_OPTIONS,
} from "../schemas/worker-schema";
import { useWorkerFormOptions } from "../hooks";
import { useCreateWorker, invalidateWorkersCache } from "@/lib/api/worker-hooks";
import type { WorkerType } from "@/lib/api/worker-types";

interface AddWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddWorkerDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddWorkerDialogProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch dynamic tool and capability options from API
  const {
    toolOptions,
    capabilityOptions,
    isLoading: isLoadingOptions,
    error: optionsError,
    getCapabilitiesForTools,
  } = useWorkerFormOptions();

  const { trigger: createWorker, isMutating } = useCreateWorker();

  const form = useForm<CreateWorkerFormData>({
    resolver: zodResolver(createWorkerSchema),
    defaultValues: {
      name: "",
      type: "scanner",
      description: "",
      capabilities: [],
      tools: [],
      execution_mode: "standalone",
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

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setApiKey(null);
      setCopied(false);
      setShowApiKey(false);
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: CreateWorkerFormData) => {
    try {
      const result = await createWorker({
        name: data.name,
        type: data.type,
        description: data.description,
        capabilities: data.capabilities as never[],
        tools: data.tools as never[],
        execution_mode: data.execution_mode,
      });

      toast.success(`Worker "${data.name}" created successfully`);
      await invalidateWorkersCache();

      // Show the API key
      if (result?.api_key) {
        setApiKey(result.api_key);
      } else {
        // If no API key returned, close dialog
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create worker"
      );
    }
  };

  const handleCopyApiKey = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    form.reset();
    setApiKey(null);
    setCopied(false);
    setShowApiKey(false);
    onOpenChange(false);
    if (apiKey) {
      onSuccess?.();
    }
  };

  // If API key is shown, display the success view
  if (apiKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Worker Created Successfully
            </DialogTitle>
            <DialogDescription>
              Save this API key now. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                Important: Save your API key
              </p>
              <p className="text-xs text-muted-foreground">
                This API key will only be shown once. Please copy it and store it securely.
                If you lose it, you&apos;ll need to regenerate a new one.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    readOnly
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    className="pr-10 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyApiKey}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Add Worker
          </DialogTitle>
          <DialogDescription>
            Create a new worker to run scans and collect data
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Worker Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select worker type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WORKER_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <WorkerTypeIcon
                              type={option.value as WorkerType}
                              className="h-4 w-4"
                            />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of worker determines its primary function
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormDescription>
                    A friendly name to identify this worker
                  </FormDescription>
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
                Create Worker
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
