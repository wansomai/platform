// components/PricingSection.tsx
'use client'
import React, { useState } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation'
import Link from 'next/link';

const PricingSection: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  const router = useRouter()

  // Pricing data
  const plans = [
    {
      name: "Free",
      description: "For individuals starting with basic legal needs",
      priceMonthly: "0",
      priceAnnually: "0",
      features: [
        { name: "Access to Legal AI Assistant", included: true },
        { name: "Upto 200MB Document Vault Storage", included: true },
        { name: "One dedicated workspace", included: true },
        { name: "Limited document generation", included: true },
        { name: "Up to 3 automated processes per month", included: true },
        { name: "No Integrations Supported", included: true },
        { name: "Email support", included: true },
        { name: "Custom workflows", included: false },
        { name: "Advanced AI automations", included: false },
        { name: "Priority support", included: false },
      ],
      popular: false,
      cta: "Try It Free",
      ctaColor: "bg-gray-700 hover:bg-[#005c4d]"
    },
    {
      name: "Professional",
      description: "For legal professionals and small practices",
      priceMonthly: "39",
      priceAnnually: "29",
      features: [
        { name: "Access to Legal AI Assistant", included: true },
        { name: "Upto 5GB Document Vault Storage", included: true },
        { name: "Upto 5 dedicated workspaces", included: true },
        { name: "Unlimited document generation", included: true },
        { name: "Up to 15 automated processes", included: true },
        { name: "Access to All Integrations", included: true },
        { name: "Email & chat support", included: true },
        { name: "Custom workflows", included: true },
        { name: "Advanced AI automations", included: false },
        { name: "Priority support", included: true },
      ],
      popular: true,
      cta: "Request Access",
      ctaColor: "bg-primary hover:bg-green-800"
    },
    {
      name: "Enterprise",
      description: "For law firms and legal departments",
      priceMonthly: "99",
      priceAnnually: "79",
      features: [
        { name: "Access to Legal AI Assistant", included: true },
        { name: "Upto 10GB Document Vault Storage", included: true },
        { name: "Unlimited dedicated workspaces", included: true },
        { name: "Unlimited document generation", included: true },
        { name: "Unlimited automated processes", included: true },
        { name: "Access to All Integrations", included: true },
        { name: "Request Custom Integrations", included: true },
        { name: "Email & chat support", included: true },
        { name: "Custom workflows", included: true },
        { name: "Advanced AI automations", included: true },
        { name: "Priority support", included: true },
      ],
      popular: false,
      cta: "Book A Demo",
      ctaColor: "bg-gray-700 hover:bg-yellow-600"
    }
  ];

  return (
    <section className="mt-20 py-20 bg-gray-50" id="pricing">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-16">
          <p>Wansom AI Pricing</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the plan that's right for your legal needs. All plans include access to our core features.
          </p>
          
          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center">
            <span className={`mr-4 text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly Billing
            </span>
            <button 
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annually' : 'monthly')}
              className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                billingPeriod === 'annually' ? 'bg-green-700' : 'bg-gray-300'
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
            <span className={`ml-4 text-sm font-medium ${billingPeriod === 'annually' ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual Billing
              <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={plan.name} 
              className={`relative rounded-lg ${
                plan.popular ? 'border-2 border-green-700 shadow-xl' : 'border border-gray-300'
              } bg-white p-6 md:p-8 flex flex-col h-full`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-700 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide flex items-center">
                  Most Popular <Sparkles className="ml-1 w-3 h-3" />
                </div>
              )}
              
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-gray-600 mt-2 mb-6">{plan.description}</p>
              
              {/* <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceAnnually}
                </span>
                <span className="text-gray-600 ml-2">
                  / month
                </span>
                {billingPeriod === 'annually' && plan.priceMonthly !== "0" && (
                  <div className="text-sm text-green-700 mt-1">
                    ${(Number(plan.priceMonthly) * 12 - Number(plan.priceAnnually) * 12).toFixed(0)} saved per year
                  </div>
                )}
              </div> */}
              
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    {feature.included ? (
                      <Check className="text-green-700 w-5 h-5 flex-shrink-0 mr-2" />
                    ) : (
                      <X className="text-gray-400 w-5 h-5 flex-shrink-0 mr-2" />
                    )}
                    <span className={feature.included ? "" : "text-gray-400"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <button 
                className={`${plan.ctaColor} text-white py-3 px-4 rounded-md font-medium transition-colors w-full mt-auto`} 
                onClick={() => router.push('/register')}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Enterprise Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold mb-3">Need a custom solution?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We offer tailored solutions for large organizations with unique legal requirements.
            Our team will work with you to create a custom plan.
          </p>
          <Link href="https://calendly.com/wansomco/30min" className="inline-flex items-center bg-[#005c4d] hover:bg-green-800 text-white py-3 px-6 rounded-md font-medium transition-colors">
            Contact Our Sales Team
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;