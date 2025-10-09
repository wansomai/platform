"use client";
import React, { useState } from "react";
import {
  FileText,
  ChevronDown,
  ArrowUpRight,
  Search,
  Sparkles,
  TrendingUp,
  FileCheck,
  Building2,
  Users,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VaultSection from "@/components/home/vault";
import KnowledgeBase from "@/components/home/Knowledgebase";

const MALawyersPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 bg-primary relative overflow-hidden">
        <div className="container mx-auto px-5 z-10 relative">
          <div className="relative grid grid-cols-1 gap-12 items-center ">
            <div className="text-white lg:basis-1/2 text-center lg:text-left space-y-5">
              <p className="text-body mb-2">AI For M&A Lawyers</p>
              <h1 className="text-heading-1 text-shadow font-serif max-w-4xl">
                Close Deals Faster when it matters the most
              </h1>
              <button className="inline-flex items-center px-6 py-3 bg-secondary w-fit text-white font-semibold rounded-lg shadow hover:bg-primary transition">
                Get Started
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </button>
            </div>
            {/* Hero image */}
            <img
              src={"/images/law-firm-boardroom.jpg"}
              alt="M&A lawyers"
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
              Accelerate Deal Execution
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {/* Stat 1 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                60%
              </h3>
              <p className="text-md text-gray-600">
                Faster due diligence
                <br />
                document review
              </p>
            </div>

            {/* Stat 2 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                +15hrs
              </h3>
              <p className="text-md text-gray-600">
                Weekly time saved
                <br />
                per transaction
              </p>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                $4.2m
              </h3>
              <p className="text-md text-gray-600">
                Potential additional value
                <br />
                per 50 deals annually
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
      icon: FileCheck,
      title: "Due Diligence Automation",
      description:
        "Rapidly analyze thousands of documents, identify risks, and create comprehensive due diligence reports with AI assistance.",
      href: "#",
    },
    {
      icon: FileText,
      title: "Contract Analysis",
      description:
        "Review purchase agreements, NDAs, and transaction documents to spot issues, extract key terms, and ensure compliance.",
      href: "#",
    },
    {
      icon: TrendingUp,
      title: "Deal Structuring",
      description:
        "Model different transaction structures, analyze tax implications, and optimize deal terms with AI-powered insights.",
      href: "#",
    },
    {
      icon: Building2,
      title: "Post-Merger Integration",
      description:
        "Plan and execute integration strategies, track milestones, and manage cross-functional coordination seamlessly.",
      href: "#",
    },
  ];

  return (
    <section className="section-spacing bg-primary">
      <div className="section-container">
        {/* Header */}
        <div className="text-center lg:text-start mb-12">
          <h2 className="text-heading-2 text-white capitalize tracking-wider">
            Your AI M&A transaction partner
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
      title: "Due Diligence",
      description:
        "Accelerate document review with AI that extracts key terms, identifies risks, and creates comprehensive reports for M&A transactions.",
    },
    {
      title: "Transaction Planning",
      description:
        "Model deal structures, analyze regulatory requirements, and develop comprehensive transaction timelines and checklists.",
    },
    {
      title: "Client Onboarding",
      description:
        "Streamline client intake and KYC processes with automated document collection, identity verification, and compliance screening.",
    },
    {
      title: "Integration Support",
      description:
        "Streamline post-merger integration with AI-powered contract consolidation, policy alignment, and stakeholder coordination.",
    },
  ];

  return (
    <section className="section-spacing bg-gray-50">
      <div className="section-container">
        <h2 className="text-heading-2 text-gray-900 max-w-3xl mb-8 text-center mx-auto">
          How M&A Lawyers Use Wansom AI
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
      question: "How does Wansom AI help with M&A due diligence?",
      answer:
        "Wansom AI analyzes thousands of documents in minutes, automatically extracting key terms, identifying potential risks, flagging unusual clauses, and creating comprehensive due diligence reports. Our AI understands M&A-specific issues like material adverse change clauses, representations and warranties, indemnification provisions, and regulatory compliance requirements. This dramatically reduces the time spent on document review while improving accuracy.",
    },
    {
      question: "Can Wansom handle multi-jurisdictional transactions?",
      answer:
        "Yes. Wansom is designed for complex cross-border M&A transactions. Our AI understands regulatory requirements across 100+ jurisdictions, including antitrust laws, foreign investment regulations, data privacy rules, and industry-specific compliance. We can identify jurisdiction-specific issues, flag potential regulatory hurdles, and help you develop appropriate transaction structures for international deals.",
    },
    {
      question: "Does Wansom integrate with virtual data rooms?",
      answer:
        "Absolutely. Wansom integrates with major virtual data room platforms, allowing you to analyze documents directly from your VDR. You can upload documents individually or in bulk, and our AI will organize, index, and analyze them automatically. We maintain strict security protocols to ensure confidential deal information remains protected throughout the process.",
    },
    {
      question: "How does Wansom help with deal structuring?",
      answer:
        "Wansom provides AI-powered analysis to help you evaluate different transaction structures. We can model various scenarios, analyze tax implications, identify optimal deal terms, and compare different approaches. Our AI draws on a vast database of comparable transactions to provide market intelligence and help you structure competitive, advantageous deals for your clients.",
    },
    {
      question: "What is the pricing for M&A lawyers?",
      answer:
        "We offer flexible pricing designed for M&A practices of all sizes. Our transaction-based pricing allows you to pay per deal, making it cost-effective for firms with varying deal flow. We also offer subscription plans for high-volume practices. Enterprise clients receive custom pricing with unlimited deals, dedicated support, and advanced features. Contact our sales team for a customized quote based on your firm's needs.",
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
            Everything you need to know about Wansom AI for M&A lawyers
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

export default MALawyersPage;
