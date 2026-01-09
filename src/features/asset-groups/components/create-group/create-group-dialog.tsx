/**
 * Create Group Dialog
 *
 * Multi-step wizard dialog for creating new asset groups with assets
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
import { ChevronLeft, ChevronRight, Loader2, FolderPlus } from "lucide-react";

import { GroupStepper, type GroupWizardStep } from "./group-stepper";
import { BasicInfoStep } from "./basic-info-step";
import { SelectAssetsStep } from "./select-assets-step";
import { NewAssetsStep } from "./new-assets-step";
import { ReviewStep } from "./review-step";
import {
  DEFAULT_CREATE_GROUP_FORM,
  type CreateGroupFormData,
} from "./types";
import type { Asset } from "@/features/assets/types";
import type { CreateAssetGroupInput, CreateAssetInGroupInput } from "../../types";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Available ungrouped assets to select from */
  ungroupedAssets: Asset[];
  /** Called when group is created */
  onSubmit?: (input: CreateAssetGroupInput) => void | Promise<void>;
}

const STEPS: GroupWizardStep[] = ["basic", "select-assets", "new-assets", "review"];

export function CreateGroupDialog({
  open,
  onOpenChange,
  ungroupedAssets,
  onSubmit,
}: CreateGroupDialogProps) {
  const [currentStep, setCurrentStep] = useState<GroupWizardStep>("basic");
  const [formData, setFormData] = useState<CreateGroupFormData>(
    DEFAULT_CREATE_GROUP_FORM
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleDataChange = (data: Partial<CreateGroupFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case "basic":
        if (!formData.name.trim()) {
          toast.error("Please enter a group name");
          return false;
        }
        return true;
      case "select-assets":
        // Optional - can skip
        return true;
      case "new-assets":
        // Validate new assets have names
        const invalidAssets = formData.newAssets.filter(
          (asset) => !asset.name.trim()
        );
        if (invalidAssets.length > 0) {
          toast.error("Please provide names for all new assets");
          return false;
        }
        return true;
      case "review":
        // Final validation
        if (!formData.name.trim()) {
          toast.error("Group name is required");
          return false;
        }
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

  const handleStepClick = (step: GroupWizardStep) => {
    const stepIndex = STEPS.indexOf(step);
    if (stepIndex < currentStepIndex) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      // Transform form data to API input
      const input: CreateAssetGroupInput = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        environment: formData.environment,
        criticality: formData.criticality,
        existingAssetIds:
          formData.selectedAssetIds.length > 0
            ? formData.selectedAssetIds
            : undefined,
        newAssets:
          formData.newAssets.length > 0
            ? formData.newAssets.map(
                (asset): CreateAssetInGroupInput => ({
                  type: asset.type,
                  name: asset.name.trim(),
                  description: asset.description?.trim() || undefined,
                  tags: asset.tags.length > 0 ? asset.tags : undefined,
                })
              )
            : undefined,
      };

      // Call submit handler
      await onSubmit?.(input);

      const totalAssets =
        formData.selectedAssetIds.length + formData.newAssets.length;
      toast.success(
        `Group "${formData.name}" created successfully${
          totalAssets > 0 ? ` with ${totalAssets} assets` : ""
        }`
      );

      // Reset and close
      setFormData(DEFAULT_CREATE_GROUP_FORM);
      setCurrentStep("basic");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(DEFAULT_CREATE_GROUP_FORM);
    setCurrentStep("basic");
    onOpenChange(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case "basic":
        return <BasicInfoStep data={formData} onChange={handleDataChange} />;
      case "select-assets":
        return (
          <SelectAssetsStep
            data={formData}
            onChange={handleDataChange}
            ungroupedAssets={ungroupedAssets}
          />
        );
      case "new-assets":
        return <NewAssetsStep data={formData} onChange={handleDataChange} />;
      case "review":
        return (
          <ReviewStep data={formData} ungroupedAssets={ungroupedAssets} />
        );
      default:
        return null;
    }
  };

  // Get step-specific button labels
  const getNextButtonLabel = () => {
    switch (currentStep) {
      case "basic":
        return "Next: Select Assets";
      case "select-assets":
        return "Next: New Assets";
      case "new-assets":
        return "Next: Review";
      default:
        return "Next";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 w-full sm:max-w-[700px]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Create Asset Group</DialogTitle>
          <DialogDescription>
            Create a new group and optionally add assets to it
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="border-b">
          <GroupStepper currentStep={currentStep} onStepClick={handleStepClick} />
        </div>

        {/* Step Content */}
        <div className="max-h-[50vh] overflow-y-auto overflow-x-hidden">
          {renderStep()}
        </div>

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
                disabled={isSubmitting || !formData.name.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Create Group
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                {getNextButtonLabel()}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
