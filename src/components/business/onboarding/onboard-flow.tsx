// components/onboarding/OnboardingFlow.tsx 
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { LocationsStep } from "@/components/business/onboarding/steps";
import GenerationWizard from "@/components/business/onboarding/GenerationWizard";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PracticeInfoStep } from "@/components/business/onboarding/practise-info";
import { PracticeAreasStep } from "@/components/business/onboarding/practiceAreas-info";
import{useSession} from 'next-auth/react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { data: session } = useSession();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showGenerationWizard, setShowGenerationWizard] = useState(false);

  // Get store values with stable references
  const {
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    isSubmitting,
    validateStep,
    formData,
    setSubmitting,
    setUserId,
    getUserId,
    errors,
  } = useOnboardingStore();

  // Initialize user ID only once
  useEffect(() => {
    if (session?.user && session.user?.organizationId && !isInitialized) {
      setUserId(session.user.organizationId);
      setIsInitialized(true);
    }
  }, [session?.user?. organizationId, setUserId, isInitialized]);

  // Memoize step components
  const steps = React.useMemo(() => [
    { number: 1, title: "Practice Info", component: <PracticeInfoStep key="practice-info" /> },
    { number: 2, title: "Practice Areas", component: <PracticeAreasStep key="practice-areas" /> },
    { number: 3, title: "Locations", component: <LocationsStep key="locations" /> },
  ], []);

  const currentStepData = steps.find((step) => step.number === currentStep);
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;
  const canProceed = validateStep(currentStep);

  const handleNext = useCallback(() => {
    if (canProceed) {
      if (isLastStep) {
        handleSubmit();
      } else {
        nextStep();
      }
    }
  }, [canProceed, isLastStep, nextStep]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      prevStep();
    }
  }, [isFirstStep, prevStep]);

  // Updated handleSubmit method
  const handleSubmit = useCallback(async () => {
    if (!canProceed) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found. Please refresh and try again.');
      }

      const submissionData = {
        userId,
        firmName: formData.firmName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || '',
        yearsInPractice: formData.yearsInPractice,
        firmSize: formData.firmSize,
        linkedinUrl: formData.linkedinUrl || '',
        currentWebsite: formData.currentWebsite || '',
        primaryLocation: formData.primaryLocation,
        serviceAreas: formData.serviceAreas,
        practiceAreas: formData.practiceAreas,
        firmStory: formData.firmStory,
        hasCurrentWebsite: Boolean(formData.currentWebsite),
        selectedPlan: formData.selectedPlan,
        billingCycle: formData.billingCycle,
      };

      const response = await fetch("/api/user-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            console.error(`Field ${field}:`, errors);
          });
          setApiError('Please check the form for errors and try again.');
        } else {
          throw new Error(result.error || "Failed to complete onboarding");
        }
        return;
      }

      // Success! Show generation wizard
      setShowGenerationWizard(true);
      
    } catch (error) {
      console.error("Submission error:", error);
      setApiError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  }, [canProceed, getUserId, formData, setSubmitting]);

  // Don't render until user is initialized
  if (!isInitialized || !session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  // Show generation wizard after onboarding completion
  if (showGenerationWizard) {
    return (
      <GenerationWizard 
        userId={session.user.organizationId ?? ""}
        onComplete={() => {
          setShowGenerationWizard(false);
          onComplete();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Setup Your Profile</h1>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* API Error Display */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Submission Error</h3>
                <p className="text-sm text-red-700 mt-1">{apiError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          {currentStepData?.component}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors
              ${
                isFirstStep
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:text-primary hover:bg-gray-50"
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex items-center gap-4">
            {!canProceed && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Please complete all required fields
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors
                ${
                  canProceed && !isSubmitting
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLastStep ? 'Creating Profile...' : 'Processing...'}
                </>
              ) : (
                <>
                  {isLastStep ? 'Complete Profile' : 'Next'}
                  {!isLastStep && <ChevronRight className="w-5 h-5" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}