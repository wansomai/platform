'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Crown,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Infinity,
  Zap,
  RefreshCw,
  Loader2,
  Download,
} from 'lucide-react';
import ReceiptModal, { type ReceiptData } from '@/components/billing/ReceiptModal';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SubscriptionPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface Subscription {
  id: string;
  planName: string;
  planPrice: string | null;
  planType?: string | null;
  billingCycle: string | null;
  status: string;
  seatCount?: number | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  paystackSubscriptionId: string | null;
  recentPayments: SubscriptionPayment[];
}

interface SubscriptionStatus {
  subscription: Subscription | null;
  organization: { id: string; name: string; accountType: string };
  effectiveStatus: 'free' | 'active' | 'attention' | 'cancelled' | 'non_renewing';
  isEnterprise: boolean;
  isOwner: boolean;
  canUpgrade: boolean;
  canCancel: boolean;
  hasProAccess: boolean;
  associateCount: number;
  canViewBilling: boolean;
}

interface BillingCardProps {
  subscriptionStatus: SubscriptionStatus;
  onCancelClick: () => void;
  onRetry: () => Promise<{ success: boolean; message: string }>;
  isCancelling: boolean;
  isRetrying: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCycle(cycle: string | null | undefined) {
  if (!cycle) return '—';
  return cycle.charAt(0).toUpperCase() + cycle.slice(1);
}

function formatAmount(amount: number, currency: string) {
  // Paystack amounts are in smallest unit (kobo/cents)
  const major = amount / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${currency.toUpperCase()} ${major.toFixed(2)}`;
  }
}

function getDaysRemaining(end: string | null | undefined) {
  if (!end) return null;
  const diff = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Status Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    variant: 'default' as const,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  non_renewing: {
    label: 'Cancelling',
    variant: 'secondary' as const,
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  attention: {
    label: 'Payment Failed',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  free: {
    label: 'Free',
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-base font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gray-700">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      {text}
    </li>
  );
}

interface PaymentRowProps {
  payment: SubscriptionPayment;
  onView: () => void;
}

function PaymentRow({ payment, onView }: PaymentRowProps) {
  const isSuccess = payment.status === 'success';

  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-full p-1.5 ${
            isSuccess ? 'bg-emerald-50' : 'bg-red-50'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-800">
            {formatAmount(payment.amount, payment.currency)}
          </p>
          <p className="text-xs text-gray-400">
            {formatDate(payment.paidAt || payment.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-xs font-medium capitalize ${
            isSuccess ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {payment.status}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onView}
          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
          title="View receipt"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BillingCard({
  subscriptionStatus,
  onCancelClick,
  onRetry,
  isCancelling,
  isRetrying,
}: BillingCardProps) {
  const { subscription, effectiveStatus, isEnterprise, isOwner, associateCount } =
    subscriptionStatus;

  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const isTeams =
    subscription?.planType === 'teams' || isEnterprise;
  // If no subscription record but org is enterprise, treat as active
  const resolvedStatus: keyof typeof STATUS_CONFIG =
    !subscription && isEnterprise ? 'active' : (effectiveStatus as keyof typeof STATUS_CONFIG);
  const statusCfg = STATUS_CONFIG[resolvedStatus] ?? STATUS_CONFIG.free;
  const daysLeft = getDaysRemaining(subscription?.currentPeriodEnd);
  const isAttention = effectiveStatus === 'attention';
  const isNonRenewing = effectiveStatus === 'non_renewing';

  // Gradient: amber for personal pro, indigo for teams/enterprise
  const gradientClass = isTeams
    ? 'from-indigo-600 to-violet-600'
    : 'from-amber-500 to-orange-500';

  const planLabel = subscription?.planName
    ? `${subscription.planName} Plan`
    : isEnterprise
    ? 'Enterprise Plan'
    : 'Pro Plan';

  return (
    <div className="space-y-5">
      {/* ── Hero banner ──────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} p-6 text-white shadow-sm`}
      >
        {/* decorative circles */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 -right-4 h-24 w-24 rounded-full bg-white/10" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              <h2 className="text-xl font-bold">{planLabel}</h2>
            </div>
            {subscription?.planPrice && (
              <p className="text-3xl font-extrabold tracking-tight">
                {subscription.planPrice}
                <span className="ml-1 text-sm font-normal opacity-80">
                  /{formatCycle(subscription.billingCycle)}
                  {isTeams && subscription?.seatCount
                    ? ` · ${subscription.seatCount} seat${
                        subscription.seatCount > 1 ? 's' : ''
                      }`
                    : ''}
                </span>
              </p>
            )}
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.className}`}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Days remaining pill */}
        {daysLeft !== null && effectiveStatus !== 'cancelled' && (
          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Clock className="h-3 w-3" />
            {isNonRenewing
              ? `Access ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
              : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} until next billing`}
          </div>
        )}
      </div>

      {/* ── Attention alert ──────────────────────────────────── */}
      {isAttention && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-red-800">
              Your last payment failed
            </p>
            <p className="text-xs text-red-600">
              Please retry the charge to keep your plan active. If the issue
              persists, update your payment method on Paystack.
            </p>
          </div>
          {isOwner && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onRetry}
              disabled={isRetrying}
              className="shrink-0"
            >
              {isRetrying ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Retry
            </Button>
          )}
        </div>
      )}

      {/* ── Stat cards grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          label="Billing Cycle"
          value={formatCycle(subscription?.billingCycle)}
        />
        <StatCard
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Period Start"
          value={formatDate(subscription?.currentPeriodStart)}
        />
        <StatCard
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Next Billing"
          value={formatDate(subscription?.currentPeriodEnd)}
          sub={isNonRenewing ? 'Plan ends on this date' : undefined}
        />
        {isTeams && (subscription?.seatCount ?? 0) > 0 && (
          <StatCard
            icon={<Users className="h-3.5 w-3.5" />}
            label="Seats"
            value={`${subscription!.seatCount} seat${
              subscription!.seatCount! > 1 ? 's' : ''
            }`}
          />
        )}
      </div>

      {/* ── Included features & limits ───────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* What's included */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-800">
              What&apos;s included
            </h3>
          </div>
          <ul className="space-y-2">
            <FeatureRow text="Unlimited client/matter workspaces" />
            <FeatureRow text="Unlimited AI responses" />
            <FeatureRow text="Draft &amp; review unlimited contracts" />
            <FeatureRow text="Multi-jurisdiction research" />
            {isTeams ? (
              <>
                <FeatureRow text="Unlimited AI Associates" />
                <FeatureRow text="Team collaboration &amp; invitations" />
                <FeatureRow text="Up to 50 GB Vault Storage" />
                <FeatureRow text="Custom workflows &amp; integrations" />
              </>
            ) : (
              <>
                <FeatureRow text="Up to 10 AI Associates" />
                <FeatureRow text="Up to 5 GB Vault Storage" />
                <FeatureRow text="Google Calendar &amp; Email integrations" />
              </>
            )}
          </ul>
        </div>

        {/* Usage limits */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Infinity className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-800">
              Your limits
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-600">Projects</span>
                <span className="font-semibold text-gray-900">Unlimited</span>
              </div>
              <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: 'var(--color-green-light)' }}>
                <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: 'var(--color-dark)' }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-600">Messages / month</span>
                <span className="font-semibold text-gray-900">Unlimited</span>
              </div>
              <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: 'var(--color-green-light)' }}>
                <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: 'var(--color-dark)' }} />
              </div>
            </div>
            {isTeams ? (
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-600">AI Associates</span>
                  <span className="font-semibold text-gray-900">Unlimited</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-primary/15">
                  <div className="h-1.5 w-full rounded-full bg-primary" />
                </div>
              </div>
            ) : (
              (() => {
                const limit = 10;
                const used = associateCount;
                const remaining = Math.max(0, limit - used);
                const pct = Math.min(100, (used / limit) * 100);
                const barColor = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-amber-400';
                const trackColor = pct >= 90 ? 'bg-red-100' : 'bg-amber-100';
                return (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-600">AI Associates</span>
                      <span className="font-semibold text-gray-900">
                        {used} / {limit}
                        <span className="ml-1.5 text-xs font-normal text-gray-400">
                          ({remaining} remaining)
                        </span>
                      </span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full ${trackColor}`}>
                      <div
                        className={`h-1.5 rounded-full ${barColor} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* ── Payment history ──────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Payment History</h3>
        </div>
        {subscription?.recentPayments && subscription.recentPayments.length > 0 ? (
          <>
            <p className="mb-3 text-xs text-gray-400">
              Last {subscription.recentPayments.length} invoice{subscription.recentPayments.length !== 1 ? 's' : ''}
            </p>
            <div className="divide-y divide-gray-50">
              {subscription.recentPayments.map((p) => (
                <PaymentRow
                  key={p.id}
                  payment={p}
                  onView={() => setReceiptData({
                    paymentId: p.id,
                    amount: p.amount,
                    currency: p.currency,
                    status: p.status,
                    paidAt: p.paidAt,
                    createdAt: p.createdAt,
                    planName: subscription.planName,
                    planPrice: subscription.planPrice,
                    billingCycle: subscription.billingCycle,
                    organizationName: subscriptionStatus.organization.name,
                  })}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-3 text-xs text-gray-400">No payment records found.</p>
        )}
      </div>

      <ReceiptModal
        open={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  );
}
