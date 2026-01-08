"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Image,
  Video,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Code,
  Paperclip,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import type { Evidence, EvidenceType } from "../../types";
import { EVIDENCE_TYPE_CONFIG } from "../../types";

interface EvidenceTabProps {
  evidence: Evidence[];
}

const EVIDENCE_ICONS: Record<EvidenceType, React.ReactNode> = {
  screenshot: <Image className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  log: <FileText className="h-4 w-4" />,
  request: <ArrowUpRight className="h-4 w-4" />,
  response: <ArrowDownLeft className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  file: <Paperclip className="h-4 w-4" />,
};

export function EvidenceTab({ evidence }: EvidenceTabProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderEvidenceContent = (item: Evidence) => {
    const isExpanded = expandedItems.has(item.id);

    switch (item.type) {
      case "screenshot":
        return (
          <div className="bg-muted/30 rounded-lg border p-4">
            <div className="flex aspect-video items-center justify-center rounded bg-neutral-800/50">
              <Image className="text-muted-foreground h-12 w-12" />
              <span className="text-muted-foreground ml-2 text-sm">
                [Screenshot Preview]
              </span>
            </div>
          </div>
        );

      case "video":
        return (
          <div className="bg-muted/30 rounded-lg border p-4">
            <div className="flex aspect-video items-center justify-center rounded bg-neutral-800/50">
              <Video className="text-muted-foreground h-12 w-12" />
              <span className="text-muted-foreground ml-2 text-sm">
                [Video Preview]
              </span>
            </div>
          </div>
        );

      case "request":
      case "response":
      case "log":
      case "code":
        const lines = item.content.split("\n");
        const previewLines = isExpanded ? lines : lines.slice(0, 8);
        const hasMore = lines.length > 8;

        return (
          <div className="space-y-2">
            <ScrollArea className="rounded-lg border bg-neutral-900/50 p-4">
              <pre className="font-mono text-xs text-neutral-300">
                {previewLines.join("\n")}
                {!isExpanded && hasMore && (
                  <span className="text-muted-foreground">
                    {"\n"}... ({lines.length - 8} more lines)
                  </span>
                )}
              </pre>
            </ScrollArea>
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => toggleExpand(item.id)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-3 w-3" /> Show All{" "}
                    {lines.length} Lines
                  </>
                )}
              </Button>
            )}
          </div>
        );

      case "file":
        return (
          <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-4">
            <Paperclip className="text-muted-foreground h-8 w-8" />
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-muted-foreground text-xs">{item.mimeType}</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-muted/30 rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              {item.content}
            </p>
          </div>
        );
    }
  };

  if (evidence.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Paperclip className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold">No Evidence</h3>
        <p className="text-muted-foreground mb-4 text-center text-sm">
          No evidence has been attached to this finding yet.
        </p>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Evidence
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-sm">
          {evidence.length} evidence item{evidence.length !== 1 ? "s" : ""}
        </h3>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Evidence
        </Button>
      </div>

      <div className="space-y-4">
        {evidence.map((item) => {
          const typeConfig = EVIDENCE_TYPE_CONFIG[item.type];

          return (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex h-8 w-8 items-center justify-center rounded">
                    {EVIDENCE_ICONS[item.type]}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-xs">
                        {typeConfig.label}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(item.createdBy.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground text-xs">
                    {item.createdBy.name}
                  </span>
                </div>
              </div>
              {renderEvidenceContent(item)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
