'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Terminal, Plus, Save } from 'lucide-react';

import type { Agent, AgentFormData, AgentDeploymentType } from '../types';
import {
  AGENT_REGIONS,
  AGENT_DEPLOYMENT_CONFIG,
} from '../types';
import { WORKER_CAPABILITIES, WORKER_TOOLS } from '@/lib/api/worker-types';

interface AgentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent | null;
  onSubmit: (data: AgentFormData) => void;
  mode: 'add' | 'edit';
}

const emptyFormData: AgentFormData = {
  name: '',
  description: '',
  deployment_type: 'cloud',
  region: '',
  capabilities: [],
  tools: [],
  labels: '',
};

export function AgentFormDialog({
  open,
  onOpenChange,
  agent,
  onSubmit,
  mode,
}: AgentFormDialogProps) {
  const [formData, setFormData] = useState<AgentFormData>(emptyFormData);

  useEffect(() => {
    if (agent && mode === 'edit') {
      setFormData({
        name: agent.name,
        description: agent.description || '',
        deployment_type: agent.deployment_type,
        region: agent.region || '',
        capabilities: agent.capabilities || [],
        tools: agent.tools || [],
        labels: Object.entries(agent.labels || {})
          .map(([k, v]) => `${k}:${v}`)
          .join(', '),
      });
    } else {
      setFormData(emptyFormData);
    }
  }, [agent, mode, open]);

  const handleSubmit = () => {
    if (!formData.name) {
      return;
    }
    onSubmit(formData);
    onOpenChange(false);
  };

  const toggleCapability = (cap: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap as never)
        ? prev.capabilities.filter((c) => c !== cap)
        : [...prev.capabilities, cap as never],
    }));
  };

  const toggleTool = (tool: string) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.includes(tool as never)
        ? prev.tools.filter((t) => t !== tool)
        : [...prev.tools, tool as never],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            {mode === 'add' ? 'Add Agent' : 'Edit Agent'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Register a new daemon agent to your infrastructure'
              : 'Update agent configuration'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              placeholder="e.g., scanner-prod-04"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Agent description..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Type & Region */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Deployment Type *</Label>
              <Select
                value={formData.deployment_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    deployment_type: value as AgentDeploymentType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AGENT_DEPLOYMENT_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                value={formData.region}
                onValueChange={(value) =>
                  setFormData({ ...formData, region: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Capabilities */}
          <div className="space-y-2">
            <Label>Capabilities</Label>
            <div className="grid grid-cols-3 gap-2">
              {WORKER_CAPABILITIES.map((cap) => (
                <div key={cap} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cap-${cap}`}
                    checked={formData.capabilities.includes(cap as never)}
                    onCheckedChange={() => toggleCapability(cap)}
                  />
                  <label
                    htmlFor={`cap-${cap}`}
                    className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {cap.toUpperCase()}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="space-y-2">
            <Label>Tools</Label>
            <div className="grid grid-cols-3 gap-2">
              {WORKER_TOOLS.map((tool) => (
                <div key={tool} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tool-${tool}`}
                    checked={formData.tools.includes(tool as never)}
                    onCheckedChange={() => toggleTool(tool)}
                  />
                  <label
                    htmlFor={`tool-${tool}`}
                    className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tool}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label htmlFor="labels">Labels (key:value, comma separated)</Label>
            <Input
              id="labels"
              placeholder="env:production, team:security"
              value={formData.labels}
              onChange={(e) =>
                setFormData({ ...formData, labels: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === 'add' ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Agent
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
