// components/PricingSection.tsx
'use client'
import React, { useState } from 'react';
import { Check, X, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PricingSection: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  const router = useRouter();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'For individuals exploring AI-powered legal work',
      priceMonthly: '0',
      priceAnnually: '0',
      priceSuffix: '/ month',
      popular: false,
      highlight: false,
      cta: 'Get Started Free',
      ctaAction: () => router.push('/register'),
      ctaVariant: 'outline' as const,
      features: [
        { name: '2 client/matter workspaces', included: true },
        { name: '8 AI Responses per month', included: true },
        { name: '500 MB Document Vault Storage', included: true },
        { name: 'Basic AI legal tools', included: true },
        { name: 'Community support', included: true },
        { name: 'AI Associates', included: false },
        { name: 'Calendar & Draft integrations', included: false },
        { name: 'Team collaboration', included: false },
      ],
    },
    {
      id: 'personal',
      name: 'Personal',
      description: 'Best for solo practitioners who want to do more',
      priceMonthly: '15',
      priceAnnually: '12',
      priceSuffix: '/ month',
      popular: true,
      highlight: false,
      cta: 'Upgrade Now',
      ctaAction: () => router.push('/login'),
      ctaVariant: 'primary' as const,
      features: [
        { name: 'Unlimited client/matter workspaces', included: true },
        { name: 'Unlimited AI Responses', included: true },
        { name: '5 GB Document Vault Storage', included: true },
        { name: 'Up to 10 AI Associates', included: true },
        { name: 'Google Calendar & Email integrations', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Team collaboration', included: false },
        { name: 'Custom workflows & deployments', included: false },
      ],
    },
    {
      id: 'teams',
      name: 'Teams',
      description: 'Collaborate on client matters with your whole firm',
      priceMonthly: '15',
      priceAnnually: '15',
      priceSuffix: '/ seat / month',
      popular: false,
      highlight: true,
      cta: 'Start Teams Plan',
      ctaAction: () => router.push('/login'),
      ctaVariant: 'teams' as const,
      features: [
        { name: 'Everything in Personal', included: true },
        { name: 'Unlimited AI Associates', included: true },
        { name: '50 GB Document Vault Storage', included: true },
        { name: 'Role-based access control', included: true },
        { name: 'Team collaboration tools', included: true },
        { name: 'Custom workflows & integrations', included: true },
        { name: 'Custom deployments', included: true },
        { name: 'Team training & priority support', included: true },
      ],
    },
  ];

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

          {/* Billing toggle — only relevant for Personal plan */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const displayPrice = billingPeriod === 'annually' ? plan.priceAnnually : plan.priceMonthly;
            // Teams plan is always billed monthly per seat regardless of toggle
            const isTeams = plan.id === 'teams';
            const showSavings =
              billingPeriod === 'annually' &&
              plan.priceMonthly !== '0' &&
              !isTeams &&
              Number(plan.priceMonthly) !== Number(plan.priceAnnually);

            return (
              <div
                key={plan.name}
                className={`relative rounded-xl flex flex-col h-full bg-white transition-shadow ${
                  plan.popular
                    ? 'border-2 border-secondary shadow-xl'
                    : plan.highlight
                    ? 'border-2 border-primary shadow-xl'
                    : 'border border-gray-200 shadow-sm'
                }`}
              >
                {/* Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                    Most Popular <Sparkles className="w-3 h-3" />
                  </div>
                )}
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                    For Teams <Zap className="w-3 h-3" />
                  </div>
                )}

                <div className="p-6 md:p-8 flex flex-col h-full">
                  {/* Plan name & description */}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${isTeams ? plan.priceMonthly : displayPrice}
                      </span>
                      <span className="text-gray-500 text-sm">{plan.priceSuffix}</span>
                    </div>
                    {showSavings && (
                      <p className="text-xs text-green-700 mt-1">
                        ${((Number(plan.priceMonthly) - Number(plan.priceAnnually)) * 12).toFixed(0)} saved per year
                      </p>
                    )}
                    {isTeams && (
                      <p className="text-xs text-gray-400 mt-1">
                        New seats billed prorated when members join
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, i) => (
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

                  {/* CTA */}
                  <button
                    onClick={plan.ctaAction}
                    className={`w-full mt-auto py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                      plan.ctaVariant === 'primary'
                        ? 'bg-secondary text-white hover:bg-green-800'
                        : plan.ctaVariant === 'teams'
                        ? 'bg-primary text-white hover:opacity-90'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
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
