'use client'
import React, { useState } from 'react';
import { Check, X, Sparkles, Zap, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  formatSubscriptionPrice,
  type PlanPricing,
  type ExplorerPricing,
  DEFAULT_SUBSCRIPTION_PRICING,
  DEFAULT_EXPLORER_PRICING,
} from '@/lib/subscriptionPricing';

interface PricingSectionProps {
  pricing?: PlanPricing;
  explorerPricing?: ExplorerPricing;
}

const EXPLORER_FEATURES = [
  'Unlimited AI responses',
  'AI Associates',
  'Unlimited client/matter workspaces',
  'Google Calendar & Gmail',
  'Draft, review & analyse documents',
  'Multi-jurisdiction research',
  'Full document vault',
];

const PERSONAL_FEATURES = [
  'Unlimited client/matter workspaces',
  'Unlimited AI Responses',
  '5 GB Document Vault Storage',
  'Up to 10 AI Associates',
  'Google Calendar & Email integrations',
  'Priority email support',
  'Team collaboration',
  'Custom workflows & deployments',
];

const TEAMS_FEATURES = [
  'Everything in Personal',
  'Unlimited AI Associates',
  '50 GB Document Vault Storage',
  'Role-based access control',
  'Team collaboration tools',
  'Custom workflows & integrations',
  'Custom deployments',
  'Team training & priority support',
];

const PricingSection: React.FC<PricingSectionProps> = ({
  pricing = DEFAULT_SUBSCRIPTION_PRICING,
  explorerPricing = DEFAULT_EXPLORER_PRICING,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  const router = useRouter();

  const personalMonthly = pricing.personal;
  const personalAnnual = Math.round(pricing.personal * 0.8);
  const personalCurrent = billingPeriod === 'annually' ? personalAnnual : personalMonthly;
  const annualSavings = (personalMonthly - personalAnnual) * 12;

  const personalLabel = formatSubscriptionPrice(personalCurrent, pricing.currency);
  const explorerLabel = formatSubscriptionPrice(explorerPricing.amount, explorerPricing.currency);
  const teamsLabel = formatSubscriptionPrice(pricing.teams, pricing.currency);
  const annualSavingsLabel = formatSubscriptionPrice(annualSavings, pricing.currency);

  return (
    <section className="section-spacing bg-gray-50" id="pricing">
      <div className="container mx-auto px-4">

        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-secondary uppercase tracking-widest mb-2">Pricing</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your practice. Upgrade or downgrade at any time — no contracts, no surprises.
          </p>

          {/* Billing toggle — only affects Personal plan */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annually' : 'monthly')}
              className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                billingPeriod === 'annually' ? 'bg-secondary' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={billingPeriod === 'annually'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  billingPeriod === 'annually' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'annually' ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual
              <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">

          {/* Free */}
          <div className="relative rounded-xl flex flex-col h-full bg-white border border-gray-200 shadow-sm">
            <div className="p-6 md:p-8 flex flex-col h-full">
              <h3 className="text-xl font-bold">Free</h3>
              <p className="text-gray-500 text-sm mt-1 mb-6">For individuals exploring AI-powered legal work</p>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500 text-sm">/ month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {[
                  { name: '2 client/matter workspaces', included: true },
                  { name: '8 AI Responses per month', included: true },
                  { name: '500 MB Document Vault Storage', included: true },
                  { name: 'Basic AI legal tools', included: true },
                  { name: 'Community support', included: true },
                  { name: 'AI Associates', included: false },
                  { name: 'Calendar & Draft integrations', included: false },
                  { name: 'Team collaboration', included: false },
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="text-green-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="text-gray-300 w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/register')}
                className="w-full mt-auto py-3 px-4 rounded-lg font-medium text-sm transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Get Started Free
              </button>
            </div>
          </div>

          {/* Explorer */}
          <div className="relative rounded-xl flex flex-col h-full bg-white border border-[#e89e00]/40 shadow-sm">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#e89e00] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide flex items-center gap-1 whitespace-nowrap">
              Try First <Flame className="w-3 h-3" />
            </div>
            <div className="p-6 md:p-8 flex flex-col h-full">
              <h3 className="text-xl font-bold">Explorer</h3>
              <p className="text-gray-500 text-sm mt-1 mb-6">14 days of full Pro access — no commitment</p>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{explorerLabel}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">one-time · 14 days</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {EXPLORER_FEATURES.map((name, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="text-green-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{name}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/login')}
                className="w-full mt-auto py-3 px-4 rounded-lg font-medium text-sm transition-colors bg-[#e89e00] text-white hover:bg-[#c78800]"
              >
                Start Explorer Trial
              </button>
            </div>
          </div>

          {/* Personal */}
          <div className="relative rounded-xl flex flex-col h-full bg-white border-2 border-secondary shadow-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
              Most Popular <Sparkles className="w-3 h-3" />
            </div>
            <div className="p-6 md:p-8 flex flex-col h-full">
              <h3 className="text-xl font-bold">Personal</h3>
              <p className="text-gray-500 text-sm mt-1 mb-6">Best for solo practitioners who want to do more</p>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{personalLabel}</span>
                  <span className="text-gray-500 text-sm">/ month</span>
                </div>
                {billingPeriod === 'annually' && (
                  <p className="text-xs text-green-700 mt-1">{annualSavingsLabel} saved per year</p>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {PERSONAL_FEATURES.map((name, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="text-green-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{name}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/login')}
                className="w-full mt-auto py-3 px-4 rounded-lg font-medium text-sm transition-colors bg-secondary text-white hover:bg-green-800"
              >
                Upgrade Now
              </button>
            </div>
          </div>

          {/* Teams */}
          <div className="relative rounded-xl flex flex-col h-full bg-white border-2 border-primary shadow-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
              For Teams <Zap className="w-3 h-3" />
            </div>
            <div className="p-6 md:p-8 flex flex-col h-full">
              <h3 className="text-xl font-bold">Teams</h3>
              <p className="text-gray-500 text-sm mt-1 mb-6">Collaborate on client matters with your whole firm</p>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{teamsLabel}</span>
                  <span className="text-gray-500 text-sm">/ seat / month</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">New seats billed prorated when members join</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {TEAMS_FEATURES.map((name, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="text-green-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{name}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/login')}
                className="w-full mt-auto py-3 px-4 rounded-lg font-medium text-sm transition-colors bg-primary text-white hover:opacity-90"
              >
                Start Teams Plan
              </button>
            </div>
          </div>

        </div>

        {/* FAQ-style note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          All plans start with a single seat. Teams plan seats are billed monthly — remove a member and the seat is released at the next renewal.
        </p>

        {/* Enterprise / Custom section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold mb-3">Need a custom enterprise solution?</h3>
          <p className="text-gray-500 mb-6 max-w-2xl mx-auto text-sm">
            Large law firms and legal departments can get custom pricing, on-premise deployments,
            SSO, advanced audit logs, and dedicated account management.
          </p>
          <Link
            href="https://calendly.com/wansomco/30min"
            className="inline-flex items-center bg-[#005c4d] hover:bg-green-800 text-white py-3 px-6 rounded-lg font-medium text-sm transition-colors"
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
