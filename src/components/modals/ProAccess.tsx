// components/ProAccessModal.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Loader2 } from "lucide-react";
import { apiService } from "@/lib/api";
import {
  formatSubscriptionPrice,
  type PlanPricing,
} from "@/lib/subscriptionPricing";

interface PopupConfig {
  pricing: PlanPricing;
}

interface ProAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string;
  userData?: {
    name?: string;
    email?: string;
    accountType?: string;
  };
}

const ProAccessModal: React.FC<ProAccessModalProps> = ({
  isOpen,
  onClose,
  errorMessage = "You have reached your plan limits. Upgrade to continue.",
}) => {
  const [isProcessingPersonal, setIsProcessingPersonal] = useState(false);
  const [isProcessingTeams, setIsProcessingTeams] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PlanPricing | null>(null);

  // Clear error when modal closes
  useEffect(() => {
    if (!isOpen) setPaymentError(null);
  }, [isOpen]);

  // Fetch localised pricing when modal opens (display only — amount is enforced server-side)
  useEffect(() => {
    if (!isOpen || pricing) return;
    apiService
      .get<{ data: PopupConfig }>("/api/payments/popup-config")
      .then((res) => {
        if (res.data?.pricing) setPricing(res.data.pricing);
      })
      .catch(() => {
        // Non-fatal — buttons still work, just show generic labels
      });
  }, [isOpen, pricing]);

  const initializePayment = async (planType: "personal" | "teams") => {
    const setLoading =
      planType === "personal" ? setIsProcessingPersonal : setIsProcessingTeams;
    setLoading(true);
    setPaymentError(null);

    try {
      // Server sets the amount and currency — Paystack locks it in the authorization URL
      const response = await apiService.post<{
        data: { authorizationUrl: string };
      }>("/api/payments/initialize", { planType });

      if (response.data?.authorizationUrl) {
        window.location.href = response.data.authorizationUrl;
      } else {
        setPaymentError("Failed to initialize payment. Please try again.");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      setPaymentError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to initialize payment. Please try again."
      );
      setLoading(false);
    }
  };

  const isAnyLoading = isProcessingPersonal || isProcessingTeams;

  const personalLabel = pricing
    ? `Upgrade to Pro · ${formatSubscriptionPrice(pricing.personal, pricing.currency)}/mo`
    : "Upgrade to Pro";

  const teamsLabel = pricing
    ? `Upgrade for Team · ${formatSubscriptionPrice(pricing.teams, pricing.currency)}/mo`
    : "Upgrade for Team";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader className="space-y-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-amber-100 p-1.5 sm:p-2 rounded-full shrink-0">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg">Keep Using Wansom?</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Error Message */}
        {(errorMessage || paymentError) && (
          <p
            className={`text-xs font-light break-words ${paymentError ? "text-red-500" : "text-gray-500"}`}
          >
            {paymentError || errorMessage}
          </p>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          {/* Personal Plan */}
          <div className="border border-gray-300 rounded-lg p-3 sm:p-4">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold">Personal Plan</h2>
              <p className="text-xs text-gray-600 mb-3 break-words">
                Best for solo practitioners who want to explore Wansom AI
              </p>
              <ul className="text-xs text-gray-600 mb-4 space-y-1 break-words">
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Unlimited
                  client/matter workspaces
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Unlimited AI
                  responses
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Draft & Review
                  unlimited Contracts
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Multi-jurisdiction research
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Upto 5GB Vault
                  Storage
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Upto 10 AI
                  Associates
                </li>
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500" />
                  Google Calendar & Email integrations
                </li>
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500" />
                  Email and phone support
                </li>
              </ul>
              <div className="bg-gray-300 my-2 h-0.5 w-full"></div>
              <Button
                type="button"
                onClick={() => initializePayment("personal")}
                className="w-full min-h-[44px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                disabled={isAnyLoading}
              >
                {isProcessingPersonal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  personalLabel
                )}
              </Button>
            </div>
          </div>

          {/* Team Plan */}
          <div className="border border-gray-300 rounded-lg p-3 sm:p-4">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold">Team Plan</h2>
              <p className="text-xs text-gray-600 mb-3 break-words">
                Collaborate more on client/matter workspaces with AI
              </p>
              <ul className="text-xs text-gray-600 mb-4 space-y-1 break-words">
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Everything in
                  Personal Plan
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Draft & Review
                  longer Contracts
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Unlimited AI
                  Associates
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Invite team members
                  to projects, documents
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Upto 50 GB Vault
                  Storage
                </li>
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Custom Workflows,
                  Integrations
                </li>
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Custom
                  Deployments
                </li>
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500" /> Team Training &amp;
                  Support
                </li>
              </ul>
              <div className="bg-gray-300 my-2 h-0.5 w-full"></div>
              <Button
                variant="outline"
                onClick={() => initializePayment("teams")}
                className="w-full min-h-[44px]"
                disabled={isAnyLoading}
              >
                {isProcessingTeams ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  teamsLabel
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2"></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProAccessModal;
