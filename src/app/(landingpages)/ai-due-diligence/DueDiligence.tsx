"use client";
import React, { useState } from "react";
import {
  FileText,
  ArrowRight,
  AlertTriangle,
  Eye,
  Search,
  Clock,
  Paperclip,
  Send,
  BarChart3,
  TrendingUp,
  Users,
  Building,
  Calendar,
  CheckSquare,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VaultSection from "@/components/home/vault";

const DueDiligencePage = () => {
  const [expandedSections, setExpandedSections] = useState({
    upload: true,
    analysis: false,
    review: false,
    report: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
          <div className="relative flex flex-col lg:flex-row gap-12 items-center">
            <div className="text-white max-w-4xl lg:basis-3/5">
   

              <h1 className="text-heading-1 mb-4 text-shadow">
                #1 AI For Due Diligence
              </h1>

              <p className="text-xl mb-8 text-gray-100">
                Accelerate your due diligence process with AI that automatically analyzes, categorizes, and flags critical issues across thousands of documents in minutes.
              </p>

              <button className="bg-[#d47b0f] hover:bg-[#355e66] text-white px-8 py-4 rounded-lg font-semibold transition-colors mb-12" onClick={() => window.location.href = '/login'}>
                Start Due Diligence Review
              </button>

              {/* Trusted by logos */}
              <div className="mb-8">
                <p className="text-gray-200 text-lg mb-4">
                  Trusted by legal teams at:
                </p>
                <div className="flex items-center space-x-2">
                  {partnerLogos.map((logo, index) => (
                    <div key={index} className="flex-shrink-0">
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        width={120}
                        height={80}
                        className="h-10 md:h-12 w-auto object-contain transition-all duration-300 hover:scale-105 brightness-0 invert"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
 {/* Document Categories Grid */}
        <DocumentsVault/>
          
          </div>
        </div>
      </section>
   
      {/* Never miss critical details section */}
      <section className="section-spacing bg-white">
        <div className="section-container">
          <h2 className="text-heading-2 text-center text-black mb-3">
            Never Miss Critical Details Again
          </h2>
            <p className="text-xl text-gray-600 mb-4 text-center mx-auto max-w-4xl">
              Not only does AI flag what's missing; it explains why those terms matter, and suggests immediate improvements.</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 border-2 border-black rounded-lg flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Automated Document Review
              </h3>
              <p className="text-gray-600">
                AI processes thousands of documents in minutes, extracting key information and flagging potential issues automatically.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 border-2 border-black rounded-lg flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Pattern Recognition
              </h3>
              <p className="text-gray-600">
                Identify trends, anomalies, and correlations across financial data, contracts, and corporate documents with advanced AI.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 border-2 border-black rounded-lg flex items-center justify-center mx-auto mb-6">
                <CheckSquare className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Compliance Verification
              </h3>
              <p className="text-gray-600">
                Automatically verify regulatory compliance across multiple jurisdictions and flag any potential violations or gaps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Complete due diligence workflow section */}
      <section className="section-spacing bg-gray-50">
        <div className="section-container">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
             <div className="relative lg:basis-3/5">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border max-w-6xl mx-auto">
                {/* Header with tabs */}
                <div className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between px-2 md:px-6 py-3">
                    <div className="flex items-center space-x-6">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex space-x-2 md:space-x-6 text-sm">
                        <button className="text-gray-500">Context</button>
                        <button className="text-[#355e66] border-b-2 border-[#355e66]">
                          Documents
                        </button>
                        <button className=" text-gray-500 pb-1">
                          Associates
                        </button>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-primary rounded-full text-center text-sm flex items-center justify-center text-white">
                      DD
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 md:h-[580px]">
                  {/* Main content area */}
                  <div className="lg:col-span-2 p-6 bg-white">
                    {/* AI Suggestion bubble */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 relative">
                      <div className="absolute -top-2 left-4 bg-gray-50 w-4 h-4 rotate-45 border-l border-t border-blue-200"></div>
                      <p className="text-sm text-gray-800 font-medium">
                        Based on my analysis of the financial documents, I've identified 3 potential compliance issues that require immediate attention.
                      </p>
                    </div>

                    {/* Due diligence analysis content */}
                    <div className="space-y-4 text-sm leading-relaxed">
                      <div>
                        <h3 className="font-bold text-base mb-3">
                          Due Diligence Analysis: TechFlow Acquisition
                        </h3>
                        <p className="text-gray-700 mb-4 hidden md:block">
                          Our comprehensive review of 1,247 documents has revealed several key findings. The target company demonstrates strong financial performance with consistent revenue growth, however there are areas requiring immediate attention before closing.
                        </p>
                      </div>

                      {/* Key findings section */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                        <h4 className="font-semibold text-yellow-800 mb-2">Critical Finding</h4>
                        <p className="text-yellow-700 text-sm mb-3">
                          Pending class-action lawsuit filed in Q3 2024 with potential exposure of $2.3M. This was not disclosed in preliminary documentation and requires immediate legal review.
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            High Risk
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            Legal Review Required
                          </span>
                        </div>
                      </div>

                      {/* File analysis preview */}
                      <div className="flex items-center space-x-3 mt-6 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">
                            Q3_2024_Litigation_Summary.pdf
                          </div>
                          <div className="text-xs text-gray-600">Analyzed 15 minutes ago</div>
                        </div>
                        <div className="ml-auto flex space-x-2">
                          <button className="p-2 hover:bg-gray-200 rounded">
                            <ArrowRight className="w-4 h-4 transform rotate-90" />
                          </button>
                          <button className="p-2 hover:bg-gray-200 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Chat input */}
                    <div className="mt-6 flex items-center space-x-3">
                      <div className="md:flex-1 relative">
                        <input
                          type="text"
                          placeholder="Ask about this due diligence analysis..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 text-gray-400"><Paperclip className="h-4 w-4"/></div>
                        </div>
                      </div>
                      <button className="bg-[#355e66] text-white p-3 rounded-lg hover:bg-[#2a4d54] transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="bg-gray-50 border-l">
                    {/* Files section */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between mb-4">
                        <button className="bg-[#355e66] text-white px-3 py-1.5 rounded text-sm flex items-center">
                          <span className="mr-2">+</span> Files
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <span className="text-green-600 text-xs font-bold">
                              XLS
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              Financial_Statements_2024.xlsx
                            </div>
                            <div className="text-xs text-gray-500">
                              Analyzed
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-red-600 text-xs font-bold">
                              PDF
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              Q3_2024_Litigation_Summary.pdf
                            </div>
                            <div className="text-xs text-gray-500">
                              Risk Found
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-bold">
                              DOC
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              Corporate_Bylaws_Current.docx
                            </div>
                            <div className="text-xs text-gray-500">
                              Compliant
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-red-600 text-xs font-bold">
                              PDF
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              IP_Patent_Portfolio.pdf
                            </div>
                            <div className="text-xs text-gray-500">
                              Under Review
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task completion */}
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            3 Critical Issues Found
                          </div>
                          <div className="text-xs text-gray-500">
                            Require immediate attention
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="p-2 bg-gray-50 rounded text-xs border-l-2 border-red-500">
                          <div className="font-medium text-gray-900">Pending Litigation</div>
                          <div className="text-gray-600">$2.3M exposure</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded text-xs border-l-2 border-yellow-500">
                          <div className="font-medium text-gray-900">Compliance Gap</div>
                          <div className="text-gray-600">Data privacy policy</div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="md:flex-1 bg-[#355e66] text-white py-2 px-3 rounded text-sm hover:bg-[#2a4d54] transition-colors">
                          Review Issues
                        </button>
                        <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:basis-2/5 space-y-4">
              <h2 className="text-heading-2 mb-6 text-gray-900 ">
                Complete due diligence workflow
                in hours, not weeks
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                From document collection to final report generation, Wansom AI streamlines your entire due diligence process with intelligent automation and expert oversight.
              </p>

              {/* Upload & Organize section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('upload')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h3 className="font-semibold text-lg text-gray-900">
                    Upload & Organize
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.upload ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.upload ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-gray-600">
                    Bulk upload documents and let AI automatically categorize them by type and importance.
                  </p>
                </div>
              </div>

              {/* AI Analysis section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('analysis')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h3 className="font-semibold text-lg text-gray-900">
                    AI Analysis
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.analysis ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.analysis ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-gray-600">
                    Our AI performs comprehensive analysis, extracting key data and identifying potential risks and opportunities.
                  </p>
                </div>
              </div>

              {/* Review & Validate section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('review')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h3 className="font-semibold text-lg text-gray-900">
                    Review & Validate
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.review ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.review ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-gray-600">
                    Review AI findings, add expert insights, and validate critical discoveries with your team.
                  </p>
                </div>
              </div>

              {/* Generate Report section */}
              <div className="pb-4">
                <button
                  onClick={() => toggleSection('report')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h3 className="font-semibold text-lg text-gray-900">
                    Generate Report
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.report ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.report ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-gray-600">
                    Create comprehensive, client-ready reports with executive summaries and detailed findings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More features section */}
  <VaultSection/>
      <Footer />
    </div>
  );
};


export const DocumentsVault=() => {
    const documentCategories = [
    {
      title: "Financial Statements & Audits",
      rules: 16,
      icon: BarChart3,
      description: "Comprehensive analysis of financial data, cash flows, and audit reports"
    },
    {
      title: "Corporate Governance Documents", 
      rules: 8,
      icon: Building,
      description: "Board resolutions, bylaws, and organizational structure analysis"
    },
    {
      title: "Operational & Commercial Agreements",
      rules: 39,
      icon: Calendar,
      description: "Customer contracts, supplier agreements, and operational policies"
    }
  ];
  return (
  <div className="relative bg-primary rounded-xl shadow-xl overflow-hidden p-6 w-full lg:basis-2/5">
            <div className="space-y-3">
              {documentCategories.map((category, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#355e66]" />
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">{category.rules} Issues</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {category.title}
                  </h3>
                  
                  <div className="space-y-2">
                    {/* Placeholder content bars */}
                    <div className="flex space-x-2">
                      <div className="h-2 bg-gray-200 rounded-full flex-1"></div>
                      <div className="h-2 bg-gray-200 rounded-full flex-1"></div>
                      <div className="h-2 bg-gray-200 rounded-full w-16"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-2 bg-gray-200 rounded-full w-24"></div>
                      <div className="h-2 bg-gray-200 rounded-full flex-1"></div>
                      <div className="h-2 bg-gray-200 rounded-full w-20"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-2 bg-gray-200 rounded-full flex-1"></div>
                      <div className="h-2 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-2 bg-gray-200 rounded-full flex-1"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
  )
}

export default DueDiligencePage;