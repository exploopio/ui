'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useCreateTool, invalidateToolsCache } from '@/lib/api/tool-hooks';
import {
  createToolSchema,
  type CreateToolFormData,
  CATEGORY_OPTIONS,
  INSTALL_METHOD_OPTIONS,
} from '../schemas/tool-schema';
import { ToolCategoryIcon } from './tool-category-icon';

interface AddToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddToolDialog({ open, onOpenChange, onSuccess }: AddToolDialogProps) {
  const [tagInput, setTagInput] = useState('');
  const [capabilityInput, setCapabilityInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [formatInput, setFormatInput] = useState('');

  const { trigger: createTool, isMutating } = useCreateTool();

  const form = useForm<CreateToolFormData>({
    resolver: zodResolver(createToolSchema),
    defaultValues: {
      name: '',
      display_name: '',
      description: '',
      category: undefined,
      install_method: undefined,
      install_cmd: '',
      update_cmd: '',
      version_cmd: '',
      version_regex: '',
      docs_url: '',
      github_url: '',
      logo_url: '',
      capabilities: [],
      supported_targets: [],
      output_formats: [],
      tags: [],
    },
  });

  const handleSubmit = async (data: CreateToolFormData) => {
    try {
      await createTool({
        name: data.name,
        display_name: data.display_name || data.name,
        description: data.description || undefined,
        category: data.category,
        install_method: data.install_method,
        install_cmd: data.install_cmd || undefined,
        update_cmd: data.update_cmd || undefined,
        version_cmd: data.version_cmd || undefined,
        version_regex: data.version_regex || undefined,
        docs_url: data.docs_url || undefined,
        github_url: data.github_url || undefined,
        logo_url: data.logo_url || undefined,
        capabilities: data.capabilities,
        supported_targets: data.supported_targets,
        output_formats: data.output_formats,
        tags: data.tags,
      });

      toast.success(`Tool "${data.display_name || data.name}" created`);
      await invalidateToolsCache();
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tool');
    }
  };

  const addArrayItem = (
    fieldName: 'tags' | 'capabilities' | 'supported_targets' | 'output_formats',
    value: string,
    setter: (v: string) => void
  ) => {
    const currentValue = form.getValues(fieldName) || [];
    if (value.trim() && !currentValue.includes(value.trim())) {
      form.setValue(fieldName, [...currentValue, value.trim()]);
    }
    setter('');
  };

  const removeArrayItem = (
    fieldName: 'tags' | 'capabilities' | 'supported_targets' | 'output_formats',
    item: string
  ) => {
    const currentValue = form.getValues(fieldName) || [];
    form.setValue(
      fieldName,
      currentValue.filter((v) => v !== item)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription>
            Register a new security tool in the system registry.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="commands">Commands</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="semgrep"
                            className="font-mono"
                          />
                        </FormControl>
                        <FormDescription>
                          Lowercase, alphanumeric with dashes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Semgrep" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="A brief description of what this tool does..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <ToolCategoryIcon
                                    category={option.value}
                                    className="h-4 w-4"
                                  />
                                  <span>{option.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    - {option.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="install_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Install Method *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select install method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INSTALL_METHOD_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="docs_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Documentation URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://docs.example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="github_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://github.com/org/repo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://example.com/logo.png"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="commands" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="install_cmd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Install Command</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="go install github.com/example/tool@latest"
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        Command to install the tool
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="update_cmd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Update Command</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="go install github.com/example/tool@latest"
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        Command to update the tool to latest version
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="version_cmd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version Command</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="tool --version"
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        Command to check current version
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="version_regex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version Regex</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="v?(\d+\.\d+\.\d+)"
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        Regex pattern to extract version number from output
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4 mt-4">
                {/* Capabilities */}
                <div>
                  <FormLabel>Capabilities</FormLabel>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={capabilityInput}
                      onChange={(e) => setCapabilityInput(e.target.value)}
                      placeholder="Add capability..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addArrayItem('capabilities', capabilityInput, setCapabilityInput);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        addArrayItem('capabilities', capabilityInput, setCapabilityInput)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {form.watch('capabilities')?.map((cap) => (
                      <Badge key={cap} variant="secondary" className="gap-1">
                        {cap}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('capabilities', cap)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Supported Targets */}
                <div>
                  <FormLabel>Supported Targets</FormLabel>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      placeholder="Add target (e.g., python, javascript)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addArrayItem('supported_targets', targetInput, setTargetInput);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        addArrayItem('supported_targets', targetInput, setTargetInput)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {form.watch('supported_targets')?.map((target) => (
                      <Badge key={target} variant="secondary" className="gap-1">
                        {target}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('supported_targets', target)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Output Formats */}
                <div>
                  <FormLabel>Output Formats</FormLabel>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={formatInput}
                      onChange={(e) => setFormatInput(e.target.value)}
                      placeholder="Add format (e.g., json, sarif)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addArrayItem('output_formats', formatInput, setFormatInput);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        addArrayItem('output_formats', formatInput, setFormatInput)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {form.watch('output_formats')?.map((format) => (
                      <Badge key={format} variant="secondary" className="gap-1">
                        {format}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('output_formats', format)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <FormLabel>Tags</FormLabel>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addArrayItem('tags', tagInput, setTagInput);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => addArrayItem('tags', tagInput, setTagInput)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {form.watch('tags')?.map((tag) => (
                      <Badge key={tag} variant="outline" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('tags', tag)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tool
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
