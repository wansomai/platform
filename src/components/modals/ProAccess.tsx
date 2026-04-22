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
import { Crown, Zap, Loader2, Check, X } from "lucide-react";
import { apiService } from "@/lib/api";
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
  "Everything in Explorer",
  "Ongoing monthly access",
  "Up to 5 GB vault storage",
  "Priority email & phone support",
  "Best value for regular use",
];

const TEAM_FEATURES = [
  "Everything in Pro",
  "Invite and collaborate with your team",
  "Role-based organization access",
  "Per-seat billing with scalable growth",
  "Best for law firms and legal teams",
];

const FREE_FEATURES = [
  "2 workspaces",
  "8 AI messages / month",
  "Basic document drafting",
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
    sub: "Upgrade to keep going.",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full shrink-0 mt-0.5">
                <Crown className="h-5 w-5 text-amber-600" />
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

        {/* Step 1: choose plan flow */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setPlanFlow("personal")}
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                planFlow === "personal"
                  ? "bg-white text-[#0a4b5e] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => setPlanFlow("teams")}
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                planFlow === "teams"
                  ? "bg-white text-[#0a4b5e] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Team
            </button>
          </div>
        </div>

        {paymentError && (
          <div className="mx-5 mt-3 text-xs text-red-600 bg-red-50 rounded-md px-3 py-2 border border-red-200">
            {paymentError}
          </div>
        )}

        {/* Personal flow: Free + Explorer + Pro */}
        {planFlow === "personal" && (
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* ── Free (current — greyed out) ── */}
          {!explorerExpired && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 opacity-70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Free
                </span>
                <Badge variant="secondary" className="text-[10px] h-5 bg-gray-200 text-gray-600">
                  Current
                </Badge>
              </div>
              <p className="text-2xl font-bold text-gray-400 mb-3">$0</p>
              <ul className="space-y-1.5 mb-4">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-gray-400">
                    <X className="h-3 w-3 shrink-0 mt-0.5 text-gray-300" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs opacity-50"
                disabled
              >
                Your current plan
              </Button>
            </div>
          )}

          {/* ── Explorer (featured) ── */}
          <div
            className={`rounded-xl border-2 border-amber-400 bg-amber-50 p-4 relative ${
              explorerExpired ? "opacity-90" : ""
            }`}
          >
            <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] h-5 bg-amber-500 text-white px-2 whitespace-nowrap">
              {explorerExpired ? "Renew Access" : "Try First"}
            </Badge>
            <div className="flex items-center justify-between mb-1 mt-1">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Explorer
              </span>
            </div>
            <div className="mb-1">
              <span className="text-2xl font-bold text-gray-900">{explorerLabel}</span>
              <span className="text-xs text-gray-500 ml-1">/ 2 weeks</span>
            </div>
            <p className="text-[11px] text-amber-700 mb-3">One-time · no subscription</p>
            <ul className="space-y-1.5 mb-4">
              {EXPLORER_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-gray-700">
                  <Check className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => initializePayment("explorer")}
              disabled={isAnyLoading}
              className="w-full text-xs bg-amber-500 hover:bg-amber-600 text-white"
              size="sm"
            >
              {isProcessingExplorer ? (
                <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Processing…</>
              ) : (
                `Continue for ${explorerLabel}`
              )}
            </Button>
          </div>

          {/* ── Pro (monthly) ── */}
          <div className={`rounded-xl border border-gray-200 bg-white p-4 relative ${explorerExpired ? "border-2 border-amber-400 bg-amber-50" : ""}`}>
            {explorerExpired && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] h-5 bg-amber-500 text-white px-2 whitespace-nowrap">
                Recommended
              </Badge>
            )}
            <div className="flex items-center justify-between mb-1 mt-1">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Pro
              </span>
              <Badge variant="secondary" className="text-[10px] h-5 bg-green-100 text-green-700">
                Best Value
              </Badge>
            </div>
            <div className="mb-1">
              <span className="text-2xl font-bold text-gray-900">{proLabel}</span>
              <span className="text-xs text-gray-500 ml-1">/ month</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Cancel anytime</p>
            <ul className="space-y-1.5 mb-4">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-gray-700">
                  <Check className="h-3 w-3 shrink-0 mt-0.5 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => initializePayment("personal")}
              disabled={isAnyLoading}
              variant={explorerExpired ? "default" : "outline"}
              className={`w-full text-xs ${explorerExpired ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
              size="sm"
            >
              {isProcessingPro ? (
                <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Processing…</>
              ) : (
                `Subscribe · ${proLabel}/mo`
              )}
            </Button>
          </div>
        </div>
        )}

        {/* Team flow: Team-only card */}
        {planFlow === "teams" && (
          <div className="px-5 py-4">
            <div className="rounded-xl border-2 border-[#0a4b5e] bg-white p-4 shadow-[0_1px_0_rgba(10,75,94,0.06)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#0a4b5e] uppercase tracking-wide">
                  Team
                </span>
                <Badge className="text-[10px] h-5 bg-[#0a4b5e] text-white px-2">
                  Team Plan
                </Badge>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-gray-900">{teamUnitLabel}</span>
                <span className="text-xs text-gray-500 ml-1">/ seat / month</span>
              </div>
              <p className="text-xs text-[#0a4b5e] mb-3">Choose seats and continue to checkout</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Firm name</label>
                  <input
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="Enter firm name"
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-[#0a4b5e] focus:ring-2 focus:ring-[#0a4b5e]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Seats</label>
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
                className="w-full text-xs bg-[#0a4b5e] hover:bg-[#083b4a] text-white"
                size="sm"
              >
                {isProcessingTeam ? (
                  <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Processing…</>
                ) : (
                  `Continue · ${teamTotalLabel}/mo`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-center">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Maybe later →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProAccessModal;
