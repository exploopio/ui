"use client";

import { useMemo } from "react";
import { useTools } from "@/lib/api/tool-hooks";
import { useAllToolCategories, getCategoryNameById } from "@/lib/api/tool-category-hooks";
import type { Tool } from "@/lib/api/tool-types";

// ============================================
// TYPES
// ============================================

export interface FormOption {
  value: string;
  label: string;
  description?: string;
}

export interface ToolOption extends FormOption {
  category: string;
  capabilities: string[];
  logoUrl?: string;
}

export interface CapabilityOption extends FormOption {
  toolCount: number;
}

export interface UseWorkerFormOptionsReturn {
  /** Tool options derived from active tools in database */
  toolOptions: ToolOption[];
  /** Capability options derived from tools' capabilities */
  capabilityOptions: CapabilityOption[];
  /** Raw tools data from API */
  tools: Tool[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Get tools that have specific capabilities */
  getToolsByCapabilities: (capabilities: string[]) => ToolOption[];
  /** Get capabilities for specific tools */
  getCapabilitiesForTools: (toolNames: string[]) => string[];
}

// ============================================
// CAPABILITY LABELS
// ============================================

const CAPABILITY_LABELS: Record<string, { label: string; description: string }> = {
  sast: { label: "SAST", description: "Static Application Security Testing" },
  sca: { label: "SCA", description: "Software Composition Analysis" },
  dast: { label: "DAST", description: "Dynamic Application Security Testing" },
  secrets: { label: "Secrets", description: "Secret Detection" },
  iac: { label: "IaC", description: "Infrastructure as Code Scanning" },
  infra: { label: "Infra", description: "Infrastructure Scanning" },
  container: { label: "Container", description: "Container Security Scanning" },
  web3: { label: "Web3", description: "Web3/Blockchain Security" },
  collector: { label: "Collector", description: "Data Collection" },
  api: { label: "API", description: "API Security Testing" },
  recon: { label: "Recon", description: "Reconnaissance" },
  osint: { label: "OSINT", description: "Open Source Intelligence" },
};

// ============================================
// HOOK
// ============================================

/**
 * Hook to get dynamic tool and capability options for worker forms.
 *
 * Features:
 * - Fetches active tools from database
 * - Derives unique capabilities from tools
 * - Provides helper functions for filtering
 * - Handles loading and error states
 *
 * @example
 * ```tsx
 * const { toolOptions, capabilityOptions, isLoading } = useWorkerFormOptions();
 *
 * // Filter tools by selected capabilities
 * const filteredTools = getToolsByCapabilities(selectedCapabilities);
 * ```
 */
export function useWorkerFormOptions(): UseWorkerFormOptionsReturn {
  // Fetch only active tools
  const { data, isLoading, error } = useTools(
    { is_active: true, per_page: 100 },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  );

  // Fetch tool categories
  const { data: categoriesData } = useAllToolCategories();

  // Memoize tools to prevent unnecessary re-renders
  const tools = useMemo(() => data?.items ?? [], [data?.items]);

  // Derive tool options from API data
  const toolOptions = useMemo<ToolOption[]>(() => {
    return tools.map((tool) => {
      const categoryName = getCategoryNameById(categoriesData?.items, tool.category_id);
      return {
        value: tool.name,
        label: tool.display_name,
        description: tool.description || `${categoryName.toUpperCase()} tool`,
        category: categoryName,
        capabilities: tool.capabilities || [],
        logoUrl: tool.logo_url,
      };
    });
  }, [tools, categoriesData]);

  // Derive unique capabilities from all tools
  const capabilityOptions = useMemo<CapabilityOption[]>(() => {
    // Count tools per capability
    const capabilityCount = new Map<string, number>();

    for (const tool of tools) {
      for (const cap of tool.capabilities || []) {
        capabilityCount.set(cap, (capabilityCount.get(cap) || 0) + 1);
      }
    }

    // Convert to options array
    const options: CapabilityOption[] = [];

    for (const [capability, count] of capabilityCount) {
      const labelInfo = CAPABILITY_LABELS[capability] || {
        label: capability.toUpperCase(),
        description: `${capability} capability`,
      };

      options.push({
        value: capability,
        label: labelInfo.label,
        description: labelInfo.description,
        toolCount: count,
      });
    }

    // Sort by tool count (most popular first), then alphabetically
    return options.sort((a, b) => {
      if (b.toolCount !== a.toolCount) {
        return b.toolCount - a.toolCount;
      }
      return a.label.localeCompare(b.label);
    });
  }, [tools]);

  // Helper: Get tools that have ANY of the specified capabilities
  const getToolsByCapabilities = useMemo(() => {
    return (capabilities: string[]): ToolOption[] => {
      if (!capabilities.length) return toolOptions;

      return toolOptions.filter((tool) =>
        capabilities.some((cap) => tool.capabilities.includes(cap))
      );
    };
  }, [toolOptions]);

  // Helper: Get all capabilities for the specified tools
  const getCapabilitiesForTools = useMemo(() => {
    return (toolNames: string[]): string[] => {
      const capabilities = new Set<string>();

      for (const toolName of toolNames) {
        const tool = toolOptions.find((t) => t.value === toolName);
        if (tool) {
          for (const cap of tool.capabilities) {
            capabilities.add(cap);
          }
        }
      }

      return Array.from(capabilities);
    };
  }, [toolOptions]);

  return {
    toolOptions,
    capabilityOptions,
    tools,
    isLoading,
    error: error || null,
    getToolsByCapabilities,
    getCapabilitiesForTools,
  };
}
