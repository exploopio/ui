'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Settings,
  Trash2,
  ExternalLink,
  Github,
  Power,
  PowerOff,
  ArrowUpCircle,
  Clock,
  Tag,
  Terminal,
  FileText,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tool } from '@/lib/api/tool-types';
import { INSTALL_METHOD_DISPLAY_NAMES } from '@/lib/api/tool-types';
import {
  ToolCategoryIcon,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  getCategoryBadgeColor,
} from './tool-category-icon';

interface ToolDetailSheetProps {
  tool: Tool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (tool: Tool) => void;
  onDelete: (tool: Tool) => void;
  onActivate: (tool: Tool) => void;
  onDeactivate: (tool: Tool) => void;
  onCheckUpdate?: (tool: Tool) => void;
}

export function ToolDetailSheet({
  tool,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onCheckUpdate,
}: ToolDetailSheetProps) {
  if (!tool) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-4">
            {tool.logo_url ? (
              <img
                src={tool.logo_url}
                alt={tool.display_name}
                className="h-12 w-12 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <ToolCategoryIcon category={tool.category} className="h-6 w-6" />
              </div>
            )}
            <div>
              <SheetTitle>{tool.display_name}</SheetTitle>
              <SheetDescription>{tool.name}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  tool.is_active
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-500 text-white'
                )}
              >
                {tool.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {tool.is_builtin && (
                <Badge variant="outline">Built-in</Badge>
              )}
              {tool.has_update && (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-500"
                >
                  <ArrowUpCircle className="mr-1 h-3 w-3" />
                  Update Available
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {tool.is_active ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeactivate(tool)}
              >
                <PowerOff className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onActivate(tool)}
              >
                <Power className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
            {!tool.is_builtin && (
              <>
                <Button variant="outline" size="sm" onClick={() => onEdit(tool)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-500"
                  onClick={() => onDelete(tool)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
            {tool.has_update && onCheckUpdate && (
              <Button variant="outline" size="sm" onClick={() => onCheckUpdate(tool)}>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Check Update
              </Button>
            )}
          </div>

          <Separator />

          {/* Description */}
          {tool.description && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Description</h4>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </div>
          )}

          {/* Category & Install */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                <ToolCategoryIcon category={tool.category} className="h-4 w-4" />
                Category
              </h4>
              <Badge
                variant="outline"
                className={cn('text-xs', getCategoryBadgeColor(tool.category))}
              >
                {CATEGORY_LABELS[tool.category]}
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">
                {CATEGORY_DESCRIPTIONS[tool.category]}
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                <Box className="h-4 w-4" />
                Install Method
              </h4>
              <Badge variant="secondary">
                {INSTALL_METHOD_DISPLAY_NAMES[tool.install_method]}
              </Badge>
            </div>
          </div>

          {/* Version Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="mb-2 text-sm font-medium">Current Version</h4>
              <p className="text-sm">{tool.current_version || 'Not installed'}</p>
            </div>
            {tool.latest_version && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Latest Version</h4>
                <p className="text-sm">{tool.latest_version}</p>
              </div>
            )}
          </div>

          {/* Commands */}
          {(tool.install_cmd || tool.version_cmd || tool.update_cmd) && (
            <>
              <Separator />
              <div>
                <h4 className="mb-3 text-sm font-medium flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Commands
                </h4>
                <div className="space-y-3">
                  {tool.install_cmd && (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Install</p>
                      <code className="block rounded bg-muted p-2 text-xs font-mono">
                        {tool.install_cmd}
                      </code>
                    </div>
                  )}
                  {tool.version_cmd && (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Version Check</p>
                      <code className="block rounded bg-muted p-2 text-xs font-mono">
                        {tool.version_cmd}
                      </code>
                    </div>
                  )}
                  {tool.update_cmd && (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Update</p>
                      <code className="block rounded bg-muted p-2 text-xs font-mono">
                        {tool.update_cmd}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Capabilities */}
          {tool.capabilities && tool.capabilities.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-medium">Capabilities</h4>
                <div className="flex flex-wrap gap-1">
                  {tool.capabilities.map((cap) => (
                    <Badge key={cap} variant="outline" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Supported Targets */}
          {tool.supported_targets && tool.supported_targets.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Supported Targets</h4>
              <div className="flex flex-wrap gap-1">
                {tool.supported_targets.map((target) => (
                  <Badge key={target} variant="secondary" className="text-xs">
                    {target}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Output Formats */}
          {tool.output_formats && tool.output_formats.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Output Formats
              </h4>
              <div className="flex flex-wrap gap-1">
                {tool.output_formats.map((format) => (
                  <Badge key={format} variant="outline" className="text-xs">
                    {format}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tool.tags && tool.tags.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-1">
                {tool.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(tool.docs_url || tool.github_url) && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {tool.docs_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={tool.docs_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Documentation
                    </a>
                  </Button>
                )}
                {tool.github_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={tool.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created: {new Date(tool.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated: {new Date(tool.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
