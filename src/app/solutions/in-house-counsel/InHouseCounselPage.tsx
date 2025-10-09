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
import Image from "next/image";
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
      <section className="pt-24 md:pt-32 bg-primary relative overflow-hidden">
        <div className="container mx-auto px-5 z-10 relative">
          <div className="relative grid grid-cols-1 gap-12 items-center ">
            <div className="text-white lg:basis-1/2 text-center lg:text-left space-y-5">
              <p className="text-body mb-2">AI For In-House Legal Teams </p>
              <h1 className="text-heading-1 text-shadow font-serif max-w-4xl">
                Streamline Routine Legal Tasks so you focus on High Impact Work
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
        <div className="section-container flex flext-col justify-between lg:flex-row gap-16">
          {/* Active Stats */}
          <div className="text-left mb-8">
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
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
                Weekly time savings by
                <br />
                &gt;from routine tasks
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

const ContractManagementSection = () => {
  const [expandedSections, setExpandedSections] = useState({
    review: true,
    redlining: false,
    repository: false,
    templates: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <section className="section-spacing bg-white">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <img
            src="/images/collaborative-workspace.png"
            alt="Contract Management"
            className="w-full rounded-2xl shadow-lg"
          />

          <div className="space-y-4">
            {/* Contract Review section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection("review")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-2 text-gray-900">
                  Intelligent Contract Review
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.review ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.review
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  AI analyzes contracts to identify risks, non-standard clauses,
                  and missing provisions, helping you review agreements in
                  minutes instead of hours.
                </p>
              </div>
            </div>

            {/* Automated Redlining section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection("redlining")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-4 text-gray-900">
                  Automated Redlining
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.redlining ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.redlining
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Generate redlines based on your playbook standards and
                  negotiate contracts faster with AI-suggested revisions.
                </p>
              </div>
            </div>

            {/* Contract Repository section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection("repository")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-4 text-gray-900">
                  Centralized Contract Repository
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.repository ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.repository
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Store, search, and manage all contracts in one secure location
                  with advanced search capabilities and metadata extraction.
                </p>
              </div>
            </div>

            {/* Template Library section */}
            <div className="pb-4">
              <button
                onClick={() => toggleSection("templates")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-4 text-gray-900">
                  Smart Template Library
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.templates ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.templates
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Create and maintain a library of pre-approved templates that
                  business teams can use for self-service contract generation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ComplianceRiskSection = () => {
  const [expandedSections, setExpandedSections] = useState({
    monitoring: true,
    alerts: false,
    reporting: false,
    obligations: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <section className="section-spacing bg-gray-50">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-4">
            {/* Compliance Monitoring section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection("monitoring")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-2 text-gray-900">
                  Compliance Monitoring & Risk Assessment
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.monitoring ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.monitoring
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Stay on top of regulatory changes across multiple
                  jurisdictions and automatically assess impact on your business
                  operations.
                </p>
              </div>
            </div>

            {/* Risk Alerts section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection("alerts")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-4 text-gray-900">
                  Real-Time Risk Alerts
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.alerts ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.alerts
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Get notified of potential compliance issues, contract risks,
                  and regulatory changes that affect your organization.
                </p>
              </div>
            </div>

            {/* Compliance Reporting section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection("reporting")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-4 text-gray-900">
                  Automated Compliance Reporting
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.reporting ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.reporting
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Generate comprehensive compliance reports for stakeholders,
                  auditors, and regulatory bodies with just a few clicks.
                </p>
              </div>
            </div>

            {/* Obligation Management section */}
            <div className="pb-4">
              <button
                onClick={() => toggleSection("obligations")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-4 text-gray-900">
                  Contract Obligation Tracking
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.obligations ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.obligations
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Never miss a deadline or obligation. Track renewals,
                  terminations, and key dates across all your contracts.
                </p>
              </div>
            </div>
          </div>

          <ComplianceDashboard />
        </div>
      </div>
    </section>
  );
};

const ComplianceDashboard = () => {
  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Compliance Dashboard
      </h3>
      <div className="space-y-4">
        {/* Compliance Item 1 - Good */}
        <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
          <div>
            <p className="font-semibold text-gray-900">GDPR Compliance</p>
            <p className="text-sm text-gray-600">All requirements met</p>
          </div>
        </div>

        {/* Compliance Item 2 - Warning */}
        <div className="flex items-start gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <Shield className="w-6 h-6 text-yellow-600 mt-1" />
          <div>
            <p className="font-semibold text-gray-900">Contract Renewals</p>
            <p className="text-sm text-gray-600">
              5 contracts expiring in 30 days
            </p>
          </div>
        </div>

        {/* Compliance Item 3 - Good */}
        <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
          <div>
            <p className="font-semibold text-gray-900">Data Privacy Audit</p>
            <p className="text-sm text-gray-600">Completed and approved</p>
          </div>
        </div>

        {/* Compliance Item 4 - Info */}
        <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <BarChart3 className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <p className="font-semibold text-gray-900">Risk Assessment</p>
            <p className="text-sm text-gray-600">
              23 contracts reviewed this month
            </p>
          </div>
        </div>
      </div>
    </div>
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
