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
import { Input } from "@/components/ui/input";
import { Crown, Zap, Loader2, Minus, Plus, Building2 } from "lucide-react";
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

  // Team plan fields
  const [firmName, setFirmName] = useState("");
  const [teamSize, setTeamSize] = useState(1);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentError(null);
      setFirmName("");
      setTeamSize(1);
    }
  }, [isOpen]);

  // Fetch localised pricing when modal opens (display only — amount is enforced server-side)
  useEffect(() => {
    if (!isOpen || pricing) return;
    apiService
      .get<{ data: PopupConfig }>("/api/payments/popup-config")
      .then((res) => {
        if (res.data?.pricing) setPricing(res.data.pricing);
      })
      .catch(() => {});
  }, [isOpen, pricing]);

  const initializePayment = async (planType: "personal" | "teams") => {
    const setLoading =
      planType === "personal" ? setIsProcessingPersonal : setIsProcessingTeams;
    const trimmedFirmName = firmName.trim();

    if (planType === "teams" && !trimmedFirmName) {
      setPaymentError("Firm name is required for Team Plan payment.");
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const payload: Record<string, any> = { planType };

      if (planType === "teams") {
        payload.seatCount = teamSize;
        payload.firmName = trimmedFirmName;
      }

      const response = await apiService.post<{
        data: { authorizationUrl: string };
      }>("/api/payments/initialize", payload);

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
  const isFirmNameMissing = firmName.trim().length === 0;

  const personalLabel = pricing
    ? `Upgrade to Pro · ${formatSubscriptionPrice(pricing.personal, pricing.currency)}/mo`
    : "Upgrade to Pro";

  const teamPerSeat = pricing
    ? formatSubscriptionPrice(pricing.teams, pricing.currency)
    : "$15";

  const teamTotal = pricing
    ? formatSubscriptionPrice(pricing.teams * teamSize, pricing.currency)
    : `$${15 * teamSize}`;

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
          <div className="border border-gray-300 rounded-lg p-3 sm:p-4 md:w-1/2">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold">Personal Plan</h2>
              <p className="text-xs text-gray-600 mb-3 break-words">
                Best for solo practitioners who want to explore Wansom AI
              </p>
              <ul className="text-xs text-gray-600 mb-4 space-y-1 break-words">
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0 mt-0.5" /> Unlimited
                  client/matter workspaces
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0" /> Unlimited AI
                  responses
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0" /> Draft & Review
                  unlimited Contracts
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0" /> Multi-jurisdiction research
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0" /> Upto 5GB Vault
                  Storage
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0" /> Upto 10 AI
                  Associates
                </li>
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                  Google Calendar & Email integrations
                </li>
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                  Email and phone support
                </li>
              </ul>
              <p className="text-xs text-gray-500 mb-3">
                You can always invite team members later.
              </p>
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
          <div className="border border-gray-300 rounded-lg p-3 sm:p-4 md:w-1/2">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold">Team Plan</h2>
              <p className="text-xs text-gray-600 mb-3 break-words">
                Collaborate more on client/matter workspaces with AI
              </p>
              <ul className="text-xs text-gray-600 mb-4 space-y-1 break-words">
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0 mt-0.5" /> Everything in
                  Personal Plan
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0" /> Draft & Review
                  longer Contracts
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0" /> Unlimited AI
                  Associates
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0" /> Invite team members
                  to projects, documents
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0" /> Upto 50 GB Vault
                  Storage
                </li>
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0 mt-0.5" /> Custom Workflows,
                  Integrations
                </li>
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0 mt-0.5" /> Custom
                  Deployments
                </li>
                <li className="flex items-start gap-1">
                  <Zap className="h-3 w-3 text-green-500 shrink-0 mt-0.5" /> Team Training &amp;
                  Support
                </li>
              </ul>

              {/* Firm name */}
              <div className="mb-3">
                <label htmlFor="firmName" className="block text-xs font-medium text-gray-700 mb-1">
                  Name of firm
                </label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    id="firmName"
                    value={firmName}
                    onChange={(e) => {
                      setFirmName(e.target.value);
                      if (paymentError) setPaymentError(null);
                    }}
                    placeholder="e.g. Ochieng & Associates"
                    className="pl-8 h-9 text-xs"
                    disabled={isAnyLoading}
                  />
                </div>
                {isFirmNameMissing && (
                  <p className="mt-1 text-[11px] text-red-500">
                    Firm name is required for Team Plan payment.
                  </p>
                )}
              </div>

              {/* Team size stepper */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Number of associates / team
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTeamSize((s) => Math.max(1, s - 1))}
                    disabled={teamSize <= 1 || isAnyLoading}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="flex h-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-4 min-w-[48px] tabular-nums text-sm font-semibold">
                    {teamSize}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTeamSize((s) => s + 1)}
                    disabled={isAnyLoading}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-gray-500">
                    {teamSize === 1 ? "seat" : "seats"}
                  </span>
                </div>
              </div>

              {/* Dynamic total */}
              <div className="rounded-md bg-gray-50 border border-gray-200 p-2.5 mb-3">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-gray-600">
                    {teamPerSeat}/seat × {teamSize}
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {teamTotal}
                    <span className="text-xs font-normal text-gray-500">/mo</span>
                  </span>
                </div>
              </div>

              <div className="bg-gray-300 my-2 h-0.5 w-full"></div>
              <Button
                variant="outline"
                onClick={() => initializePayment("teams")}
                className="w-full min-h-[44px]"
                disabled={isAnyLoading || isFirmNameMissing}
              >
                {isProcessingTeams ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Request Team Access"
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
