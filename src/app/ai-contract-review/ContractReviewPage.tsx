"use client";
import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle,
  Play,
  ArrowRight,
  Brain,
  Zap,
  BookOpen,
  Shield,
  AlertTriangle,
  Eye,
  Search,
  Clock,
  Target,
  ThumbsUp,
  X,
  ClipboardCopy,
  Clipboard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MoreFeatures from "@/components/home/MoreFeatures";

const ContractReviewPage = () => {
  const [selectedRisk, setSelectedRisk] = useState("critical");

  const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Akoth Odipo Advocayes" },
    { src: "/logos/7.png", alt: "Riskhouse International" },
    { src: "/logos/4.png", alt: "Netsheria" },
  ];

  const riskCategories = [
    {
      id: "critical",
      label: "Critical",
      count: 3,
      color: "text-red-600 bg-red-100",
    },
    {
      id: "high",
      label: "High",
      count: 7,
      color: "text-orange-600 bg-orange-100",
    },
    {
      id: "medium",
      label: "Medium",
      count: 12,
      color: "text-yellow-600 bg-yellow-100",
    },
    { id: "low", label: "Low", count: 5, color: "text-green-600 bg-green-100" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar placeholder */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-[#355e66] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/1.png')] bg-cover bg-center bg-blend-multiply opacity-30"></div>
        <div className="container mx-auto px-4 z-10 relative">
          <div className="relative flex flex-col lg:flex-row gap-12 items-center">
            <div className="text-white max-w-4xl lg:basis-2/5">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
                <Eye className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  AI-Powered Contract Review
                </span>
                <span className="ml-3 bg-white/20 text-xs px-2 py-1 rounded">
                  Wansom
                </span>
              </div>

              <h1 className="text-heading-1 mb-4 text-shadow">
                AI Contract Review
              </h1>

              <p className="text-xl mb-8 text-gray-100">
                Review and redline your contracts within a collaborative AI
                workspace. Catch risks, errors, and overlooked clauses
                instantly.
              </p>

              <button className="bg-[#d47b0f] hover:bg-[#355e66] text-white px-8 py-4 rounded-lg font-semibold transition-colors mb-12">
                Try Wansom Contracts Free
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

            {/* Hero Demo Interface */}
            <div className="relative w-full lg:basis-2/3">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border max-w-4xl">
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
                      WO
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 h-[580px]">
                  {/* Main content area */}
                  <div className="lg:col-span-2 p-6 bg-white">
                    {/* AI Suggestion bubble */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 relative">
                      <div className="absolute -top-2 left-4 bg-gray-50 w-4 h-4 rotate-45 border-l border-t border-blue-200"></div>
                      <p className="text-sm text-gray-800 font-medium">
                        Yes, update the contract to match the policy
                      </p>
                    </div>

                    {/* Contract content */}
                    <div
                      className="space-y-4 text-sm leading-relaxed"
                      style={{ fontFamily: "Times, serif" }}
                    >
                      <div>
                        <h3 className="font-bold text-base mb-3">
                          9.1 Data Protection and Privacy:
                        </h3>
                        <p className="text-gray-700 mb-4">
                          Employee data is collected and processed for
                          legitimate business purposes (payroll, benefits,
                          performance, etc.) in accordance with Company policy
                          and applicable laws. Data types, storage, access, and
                          retention are detailed in our Data Protection Policy.
                          Employees have rights to access, rectify, or request
                          erasure of their data.
                        </p>
                      </div>

                      {/* Generated content box */}
                      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-6">
                        <p className="text-gray-700 text-sm italic">
                          Create "Standard Employment Contract Template
                          v4_Revised.docx" with all these changes and a
                          "Contract Compliance & Improvement Report_May
                          2025.pdf"
                        </p>
                      </div>

                      {/* File preview */}
                      <div className="flex items-center space-x-3 mt-6 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">
                            Standard Employment Contract Template v3.docx
                          </div>
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
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Ask Anything about this project"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 text-gray-400">📎</div>
                        </div>
                      </div>
                      <button className="bg-[#355e66] text-white p-3 rounded-lg hover:bg-[#2a4d54] transition-colors">
                        <ArrowRight className="w-4 h-4" />
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
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-red-600 text-xs font-bold">
                              PDF
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              Employee Onboarding.PDF
                            </div>
                            <div className="text-xs text-gray-500">
                              View File
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-bold">
                              DOC
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              Standard Employment Contract Template v3.docx
                            </div>
                            <div className="text-xs text-gray-500">
                              Start Editing
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
                              Group HR Policies.PDF
                            </div>
                            <div className="text-xs text-gray-500">
                              View File
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <span className="text-green-600 text-xs font-bold">
                              XLS
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              New Employee List.XLS
                            </div>
                            <div className="text-xs text-gray-500">
                              View File
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task completion */}
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            1 Task Completed
                          </div>
                          <div className="text-xs text-gray-500">
                            Document created successfully
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-[#355e66] text-white py-2 px-3 rounded text-sm hover:bg-[#2a4d54] transition-colors">
                          View Task
                        </button>
                        <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                          Restart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Second set of eyes section */}
      <section className="section-spacing bg-gray-100">
        <div className="section-container text-center">
          <h2 className="text-heading-2 mb-4 text-gray-900">
            Second set of eyes for your contracts
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Wansom's AI reviews your contracts, highlighting risks and
            suggesting improvements, so you can focus on what matters most.</p>
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
              {/* Document viewer with sidebar */}
              <div className="grid grid-cols-1 md:grid-cols-4 h-fit md:h-[700px]">
                {/* Document area */}
                <div className="lg:col-span-3 p-6 bg-gray-50">
                  <div
                    className="bg-white rounded-lg border h-full p-6 overflow-y-auto"
                    style={{ fontFamily: "Times, serif" }}
                  >
                    {/* Document header */}
                    <div className="text-center mb-8">
                      <h1 className="text-lg md:text-2xl font-bold mb-2">
                        SOFTWARE LICENSING AGREEMENT
                      </h1>
                      <p className="text-gray-600">
                        Between TechFlow Solutions Inc. and Enterprise Client
                        Corp.
                      </p>
                      <hr className="mt-4" />
                    </div>

                    {/* Full document content */}
                    <div className="space-y-6 text-sm leading-relaxed">
                      {/* Section 1 */}
                      <div className="hidden md:block">
                        <h3 className="font-bold text-base mb-3">
                          1. GRANT OF LICENSE
                        </h3>
                        <p className="mb-4">
                          Subject to the terms and conditions of this Agreement,
                          TechFlow Solutions Inc. hereby grants to Enterprise
                          Client Corp. a non-exclusive, non-transferable license
                          to use the Software solely for internal business
                          purposes in accordance with the Documentation.
                        </p>
                      </div>

                      {/* Section 2 - with highlighted critical issue */}
                      <div>
                        <h3 className="font-bold text-base mb-3">
                          2. RESTRICTIONS AND LIMITATIONS
                        </h3>
                        <p className="mb-4">
                          Client shall not, and shall not permit any third party
                          to: (a) copy, modify, or create derivative works of
                          the Software; (b) reverse engineer, disassemble, or
                          decompile the Software; or (c) sublicense, rent,
                          lease, or otherwise transfer rights to the Software.{" "}
                          <span className="bg-red-200 px-1 rounded border-l-2 border-red-500">
                            Client agrees to indemnify and hold harmless
                            TechFlow from any and all claims, damages, or losses
                            arising from Client's unauthorized use of the
                            Software, including attorney fees and costs.
                          </span>
                        </p>
                      </div>

                      {/* Section 3 - with medium risk */}
                      <div >
                        <h3 className="font-bold text-base mb-3">
                          3. PAYMENT TERMS
                        </h3>
                        <p className="mb-4">
                          Client agrees to pay the license fees as set forth in
                          Schedule A. All payments are due within thirty (30)
                          days of invoice date.{" "}
                          <span className="bg-yellow-200 px-1 rounded border-l-2 border-yellow-500">
                            Late payments may be subject to interest charges of
                            1.5% per month or the maximum rate permitted by law,
                            whichever is less.
                          </span>{" "}
                          TechFlow reserves the right to suspend access to the
                          Software for any overdue payments.
                        </p>
                      </div>

                      {/* Section 4 - with high risk */}
                      <div className="hidden md:block">
                        <h3 className="font-bold text-base mb-3">
                          4. WARRANTIES AND DISCLAIMERS
                        </h3>
                        <p className="mb-4">
                          <span className="bg-orange-200 px-1 rounded border-l-2 border-orange-500">
                            THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTIES
                            OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
                            LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
                            FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                          </span>{" "}
                          TechFlow does not warrant that the Software will be
                          error-free or that access to the Software will be
                          uninterrupted.
                        </p>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="bg-white border-l -mt-[120px] md:mt-0">
                  <div className="p-4 border-b bg-gray-50 ">
                    <div className="flex gap-2 items-center">
                      <h3 className="font-semibold ">Review</h3>
                      <Target className="w-4 h-4 mr-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 mt-1">
                        8 Suggestions
                      </p>
                      <div className="flex items-center mt-2 bg-white border border-gray-300 rounded-lg px-1 py-1 cursor-pointer hover:bg-gray-50 transition-colors">
                           <Clipboard className="h-4 w-4 text-black" /><span className="text-sm  px-2 py-1 rounded">
                           copy
                        </span>
                     
                      </div>
                    </div>
                  </div>

                  <div className="p-4 h-full overflow-y-auto">
                    <div className="space-y-3">
                      {/* Critical Risk - Expanded */}
                      <div className="border rounded-lg">
                        <div
                          className="p-3 cursor-pointer bg-red-50 border-b"
                          onClick={() =>
                            setSelectedRisk(
                              selectedRisk === "critical" ? "" : "critical"
                            )
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-600">
                                Critical
                              </span>
                              <span className="text-sm font-medium">3</span>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                selectedRisk === "critical" ? "rotate-90" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {selectedRisk === "critical" && (
                          <div className="p-3 space-y-3">
                            <div className="text-xs space-y-2">
                              <div className="p-2 bg-red-50 rounded border-l-2 border-red-500">
                                <div className="font-medium text-red-800 mb-1">
                                  Broad Indemnification Clause
                                </div>
                                <p className="text-red-700">
                                  Client indemnifies TechFlow for unauthorized
                                  use. Consider limiting scope and adding mutual
                                  indemnification.
                                </p>
                                <button className="mt-2 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">
                                  Apply Change
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* High Risk */}
                      <div className="border rounded-lg">
                        <div
                          className="p-3 cursor-pointer"
                          onClick={() =>
                            setSelectedRisk(
                              selectedRisk === "high" ? "" : "high"
                            )
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-600">
                                High
                              </span>
                              <span className="text-sm font-medium">2</span>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                selectedRisk === "high" ? "rotate-90" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {selectedRisk === "high" && (
                          <div className="p-3 space-y-3">
                            <div className="text-xs space-y-2">
                              <div className="p-2 bg-orange-50 rounded border-l-2 border-orange-500">
                                <div className="font-medium text-orange-800 mb-1">
                                  Warranty Disclaimer
                                </div>
                                <p className="text-orange-700">
                                  Broad "AS IS" disclaimer may leave client
                                  without recourse for software defects.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Medium Risk */}
                      <div className="border rounded-lg">
                        <div
                          className="p-3 cursor-pointer"
                          onClick={() =>
                            setSelectedRisk(
                              selectedRisk === "medium" ? "" : "medium"
                            )
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-600">
                                Medium
                              </span>
                              <span className="text-sm font-medium">2</span>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                selectedRisk === "medium" ? "rotate-90" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {selectedRisk === "medium" && (
                          <div className="p-3 space-y-3">
                            <div className="text-xs space-y-2">
                              <div className="p-2 bg-yellow-50 rounded border-l-2 border-yellow-500">
                                <div className="font-medium text-yellow-800 mb-1">
                                  Interest Rate Terms
                                </div>
                                <p className="text-yellow-700">
                                  1.5% monthly interest rate may be excessive.
                                  Consider negotiating lower rate.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Low Risk */}
                      <div className="border rounded-lg">
                        <div
                          className="p-3 cursor-pointer"
                          onClick={() =>
                            setSelectedRisk(selectedRisk === "low" ? "" : "low")
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-600">
                                Low
                              </span>
                              <span className="text-sm font-medium">1</span>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                selectedRisk === "low" ? "rotate-90" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {selectedRisk === "low" && (
                          <div className="p-3 space-y-3">
                            <div className="text-xs space-y-2">
                              <div className="p-2 bg-green-50 rounded border-l-2 border-green-500">
                                <div className="font-medium text-green-800 mb-1">
                                  Termination Clause
                                </div>
                                <p className="text-green-700">
                                  Clear termination terms with reasonable notice
                                  period. Well-structured clause.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#355e66]">
                          78%
                        </div>
                        <div className="text-sm text-gray-600">
                          Agreement Score
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-4 bg-[#355e66] text-white py-2 rounded hover:bg-[#2a4d54] transition-colors">
                      Apply All Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find risks and errors section */}
      <section className="section-spacing bg-gray-50">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-heading-2 mb-6 text-gray-900">
                Find risks and errors
              
                buried in your docs
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Wansom's AI scans your contracts to uncover hidden risks,
                errors, and opportunities for improvement, so you can make
                informed decisions faster.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#355e66] rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Instant Risk Detection
                    </h3>
                    <p className="text-gray-600">
                      AI analyzes every clause to identify potential legal and
                      business risks in real-time.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#d47b0f] rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Smart Redline Suggestions
                    </h3>
                    <p className="text-gray-600">
                      Get specific recommendations with alternative language to
                      strengthen your position.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Review Time Cut by 80%
                    </h3>
                    <p className="text-gray-600">
                      Complete thorough contract reviews in minutes instead of
                      hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-primary rounded-xl shadow-xl overflow-hidden p-4">
              <div className="bg-white rounded-xl shadow-xl border p-6">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-gray-900">
                      Critical Risk Found
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    The contract currently states that the Company will own all
                    data, including client improvements, enhancements, or
                    modifications. This could potentially give ownership of
                    modifications and enhancements to the Customer...
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-2">Suggested Revision:</h4>
                  <p className="text-sm text-gray-700 italic">
                    "Company retains ownership of all improvements,
                    enhancements, or modifications to ensure that any
                    improvements or modifications specifically requested by the
                    Customer do not become sole property of the Company."
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-[#355e66] text-white py-2 px-4 rounded hover:bg-[#2a4d54] transition-colors">
                    Accept Suggestion
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breeze through reviews section */}
      <section className="section-spacing bg-[#355e66]">
        <div className="section-container">
          <h2 className="text-heading-2 text-center mb-12 text-white">
           Get Reviews Done in Minutes
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-[#355e66] rounded-lg flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Insightful comments in one click
              </h3>
              <p className="text-gray-600">
                Wansom reviews entire documents instantly and drafts comments.
                You choose which are approved and applied.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-[#d47b0f] rounded-lg flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Bulk approve
              </h3>
              <p className="text-gray-600">
                Review, edit, and accept multiple changes in one go. Track
                changes and show additional items.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                <ThumbsUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Redline in your name
              </h3>
              <p className="text-gray-600">
                Edits appear under your name, so you can forward redlined
                reviews to clients without extra work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* More features section */}
     <MoreFeatures/>

  
      {/* Footer placeholder */}
      <Footer/>
    </div>
  );
};

export default ContractReviewPage;
