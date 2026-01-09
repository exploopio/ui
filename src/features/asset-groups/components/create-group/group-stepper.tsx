/**
 * Group Wizard Stepper
 *
 * Visual step indicator for the create group wizard
 */

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type GroupWizardStep = "basic" | "select-assets" | "new-assets" | "review";

interface GroupStepperProps {
  currentStep: GroupWizardStep;
  onStepClick?: (step: GroupWizardStep) => void;
}

const STEPS: { id: GroupWizardStep; label: string }[] = [
  { id: "basic", label: "Basic Info" },
  { id: "select-assets", label: "Select Assets" },
  { id: "new-assets", label: "New Assets" },
  { id: "review", label: "Review" },
];

export function GroupStepper({ currentStep, onStepClick }: GroupStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-4">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <button
              type="button"
              onClick={() => isCompleted && onStepClick?.(step.id)}
              disabled={!isCompleted}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                isCompleted &&
                  "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer",
                isCurrent && "bg-primary text-primary-foreground",
                isPending && "text-muted-foreground bg-muted/50"
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                    isCurrent && "bg-primary-foreground/20",
                    isPending && "bg-muted-foreground/20"
                  )}
                >
                  {index + 1}
                </span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-8",
                  index < currentIndex ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
