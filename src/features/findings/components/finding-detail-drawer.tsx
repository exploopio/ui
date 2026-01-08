"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExternalLink,
  Calendar,
  ChevronDown,
  Shield,
  FileText,
  Wrench,
  AlertTriangle,
  Clock,
  Server,
  Eye,
  Send,
  Copy,
  XCircle,
  Link2,
  UserPlus,
  MessageSquare,
  MoreHorizontal,
  Check,
} from "lucide-react";
import {
  FINDING_STATUS_CONFIG,
  SEVERITY_CONFIG,
  STATUS_TRANSITIONS,
  MOCK_USERS,
} from "../types";
import type { Finding, FindingStatus, FindingUser } from "../types";
import type { Severity } from "@/features/shared/types";

interface FindingDetailDrawerProps {
  finding: Finding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (findingId: string, status: FindingStatus) => void;
  onSeverityChange?: (findingId: string, severity: Severity) => void;
  onAssigneeChange?: (findingId: string, assignee: FindingUser | null) => void;
  onAddComment?: (findingId: string, comment: string) => void;
}

export function FindingDetailDrawer({
  finding,
  open,
  onOpenChange,
  onStatusChange,
  onSeverityChange,
  onAssigneeChange,
  onAddComment,
}: FindingDetailDrawerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<FindingStatus | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [assignee, setAssignee] = useState<FindingUser | null | undefined>(undefined);
  const [comment, setComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);

  if (!finding) return null;

  // Use local state if changed, otherwise use finding value
  const currentStatus = status ?? finding.status;
  const currentSeverity = severity ?? finding.severity;
  const currentAssignee = assignee !== undefined ? assignee : finding.assignee;

  const statusConfig = FINDING_STATUS_CONFIG[currentStatus];
  const severityConfig = SEVERITY_CONFIG[currentSeverity];
  const availableTransitions = STATUS_TRANSITIONS[currentStatus];

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

  const handleStatusChange = (newStatus: FindingStatus) => {
    setStatus(newStatus);
    onStatusChange?.(finding.id, newStatus);
  };

  const handleSeverityChange = (newSeverity: Severity) => {
    setSeverity(newSeverity);
    onSeverityChange?.(finding.id, newSeverity);
  };

  const handleAssigneeChange = (user: FindingUser | null) => {
    setAssignee(user);
    onAssigneeChange?.(finding.id, user);
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    onAddComment?.(finding.id, comment);
    setComment("");
    setShowCommentInput(false);
  };

  const handleViewDetails = () => {
    onOpenChange(false);
    router.push(`/findings/${finding.id}`);
  };

  const handleMarkDuplicate = () => {
    handleStatusChange("duplicate");
  };

  const handleMarkFalsePositive = () => {
    handleStatusChange("false_positive");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl">
        {/* Header */}
        <SheetHeader className="space-y-3 border-b px-6 py-4 text-left">
          <div className="space-y-1">
            <p className="text-muted-foreground font-mono text-xs">
              {finding.id}
            </p>
            <SheetTitle className="text-lg leading-snug pr-8">
              {finding.title}
            </SheetTitle>
          </div>

          {/* CVE/CWE badges */}
          {(finding.cve || finding.cwe) && (
            <div className="flex flex-wrap gap-2">
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
          )}

          <SheetDescription className="sr-only">
            Quick view and actions for finding
          </SheetDescription>
        </SheetHeader>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3 bg-muted/30">
          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 ${statusConfig.bgColor} ${statusConfig.textColor} border-0 hover:opacity-80`}
              >
                {statusConfig.label}
                <ChevronDown className="ml-1.5 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
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
                    {s === currentStatus && (
                      <Check className="ml-auto h-3 w-3" />
                    )}
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
                className={`h-8 ${severityConfig.bgColor} ${severityConfig.textColor} border-0 hover:opacity-80`}
              >
                <Shield className="mr-1 h-3 w-3" />
                {severityConfig.label}
                <ChevronDown className="ml-1.5 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-xs">Change Severity</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((s) => {
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
                    {s === currentSeverity && (
                      <Check className="ml-1 h-3 w-3" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assignee Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                {currentAssignee ? (
                  <>
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">
                        {getInitials(currentAssignee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[80px] truncate text-xs">
                      {currentAssignee.name.split(" ")[0]}
                    </span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3" />
                    <span className="text-xs">Assign</span>
                  </>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-xs">Assign to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {currentAssignee && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleAssigneeChange(null)}
                    className="text-muted-foreground"
                  >
                    Unassign
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {MOCK_USERS.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => handleAssigneeChange(user)}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{user.name}</p>
                    <p className="text-muted-foreground text-xs capitalize">{user.role}</p>
                  </div>
                  {currentAssignee?.id === user.id && (
                    <Check className="h-3 w-3" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleMarkDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Mark as Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMarkFalsePositive}>
                <XCircle className="mr-2 h-4 w-4" />
                Mark as False Positive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link2 className="mr-2 h-4 w-4" />
                Link Finding
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-6">
            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs">CVSS Score</p>
                <p className="text-sm font-semibold font-mono">
                  {finding.cvss !== undefined ? finding.cvss : "-"}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs">Source</p>
                <p className="text-sm capitalize">{finding.source}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs">Discovered</p>
                <p className="text-sm">{formatDate(finding.discoveredAt)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs">Last Updated</p>
                <p className="text-sm">{formatDate(finding.updatedAt)}</p>
              </div>
            </div>

            <Separator />

            {/* Affected Assets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Server className="h-4 w-4" />
                  Affected Assets
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {finding.assets.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {finding.assets.slice(0, 3).map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-lg border p-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-xs capitalize shrink-0">
                        {asset.type}
                      </Badge>
                      <span className="text-sm truncate">{asset.name}</span>
                    </div>
                    {asset.criticality && (
                      <Badge
                        className={`text-xs shrink-0 ${SEVERITY_CONFIG[asset.criticality].bgColor} ${SEVERITY_CONFIG[asset.criticality].textColor} border-0`}
                      >
                        {asset.criticality}
                      </Badge>
                    )}
                  </div>
                ))}
                {finding.assets.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs h-7">
                    +{finding.assets.length - 3} more assets
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4" />
                Description
              </h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {finding.description}
              </p>
            </div>

            <Separator />

            {/* Remediation Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Wrench className="h-4 w-4" />
                  Remediation
                </h4>
                <span className="text-sm font-semibold">
                  {finding.remediation.progress}%
                </span>
              </div>
              <Progress value={finding.remediation.progress} className="h-2" />
              <p className="text-muted-foreground text-xs line-clamp-2">
                {finding.remediation.description}
              </p>
              {finding.remediation.deadline && (
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-muted-foreground">
                    Due: {formatDate(finding.remediation.deadline)}
                  </span>
                </div>
              )}
            </div>

            {/* Evidence Preview */}
            {finding.evidence.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <Eye className="h-4 w-4" />
                      Evidence
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {finding.evidence.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {finding.evidence.slice(0, 4).map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-md border p-2 text-xs hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <p className="truncate font-medium">{ev.title}</p>
                        <p className="text-muted-foreground capitalize">
                          {ev.type}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tags */}
            {finding.tags && finding.tags.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {finding.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer with Quick Comment & View Details */}
        <div className="flex-shrink-0 border-t">
          {/* Quick Comment */}
          {showCommentInput ? (
            <div className="p-4 space-y-2 border-b">
              <Textarea
                placeholder="Add a quick comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCommentInput(false);
                    setComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                >
                  <Send className="mr-1.5 h-3 w-3" />
                  Send
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => setShowCommentInput(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Add a comment...
              </Button>
            </div>
          )}

          {/* View Details Button */}
          <div className="p-4">
            <Button className="w-full" onClick={handleViewDetails}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full Details
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
