"use client";

import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import { SECURITY_PROCESS_STEPS } from "../types";

interface ProcessStepperProps {
  currentStep: number;
  className?: string;
}

export function ProcessStepper({ currentStep, className }: ProcessStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {SECURITY_PROCESS_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Circle
                      className={cn(
                        "h-3 w-3",
                        isCurrent ? "fill-primary" : "fill-muted"
                      )}
                    />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCompleted || isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-muted-foreground hidden text-xs sm:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {index < SECURITY_PROCESS_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
