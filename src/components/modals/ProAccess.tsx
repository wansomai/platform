// components/modals/ProAccess.tsx
//
// Canva-style upgrade modal shown when a user hits free-plan limits or when
// their Explorer access has expired. Three visual tiers are presented:
//   Free (greyed — current)  →  Explorer (featured — 2 weeks)  →  Pro (monthly)
//
// The Explorer plan is always highlighted as the easiest next step. Once
// the user's explorer period has ended the header copy changes and Pro
// becomes the primary CTA.

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Loader2, Check, ArrowLeft, ChevronLeft } from "lucide-react";
import { apiService } from "@/lib/api";
import LogoAnimation from "@/components/commons/LogoAnimation";
import {
  formatSubscriptionPrice,
  type PlanPricing,
  type ExplorerPricing,
} from "@/lib/subscriptionPricing";

interface PopupConfig {
  pricing: PlanPricing;
  explorerPricing: ExplorerPricing;
}

export interface ProAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The limit that was hit — used in the header copy */
  limitType?: "messages" | "projects" | "associates" | "general" | "trial_expired";
  /** Pass 'explorer_expired' to adjust header copy and promote Pro as primary */
  planState?: "free" | "explorer_expired";
}

const EXPLORER_FEATURES = [
  "Unlimited AI responses",
  "AI Associates",
  "Unlimited client/matter workspaces",
  "Google Calendar & Gmail",
  "Draft, review & analyse documents",
  "Multi-jurisdiction research",
  "Full document vault",
];

const PRO_FEATURES = [
  "Unlimited client/matter workspaces",
  "Unlimited AI Responses",
  "5 GB Document Vault Storage",
  "Up to 10 AI Associates",
  "Google Calendar & Email integrations",
  "Priority email support",
  "Team collaboration",
  "Custom workflows & deployments",
];

const TEAM_FEATURES = [
  "Everything in Personal",
  "Unlimited AI Associates",
  "50 GB Document Vault Storage",
  "Role-based access control",
  "Team collaboration tools",
  "Custom workflows & integrations",
  "Custom deployments",
  "Team training & priority support",
];

const LIMIT_COPY: Record<string, { title: string; sub: string }> = {
  messages: {
    title: "You've used all your free messages",
    sub: "Unlock unlimited AI responses to keep working.",
  },
  projects: {
    title: "You've reached the workspace limit",
    sub: "Upgrade to create unlimited client/matter workspaces.",
  },
  associates: {
    title: "AI Associates are a premium feature",
    sub: "Upgrade to Explorer or Pro to create and use AI Associates.",
  },
  general: {
    title: "You've reached your free plan limit",
    sub: "Upgrade to keep using Wansom AI.",
  },
  trial_expired: {
    title: "Your 15-day Pro trial has ended",
    sub: "Try Explorer for 2 weeks or subscribe to Pro for ongoing monthly access.",
  },
};

const ProAccessModal: React.FC<ProAccessModalProps> = ({
  isOpen,
  onClose,
  limitType = "general",
  planState = "free",
}) => {
  const [isProcessingExplorer, setIsProcessingExplorer] = useState(false);
  const [isProcessingPro, setIsProcessingPro] = useState(false);
  const [isProcessingTeam, setIsProcessingTeam] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [planFlow, setPlanFlow] = useState<"personal" | "teams">("personal");
  const [flowStep, setFlowStep] = useState<1 | 2>(1);
  const [paymentMode, setPaymentMode] = useState<"recurrent" | "unique">("recurrent");
  const [firmName, setFirmName] = useState("");
  const [seatCount, setSeatCount] = useState(1);

  const explorerExpired = planState === "explorer_expired";

  useEffect(() => {
    if (!isOpen) {
      setPaymentError(null);
      return;
    }
    if (config) return;
    apiService
      .get<{ data: PopupConfig }>("/api/payments/popup-config")
      .then((res) => {
        if (res.data) setConfig(res.data);
      })
      .catch(() => {});
  }, [isOpen, config]);

  useEffect(() => {
    if (!isOpen) {
      setFlowStep(1);
      setPaymentMode("recurrent");
      setPlanFlow("personal");
      setFirmName("");
      setSeatCount(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (planFlow === "teams") {
      setPaymentMode("recurrent");
    }
  }, [planFlow]);

  const initializePayment = async (planType: "explorer" | "personal" | "teams") => {
    const setLoading = planType === "explorer"
      ? setIsProcessingExplorer
      : planType === "teams"
        ? setIsProcessingTeam
        : setIsProcessingPro;
    setLoading(true);
    setPaymentError(null);

    try {
      const response = await apiService.post<{
        data: { authorizationUrl: string };
      }>(
        "/api/payments/initialize",
        planType === "teams"
          ? {
              planType,
              firmName: firmName.trim(),
              seatCount: Math.max(1, Math.floor(seatCount || 1)),
            }
          : { planType }
      );

      if (response.data?.authorizationUrl) {
        window.location.href = response.data.authorizationUrl;
      } else {
        setPaymentError("Failed to initialize payment. Please try again.");
        setLoading(false);
      }
    } catch (error: any) {
      setPaymentError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to initialize payment. Please try again."
      );
      setLoading(false);
    }
  };

  const isAnyLoading = isProcessingExplorer || isProcessingPro;
  const isAnyTeamLoading = isProcessingTeam;

  const explorerLabel = config?.explorerPricing
    ? formatSubscriptionPrice(
        config.explorerPricing.amount,
        config.explorerPricing.currency
      )
    : "$5";

  const proLabel = config?.pricing
    ? formatSubscriptionPrice(config.pricing.personal, config.pricing.currency)
    : "$12";
  const teamUnitLabel = config?.pricing
    ? formatSubscriptionPrice(config.pricing.teams, config.pricing.currency)
    : "$15";
  const teamTotalLabel = config?.pricing
    ? formatSubscriptionPrice(config.pricing.teams * Math.max(1, seatCount), config.pricing.currency)
    : `$${15 * Math.max(1, seatCount)}`;

  const headerCopy = explorerExpired
    ? {
        title: "Your Explorer access has ended",
        sub: "Subscribe to Pro to keep all your work and continue without limits.",
      }
    : LIMIT_COPY[limitType];

  const rightPanelBullets = planFlow === "personal"
    ? [
        "Unlimited legal drafting and review",
        "Priority AI responses for active matters",
        "Full access to premium legal tools",
        "Smarter contract analysis in less time",
        "Advanced templates for legal workflows",
        "Faster turnaround for client deliverables",
      ]
    : [
        "Shared workspaces for your firm",
        "Role-based collaboration by seat",
        "Scale billing as your team grows",
        "Centralized matter management for teams",
        "Shared knowledge across your legal staff",
        "Improved oversight for partners and admins",
      ];

  const rightPanelTagline = planFlow === "personal"
    ? "Best for solo practitioners who want to do more"
    : "Collaborate on client matters with your whole firm or organization.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[95vh] md:h-[92vh] max-h-[95vh] md:max-h-[760px] overflow-y-auto md:overflow-hidden p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
                <button
                type="button"
                className="border-none"
                onClick={() => setFlowStep(1)}
               
              >
                <ChevronLeft className="h-6 w-6 text-primary" />
             
              </button>
              <div className="bg-[#0a4b5e]/10 p-2 rounded-full shrink-0 mt-0.5">
                <Crown className="h-5 w-5 text-[#0a4b5e]" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-900 leading-snug">
                  {headerCopy.title}
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5">{headerCopy.sub}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {flowStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 md:min-h-[620px]">
            <div className="px-5 pt-4 pb-5 border-b md:border-b-0 md:border-r border-gray-100 h-full flex flex-col">
              <h3 className="text-xl font-semibold text-gray-900">Try Wansom Pro</h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose your account type to continue.
              </p>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setPlanFlow("personal")}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                    planFlow === "personal"
                      ? "border-[#0a4b5e] bg-[#0a4b5e]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">Pro (Personal)</span>
                    <span className="text-xs text-gray-500">For Individuals</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFlow("teams")}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                    planFlow === "teams"
                      ? "border-[#0a4b5e] bg-[#0a4b5e]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">Team Plan</span>
                    <span className="text-xs text-gray-500">For firms/Organizations</span>
                  </div>
                </button>
              </div>

              <p className="text-sm font-semibold text-gray-900 mt-5 mb-2">
                Everything you get:
              </p>
              <ul className="space-y-2">
                {rightPanelBullets.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 shrink-0 mt-0.5 text-[#0a4b5e]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-5 bg-[#0a4b5e] hover:bg-[#005c4d] text-white"
                onClick={() => setFlowStep(2)}
              >
                Continue
              </Button>

              <p className="text-xs text-gray-500 mt-2 text-center pb-1">
                Secure checkout. Your Data is safe with us.
              </p>
            </div>

            <div className="bg-white p-6 border-t md:border-t-0 border-gray-100 h-full flex">
              <div className="w-full h-full flex flex-col items-center justify-center text-center md:-translate-y-6">
                <div className="rounded-2xl bg-white p-4">
                  <LogoAnimation
                    className="!animate-none h-[180px] w-[180px] [&>svg]:h-full [&>svg]:w-full"
                  />
                </div>
                <p className="mt-2 text-gray-700 text-lg font-semibold leading-snug max-w-[320px]">
                  {rightPanelTagline}
                </p>
              </div>
            </div>
          </div>
        )}

        {paymentError && (
          <div className="mx-5 mt-3 text-xs text-red-600 bg-red-50 rounded-md px-3 py-2 border border-red-200">
            {paymentError}
          </div>
        )}

        {flowStep === 2 && (
          <div className="px-5 py-4 md:min-h-[620px]">
      

            {planFlow === "personal" && (
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#0a4b5e]/10 p-1 w-full  mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMode("recurrent")}
                  className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    paymentMode === "recurrent"
                      ? "bg-white text-[#0a4b5e] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Monthly Subscription
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("unique")}
                  className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    paymentMode === "unique"
                      ? "bg-white text-[#0a4b5e] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  One-time Payment
                </button>
              </div>
            )}

            {planFlow === "personal" && paymentMode === "unique" && (
              <div className="rounded-xl border border-[#e89e00]/50 bg-[#e89e00]/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Explorer (2 weeks)</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{explorerLabel}</p>
                <p className="text-xs text-[#7a5500] mt-1 mb-3">No Monthly subscription required</p>
                <ul className="space-y-1.5 mb-4">
                  {EXPLORER_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <Check className="h-3 w-3 shrink-0 mt-0.5 text-[#0a4b5e]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => initializePayment("explorer")}
                  disabled={isAnyLoading}
                  className="w-full text-sm bg-[#0a4b5e] hover:bg-[#005c4d] text-white"
                  size="sm"
                >
                  {isProcessingExplorer ? (
                    <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Processing…</>
                  ) : (
                    `Continue For · ${explorerLabel}`
                  )}
                </Button>
              </div>
            )}

            {planFlow === "personal" && paymentMode === "recurrent" && (
              <div className={`rounded-xl border p-4 ${explorerExpired ? "border-[#0a4b5e]/40 bg-[#0a4b5e]/5" : "border-gray-200 bg-white"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Pro (Monthly)</span>
                 
                </div>
                <p className="text-2xl font-bold text-gray-900">{proLabel}<span className="text-xs text-gray-500 ml-1">/month</span></p>
                <p className="text-xs text-gray-500 mt-1 mb-3">Cancel anytime.</p>
                <ul className="space-y-1.5 mb-4">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <Check className="h-3 w-3 shrink-0 mt-0.5 text-[#0a4b5e]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => initializePayment("personal")}
                  disabled={isAnyLoading}
                  className={`w-full text-sm ${explorerExpired ? "bg-[#0a4b5e] hover:bg-[#005c4d] text-white" : "border-[#0a4b5e] bg-primary text-white hover:bg-[#0a4b5e]/5"}`}
                  variant={explorerExpired ? "default" : "outline"}
                  size="sm"
                >
                  {isProcessingPro ? (
                    <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Processing…</>
                  ) : (
                    `Subscribe For · ${proLabel}/mo`
                  )}
                </Button>
              </div>
            )}

            {planFlow === "teams" && (
              <div className="rounded-xl border-2 border-[#0a4b5e] bg-white p-4 shadow-[0_1px_0_rgba(10,75,94,0.06)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#0a4b5e] uppercase tracking-wide">
                    Team Plan
                  </span>
                
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-gray-900">{teamUnitLabel}</span>
                  <span className="text-xs text-gray-500 ml-1">/ member / month</span>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Firm name / Organization</label>
                    <input
                      type="text"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      placeholder="eg. Wansom & CO LLP"
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-[#0a4b5e] focus:ring-2 focus:ring-[#0a4b5e]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Number of members</label>
                    <input
                      type="number"
                      min={1}
                      value={seatCount}
                      onChange={(e) => setSeatCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-[#0a4b5e] focus:ring-2 focus:ring-[#0a4b5e]/20"
                    />
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {TEAM_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <Check className="h-3 w-3 shrink-0 mt-0.5 text-[#0a4b5e]" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => initializePayment("teams")}
                  disabled={isAnyTeamLoading || !firmName.trim()}
                  className="w-full text-xs bg-[#0a4b5e] hover:bg-[#005c4d] text-white"
                  size="sm"
                >
                  {isProcessingTeam ? (
                    <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Processing…</>
                  ) : (
                    `Continue · ${teamTotalLabel}/mo`
                  )}
                </Button>
              </div>
            )}

          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};

export default ProAccessModal;
