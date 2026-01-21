"use client";
import React, { useState } from "react";
import {
  FileText,
  ChevronDown,
  ArrowUpRight,
  Search,
  Scale,
  Gavel,
  Sparkles,
  SquareArrowOutUpRight,
  ArrowRight,
  TrendingUp,
  Target,
  Brain,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VaultSection from "@/components/home/vault";
import KnowledgeBase from "@/components/home/Knowledgebase";

const LitigationLawyersPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-5 relative overflow-hidden">
        {/* SVG Background */}
        <div className="absolute inset-0 z-0">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1220 810"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <g clipPath="url(#clip0_186_1134)">
              <mask
                id="mask0_186_1134"
                style={{ maskType: "alpha" }}
                maskUnits="userSpaceOnUse"
                x="10"
                y="-1"
                width="1200"
                height="812"
              >
                <rect
                  x="10"
                  y="-0.84668"
                  width="1200"
                  height="811.693"
                  fill="url(#paint0_linear_186_1134)"
                />
              </mask>
              <g mask="url(#mask0_186_1134)">
                {/* Grid Rectangles */}
                {[...Array(35)].map((_, i) => (
                  <React.Fragment key={`row1-${i}`}>
                    <rect
                      x={-20.0891 + i * 36}
                      y="9.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="45.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="81.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="117.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="153.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="189.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="225.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="261.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="297.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="333.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="369.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="405.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="441.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="477.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="513.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="549.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="585.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="621.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="657.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="693.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="729.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={-20.0891 + i * 36}
                      y="765.2"
                      width="35.6"
                      height="35.6"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity="0.11"
                      strokeWidth="0.4"
                      strokeDasharray="2 2"
                    />
                  </React.Fragment>
                ))}
                {/* Specific Rectangles with fill */}
                <rect
                  x="699.711"
                  y="81"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.08"
                />
                <rect
                  x="195.711"
                  y="153"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.09"
                />
                <rect
                  x="1023.71"
                  y="153"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.09"
                />
                <rect
                  x="123.711"
                  y="225"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.09"
                />
                <rect
                  x="1095.71"
                  y="225"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.09"
                />
                <rect
                  x="951.711"
                  y="297"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.09"
                />
                <rect
                  x="231.711"
                  y="333"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.07"
                />
                <rect
                  x="303.711"
                  y="405"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.07"
                />
                <rect
                  x="87.7109"
                  y="405"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.09"
                />
                <rect
                  x="519.711"
                  y="405"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.08"
                />
                <rect
                  x="771.711"
                  y="405"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.09"
                />
                <rect
                  x="591.711"
                  y="477"
                  width="36"
                  height="36"
                  fill="hsl(var(--primary))"
                  fillOpacity="0.07"
                />
              </g>
            </g>

            <rect
              x="0.5"
              y="0.5"
              width="1219"
              height="809"
              rx="15.5"
              stroke="hsl(var(--foreground))"
              strokeOpacity="0.06"
            />

            <defs>
              <filter
                id="filter0_f_186_1134"
                x="147.369"
                y="-467.818"
                width="1941.42"
                height="2035.46"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feGaussianBlur
                  stdDeviation="159.394"
                  result="effect1_foregroundBlur_186_1134"
                />
              </filter>
              <filter
                id="filter1_f_186_1134"
                x="-554.207"
                y="-1169.39"
                width="3216.57"
                height="3310.61"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feGaussianBlur
                  stdDeviation="478.182"
                  result="effect1_foregroundBlur_186_1134"
                />
              </filter>
              <filter
                id="filter2_f_186_1134"
                x="426.762"
                y="-452.424"
                width="1622.63"
                height="1716.67"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feGaussianBlur
                  stdDeviation="79.6969"
                  result="effect1_foregroundBlur_186_1134"
                />
              </filter>
              <filter
                id="filter3_f_186_1134"
                x="-253.163"
                y="-611.818"
                width="2221.95"
                height="2035.46"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feGaussianBlur
                  stdDeviation="159.394"
                  result="effect1_foregroundBlur_186_1134"
                />
              </filter>
              <linearGradient
                id="paint0_linear_186_1134"
                x1="35.0676"
                y1="23.6807"
                x2="903.8"
                y2="632.086"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="hsl(var(--foreground))" stopOpacity="0" />
                <stop offset="1" stopColor="hsl(var(--muted-foreground))" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_186_1134"
                x1="1118.08"
                y1="-149.03"
                x2="1118.08"
                y2="1248.85"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="hsl(var(--foreground))" />
                <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
                <stop offset="1" stopColor="hsl(var(--primary))" />
              </linearGradient>
              <linearGradient
                id="paint2_linear_186_1134"
                x1="1054.08"
                y1="-213.03"
                x2="1054.08"
                y2="1184.85"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="hsl(var(--foreground))" />
                <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
                <stop offset="1" stopColor="hsl(var(--primary))" />
              </linearGradient>
              <linearGradient
                id="paint3_linear_186_1134"
                x1="1238.08"
                y1="-293.03"
                x2="1238.08"
                y2="1104.85"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="hsl(var(--foreground))" />
                <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
                <stop offset="1" stopColor="hsl(var(--primary))" />
              </linearGradient>
              <radialGradient
                id="paint4_radial_186_1134"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(989.13 557.24) rotate(47.9516) scale(466.313 471.424)"
              >
                <stop stopColor="hsl(var(--foreground))" />
                <stop offset="0.157789" stopColor="hsl(var(--primary-light))" />
                <stop offset="1" stopColor="hsl(var(--primary))" />
              </radialGradient>
              <clipPath id="clip0_186_1134">
                <rect
                  width="1220"
                  height="810"
                  rx="16"
                  fill="hsl(var(--foreground))"
                />
              </clipPath>
            </defs>
          </svg>
        </div>

        {/* Header positioned at top of hero container */}
        <div className="absolute top-0 left-0 right-0 z-20"></div>
        <div className="section-container mx-auto px-5 z-10 relative">
          <div className="relative grid grid-cols-1  gap-5 items-center ">
            <div className="text-primary lg:basis-1/2 text-center lg:text-left space-y-5">
              <p className="text-body mb-2">AI For Litigation Lawyers</p>
              <h1 className="text-heading-1 font-serif max-w-4xl">
                Enjoy Winning More Cases with AI Inspired Teammates
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 mb-8">
                Prepare winning cases with AI that analyzes your arguments,
                predicts outcomes, and simulates opposing counsel strategies to
                strengthen your position.
              </p>
              <button
                className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-[#2a4d54] rounded-md py-3 px-6 mb-10 mx-auto lg:mx-0"
                onClick={() => (window.location.href = "/register")}
                aria-label="Try Wansom AI for free - Start your free trial"
              >
                TRY WANSOM FOR FREE{" "}
                <SquareArrowOutUpRight
                  className="w-5 h-5 text-white"
                  aria-hidden="true"
                />
              </button>
            </div>
            {/* Hero image */}
            <img
              src={"/images/supreme-court.jpg"}
              alt="litigation lawyers"
              className="rounded-lg rounded-b-none "
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-spacing bg-white">
        <div className="section-container flex flex-col justify-between lg:flex-row gap-16">
          {/* Active Stats */}
          <div className="text-left mb-2 lg:mb-8">
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider text-center lg:text-left">
              Actionable Results From Day One
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {/* Stat 1 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                70%
              </h3>
              <p className="text-md text-gray-600">
                Faster legal research
                <br />
                and case analysis
              </p>
            </div>

            {/* Stat 2 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                +10hrs
              </h3>
              <p className="text-md text-gray-600">
                Weekly time saved
                <br />
                per attorney
              </p>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                95%
              </h3>
              <p className="text-md text-gray-600">
                Accuracy in case law
                <br />
                citation and analysis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Key Capabilities Section */}
      <KeyCapabilities />

      <KnowledgeBase />
      <VaultSection />

      {/* FAQ Section */}
      <FAQSection />

      <Footer />
    </div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: Search,
      title: "Evidence Analysis",
      description:
        "AI automatically reviews all case materials, identifies key evidence, and suggests additional documentation needed.",
      href: "login",
    },
    {
      icon: Sparkles,
      title: "Case Strategy",
      description:
        "Role-play against AI opposition to test arguments, identify weaknesses, and refine your case strategy.",
      href: "login",
    },
    {
      icon: Scale,
      title: "Outcome Prediction",
      description:
        "Get data-driven predictions on case outcomes, settlement ranges, and optimal strategic timing.",
      href: "login",
    },
  ];

  return (
    <section className="section-spacing bg-primary">
      <div className="section-container">
        {/* Header */}
        <div className="text-center lg:text-start mb-12">
          <h2 className="text-heading-2 text-white capitalize tracking-wider">
            Your AI litigation partner
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white border border-gray-200 rounded-xl py-6 px-3 hover:shadow-lg transition-all duration-300"
            >
              {/* Icon */}
              <div className="mb-6">
                <feature.icon
                  className="w-12 h-12 text-primary"
                  strokeWidth={1.5}
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                {feature.description}
              </p>

              {/* Arrow Link */}
              <a
                href={feature.href}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300"
                aria-label={`Learn more about ${feature.title}`}
              >
                <ArrowUpRight className="w-5 h-5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const KeyCapabilities = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      title: "Legal Research",
      description:
        "Search through millions of cases, statutes, and regulations to find relevant authorities and build stronger arguments.",
    },
    {
      title: "Document Discovery",
      description:
        "Analyze thousands of documents quickly, identify key evidence, and organize discovery materials efficiently.",
    },
    {
      title: "Brief Preparation",
      description:
        "Generate court-ready legal briefs, motions, and pleadings with AI assistance and jurisdiction-specific formatting.",
    },
    {
      title: "Case Management",
      description:
        "Track deadlines, manage case files, and coordinate with your team using integrated case management tools.",
    },
  ];

  return (
    <section className="section-spacing bg-gray-50">
      <div className="section-container">
        <h2 className="text-heading-2 text-gray-900 max-w-3xl mb-8 text-center mx-auto">
          How Litigation Lawyers Use Wansom AI
        </h2>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-12">
          <div className="flex flex-wrap space-x-0 border-b border-gray-300">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeTab === index
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-5 justify-center">


            <div>
                <p className="text-xl text-gray-600 leading-relaxed mb-6 max-w-4xl  mx-auto">
              {tabs[activeTab].description}
            </p>
            <button
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition mx-auto"
              onClick={() => (window.location.href = "/register")}
            >
              Get Started
              <ArrowUpRight className="w-5 h-5 ml-2" />
            </button>
            </div>
          <CasePreparationInterface />
          </div>
        </div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does Wansom AI help with legal research?",
      answer:
        "Wansom AI uses advanced natural language processing to search through millions of legal documents, cases, and statutes. Simply describe your legal issue in plain language, and our AI will find relevant case law, identify applicable statutes, and surface key precedents. The system understands legal concepts and can find analogous cases even when different terminology is used.",
    },
    {
      question: "Can Wansom cite check my briefs?",
      answer:
        "Yes, Wansom includes comprehensive cite checking capabilities. Our AI verifies that all case citations are accurate, checks if cases have been overruled or distinguished, and ensures proper Bluebook or jurisdiction-specific citation format. This helps you avoid embarrassing citation errors and ensures your briefs meet court standards.",
    },
    {
      question: "Does Wansom work for all practice areas?",
      answer:
        "Absolutely. Wansom supports all major practice areas including civil litigation, criminal defense, family law, employment law, personal injury, and more. Our AI is trained on case law across multiple jurisdictions and practice areas, making it valuable for any litigation attorney regardless of specialty.",
    },
    {
      question: "How secure is my case information?",
      answer:
        "Security is our top priority. All case data is encrypted with bank-level AES-256 encryption, both in transit and at rest. We maintain SOC 2 Type II compliance and undergo regular security audits. Your confidential case information is never used to train our AI models, and you maintain complete ownership and control of all your data.",
    },
    {
      question: "What is the pricing for litigation lawyers?",
      answer:
        "We offer flexible pricing designed for solo practitioners and litigation firms of all sizes. Plans start with a free trial, followed by monthly or annual subscriptions based on the number of users and features needed. Our Professional plan includes unlimited legal research, document analysis, and brief drafting. Contact our sales team for custom enterprise pricing for larger firms.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="section-spacing bg-gray-50">
      <div className="section-container max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-heading-2 text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Wansom AI for litigation lawyers
          </p>
        </div>

        <div>
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between py-6 text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openFAQ === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openFAQ === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="pb-6">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CasePreparationInterface = () => {
  return (
    <div className="bg-primary rounded-lg p-4 relative overflow-hidden md:min-w-[500px]">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden lg:w-[75%]">
        <div className="flex items-center bg-gray-50 px-4 py-3 border-b">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="flex ml-auto space-x-4 text-sm">
            <button className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Analysis
            </button>
            <button className="flex items-center text-primary font-medium">
              <span className="w-2 h-2 bg-[#355e66] rounded-full mr-2"></span>
              Strategy
            </button>
            <button className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Predict
            </button>
          </div>
        </div>
        
        <div className="p-6 text-gray-900">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium">AI Opposition Simulation</h3>
                <p className="text-sm text-gray-600">Test arguments against AI counsel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium">Strategy Development</h3>
                <p className="text-sm text-gray-600">Build comprehensive case strategy</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium">Outcome Prediction</h3>
                <p className="text-sm text-gray-600">AI-powered success probability</p>
              </div>
            </div>
            
            <button className="text-sm text-gray-600 flex items-center">
              3 More Features <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center lg:text-left lg:w-[60%] absolute top-1/2 right-1 md:right-10">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">Case Analysis Report</div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-300 rounded w-full"></div>
              <div className="h-2 bg-gray-300 rounded w-3/4"></div>
              <div className="h-2 bg-green-500 rounded w-5/6"></div>
              <div className="h-2 bg-primary rounded w-1/2"></div>
              <div className="h-2 bg-gray-300 rounded w-2/3"></div>
              <div className="text-xs text-primary mt-2 font-medium">87% Success Rate</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">Case Strategy Preview</div>
        </div>
      </div>
    </div>
  );
};

export default LitigationLawyersPage;
