"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Loader,
  Wrench,
  Link,
  ListChecks,
} from "lucide-react";
import type { Remediation, RemediationStepStatus } from "../../types";

interface RemediationTabProps {
  remediation: Remediation;
}

const STATUS_ICONS: Record<RemediationStepStatus, React.ReactNode> = {
  pending: <Circle className="text-muted-foreground h-4 w-4" />,
  in_progress: <Loader className="h-4 w-4 animate-spin text-yellow-400" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-400" />,
};

export function RemediationTab({ remediation }: RemediationTabProps) {
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

  const isOverdue =
    remediation.deadline && new Date(remediation.deadline) < new Date();
  const daysUntilDeadline = remediation.deadline
    ? Math.ceil(
        (new Date(remediation.deadline).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const completedSteps = remediation.steps.filter(
    (s) => s.status === "completed"
  ).length;
  const totalSteps = remediation.steps.length;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Remediation Progress</h3>
            <p className="text-muted-foreground text-sm">
              {completedSteps} of {totalSteps} steps completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{remediation.progress}%</p>
            {remediation.deadline && (
              <div
                className={`flex items-center justify-end gap-1 text-xs ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}
              >
                {isOverdue ? (
                  <Clock className="h-3 w-3" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                {isOverdue ? (
                  <span>Overdue by {Math.abs(daysUntilDeadline!)} days</span>
                ) : (
                  <span>Due {formatDate(remediation.deadline)}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <Progress value={remediation.progress} className="h-2" />
      </div>

      {/* Description */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Wrench className="h-4 w-4" />
          Recommended Fix
        </h3>
        <p className="text-muted-foreground text-sm">{remediation.description}</p>
      </div>

      <Separator />

      {/* Remediation Steps */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <ListChecks className="h-4 w-4" />
            Steps
          </h3>
          <Button size="sm" variant="outline">
            Add Step
          </Button>
        </div>
        <div className="space-y-3">
          {remediation.steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                step.status === "completed"
                  ? "border-green-500/20 bg-green-500/5"
                  : step.status === "in_progress"
                    ? "border-yellow-500/20 bg-yellow-500/5"
                    : "bg-muted/30"
              }`}
            >
              <div className="pt-0.5">
                <Checkbox
                  checked={step.status === "completed"}
                  disabled
                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    Step {index + 1}
                  </span>
                  {STATUS_ICONS[step.status]}
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      step.status === "completed"
                        ? "border-green-500/50 text-green-400"
                        : step.status === "in_progress"
                          ? "border-yellow-500/50 text-yellow-400"
                          : ""
                    }`}
                  >
                    {step.status === "in_progress"
                      ? "In Progress"
                      : step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                  </Badge>
                </div>
                <p
                  className={`text-sm ${step.status === "completed" ? "text-muted-foreground line-through" : ""}`}
                >
                  {step.description}
                </p>
                {step.completedBy && step.completedAt && (
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">
                        {getInitials(step.completedBy.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      Completed by {step.completedBy.name} on{" "}
                      {formatDate(step.completedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* References */}
      {remediation.references.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Link className="h-4 w-4" />
              References
            </h3>
            <ul className="space-y-2">
              {remediation.references.map((ref, index) => (
                <li key={index}>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {ref}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
