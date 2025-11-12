
'use client'
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { ArrowRight, CheckCircle, ChevronRight, Circle, Globe, Loader, Sparkles, Target, Zap,RotateCcw, Search, MapPin, Eye, Check, X,ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {PatnerLogoSection} from "@/components/home/Partnerlogos";
import { useState, useEffect } from "react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

// Handle navbar transparency on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div >
      <Navbar/>
      <main>
        <HeroSection/>
        {/* <section className="section-container " id="ai-assistant">
         <img src='/academy-demo.png' alt='Partner Logos' className='w-full h-auto object-cover mb-8 rounded-lg' />
       </section> */}
        <PatnerLogoSection/>
       
        <HowITWorksSection/>
        <AutomateSeo/>
       
      </main>
      <Footer/>
    </div>
  );
}

function AutomateSeo() {
  return (
    <section className="section-spacing" id="whyjoin">
      <div className="section-container pb-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-heading-2 mb-6 text-gray-900 font-serif">
              Why Join the Program
            </h2>
            <p className="text-body text-gray-600 mb-8">
            We have 20 exclusive spots for top lawyers to learn how to use AI search engines to automate their client acquisition pipeline.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#355e66] rounded-lg flex items-center justify-center p-3">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                     Dedicated Accounts Manager
                  </h3>
                  <p className="text-gray-600">
                   You will be assigned a spcialist for three weeks to guide you through the process.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#d47b0f] rounded-lg flex items-center justify-center p-3">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Watch the AI Magic</h3>
                  <p className="text-gray-600">
                  Once you are done with research and optimization, automate your pipeline with AI and monitor progress.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center p-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                  Review and Optimize
                  </h3>
                  <p className="text-gray-600">
                   Based on the performance, we review and tweak the AI model to improve the results.
                  </p>
                </div>
              </div>
            </div>
            <button 
        className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-[#d47b0f] hover:bg-black rounded-md py-3 px-6 mt-10"
        onClick={() => window.location.href = '/demo'}
      >
         Submit Your Application <ArrowUpRight className='w-5 h-5 text-white' />
      </button>
          </div>
          
          <ResearchSourcesWorkflow />
        </div>
      </div>
    </section>
  );
}

function ResearchSourcesWorkflow() {
  return (
    <div className="max-w-4xl mx-auto bg-primary p-8 rounded-3xl">
      {/* Top Card */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-3 justify-between">
          <h2 className="text-md font-semibold text-gray-900">
            Injury Arttoney in Newyork
          </h2>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Bottom Card with Workflow Steps */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="space-y-6">
          {/* Step 1 - Completed */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-medium text-gray-900">
            Retrivieng competitor list
            </span>
          </div>

          {/* Step 2 - In Progress */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Loader className="w-6 h-6 text-primary animate-spin" />
            </div>
            <span className="text-lg font-medium text-gray-900">
              Generating your AI profile
            </span>
          </div>

          {/* Step 3 - Pending */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Circle className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-lg font-medium text-gray-500">
              Compare page ranking and SEO score
            </span>
          </div>

          {/* Step 4 - Pending */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Circle className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-lg font-medium text-gray-500">
              Deploy your AI profile
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function TeamSection(){
 return(
  <div className="section-container section-spacing">
    <h2 className="text-heading-2 text-center mb-3">
 Save More Time for what Matters
    </h2>
<p className="text-body max-w-4xl text-center mx-auto mb-6">
 Save hours each week with our AI-powered client qualification system. Set your preferences once, and our assistant will pre-screen potential clients, ensuring you only spend time on qualified leads that match your practice.
</p>
<div className=" w-full h-full">
<img src="/meeting.jpg" className="w-full h-full object-cover  object-center rounded  max-h-[500px]"/>
</div>

  </div>
 ) 
}

function HeroSection(){

  return (
    <section
    className="  pt-24 md:pt-20 pl-5  bg-primary relative overflow-hidden"
  >
   
      <div className=" container mx-auto grid lg:grid-cols-2 gap-5 items-center">
        {/* Left Side - Content */}
        <div className="text-left space-y-8">
          <div className="space-y-6">
         <h1 className=" text-heading-1 mb-4 text-white text-shadow-2xs capitalize font-serif">
   AI Built for Lawyers
      </h1>
      
      <p className="text-lg md:text-xl max-w-4xl mb-8  text-[#f3f4f4]">
        Are you struggling to get more clients for your legal practice? Apply to be part of our AI-first marketing program for lawyers to help automate your client acquisition pipeline.
      </p>
<button 
        className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-[#d47b0f] hover:bg-black rounded-md py-3 px-6 mb-10"
        onClick={() => window.location.href = '/demo'}
      >
         Submit Your Application <ArrowUpRight className='w-5 h-5 text-white' />
      </button>
          </div>

        </div>

        {/* Right Side - Form */}
        <div>
          <img src="/law-office.jpg"/>

        </div>

    </div>
  </section>
  );
};

function HowITWorksSection () {
  const features = [
    {
      id: 'content-engine',
      title: 'AI Content Engine',
      description: 'Generates service pages, articles & FAQs that rank automatically on AI search engines.',
      bgColor: 'bg-gray-50',
      accentColor: 'bg-gray-800',
      illustration: (
        <div className="relative">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-200 rounded-lg p-3 relative">
              <div className="w-full h-8 bg-gray-300 rounded mb-2"></div>
              <div className="w-3/4 h-2 bg-gray-400 rounded mb-1"></div>
              <div className="w-1/2 h-2 bg-gray-400 rounded"></div>
              <Search className="absolute -top-1 -right-1 w-4 h-4 text-gray-700" />
            </div>
            <div className="bg-gray-200 rounded-lg p-3">
              <div className="w-full h-8 bg-gray-300 rounded mb-2"></div>
              <div className="w-2/3 h-2 bg-gray-400 rounded mb-1"></div>
              <div className="w-4/5 h-2 bg-gray-400 rounded"></div>
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'local-seo',
      title: 'Local SEO Autopilot',
      description: 'Optimizes your firm\'s profile for "lawyer near me" queries in 300+ cities and practice areas.',
      bgColor: 'bg-gray-100',
      accentColor: 'bg-black',
      illustration: (
        <div className="relative flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="bg-gray-200 rounded-lg p-3 w-16 h-12 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-gray-700" />
            </div>
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
            <div className="text-gray-800 font-bold text-sm">300+</div>
            <div className="bg-gray-200 rounded-lg p-3 w-16 h-12 flex items-center justify-center">
              <div className="w-8 h-2 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'competitor-intelligence',
      title: 'Competitor Intelligence',
      description: 'See why top firms are featured — and get content suggestions to outrank them.',
      bgColor: 'bg-gray-50',
      accentColor: 'bg-gray-900',
      illustration: (
        <div className="relative flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-gray-400 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gray-500 rotate-45"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-gray-700 rounded-full"></div>
            <div className="absolute top-1/2 -left-8 w-6 h-6 border-2 border-gray-400 rotate-45"></div>
            <div className="absolute top-1/2 -right-8 w-4 h-4 bg-gray-500"></div>
          </div>
        </div>
      )
    },
    {
      id: 'leads-from-chat',
      title: 'Leads from AI Chat',
      description: 'Turns real potential client questions from AI chat into referrals.',
      bgColor: 'bg-gray-100',
      accentColor: 'bg-gray-800',
      illustration: (
        <div className="relative flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="absolute -top-1 -right-1 bg-gray-300 rounded-full px-2 py-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="bg-white" id="about">
      <div className="section-container section-spacing">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-heading-2 mb-3 leading-tight capitalize text-black font-serif">
           The AI Transformation
          </h1>
          <p className="text-body text-gray-600 max-w-4xl mx-auto mb-6 leading-relaxed">
            AI is changing how consumers search for legal services. 96% of people seeking legal help start with Google, yet the only average of three sources can be shown by Gemini at a time making top-ranking firms in major cities are capture 60-80% of online leads. 
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`${feature.bgColor} rounded-xl shadow-lg p-8 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden border border-gray-200`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)`
                }}></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Title at top */}
                <h3 className="text-xl font-bold text-black mb-6 text-center">
                  {feature.title}
                </h3>
                
                {/* Illustration in middle */}
                <div className="h-24 mb-6 flex items-center justify-center flex-grow">
                  {feature.illustration}
                </div>
                
                {/* Description and Arrow at bottom */}
                <div className="mt-auto flex items-center justify-between">
                  <p className="text-gray-600 leading-relaxed text-center">
                    {feature.description}
                  </p>
                  
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

function PricingSection () {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  const router = useRouter()

  // Pricing data
  const plans = [
    {
      name: "Lite",
      description: "For individuals starting with basic legal needs",
      priceMonthly: "39",
      priceAnnually: "37",
      features: [
        { name: "Optimized AI search profile ", included: true },
        { name: "5 Optimized content pages", included: true },
        { name: "Personalized profile FAQs", included: true },
        { name: "weekly competitor ranking insights", included: true },
        { name: "weekly keyword research and rotation", included: true },
        { name: "Upto 3 practice area profiles", included: true },
        { name: "Upto 3 location profile rankings", included: true },
         {name: "Access to wansom AI legal Assistant", included: true },
      ],
      popular: false,
      cta: "Create Account",
      ctaColor: "bg-gray-700 hover:bg-[#005c4d]"
    },
    {
      name: "Professional",
      description: "For legal professionals and law firms",
      priceMonthly: "87",
      priceAnnually: "85",
      features: [
        { name: "Optimized AI search profile ", included: true },
        { name: "10 weekly Optimized content pages", included: true },
        { name: "Personalized profile FAQs", included: true },
        { name: "Deep weekly competitor ranking insights with reports", included: true },
        { name: "Weekly keyword research and rotation", included: true },
        { name: "Upto 15 practice area profiles", included: true },
        { name: "Unlimited location profile rankings", included: true },
         {name: "Access to wansom AI legal Assistant", included: true },
      ],
      popular: true,
      cta: "Create Account",
      ctaColor: "bg-primary hover:bg-green-800"
    },
    {
      name: "Enterprise",
      description: "For law firms and legal departments",
      priceMonthly: "199",
      priceAnnually: "195",
      features: [
         { name: "Optimized AI search profile", included: true },
        { name: "Unlimited Optimized content pages", included: true },
        { name: "Personalized profile FAQs", included: true },
        { name: "Optimized AI profiles for team members", included: true },
        { name: "Deep weekly competitor ranking insights with reports", included: true },
        { name: "Weekly keyword research and rotation", included: true },
        { name: "Unlimited practice area profiles", included: true },
        { name: "Unlimited location profile rankings", included: true },
         {name: "Access to wansom legal AI suite", included: true },
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
                billingPeriod === 'annually' ? 'bg-primary' : 'bg-gray-300'
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
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-secondary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide flex items-center">
                  Most Popular <Sparkles className="ml-1 w-3 h-3" />
                </div>
              )}
              
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-gray-600 mt-2 mb-6">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceAnnually}
                </span>
                <span className="text-gray-600 ml-2">
                  / month
                </span>
                {billingPeriod === 'annually' && plan.priceMonthly !== "0" && (
                  <div className="text-sm text-primary mt-1">
                    ${(Number(plan.priceMonthly) * 12 - Number(plan.priceAnnually) * 12).toFixed(0)} saved per year
                  </div>
                )}
              </div>
              
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
          <h3 className="text-2xl font-bold mb-3">Need a custom AI solution?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We offer tailored AI solutions to fit unique legal workflows and requirements.
            Our team will work with you to create a custom plan.
          </p>
          <Link href="https://calendly.com/wansomco/30min" className="inline-flex items-center bg-primary hover:bg-green-800 text-white py-3 px-6 rounded-md font-medium transition-colors">
            Contact Our Sales Team
          </Link>
        </div>
      </div>
    </section>
  );
}