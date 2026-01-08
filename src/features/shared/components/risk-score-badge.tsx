"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getRiskLevel } from "../types";

interface RiskScoreBadgeProps {
  score: number;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RiskScoreBadge({
  score,
  showScore = true,
  size = "md",
  className,
}: RiskScoreBadgeProps) {
  const { label, color, textColor } = getRiskLevel(score);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-2.5 py-1",
  };

  return (
    <Badge className={cn(color, textColor, sizeClasses[size], className)}>
      {showScore ? `${score} - ${label}` : label}
    </Badge>
  );
}
