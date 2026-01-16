"use client";

import { useState } from "react";
import { Copy, Check, FileCode, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Worker } from "@/lib/api/worker-types";

interface WorkerConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker;
  apiKey?: string; // Optional - only available right after creation/regeneration
}

export function WorkerConfigDialog({
  open,
  onOpenChange,
  worker,
  apiKey,
}: WorkerConfigDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);

  // Get the base URL from environment or default
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin.replace(/:\d+$/, ":8080") // Replace frontend port with API port
    : "http://localhost:8080";

  // Generate scanner configs based on worker's tools
  const scannerConfigs = worker.tools.length > 0
    ? worker.tools.map(tool => {
        // Map tool names to scanner names
        const scannerName = tool === "trivy" ? "trivy-fs" : tool;
        return `  - name: ${scannerName}\n    enabled: true`;
      }).join("\n")
    : `  - name: semgrep\n    enabled: true`;

  // YAML config template
  const yamlConfig = `# Rediver Agent Configuration for ${worker.name}
# Generated from Rediver UI

agent:
  name: ${worker.name}
  enable_commands: true
  command_poll_interval: 30s
  heartbeat_interval: 1m

rediver:
  base_url: ${baseUrl}
  api_key: ${apiKey || "<YOUR_API_KEY>"}
  worker_id: ${worker.id}

scanners:
${scannerConfigs}

# Optional: Default scan targets (for standalone mode)
# targets:
#   - /path/to/project1
#   - /path/to/project2
`;

  // Environment variables
  const envConfig = `# Environment Variables for ${worker.name}

export REDIVER_API_URL=${baseUrl}
export REDIVER_API_KEY=${apiKey || "<YOUR_API_KEY>"}
export REDIVER_WORKER_ID=${worker.id}
`;

  // Docker run command
  const dockerConfig = `# Docker run command for ${worker.name}

docker run -d \\
  --name ${worker.name.toLowerCase().replace(/\s+/g, "-")} \\
  -v /path/to/scan:/code:ro \\
  -e REDIVER_API_URL=${baseUrl} \\
  -e REDIVER_API_KEY=${apiKey || "<YOUR_API_KEY>"} \\
  -e REDIVER_WORKER_ID=${worker.id} \\
  rediver/agent:latest \\
  -daemon -config /app/agent.yaml
`;

  // CLI one-shot command
  const cliConfig = `# CLI Commands for ${worker.name}

# One-shot scan (run once and exit)
./rediver-agent \\
  -tool ${worker.tools[0] === "trivy" ? "trivy-fs" : worker.tools[0] || "semgrep"} \\
  -target /path/to/project \\
  -push

# Daemon mode (continuous)
./rediver-agent -daemon -config agent.yaml

# With environment variables
export REDIVER_API_URL=${baseUrl}
export REDIVER_API_KEY=${apiKey || "<YOUR_API_KEY>"}
./rediver-agent -tool ${worker.tools[0] === "trivy" ? "trivy-fs" : worker.tools[0] || "semgrep"} -target . -push
`;

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Agent Configuration
          </DialogTitle>
          <DialogDescription>
            Configuration templates for <strong>{worker.name}</strong>
            {!apiKey && (
              <span className="text-yellow-600 dark:text-yellow-400 block mt-1">
                Note: Replace {"<YOUR_API_KEY>"} with your actual API key
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="yaml" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="yaml">YAML</TabsTrigger>
            <TabsTrigger value="env">Env Vars</TabsTrigger>
            <TabsTrigger value="docker">Docker</TabsTrigger>
            <TabsTrigger value="cli">CLI</TabsTrigger>
          </TabsList>

          <TabsContent value="yaml" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="flex justify-end gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(yamlConfig, `${worker.name.toLowerCase().replace(/\s+/g, "-")}-agent.yaml`)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(yamlConfig, "YAML config")}
              >
                {copied === "YAML config" ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy
              </Button>
            </div>
            <pre className="flex-1 overflow-auto rounded-lg bg-muted p-4 text-sm font-mono whitespace-pre">
              {yamlConfig}
            </pre>
          </TabsContent>

          <TabsContent value="env" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="flex justify-end gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(envConfig, "Environment variables")}
              >
                {copied === "Environment variables" ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy
              </Button>
            </div>
            <pre className="flex-1 overflow-auto rounded-lg bg-muted p-4 text-sm font-mono whitespace-pre">
              {envConfig}
            </pre>
          </TabsContent>

          <TabsContent value="docker" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="flex justify-end gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(dockerConfig, "Docker command")}
              >
                {copied === "Docker command" ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy
              </Button>
            </div>
            <pre className="flex-1 overflow-auto rounded-lg bg-muted p-4 text-sm font-mono whitespace-pre">
              {dockerConfig}
            </pre>
          </TabsContent>

          <TabsContent value="cli" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="flex justify-end gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(cliConfig, "CLI commands")}
              >
                {copied === "CLI commands" ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy
              </Button>
            </div>
            <pre className="flex-1 overflow-auto rounded-lg bg-muted p-4 text-sm font-mono whitespace-pre">
              {cliConfig}
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
