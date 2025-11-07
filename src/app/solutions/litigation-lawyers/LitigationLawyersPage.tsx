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
      <section className="pt-24 md:pt-32 bg-primary relative overflow-hidden">
        <div className="container mx-auto px-5 z-10 relative">
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ">
            <div className="text-white lg:basis-1/2 text-center lg:text-left space-y-5">
              <p className="text-body mb-2">AI For Litigation Lawyers</p>
              <h1 className="text-heading-1 text-shadow font-serif max-w-4xl">
               Enjoy Winning More Cases with AI Inspired Teammates
              </h1>
              <button className="inline-flex items-center px-6 py-3 bg-secondary w-fit text-white font-semibold rounded-lg shadow hover:bg-primary transition">
                Get Started
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </button>
            </div>
            {/* Hero image */}
            <img
              src={"/images/supreme-court.png"}
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
      title: "Case Law Research",
      description:
        "Find relevant case law, precedents, and legal authorities in seconds with AI-powered search across multiple jurisdictions.",
      href: "#",
    },
    {
      icon: FileText,
      title: "Document Discovery",
      description:
        "Analyze thousands of documents quickly, identify key evidence, and organize discovery materials efficiently.",
      href: "#",
    },
    {
      icon: Sparkles,
      title: "Brief Drafting",
      description:
        "Generate court-ready legal briefs, motions, and pleadings with AI assistance and jurisdiction-specific formatting.",
      href: "#",
    },
    {
      icon: Scale,
      title: "Case Strategy",
      description:
        "Analyze case strengths, identify winning arguments, and develop litigation strategies backed by data and precedent.",
      href: "#",
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
      title: "Legal Research",
      description:
        "Search through millions of cases, statutes, and regulations to find relevant authorities and build stronger arguments.",
    },
    {
      title: "Document Review",
      description:
        "Quickly review and analyze discovery documents, depositions, and evidence with AI-powered insights.",
    },
    {
      title: "Brief Preparation",
      description:
        "Draft persuasive legal briefs with proper citations, formatting, and jurisdiction-specific requirements.",
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

export default LitigationLawyersPage;
