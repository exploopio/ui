/**
 * New Scan Dialog
 *
 * Multi-step wizard dialog for creating new scans
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Play } from "lucide-react";

import { ScanStepper, type ScanWizardStep } from "./scan-stepper";
import { BasicInfoStep } from "./basic-info-step";
import { TargetsStep } from "./targets-step";
import { OptionsStep } from "./options-step";
import { ScheduleStep } from "./schedule-step";
import { DEFAULT_NEW_SCAN, type NewScanFormData } from "../../types";

interface NewScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: NewScanFormData) => void;
}

const STEPS: ScanWizardStep[] = ["basic", "targets", "options", "schedule"];

export function NewScanDialog({
  open,
  onOpenChange,
  onSubmit,
}: NewScanDialogProps) {
  const [currentStep, setCurrentStep] = useState<ScanWizardStep>("basic");
  const [formData, setFormData] = useState<NewScanFormData>(DEFAULT_NEW_SCAN);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleDataChange = (data: Partial<NewScanFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case "basic":
        if (!formData.name.trim()) {
          toast.error("Please enter a scan name");
          return false;
        }
        if (formData.mode === "workflow" && !formData.workflowId) {
          toast.error("Please select a workflow");
          return false;
        }
        return true;
      case "targets":
        const { targets } = formData;
        if (targets.type === "asset_groups" && targets.assetGroupIds.length === 0) {
          toast.error("Please select at least one asset group");
          return false;
        }
        if (targets.type === "individual" && targets.assetIds.length === 0) {
          toast.error("Please select at least one asset");
          return false;
        }
        if (targets.type === "custom" && targets.customTargets.length === 0) {
          toast.error("Please enter at least one target");
          return false;
        }
        return true;
      case "options":
        return true;
      case "schedule":
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  const handleStepClick = (step: ScanWizardStep) => {
    const stepIndex = STEPS.indexOf(step);
    if (stepIndex < currentStepIndex) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSubmit?.(formData);

      if (formData.schedule.runImmediately) {
        toast.success(`Scan "${formData.name}" started successfully`);
      } else {
        toast.success(`Scan "${formData.name}" scheduled successfully`);
      }

      // Reset and close
      setFormData(DEFAULT_NEW_SCAN);
      setCurrentStep("basic");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create scan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(DEFAULT_NEW_SCAN);
    setCurrentStep("basic");
    onOpenChange(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case "basic":
        return <BasicInfoStep data={formData} onChange={handleDataChange} />;
      case "targets":
        return <TargetsStep data={formData} onChange={handleDataChange} />;
      case "options":
        return <OptionsStep data={formData} onChange={handleDataChange} />;
      case "schedule":
        return <ScheduleStep data={formData} onChange={handleDataChange} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-[600px]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>New Scan</DialogTitle>
          <DialogDescription>
            Configure and launch a new security scan
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="border-b">
          <ScanStepper currentStep={currentStep} onStepClick={handleStepClick} />
        </div>

        {/* Step Content */}
        <div className="max-h-[50vh] overflow-y-auto">{renderStep()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <div>
            {!isFirstStep && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {formData.schedule.runImmediately
                      ? "Starting..."
                      : "Scheduling..."}
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    {formData.schedule.runImmediately
                      ? "Start Scan"
                      : "Schedule Scan"}
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
