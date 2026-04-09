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
  Zap,
  RefreshCw,
  Loader2,
  Download,
  BadgeCheck,
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

// ─── Brand tokens (from globals.css) ────────────────────────────────────────
const BRAND = {
  primary:    '#0a4b5e',
  secondary:  '#F18F01',
  primaryDim: '#E9F5F3',
  dark:       '#005c4d',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatCycle(cycle: string | null | undefined) {
  if (!cycle) return '—';
  return cycle.charAt(0).toUpperCase() + cycle.slice(1);
}

function formatAmount(amount: number, currency: string) {
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
  active:      { label: 'Active',         className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  non_renewing:{ label: 'Cancelling',     className: 'bg-orange-100 text-orange-700 border-orange-200' },
  attention:   { label: 'Payment Failed', className: 'bg-red-100 text-red-700 border-red-200' },
  cancelled:   { label: 'Cancelled',      className: 'bg-white/20 text-white border-white/30' },
  free:        { label: 'Free',           className: 'bg-white/20 text-white border-white/30' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-xl border p-4"
      style={{ background: BRAND.primaryDim, borderColor: `${BRAND.primary}20` }}
    >
      <div className="flex items-center gap-2" style={{ color: `${BRAND.primary}99` }}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-base font-semibold" style={{ color: BRAND.primary }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: `${BRAND.primary}80` }}>{sub}</p>}
    </div>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gray-700">
      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: BRAND.primary }} />
      {text}
    </li>
  );
}

function SectionCard({ icon, title, children }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border bg-white p-5 shadow-sm"
      style={{ borderColor: `${BRAND.primary}15` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ background: BRAND.primaryDim }}
        >
          <span style={{ color: BRAND.primary }}>{icon}</span>
        </div>
        <h3 className="text-sm font-semibold" style={{ color: BRAND.primary }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function UsageBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full" style={{ background: `${BRAND.primary}15` }}>
      <div
        className="h-1.5 rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function PaymentRow({ payment, onView }: { payment: SubscriptionPayment; onView: () => void }) {
  const isSuccess = payment.status === 'success';
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-1.5 ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {isSuccess
            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            : <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
        </div>
        <div>
          <p className="font-medium text-gray-800">{formatAmount(payment.amount, payment.currency)}</p>
          <p className="text-xs text-gray-400">{formatDate(payment.paidAt || payment.createdAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium capitalize ${isSuccess ? 'text-emerald-600' : 'text-red-500'}`}>
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
  const { subscription, effectiveStatus, isEnterprise, isOwner, associateCount } = subscriptionStatus;
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const isTeams = subscription?.planType === 'teams';
  const resolvedStatus: keyof typeof STATUS_CONFIG =
    !subscription && isEnterprise ? 'active' : (effectiveStatus as keyof typeof STATUS_CONFIG);
  const statusCfg = STATUS_CONFIG[resolvedStatus] ?? STATUS_CONFIG.free;
  const daysLeft = getDaysRemaining(subscription?.currentPeriodEnd);
  const isAttention = effectiveStatus === 'attention';
  const isNonRenewing = effectiveStatus === 'non_renewing';

  const planLabel = subscription?.planName
    ? `${subscription.planName} Plan`
    : isEnterprise ? 'Enterprise Plan' : 'Pro Plan';

  // Associate bar (personal only)
  const assocLimit = 10;
  const assocPct = Math.min(100, (associateCount / assocLimit) * 100);
  const assocColor = assocPct >= 90 ? '#ef4444' : BRAND.primary;

  return (
    <div className="space-y-5">

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-md"
        style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, #0d6b87 100%)` }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-10 -right-4 h-28 w-28 rounded-full bg-white/5" />
        {/* Secondary colour accent stripe */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${BRAND.secondary}, ${BRAND.secondary}cc)` }}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Crown className="h-4 w-4" style={{ color: BRAND.secondary }} />
              </div>
              <h2 className="text-xl font-bold">{planLabel}</h2>
            </div>
            {subscription?.planPrice && (
              <p className="text-3xl font-extrabold tracking-tight">
                {subscription.planPrice}
                <span className="ml-1 text-sm font-normal opacity-70">
                  /{formatCycle(subscription.billingCycle)}
                  {isTeams && subscription?.seatCount
                    ? ` · ${subscription.seatCount} seat${subscription.seatCount > 1 ? 's' : ''}`
                    : ''}
                </span>
              </p>
            )}
            <p className="text-sm text-white/60">{subscriptionStatus.organization.name}</p>
          </div>

          <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* Days remaining pill */}
        {daysLeft !== null && effectiveStatus !== 'cancelled' && (
          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
            <Clock className="h-3 w-3" style={{ color: BRAND.secondary }} />
            {isNonRenewing
              ? `Access ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
              : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} until next billing`}
          </div>
        )}
      </div>

      {/* ── Payment failed alert ─────────────────────────────── */}
      {isAttention && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-red-800">Your last payment failed</p>
            <p className="text-xs text-red-600">
              Please retry the charge to keep your plan active. If the issue persists, update your payment method on Paystack.
            </p>
          </div>
          {isOwner && (
            <Button
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="shrink-0 bg-red-600 hover:bg-red-700 text-white"
            >
              {isRetrying
                ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Retry
            </Button>
          )}
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<RefreshCw className="h-3.5 w-3.5" />} label="Billing Cycle"  value={formatCycle(subscription?.billingCycle)} />
        <StatCard icon={<Calendar className="h-3.5 w-3.5" />}  label="Period Start"   value={formatDate(subscription?.currentPeriodStart)} />
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
            value={`${subscription!.seatCount} seat${subscription!.seatCount! > 1 ? 's' : ''}`}
          />
        )}
      </div>

      {/* ── Features & limits ───────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SectionCard icon={<Zap className="h-3.5 w-3.5" />} title="What's included">
          <ul className="space-y-2">
            <FeatureRow text="Unlimited client/matter workspaces" />
            <FeatureRow text="Unlimited AI responses" />
            <FeatureRow text="Draft & review unlimited contracts" />
            <FeatureRow text="Multi-jurisdiction research" />
            {isTeams ? (
              <>
                <FeatureRow text="Unlimited AI Associates" />
                <FeatureRow text="Team collaboration & invitations" />
                <FeatureRow text="Up to 50 GB Vault Storage" />
                <FeatureRow text="Custom workflows & integrations" />
              </>
            ) : (
              <>
                <FeatureRow text="Up to 10 AI Associates" />
                <FeatureRow text="Up to 5 GB Vault Storage" />
                <FeatureRow text="Google Calendar & Email integrations" />
              </>
            )}
          </ul>
        </SectionCard>

        <SectionCard icon={<BadgeCheck className="h-3.5 w-3.5" />} title="Your limits">
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-600">Projects</span>
                <span className="font-semibold" style={{ color: BRAND.primary }}>Unlimited</span>
              </div>
              <UsageBar pct={100} color={BRAND.primary} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-600">Messages / month</span>
                <span className="font-semibold" style={{ color: BRAND.primary }}>Unlimited</span>
              </div>
              <UsageBar pct={100} color={BRAND.primary} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-600">AI Associates</span>
                {isTeams ? (
                  <span className="font-semibold" style={{ color: BRAND.primary }}>
                    {associateCount} active
                    <span className="ml-1.5 text-xs font-normal text-gray-400">(unlimited)</span>
                  </span>
                ) : (
                  <span className="font-semibold" style={{ color: assocColor }}>
                    {associateCount} / {assocLimit}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      ({Math.max(0, assocLimit - associateCount)} remaining)
                    </span>
                  </span>
                )}
              </div>
              <UsageBar pct={isTeams ? Math.min(100, (associateCount / 10) * 100) : assocPct} color={isTeams ? BRAND.primary : assocColor} />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Payment history ─────────────────────────────────── */}
      <SectionCard icon={<CreditCard className="h-3.5 w-3.5" />} title="Payment History">
        {subscription?.recentPayments && subscription.recentPayments.length > 0 ? (
          <>
            <p className="mb-3 text-xs text-gray-400">
              Last {subscription.recentPayments.length} invoice{subscription.recentPayments.length !== 1 ? 's' : ''}
            </p>
            <div className="divide-y" style={{ borderColor: `${BRAND.primary}10` }}>
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
      </SectionCard>

      {/* ── Cancel plan ─────────────────────────────────────── */}
      {isOwner && subscriptionStatus.canCancel && (
        <div
          className="flex items-center justify-between rounded-xl border bg-white px-5 py-4"
          style={{ borderColor: `${BRAND.primary}15` }}
        >
          <div>
            <p className="text-sm font-medium text-gray-800">Cancel subscription</p>
            <p className="text-xs text-gray-400">You will retain access until the end of your billing period.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelClick}
            disabled={isCancelling}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Cancel Plan'}
          </Button>
        </div>
      )}

      <ReceiptModal
        open={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </div>
  );
}
