"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronDown,
  ExternalLink,
  User,
  Calendar,
  Tag,
  Shield,
} from "lucide-react";
import {
  FINDING_STATUS_CONFIG,
  SEVERITY_CONFIG,
  STATUS_TRANSITIONS,
} from "../../types";
import type { FindingDetail, FindingStatus } from "../../types";
import type { Severity } from "@/features/shared/types";

interface FindingHeaderProps {
  finding: FindingDetail;
  onStatusChange?: (status: FindingStatus) => void;
  onSeverityChange?: (severity: Severity) => void;
  onAssigneeChange?: (assigneeId: string | null) => void;
}

export function FindingHeader({
  finding,
  onStatusChange,
  onSeverityChange,
}: FindingHeaderProps) {
  const [status, setStatus] = useState<FindingStatus>(finding.status);
  const [severity, setSeverity] = useState<Severity>(finding.severity);

  const statusConfig = FINDING_STATUS_CONFIG[status];
  const severityConfig = SEVERITY_CONFIG[severity];
  const availableTransitions = STATUS_TRANSITIONS[status];

  const handleStatusChange = (newStatus: FindingStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const handleSeverityChange = (newSeverity: Severity) => {
    setSeverity(newSeverity);
    onSeverityChange?.(newSeverity);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  return (
    <div className="space-y-4">
      {/* Title and ID */}
      <div>
        <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm">
          <span className="font-mono">{finding.id}</span>
          {finding.cve && (
            <Badge variant="outline" className="text-xs">
              {finding.cve}
            </Badge>
          )}
          {finding.cwe && (
            <Badge variant="outline" className="text-xs">
              {finding.cwe}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold">{finding.title}</h1>
      </div>

      {/* Status and Severity Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}
            >
              {statusConfig.label}
              <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {availableTransitions.map((s) => {
              const config = FINDING_STATUS_CONFIG[s];
              return (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${config.bgColor.replace("/20", "")}`}
                  />
                  {config.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Severity Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`${severityConfig.bgColor} ${severityConfig.textColor} border-0`}
            >
              <Shield className="mr-1 h-3 w-3" />
              {severityConfig.label}
              {finding.cvss !== undefined && (
                <span className="ml-1 font-mono text-xs">({finding.cvss})</span>
              )}
              <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(
              Object.keys(SEVERITY_CONFIG) as Severity[]
            ).map((s) => {
              const config = SEVERITY_CONFIG[s];
              return (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleSeverityChange(s)}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${config.bgColor.replace("/20", "")}`}
                  />
                  {config.label}
                  <span className="text-muted-foreground ml-auto text-xs">
                    {config.cvssRange}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* CVSS Vector */}
        {finding.cvssVector && (
          <Badge variant="secondary" className="font-mono text-xs">
            {finding.cvssVector}
          </Badge>
        )}
      </div>

      {/* Meta Row */}
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {/* Assignee */}
        <div className="flex items-center gap-2">
          {finding.assignee ? (
            <>
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {getInitials(finding.assignee.name)}
                </AvatarFallback>
              </Avatar>
              <span>{finding.assignee.name}</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              <span>Unassigned</span>
            </>
          )}
        </div>

        {/* Discovered Date */}
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>Discovered {formatDate(finding.discoveredAt)}</span>
        </div>

        {/* Source */}
        <div className="flex items-center gap-1">
          <ExternalLink className="h-4 w-4" />
          <span className="capitalize">{finding.source}</span>
          {finding.scanner && <span className="text-xs">({finding.scanner})</span>}
        </div>
      </div>

      {/* Tags */}
      {finding.tags && finding.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="text-muted-foreground h-4 w-4" />
          {finding.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Affected Assets */}
      {finding.assets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {finding.assets.map((asset) => (
            <Badge key={asset.id} variant="secondary" className="gap-1">
              <span className="text-muted-foreground text-xs capitalize">
                {asset.type}:
              </span>
              {asset.name}
              {asset.criticality && (
                <span
                  className={`ml-1 text-xs ${SEVERITY_CONFIG[asset.criticality].textColor}`}
                >
                  ({asset.criticality})
                </span>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
