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
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const LegalResearchPage = () => {
  const [selectedSource, setSelectedSource] = useState("cases");

  const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Akoth Odipo Advocayes" },
    { src: "/logos/7.png", alt: "Riskhouse International" },
    { src: "/logos/4.png", alt: "Netsheria" },
  ];

  const researchSources = [
    {
      id: "cases",
      label: "Case Law",
      count: 2847,
      color: "text-blue-600 bg-blue-100",
      relevance: 94,
    },
    {
      id: "statutes",
      label: "Statutes",
      count: 567,
      color: "text-green-600 bg-green-100",
      relevance: 89,
    },
    {
      id: "regulations",
      label: "Regulations",
      count: 234,
      color: "text-purple-600 bg-purple-100",
      relevance: 82,
    },
    {
      id: "secondary",
      label: "Secondary",
      count: 156,
      color: "text-orange-600 bg-orange-100",
      relevance: 76,
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
                <Search className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  AI-Powered Legal Research
                </span>
                <span className="ml-3 bg-white/20 text-xs px-2 py-1 rounded">
                  Wansom
                </span>
              </div>

              <h1 className="text-heading-1 mb-4 text-shadow">
                AI Legal Research
              </h1>

              <p className="text-xl mb-8 text-gray-100">
                Get instant answers to complex legal questions with AI that searches through millions of cases, statutes, and legal authorities in seconds.
              </p>

              <button className="bg-[#d47b0f] hover:bg-[#355e66] text-white px-8 py-4 rounded-lg font-semibold transition-colors mb-12">
                Start Research Now
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
                          Research
                        </button>
                        <button className=" text-gray-500 pb-1">
                          Associates
                        </button>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-primary rounded-full text-center text-sm flex items-center justify-center text-white">
                      LR
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 md:h-[580px]">
                  {/* Main content area */}
                  <div className="lg:col-span-2 p-6 bg-white">
                    {/* AI Research Response */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative">
                      <div className="absolute -top-2 left-4 bg-blue-50 w-4 h-4 rotate-45 border-l border-t border-blue-200"></div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-[#355e66] rounded-lg flex items-center justify-center">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-800 font-medium mb-2">
                            Based on recent precedent in similar employment disputes, courts typically favor employers when proper documentation exists.
                          </p>
                          <p className="text-xs text-gray-600">
                            Found 47 relevant cases, 12 statutes, and 8 regulations
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Research Query */}
                    <div className="space-y-4 text-sm leading-relaxed">
                      <div>
                        <h3 className="font-bold text-base mb-3">
                          Research Query: Employment Termination Rights
                        </h3>
                        <p className="text-gray-700 mb-4 hidden md:block">
                          "What are the legal requirements for terminating an employee for performance issues in California, and what documentation is needed to defend against wrongful termination claims?"
                        </p>
                      </div>

                      {/* Key finding with case citation */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                        <h4 className="font-semibold text-green-800 mb-2">Key Precedent Found</h4>
                        <p className="text-green-700 text-sm mb-3">
                          <strong>Smith v. TechCorp (2023)</strong> - California Court of Appeals held that employers must provide at least 30 days of documented performance improvement plans before termination.
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Highly Relevant
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            Recent Decision
                          </span>
                          <button className="text-xs text-blue-600 hover:underline">
                            View Full Case
                          </button>
                        </div>
                      </div>

                      {/* Research sources preview */}
                      <div className="space-y-2 mt-6">
                        <h4 className="font-semibold text-gray-900">Additional Sources</h4>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Scale className="w-6 h-6 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              California Labor Code § 2922
                            </div>
                            <div className="text-xs text-gray-600">At-will employment provisions</div>
                          </div>
                          <div className="ml-auto flex space-x-2">
                            <button className="p-2 hover:bg-gray-200 rounded">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chat input */}
                    <div className="mt-6 flex items-center space-x-3">
                      <div className="md:flex-1 relative">
                        <input
                          type="text"
                          placeholder="Ask a follow-up question..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      <button className="bg-[#355e66] text-white p-3 rounded-lg hover:bg-[#2a4d54] transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="bg-gray-50 border-l">
                    {/* Research Sources */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">Sources</h3>
                        <button className="text-[#355e66] text-sm">Filter</button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <Gavel className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              Smith v. TechCorp (2023)
                            </div>
                            <div className="text-xs text-gray-500">
                              CA Court of Appeals
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              CA Labor Code § 2922
                            </div>
                            <div className="text-xs text-gray-500">
                              State Statute
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              29 CFR § 1630.2
                            </div>
                            <div className="text-xs text-gray-500">
                              Federal Regulation
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-3 p-2 hover:bg-white rounded">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <Library className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              Employment Law Treatise
                            </div>
                            <div className="text-xs text-gray-500">
                              Secondary Authority
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Research Summary */}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-4">Research Summary</h3>
                      
                      <div className="space-y-3 text-sm">
                        <div className="p-3 bg-white rounded border">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-medium">47 Cases Found</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            92% relevance score
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded border">
                          <div className="flex items-center space-x-2 mb-2">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">12 Statutes</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            State & federal law
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded border">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">8 Regulations</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Administrative rules
                          </div>
                        </div>
                      </div>

                      <button className="w-full mt-4 bg-[#355e66] text-white py-3 rounded-lg hover:bg-[#2a4d54] transition-colors">
                        Generate Brief
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instant legal answers section */}
      <section className="section-spacing bg-gray-100">
        <div className="section-container text-center">
          <h2 className="text-heading-2 mb-4 text-gray-900">
            Get instant answers to complex legal questions
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Our AI searches through millions of legal authorities in seconds, providing you with relevant cases, statutes, and expert analysis for any legal question.
          </p>

          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
              {/* Research interface dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-4 md:h-[700px]">
                {/* Main research area */}
                <div className="lg:col-span-3 p-6 bg-white">
                  {/* Search query */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border">
                      <Search className="w-5 h-5 text-[#355e66]" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          "What are the statute of limitations for breach of contract claims in New York?"
                        </div>
                        <div className="text-sm text-gray-600">Searched 15 seconds ago</div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="bg-blue-50 rounded-lg p-6 mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-[#355e66] rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-3">AI Research Summary</h3>
                        <p className="text-gray-700 mb-4">
                          In New York, the statute of limitations for breach of contract claims is <strong>6 years</strong> for written contracts and <strong>6 years</strong> for oral contracts under NY CPLR § 213. The limitation period begins when the breach occurs, not when it is discovered.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-white rounded border">
                            <div className="font-medium text-gray-900 mb-1">Written Contracts</div>
                            <div className="text-sm text-gray-600">6 years from breach</div>
                            <div className="text-xs text-blue-600 mt-1">NY CPLR § 213(2)</div>
                          </div>
                          <div className="p-3 bg-white rounded border">
                            <div className="font-medium text-gray-900 mb-1">Oral Contracts</div>
                            <div className="text-sm text-gray-600">6 years from breach</div>
                            <div className="text-xs text-blue-600 mt-1">NY CPLR § 213(2)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key authorities */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Key Legal Authorities</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">NY CPLR § 213(2)</div>
                          <p className="text-sm text-gray-600 mt-1">
                            Actions for breach of contract must be commenced within six years
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Primary Authority</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Current</span>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-200 rounded">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      <div className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <Gavel className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Ely-Cruikshank Co. v. Bank of Montreal (1986)</div>
                          <p className="text-sm text-gray-600 mt-1">
                            NY Court of Appeals confirmed that breach of contract accrues when breach occurs, not when discovered
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Binding Precedent</span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Landmark Case</span>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-200 rounded">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      <div className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                          <Library className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">NY Practice Series: Contract Law § 15:4</div>
                          <p className="text-sm text-gray-600 mt-1">
                            Comprehensive analysis of statute of limitations in contract disputes
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Secondary Authority</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Expert Analysis</span>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-200 rounded">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Research sidebar */}
                <div className="bg-gray-50 border-l p-4">
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Research Stats</h4>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded border">
                        <div className="text-2xl font-bold text-[#355e66]">2.3M</div>
                        <div className="text-sm text-gray-600">Sources Searched</div>
                      </div>
                      
                      <div className="p-3 bg-white rounded border">
                        <div className="text-2xl font-bold text-green-600">97%</div>
                        <div className="text-sm text-gray-600">Accuracy Rate</div>
                      </div>
                      
                      <div className="p-3 bg-white rounded border">
                        <div className="text-2xl font-bold text-blue-600">15s</div>
                        <div className="text-sm text-gray-600">Search Time</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Related Topics</h4>
                    
                    <div className="space-y-2">
                      <button className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-gray-50 transition-colors">
                        Contract formation elements
                      </button>
                      <button className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-gray-50 transition-colors">
                        Breach remedies in NY
                      </button>
                      <button className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-gray-50 transition-colors">
                        Tolling provisions
                      </button>
                      <button className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-gray-50 transition-colors">
                        Discovery rule exceptions
                      </button>
                    </div>
                  </div>

                  <button className="w-full bg-[#355e66] text-white py-3 rounded-lg hover:bg-[#2a4d54] transition-colors mb-4">
                    Export Research
                  </button>
                  
                  <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                    Save to Library
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal authorities database section */}
      <section className="section-spacing bg-gray-50">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-heading-2 mb-6 text-gray-900">
                Access millions of legal authorities
                in one intelligent search
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our comprehensive legal database includes case law, statutes, regulations, and secondary authorities from all 50 states and federal courts, continuously updated and cross-referenced by AI.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#355e66] rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Comprehensive Coverage
                    </h3>
                    <p className="text-gray-600">
                      Federal and state courts, administrative agencies, and secondary authorities all in one search.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#d47b0f] rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Real-Time Updates
                    </h3>
                    <p className="text-gray-600">
                      Stay current with new decisions and legislative changes updated within hours of publication.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Relevance Ranking
                    </h3>
                    <p className="text-gray-600">
                      AI-powered relevance scoring ensures the most pertinent authorities appear first in your results.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-primary rounded-xl shadow-xl overflow-hidden p-6">
              <div className="bg-white rounded-xl shadow-xl border p-6">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Search className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-gray-900">
                      Legal Database Search
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Searching across 2.3M legal authorities for: "corporate liability for employee actions"
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-3">Search Results:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center space-x-2">
                        <Gavel className="w-4 h-4 text-blue-500" />
                        <span>Federal Cases</span>
                      </div>
                      <span className="font-medium">1,247</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-green-500" />
                        <span>State Statutes</span>
                      </div>
                      <span className="font-medium">89</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-purple-500" />
                        <span>Regulations</span>
                      </div>
                      <span className="font-medium">156</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 mb-4">
                  <div className="text-sm text-green-800">
                    <strong>Top Result:</strong> Respondeat superior doctrine - Employer liability established in 94% of similar cases
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-[#355e66] text-white py-2 px-4 rounded hover:bg-[#2a4d54] transition-colors">
                    View Results
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research workflow section */}
      <section className="section-spacing bg-[#355e66]">
        <div className="section-container">
          <h2 className="text-heading-2 text-center mb-12 text-white">
            Complete Legal Research in Minutes
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-[#355e66] rounded-lg flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Natural Language Search
              </h3>
              <p className="text-gray-600">
                Ask questions in plain English and get precise legal answers with relevant case citations and statutory analysis.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-[#d47b0f] rounded-lg flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                AI Analysis & Synthesis
              </h3>
              <p className="text-gray-600">
                Get synthesized answers that combine multiple authorities, highlighting conflicts and providing clear guidance.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Instant Brief Generation
              </h3>
              <p className="text-gray-600">
                Generate research memos and briefs with proper citations, ready for client delivery or court filing.
              </p>
            </div>
          </div>

          <div className="text-center">
            <button className="bg-[#d47b0f] hover:bg-[#b8690c] text-white px-8 py-4 rounded-lg font-semibold transition-colors">
              Try Legal Research Free
            </button>
          </div>
        </div>
      </section>

      {/* Research sources section */}
      <section className="section-spacing bg-white">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Research Sources Coverage</span>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Live</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <Gavel className="w-6 h-6 text-blue-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Federal & State Courts</h4>
                        <p className="text-sm text-gray-600">Supreme Court, Circuit Courts, District Courts, State Appellate Courts</p>
                      </div>
                      <span className="text-sm text-blue-600 font-medium">1.2M cases</span>
                    </div>

                    <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <BookOpen className="w-6 h-6 text-green-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Statutes & Codes</h4>
                        <p className="text-sm text-gray-600">U.S. Code, State Statutes, Municipal Codes</p>
                      </div>
                      <span className="text-sm text-green-600 font-medium">890K statutes</span>
                    </div>

                    <div className="flex items-center space-x-4 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <FileText className="w-6 h-6 text-purple-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Regulations & Rules</h4>
                        <p className="text-sm text-gray-600">CFR, State Regulations, Court Rules</p>
                      </div>
                      <span className="text-sm text-purple-600 font-medium">340K regulations</span>
                    </div>

                    <div className="flex items-center space-x-4 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                      <Library className="w-6 h-6 text-orange-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">Secondary Sources</h4>
                        <p className="text-sm text-gray-600">Law reviews, treatises, practice guides</p>
                      </div>
                      <span className="text-sm text-orange-600 font-medium">150K sources</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Database Coverage</span>
                      <span className="text-sm font-medium">2.3M+ Sources</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#355e66] h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Updated daily with new decisions and legislation</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-heading-2 mb-6 text-gray-900">
                Research across all jurisdictions
                and practice areas
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Whether you're researching federal constitutional law or local zoning ordinances, our AI has access to the most comprehensive legal database available, with real-time updates and cross-jurisdictional analysis.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#355e66] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Multi-Jurisdictional Search</h3>
                    <p className="text-gray-600">
                      Search across federal, state, and local authorities simultaneously with jurisdiction-specific filtering.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#d47b0f] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Practice Area Intelligence</h3>
                    <p className="text-gray-600">
                      AI understands practice area context to surface the most relevant authorities for your specific legal question.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Citation Analysis</h3>
                    <p className="text-gray-600">
                      Automatic citation checking and Shepardizing to ensure you're relying on good law.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Trend Analysis</h3>
                    <p className="text-gray-600">
                      Identify emerging legal trends and shifts in judicial interpretation across time and jurisdictions.
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
          <h2 className="text-4xl font-bold mb-16 text-gray-900">More features to explore</h2>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Legal Drafting</h3>
              <p className="text-gray-600 text-sm">Draft correct legal documents and clauses quickly</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Contract Review</h3>
              <p className="text-gray-600 text-sm">Redline contracts and catch risks automatically</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileSearch className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Due Diligence</h3>
              <p className="text-gray-600 text-sm">Never be caught off guard during transactions</p>
            </div>
            
            <div className="text-center relative">
              <div className="absolute -top-2 -right-2 bg-[#355e66] text-white text-xs px-2 py-1 rounded">Beta</div>
              <div className="w-16 h-16 bg-[#d47b0f] rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-gray-900">Case Preparation</h3>
              <p className="text-gray-600 text-sm">Predict possible case outcomes with AI role play</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LegalResearchPage;