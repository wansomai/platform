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
  Paperclip,
  Send,
  FolderOpen,
  BarChart3,
  TrendingUp,
  Users,
  Building,
  FileSearch,
  Layers,
  Database,
  Filter,
  Download,
  Share,
  Calendar,
  CheckSquare,
  Scale,
  Gavel,
  Library,
  Globe,
  Link,
  Star,
  Award,
  Bookmark,
  Activity,
  PieChart,
  MessageSquare,
  Lightbulb,
  Briefcase,
  Calculator,
  Timer,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const CasePreparationPage = () => {
  const [selectedStrategy, setSelectedStrategy] = useState("arguments");

  const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Akoth Odipo Advocayes" },
    { src: "/logos/7.png", alt: "Riskhouse International" },
    { src: "/logos/4.png", alt: "Netsheria" },
  ];

  const caseStrategies = [
    {
      id: "arguments",
      label: "Arguments",
      count: 12,
      color: "text-blue-600 bg-blue-100",
      strength: 87,
    },
    {
      id: "evidence",
      label: "Evidence",
      count: 34,
      color: "text-green-600 bg-green-100",
      strength: 92,
    },
    {
      id: "precedents",
      label: "Precedents",
      count: 28,
      color: "text-purple-600 bg-purple-100",
      strength: 79,
    },
    {
      id: "risks",
      label: "Risk Factors",
      count: 8,
      color: "text-orange-600 bg-orange-100",
      strength: 65,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 bg-[#355e66] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/1.png')] bg-cover bg-center bg-blend-multiply opacity-30"></div>
        <div className="container mx-auto px-4 z-10 relative">
          <div className="relative flex flex-col lg:flex-row gap-12 items-center">
            <div className="text-white max-w-4xl lg:basis-2/5">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">AI Case Preparation</span>
                <span className="ml-3 bg-white/20 text-xs px-2 py-1 rounded">
                  Beta
                </span>
              </div>

              <h1 className="text-heading-1 mb-4 text-shadow">
                AI Case Preparation & Prediction
              </h1>

              <p className="text-xl mb-8 text-gray-100">
                Prepare winning cases with AI that analyzes your arguments,
                predicts outcomes, and simulates opposing counsel strategies to
                strengthen your position.
              </p>

              <button className="bg-[#d47b0f] hover:bg-[#355e66] text-white px-8 py-4 rounded-lg font-semibold transition-colors mb-12">
                Start Case Analysis
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
                          Simulation
                        </button>
                        <button className=" text-gray-500 pb-1">
                          Associates
                        </button>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-primary rounded-full text-center text-sm flex items-center justify-center text-white">
                      CP
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 md:h-[580px]">
                  {/* Main content area - Chat Simulation */}
                  <div className="lg:col-span-2 p-6 bg-white flex flex-col">
                    {/* AI Suggestion bubble */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 relative hidden md:block">
                      <div className="absolute -top-2 left-4 bg-gray-50 w-4 h-4 rotate-45 border-l border-t border-blue-200"></div>
                      <p className="text-sm text-gray-800 font-medium">
                        Based on similar employment disputes, your case has an
                        87% likelihood of success. Focus on strengthening
                        documentation evidence.
                      </p>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                      <div className="space-y-4">
                        {/* Your opening argument */}
                        <div className="flex justify-end">
                          <div className="bg-[#355e66] text-white p-3 rounded-lg  w-[95%]">
                            <p className="text-sm">
                              "My client was terminated in direct retaliation
                              for reporting safety violations to OSHA. This
                              clearly violates whistleblower protection laws."
                            </p>
                          </div>
                        </div>

                        {/* AI opposing counsel response */}
                        <div className="flex justify-start">
                          <div className=" p-3 rounded-lg w-[95%]">
                            <div className="flex items-center mb-1 gap-1">
                              <Sparkles className="w-4 h-4 text-primary" />

                              <span className="text-sm font-medium text-primary">
                                Wansom
                              </span>
                            </div>
                            <p className="text-sm text-black">
                              "The termination was performance-based. Your
                              client had three documented warnings over six
                              months, well before any OSHA report was filed."
                              <br />
                              <span className="flex">
                                <Lightbulb className="w-6 h-6 text-blue-600" />
                              Counter with evidence of temporal proximity
                              between the report and termination. Highlight any
                              positive performance reviews before the complaint
                              </span>
                            </p>
                          </div>
                        </div>
                        {/* Your counter-argument */}
                        <div className="hidden md:flex justify-end">
                          <div className="bg-[#355e66] text-white p-3 rounded-lg w-[90%]">
                           
                            <p className="text-sm">
                              "The performance issues were fabricated
                              post-complaint. My client received 'exceeds
                              expectations' ratings just two months before
                              reporting."
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Chat input */}
                    <div className="flex items-center space-x-3">
                      <div className="md:flex-1 relative">
                        <input
                          type="text"
                          placeholder="Ask Anything about this case"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 text-gray-400">
                            <Paperclip className="h-4 w-4" />
                          </div>
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
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-red-600 text-xs font-bold">
                              PDF
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              Employment_Contract.pdf
                            </div>
                            <div className="text-xs text-gray-500">
                              Key Evidence
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
                              OSHA_Report.docx
                            </div>
                            <div className="text-xs text-gray-500">
                              Critical Document
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
                              Performance_Reviews.pdf
                            </div>
                            <div className="text-xs text-gray-500">
                              Supporting Evidence
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <span className="text-green-600 text-xs font-bold">
                              XLS
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              Termination_Timeline.xlsx
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
                            Brief generated successfully
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="md:flex-1 bg-[#355e66] text-white py-2 px-3 rounded text-sm hover:bg-[#2a4d54] transition-colors">
                          View Brief
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
          </div>
        </div>
      </section>

      {/* AI Case Simulation section */}
      <section className="section-spacing bg-gray-100">
        <div className="section-container flex flex-col md:flex-row">
       <div className="md:basis-1/2">
           <h2 className="text-heading-2 mb-4 text-gray-900">
            Simulate opposing counsel strategies
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            AI role-plays as opposing counsel to test your arguments, identify
            weaknesses, and help you prepare for every possible scenario in
            court.
          </p>
       </div>
<CasePreparationInterface/>
        </div>
      </section>


      {/* Case preparation workflow section */}
      <section className="section-spacing bg-[#355e66]">
        <div className="section-container">
          <h2 className="text-heading-2 text-center mb-12 text-white">
            Complete Case Preparation Workflow
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-[#355e66] rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileSearch className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Evidence Analysis
              </h3>
              <p className="text-gray-600">
                AI automatically reviews all case materials, identifies key
                evidence, and suggests additional documentation needed.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-[#d47b0f] rounded-lg flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Strategy Simulation
              </h3>
              <p className="text-gray-600">
                Role-play against AI opposition to test arguments, identify
                weaknesses, and refine your case strategy.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Outcome Prediction
              </h3>
              <p className="text-gray-600">
                Get data-driven predictions on case outcomes, settlement ranges,
                and optimal strategic timing.
              </p>
            </div>
          </div>

          <div className="text-center">
            <button className="bg-[#d47b0f] hover:bg-[#b8690c] text-white px-8 py-4 rounded-lg font-semibold transition-colors">
              Start Case Preparation
            </button>
          </div>
        </div>
      </section>


      {/* More features section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-16 text-gray-900">
            More features to explore
          </h2>

          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Legal Drafting</h3>
              <p className="text-gray-600 text-sm">
                Draft correct legal documents and clauses quickly
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Contract Review</h3>
              <p className="text-gray-600 text-sm">
                Redline contracts and catch risks automatically
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileSearch className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Due Diligence</h3>
              <p className="text-gray-600 text-sm">
                Never be caught off guard during transactions
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Legal Research</h3>
              <p className="text-gray-600 text-sm">
                Get instant answers to complex legal questions
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};


const CasePreparationInterface = () => {
  return (
    <div className="bg-[#355e66] rounded-lg p-4 relative overflow-hidden md:min-w-[500px]">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-[75%]">
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
            <button className="flex items-center text-[#355e66] font-medium">
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
              <div className="w-8 h-8 bg-[#355e66] rounded-lg flex items-center justify-center">
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
      
      <div className="text-center lg:text-left w-[60%] absolute top-1/2 right-1 md:right-10">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">Case Analysis Report</div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-300 rounded w-full"></div>
              <div className="h-2 bg-gray-300 rounded w-3/4"></div>
              <div className="h-2 bg-green-500 rounded w-5/6"></div>
              <div className="h-2 bg-[#355e66] rounded w-1/2"></div>
              <div className="h-2 bg-gray-300 rounded w-2/3"></div>
              <div className="text-xs text-green-600 mt-2 font-medium">87% Success Rate</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">Case Strategy Preview</div>
        </div>
      </div>
    </div>
  );
};

export default CasePreparationPage;
