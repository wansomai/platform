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
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 relative">
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
                          <div className="bg-[#355e66] text-white p-3 rounded-lg  w-[90%]">
                            <p className="text-sm">
                              "My client was terminated in direct retaliation
                              for reporting safety violations to OSHA. This
                              clearly violates whistleblower protection laws."
                            </p>
                          </div>
                        </div>

                        {/* AI opposing counsel response */}
                        <div className="flex justify-start">
                          <div className=" p-3 rounded-lg w-[90%]">
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
                        <div className="flex justify-end">
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
        <div className="section-container text-center">
          <h2 className="text-heading-2 mb-4 text-gray-900">
            Simulate opposing counsel strategies
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            AI role-plays as opposing counsel to test your arguments, identify
            weaknesses, and help you prepare for every possible scenario in
            court.
          </p>

          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
              {/* Case simulation interface */}
              <div className="grid grid-cols-1 lg:grid-cols-3 md:h-[700px]">
                {/* Main simulation area */}
                <div className="lg:col-span-2 p-6 bg-white">
                  {/* Simulation header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      AI Opposition Simulation
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        Live Simulation
                      </span>
                      <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Simulation conversation */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-6 h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {/* Your argument */}
                      <div className="flex justify-end">
                        <div className="bg-[#355e66] text-white p-4 rounded-lg max-w-md">
                          <div className="text-xs mb-1 opacity-75">
                            Your Argument:
                          </div>
                          <p className="text-sm">
                            "The termination clearly violates whistleblower
                            protection laws. My client reported legitimate
                            safety concerns and was fired in direct
                            retaliation."
                          </p>
                        </div>
                      </div>

                      {/* AI opposing counsel response */}
                      <div className="flex justify-start">
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg max-w-md">
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
                              <Brain className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-medium text-red-800">
                              AI Opposing Counsel:
                            </span>
                          </div>
                          <p className="text-sm text-red-700">
                            "The termination was due to performance issues
                            documented over 6 months. The safety report was
                            filed only after the employee received a negative
                            review. This suggests strategic timing rather than
                            genuine concern."
                          </p>
                        </div>
                      </div>

                      {/* Counter-argument suggestion */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-blue-800 mb-1">
                              AI Suggestion:
                            </div>
                            <p className="text-sm text-blue-700">
                              Counter with evidence that safety concerns existed
                              before the performance review. Emphasize the
                              timeline and any witnesses who can corroborate
                              earlier informal complaints.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Your counter-argument */}
                      <div className="flex justify-end">
                        <div className="bg-[#355e66] text-white p-4 rounded-lg max-w-md">
                          <div className="text-xs mb-1 opacity-75">
                            Your Counter:
                          </div>
                          <p className="text-sm">
                            "We have testimony from three colleagues who confirm
                            my client raised safety concerns informally in team
                            meetings two months before any performance issues
                            were documented."
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input for next argument */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Enter your next argument..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
                    />
                    <button className="bg-[#355e66] text-white px-6 py-3 rounded-lg hover:bg-[#2a4d54] transition-colors">
                      Submit
                    </button>
                  </div>
                </div>

                {/* Simulation sidebar */}
                <div className="bg-gray-50 border-l p-4">
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Simulation Metrics
                    </h4>

                    <div className="space-y-4">
                      <div className="p-3 bg-white rounded border">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#355e66]">
                            87%
                          </div>
                          <div className="text-sm text-gray-600">
                            Argument Strength
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded border">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            15
                          </div>
                          <div className="text-sm text-gray-600">
                            Successful Counters
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded border">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            3
                          </div>
                          <div className="text-sm text-gray-600">
                            Weak Points Found
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Opposition Strategy
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-red-50 rounded border-l-2 border-red-500">
                        <div className="font-medium text-red-800">
                          Timeline Challenge
                        </div>
                        <div className="text-red-600">
                          Questioning chronology of events
                        </div>
                      </div>
                      <div className="p-2 bg-yellow-50 rounded border-l-2 border-yellow-500">
                        <div className="font-medium text-yellow-800">
                          Performance Focus
                        </div>
                        <div className="text-yellow-600">
                          Emphasizing work quality issues
                        </div>
                      </div>
                      <div className="p-2 bg-purple-50 rounded border-l-2 border-purple-500">
                        <div className="font-medium text-purple-800">
                          Motive Attack
                        </div>
                        <div className="text-purple-600">
                          Questioning whistleblower intent
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors mb-2">
                    End Simulation
                  </button>

                  <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Save Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outcome prediction section */}
      <section className="section-spacing bg-gray-50">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-heading-2 mb-6 text-gray-900">
                Predict case outcomes with AI-powered analytics
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our AI analyzes thousands of similar cases, judge preferences,
                and legal precedents to provide accurate outcome predictions and
                strategic recommendations.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#355e66] rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Statistical Analysis
                    </h3>
                    <p className="text-gray-600">
                      AI processes outcomes from 50,000+ similar cases to
                      predict settlement ranges and trial success rates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#d47b0f] rounded-lg flex items-center justify-center">
                    <Scale className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Judge Pattern Analysis
                    </h3>
                    <p className="text-gray-600">
                      Understand specific judge tendencies and preferences to
                      tailor your presentation strategy accordingly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Strategic Recommendations
                    </h3>
                    <p className="text-gray-600">
                      Get specific advice on evidence prioritization, argument
                      sequencing, and settlement timing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-primary rounded-xl shadow-xl overflow-hidden p-6">
              <div className="bg-white rounded-xl shadow-xl border p-6">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <PieChart className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-gray-900">
                      Outcome Prediction
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Johnson v. TechCorp - Wrongful Termination Analysis
                  </p>
                </div>

                <div className="space-y-4 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-green-800">
                        Settlement Likelihood
                      </span>
                      <span className="font-bold text-green-600">75%</span>
                    </div>
                    <div className="text-sm text-green-700">
                      Expected range: $85K - $125K
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-blue-800">
                        Trial Victory
                      </span>
                      <span className="font-bold text-blue-600">65%</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      Potential award: $150K - $200K
                    </div>
                  </div>

                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-red-800">
                        Defense Victory
                      </span>
                      <span className="font-bold text-red-600">15%</span>
                    </div>
                    <div className="text-sm text-red-700">
                      Risk of dismissal or unfavorable ruling
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="text-sm text-gray-800">
                    <strong>Key Insight:</strong> Similar cases with strong
                    documentation evidence settle 89% of the time. Consider
                    strengthening timeline evidence for better position.
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-[#355e66] text-white py-2 px-4 rounded hover:bg-[#2a4d54] transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
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

      {/* Case preparation features section */}
      <section className="section-spacing bg-white">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">
                      Case Preparation Dashboard
                    </span>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        In Progress
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Document Analysis</h4>
                        <p className="text-sm text-gray-600">
                          47 documents processed, 12 key pieces identified
                        </p>
                      </div>
                      <span className="text-sm text-green-600 font-medium">
                        Complete
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Legal Research</h4>
                        <p className="text-sm text-gray-600">
                          Analyzing 234 similar cases and precedents
                        </p>
                      </div>
                      <span className="text-sm text-blue-600 font-medium">
                        78%
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Strategy Development</h4>
                        <p className="text-sm text-gray-600">
                          Building argument framework and counter-strategies
                        </p>
                      </div>
                      <span className="text-sm text-yellow-600 font-medium">
                        45%
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-500">
                          Outcome Prediction
                        </h4>
                        <p className="text-sm text-gray-500">
                          Statistical analysis and probability modeling
                        </p>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">
                        Queued
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Overall Progress
                      </span>
                      <span className="text-sm font-medium">67%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#355e66] h-2 rounded-full"
                        style={{ width: "67%" }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Estimated completion: 45 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-heading-2 mb-6 text-gray-900">
                AI-powered case preparation from evidence to strategy
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Transform your case preparation process with AI that analyzes
                evidence, develops strategies, simulates opposition, and
                predicts outcomes - all in one comprehensive workflow.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#355e66] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Intelligent Document Processing
                    </h3>
                    <p className="text-gray-600">
                      AI extracts key facts, identifies evidence gaps, and
                      organizes materials by relevance and importance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#d47b0f] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Strategic Analysis & Planning
                    </h3>
                    <p className="text-gray-600">
                      Develop comprehensive case strategies based on successful
                      patterns from similar cases.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Opposition Simulation
                    </h3>
                    <p className="text-gray-600">
                      Test your arguments against AI-powered opposing counsel to
                      identify and address weaknesses.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Outcome Prediction & Optimization
                    </h3>
                    <p className="text-gray-600">
                      Get probabilistic outcome analysis and recommendations for
                      optimal case positioning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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

export default CasePreparationPage;
