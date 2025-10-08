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
      <section className="pt-24 md:pt-32 pb-16 bg-primary relative overflow-hidden">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="relative grid grid-cols-1 gap-12 items-center ">
            <div className="text-white lg:basis-1/2 text-center lg:text-left space-y-5">
            <p className="text-body mb-2">For In-House Legal Teams </p>
              <h1 className="text-heading-1 text-shadow font-serif max-w-4xl">
               Streamline Routine Legal Tasks so you focus on High Impact Work
              </h1>
                 <button className="inline-flex items-center px-6 py-3 bg-secondary w-fit text-white font-semibold rounded-lg shadow hover:bg-gray-100 transition">
  Get Started
  <ArrowUpRight className="w-5 h-5 ml-2" />
</button>
            </div>
         

            {/* Hero Features Cards */}
<img src={'/images/in-house-counsel.jpg'} alt="in house consel" className="rounded-lg"/>

          </div>
        </div>
      </section>

      {/* Key Capabilities Section */}
      <KeyCapabilities />

      {/* Contract Management Section */}
      <ContractManagementSection />

      {/* Compliance & Risk Section */}
      <ComplianceRiskSection />

      <KnowledgeBase />
      <VaultSection />

      {/* FAQ Section */}
      <FAQSection />

      <Footer />
    </div>
  );
};


const KeyCapabilities = () => {
  const [expandedSections, setExpandedSections] = useState({
    efficiency: true,
    risk: false,
    visibility: false,
    automation: false,
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
            {/* Efficiency section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection("efficiency")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-2 text-gray-900">
                  Increase Legal Department Efficiency
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.efficiency ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.efficiency
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Automate routine legal tasks, reduce turnaround times, and let your team focus
                  on high-value strategic work that drives business results.
                </p>
              </div>
            </div>

            {/* Risk Management section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection("risk")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-4 text-gray-900">
                  Proactive Risk Management
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.risk ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.risk
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Identify and mitigate legal risks before they become problems with AI-powered
                  contract analysis and compliance monitoring.
                </p>
              </div>
            </div>

            {/* Visibility section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection("visibility")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-4 text-gray-900">
                  Enhanced Visibility & Reporting
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.visibility ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.visibility
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Track legal matters, generate insights, and demonstrate the value of your
                  legal department to executive leadership.
                </p>
              </div>
            </div>

            {/* Automation section */}
            <div className="pb-4">
              <button
                onClick={() => toggleSection("automation")}
                className="w-full flex items-center justify-between text-left group"
              >
                <h2 className="text-heading-4 text-gray-900">
                  Workflow Automation
                </h2>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.automation ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.automation
                    ? "max-h-96 opacity-100 mt-6"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xl text-gray-600">
                  Create custom workflows for contract approvals, NDA generation,
                  and other repetitive legal processes.
                </p>
              </div>
            </div>
          </div>

          {/* Visualization */}
          <EfficiencyVisualization />
        </div>
      </div>
    </section>
  );
};

const EfficiencyVisualization = () => {
  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl shadow-lg">
      <div className="space-y-6">
        {/* Metric 1 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Contract Review Time</p>
              <p className="text-2xl font-bold text-gray-900">70% Faster</p>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#d47b0f] rounded-full flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Risk Detection Rate</p>
              <p className="text-2xl font-bold text-gray-900">95% Accurate</p>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#355e66] rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Compliance Coverage</p>
              <p className="text-2xl font-bold text-gray-900">100+ Jurisdictions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
                  AI analyzes contracts to identify risks, non-standard clauses, and missing provisions,
                  helping you review agreements in minutes instead of hours.
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
                  Generate redlines based on your playbook standards and negotiate contracts
                  faster with AI-suggested revisions.
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
                  Store, search, and manage all contracts in one secure location with advanced
                  search capabilities and metadata extraction.
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
                  Create and maintain a library of pre-approved templates that business teams
                  can use for self-service contract generation.
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
                  Stay on top of regulatory changes across multiple jurisdictions and
                  automatically assess impact on your business operations.
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
                  Get notified of potential compliance issues, contract risks, and regulatory
                  changes that affect your organization.
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
                  Generate comprehensive compliance reports for stakeholders, auditors,
                  and regulatory bodies with just a few clicks.
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
                  Never miss a deadline or obligation. Track renewals, terminations,
                  and key dates across all your contracts.
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
      <h3 className="text-xl font-bold text-gray-900 mb-6">Compliance Dashboard</h3>
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
            <p className="text-sm text-gray-600">5 contracts expiring in 30 days</p>
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
            <p className="text-sm text-gray-600">23 contracts reviewed this month</p>
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
      answer: "Yes, Wansom is built with enterprise-grade security. We use bank-level encryption (AES-256) for data at rest and in transit, maintain SOC 2 Type II compliance, and undergo regular third-party security audits. Your data is stored in secure, geographically distributed data centers with 99.9% uptime SLA. We never train our AI models on your confidential data, and you maintain complete ownership and control of your information."
    },
    {
      question: "Can Wansom work across multiple jurisdictions?",
      answer: "Absolutely. Wansom supports legal research and compliance monitoring across 100+ jurisdictions worldwide, including federal, state, and local laws. Our AI is trained on jurisdiction-specific legal databases and can simultaneously search across multiple regions. You can filter results by jurisdiction, compare laws across different territories, and receive compliance alerts tailored to the jurisdictions relevant to your business operations."
    },
    {
      question: "Does Wansom require additional training?",
      answer: "No extensive training is required. Wansom is designed to be intuitive and user-friendly, with most legal professionals becoming productive within hours. We provide comprehensive onboarding materials, video tutorials, and in-app guidance. For enterprise clients, we offer optional personalized training sessions and dedicated customer success managers. The platform learns from your usage patterns and can be customized with your firm's templates, playbooks, and preferences."
    },
    {
      question: "How does Wansom AI accelerate deals?",
      answer: "Wansom accelerates deals by automating time-consuming tasks: contract review that normally takes hours is completed in minutes with AI-powered risk detection; automated redlining based on your playbook standards speeds up negotiations; smart templates enable business teams to self-serve on standard agreements; real-time collaboration features keep all stakeholders aligned; and obligation tracking ensures nothing falls through the cracks. On average, our clients report 70% faster contract turnaround times."
    },
    {
      question: "What is Wansom AI pricing?",
      answer: "Wansom offers flexible pricing to suit organizations of all sizes. We have subscription plans based on the number of users and features needed, starting with a free tier for individual practitioners. Our Professional plan is ideal for small legal teams, while our Enterprise plan includes advanced features like custom integrations, dedicated support, and unlimited AI usage. We also offer custom pricing for large organizations with specific requirements. Contact our sales team for a personalized quote and demo tailored to your needs."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="section-spacing bg-white">
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
            <div
              key={index}
              className="border-b border-gray-200"
            >
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

        {/* CTA Button */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Still have questions? We're here to help.
          </p>
          <button className="bg-primary hover:bg-[#355e66] text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            Schedule a Demo
          </button>
        </div>
      </div>
    </section>
  );
};

export default InHouseCounselPage;
