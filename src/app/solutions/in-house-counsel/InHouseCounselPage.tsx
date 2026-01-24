"use client";
import React, { useState } from "react";
import {
  CheckCircle,
  FileText,
  Shield,
  BarChart3,
  ChevronDown,
  ArrowUpRight,
  Clock,
  Users,
  Search,
  Zap,
  BookOpen,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VaultSection from "@/components/home/vault";
import KnowledgeBase from "@/components/home/Knowledgebase";

const InHouseCounselPage = () => {
  const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Akoth Odipo Advocates" },
    { src: "/logos/7.png", alt: "Riskhouse International" },
    { src: "/logos/4.png", alt: "Netsheria" },
  ];

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
                      <rect x="10" y="-0.84668" width="1200" height="811.693" fill="url(#paint0_linear_186_1134)" />
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
                      <rect x="699.711" y="81" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.08" />
                      <rect x="195.711" y="153" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.09" />
                      <rect x="1023.71" y="153" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.09" />
                      <rect x="123.711" y="225" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.09" />
                      <rect x="1095.71" y="225" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.09" />
                      <rect x="951.711" y="297" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.09" />
                      <rect x="231.711" y="333" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.07" />
                      <rect x="303.711" y="405" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.07" />
                      <rect x="87.7109" y="405" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.09" />
                      <rect x="519.711" y="405" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.08" />
                      <rect x="771.711" y="405" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.09" />
                      <rect x="591.711" y="477" width="36" height="36" fill="hsl(var(--primary))" fillOpacity="0.07" />
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
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="159.394" result="effect1_foregroundBlur_186_1134" />
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
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="478.182" result="effect1_foregroundBlur_186_1134" />
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
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="79.6969" result="effect1_foregroundBlur_186_1134" />
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
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="159.394" result="effect1_foregroundBlur_186_1134" />
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
                      <rect width="1220" height="810" rx="16" fill="hsl(var(--foreground))" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
        
              {/* Header positioned at top of hero container */}
              <div className="absolute top-0 left-0 right-0 z-20">
              </div>
        <div className="section-container mx-auto px-5 z-10 relative">
          <div className="relative grid grid-cols- lg:grid-cols-2 gap-5 items-center ">
            <div className="text-primary lg:basis-1/2 text-center lg:text-left space-y-5">
              <p className="text-body mb-2">AI For In-House Legal Teams </p>
              <h1 className="text-heading-1  font-serif max-w-4xl">
               Do More Legal Work with Less
              </h1>
              <button className="inline-flex items-center px-6 py-3 bg-secondary w-fit text-white font-semibold rounded-lg shadow hover:bg-primary transition">
                Get Started
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </button>
            </div>
            {/* Hero image */}
            <img
              src={"/images/in-house-counsel.jpg"}
              alt="in house consel"
              className="rounded-lg rounded-b-none "
            />
          </div>
        </div>
      </section>
      <section className="section-spacing bg-white">
        <div className="section-container flex flex-col justify-between lg:flex-row gap-16">
          {/* Active Stats */}
          <div className="text-left mb-2 lg:mb-8">
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider text-center lg:text-left">
              Get Immediate Return On Investment
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {/* Stat 1 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                30%
              </h3>
              <p className="text-md text-gray-600">
                Average measured
                <br />
                boost in productivity
              </p>
            </div>

            {/* Stat 2 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                +5hrs
              </h3>
              <p className="text-md text-gray-600">
                Weekly time savings
                <br />
                from routine tasks
              </p>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                $2.3m
              </h3>
              <p className="text-md text-gray-600">
                potential additional billing
                <br />
                per 100 lawyers annually
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
      icon: Zap,
      title: "Quick-Start Drafting",
      description:
        "Jumpstart any legal document effortlessly with AI-powered drafting tools and a professional legal template library.",
      href: "#",
    },
    {
      icon: FileText,
      title: "Document Automation",
      description:
        "Upload,Tag,and gain instant insights from you documents to save time, accelerate decision-making, and close deals faster.",
      href: "#",
    },
    {
      icon: Sparkles,
      title: "Legal Research",
      description:
        "Get answers to complex legal questions with AI that searches through cases, statutes, and legal authorities in seconds.",
      href: "#",
    },
    {
      icon: MessageSquare,
      title: "Team Collaboration",
      description:
        "Brainstorm and share ideas with your team in real-time. Wansom enhances the quality and efficiency of your team's work.",
      href: "#",
    },
  ];

  return (
    <section className="section-spacing bg-primary">
      <div className="section-container">
        {/* Header */}
        <div className="text-center lg:text-start mb-12">
          <h2 className="text-heading-2 text-white capitalize tracking-wider">
            Your teammate with AI superpowers
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      title: "Negotiate Contracts Faster",
      description:
        "Automate contract review and redlining to speed up negotiations and close deals faster.",
      image: "/images/collaborative-workspace.png",
    },
    {
      title: "Risk Management",
      description:
        "Identify, track and mitigate legal risks before they become firm-wide problems.",
      image: "/images/collaborative-workspace.png",
    },
    {
      title: "Regulatory Compliance",
      description:
        "Monitor regulatory changes and ensure ongoing compliance across multiple jurisdictions.",
      image: "/images/collaborative-workspace.png",
    },
    {
      title: "Workflow Automation",
      description:
        "Create custom workflows for contract approvals, e-filling, and other repetitive legal processes.",
      image: "/images/collaborative-workspace.png",
    },
  ];

  return (
    <section className="section-spacing bg-gray-50">
      <div className="section-container">
        <h2 className="text-heading-2 text-gray-900 max-w-3xl mb-8 text-center mx-auto">
          How In-House Teams Use Wansom AI
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
          <div className="flex flex-col items-center gap-5 justify-center">
            <p className="text-xl text-gray-600 leading-relaxed mb-6 max-w-4xl text-center mx-auto">
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
        </div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is Wansom secure?",
      answer:
        "Yes, Wansom is built with enterprise-grade security. We use bank-level encryption (AES-256) for data at rest and in transit, maintain SOC 2 Type II compliance, and undergo regular third-party security audits. Your data is stored in secure, geographically distributed data centers with 99.9% uptime SLA. We never train our AI models on your confidential data, and you maintain complete ownership and control of your information.",
    },
    {
      question: "Can Wansom work across multiple jurisdictions?",
      answer:
        "Absolutely. Wansom supports legal research and compliance monitoring across 100+ jurisdictions worldwide, including federal, state, and local laws. Our AI is trained on jurisdiction-specific legal databases and can simultaneously search across multiple regions. You can filter results by jurisdiction, compare laws across different territories, and receive compliance alerts tailored to the jurisdictions relevant to your business operations.",
    },
    {
      question: "Does Wansom require additional training?",
      answer:
        "No extensive training is required. Wansom is designed to be intuitive and user-friendly, with most legal professionals becoming productive within hours. We provide comprehensive onboarding materials, video tutorials, and in-app guidance. For enterprise clients, we offer optional personalized training sessions and dedicated customer success managers. The platform learns from your usage patterns and can be customized with your firm's templates, playbooks, and preferences.",
    },
    {
      question: "How does Wansom AI accelerate deals?",
      answer:
        "Wansom accelerates deals by automating time-consuming tasks: contract review that normally takes hours is completed in minutes with AI-powered risk detection; automated redlining based on your playbook standards speeds up negotiations; smart templates enable business teams to self-serve on standard agreements; real-time collaboration features keep all stakeholders aligned; and obligation tracking ensures nothing falls through the cracks. On average, our clients report 70% faster contract turnaround times.",
    },
    {
      question: "What is Wansom AI pricing?",
      answer:
        "Wansom offers flexible pricing to suit organizations of all sizes. We have subscription plans based on the number of users and features needed, starting with a free tier for individual practitioners. Our Professional plan is ideal for small legal teams, while our Enterprise plan includes advanced features like custom integrations, dedicated support, and unlimited AI usage. We also offer custom pricing for large organizations with specific requirements. Contact our sales team for a personalized quote and demo tailored to your needs.",
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
            Everything you need to know about Wansom AI for in-house counsel
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

export default InHouseCounselPage;
