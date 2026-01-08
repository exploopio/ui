"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PlusCircle,
  MessageSquare,
  ArrowRightLeft,
  Gauge,
  UserPlus,
  UserMinus,
  Lock,
  FilePlus,
  Wrench,
  RefreshCw,
  ShieldCheck,
  RotateCcw,
  Link,
  Copy,
  XCircle,
  Bot,
  Paperclip,
  Send,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Activity, ActivityType } from "../../types";
import { ACTIVITY_TYPE_CONFIG, FINDING_STATUS_CONFIG, SEVERITY_CONFIG } from "../../types";
import type { Severity } from "@/features/shared/types";

interface ActivityPanelProps {
  activities: Activity[];
  onAddComment?: (comment: string, isInternal: boolean) => void;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  created: <PlusCircle className="h-4 w-4" />,
  ai_triage: <Bot className="h-4 w-4" />,
  status_changed: <ArrowRightLeft className="h-4 w-4" />,
  severity_changed: <Gauge className="h-4 w-4" />,
  assigned: <UserPlus className="h-4 w-4" />,
  unassigned: <UserMinus className="h-4 w-4" />,
  comment: <MessageSquare className="h-4 w-4" />,
  internal_note: <Lock className="h-4 w-4" />,
  evidence_added: <FilePlus className="h-4 w-4" />,
  remediation_started: <Wrench className="h-4 w-4" />,
  remediation_updated: <RefreshCw className="h-4 w-4" />,
  verified: <ShieldCheck className="h-4 w-4" />,
  reopened: <RotateCcw className="h-4 w-4" />,
  linked: <Link className="h-4 w-4" />,
  duplicate_marked: <Copy className="h-4 w-4" />,
  false_positive_marked: <XCircle className="h-4 w-4" />,
};

export function ActivityPanel({ activities, onAddComment }: ActivityPanelProps) {
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const toggleReplies = (activityId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getActorName = (actor: Activity["actor"]) => {
    if (actor === "system") return "System";
    if (actor === "ai") return "AI Assistant";
    return actor.name;
  };

  const getActorInitials = (actor: Activity["actor"]) => {
    if (actor === "system") return "SYS";
    if (actor === "ai") return "AI";
    return actor.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    onAddComment?.(comment, isInternal);
    setComment("");
  };

  const renderActivityContent = (activity: Activity) => {
    const config = ACTIVITY_TYPE_CONFIG[activity.type];

    switch (activity.type) {
      case "status_changed":
        const prevStatus = activity.previousValue
          ? FINDING_STATUS_CONFIG[activity.previousValue as keyof typeof FINDING_STATUS_CONFIG]
          : null;
        const newStatus = activity.newValue
          ? FINDING_STATUS_CONFIG[activity.newValue as keyof typeof FINDING_STATUS_CONFIG]
          : null;

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span>Changed status from</span>
              {prevStatus && (
                <Badge
                  className={`${prevStatus.bgColor} ${prevStatus.textColor} border-0 text-xs`}
                >
                  {prevStatus.label}
                </Badge>
              )}
              <span>to</span>
              {newStatus && (
                <Badge
                  className={`${newStatus.bgColor} ${newStatus.textColor} border-0 text-xs`}
                >
                  {newStatus.label}
                </Badge>
              )}
            </div>
            {activity.content && (
              <p className="text-muted-foreground text-sm">{activity.content}</p>
            )}
          </div>
        );

      case "severity_changed":
        const prevSeverity = activity.previousValue
          ? SEVERITY_CONFIG[activity.previousValue as Severity]
          : null;
        const newSeverity = activity.newValue
          ? SEVERITY_CONFIG[activity.newValue as Severity]
          : null;

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span>Changed severity from</span>
              {prevSeverity && (
                <Badge
                  className={`${prevSeverity.bgColor} ${prevSeverity.textColor} border-0 text-xs`}
                >
                  {prevSeverity.label}
                </Badge>
              )}
              <span>to</span>
              {newSeverity && (
                <Badge
                  className={`${newSeverity.bgColor} ${newSeverity.textColor} border-0 text-xs`}
                >
                  {newSeverity.label}
                </Badge>
              )}
            </div>
            {activity.reason && (
              <p className="text-muted-foreground text-sm">{activity.reason}</p>
            )}
          </div>
        );

      case "ai_triage":
        let aiData = null;
        try {
          aiData = activity.content ? JSON.parse(activity.content) : null;
        } catch {
          // ignore
        }

        return (
          <div className="bg-purple-500/10 space-y-2 rounded-lg border border-purple-500/20 p-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">
                AI Analysis Complete
              </span>
            </div>
            {aiData && (
              <>
                <p className="text-sm">{aiData.summary}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Risk: {aiData.risk}</Badge>
                  <Badge variant="outline">CVSS: {aiData.cvss}</Badge>
                  <Badge variant="outline">
                    Exploitability: {aiData.exploitability}
                  </Badge>
                </div>
              </>
            )}
          </div>
        );

      case "comment":
      case "internal_note":
        const showReplies = expandedReplies.has(activity.id);
        const hasReplies = activity.replies && activity.replies.length > 0;

        return (
          <div className="space-y-3">
            <div
              className={`rounded-lg p-3 ${activity.type === "internal_note" ? "border border-amber-500/20 bg-amber-500/10" : "bg-muted/50"}`}
            >
              {activity.type === "internal_note" && (
                <div className="mb-2 flex items-center gap-1 text-xs text-amber-400">
                  <Lock className="h-3 w-3" />
                  Internal Note
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm">{activity.content}</p>

              {/* Attachments */}
              {activity.attachments && activity.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {activity.attachments.map((att) => (
                    <Badge
                      key={att.id}
                      variant="secondary"
                      className="cursor-pointer gap-1"
                    >
                      <Paperclip className="h-3 w-3" />
                      {att.filename}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Reactions */}
              {activity.reactions && activity.reactions.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {activity.reactions.map((reaction, idx) => (
                    <TooltipProvider key={idx}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="cursor-pointer gap-1 text-xs"
                          >
                            {reaction.emoji} {reaction.count}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {reaction.users.map((u) => u.name).join(", ") ||
                              `${reaction.count} reactions`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              )}
            </div>

            {/* Replies */}
            {hasReplies && (
              <div className="pl-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => toggleReplies(activity.id)}
                >
                  {showReplies ? (
                    <ChevronUp className="mr-1 h-3 w-3" />
                  ) : (
                    <ChevronDown className="mr-1 h-3 w-3" />
                  )}
                  {activity.replies!.length} repl
                  {activity.replies!.length === 1 ? "y" : "ies"}
                </Button>

                {showReplies && (
                  <div className="mt-2 space-y-2 border-l-2 border-muted pl-3">
                    {activity.replies!.map((reply) => (
                      <div key={reply.id} className="bg-muted/30 rounded p-2">
                        <div className="mb-1 flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">
                              {getActorInitials(reply.actor)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {getActorName(reply.actor)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatTimeAgo(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "assigned":
        return (
          <div className="text-sm">
            <span>Assigned to </span>
            <span className="font-medium">
              {(activity.metadata?.assigneeName as string) || activity.content}
            </span>
          </div>
        );

      case "evidence_added":
        const evidenceType = activity.metadata?.evidenceType as string | undefined;
        return (
          <div className="text-sm">
            <span>{activity.content}</span>
            {evidenceType && (
              <Badge variant="outline" className="ml-2 text-xs">
                {evidenceType}
              </Badge>
            )}
          </div>
        );

      case "created":
        const scanName = activity.metadata?.scanName as string | undefined;
        return (
          <div className="space-y-1 text-sm">
            <p>{activity.content}</p>
            {scanName && (
              <Badge variant="secondary" className="text-xs">
                {scanName}
              </Badge>
            )}
          </div>
        );

      default:
        return (
          <p className="text-sm">
            {activity.content || config.label}
          </p>
        );
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Activity Timeline */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-4 p-4">
          {sortedActivities.map((activity) => {
            const config = ACTIVITY_TYPE_CONFIG[activity.type];

            return (
              <div key={activity.id} className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className={`text-xs ${activity.actor === "ai" ? "bg-purple-500/20 text-purple-400" : activity.actor === "system" ? "bg-blue-500/20 text-blue-400" : ""}`}
                    >
                      {getActorInitials(activity.actor)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {getActorName(activity.actor)}
                    </span>
                    <div className={`flex items-center gap-1 ${config.color}`}>
                      {ACTIVITY_ICONS[activity.type]}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                  {renderActivityContent(activity)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comment Input */}
      <div className="flex-shrink-0 border-t p-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={isInternal ? "secondary" : "ghost"}
                size="sm"
                className="h-7 gap-1 px-2"
                onClick={() => setIsInternal(!isInternal)}
              >
                <Lock className="h-3 w-3" />
                <span className="text-xs">Internal</span>
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!comment.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
