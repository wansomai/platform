"use client";
import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle,
  Brain,
  Zap,
  BookOpen,
  Search,
  Clock,
  Target,
  Send,
  Gavel,
  Library,
  Globe,
  Link,
  Star,
  Award,
  Bookmark,
  Loader,
  Circle,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MoreFeatures from "@/components/home/MoreFeatures";

const LegalResearchPage = () => {
  const [selectedSource, setSelectedSource] = useState("cases");

  const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Akoth Odipo Advocates" },
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
<ResearchInterfaceCards/>
          
            
          </div>
        </div>
      </section>

   

      {/* Legal authorities database section */}
      <section className="section-spacing bg-gray-100">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-heading-2 mb-6 text-gray-900">
                Access millions of legal authorities
                in one intelligent search
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our AI searches through millions of legal authorities in seconds, providing you with relevant cases, statutes, and expert analysis for any legal question.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#355e66] rounded-lg flex items-center justify-center p-3">
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
                  <div className="w-12 h-12 bg-[#d47b0f] rounded-lg flex items-center justify-center p-3">
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
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center p-3">
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
  <ResearchSourcesWorkflow/>
          
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
            <button className="bg-[#d47b0f] hover:bg-[#b8690c] text-white px-8 py-4 rounded-lg font-semibold transition-colors"  onClick={() => (window.location.href = "/login")}>
              Try Legal Research Free
            </button>
          </div>
        </div>
      </section>

      {/* Research sources section */}
      <section className="section-spacing bg-gray-50">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
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

            <div>
              <h2 className="text-heading-2 mb-6 text-gray-900">
                Research across all jurisdictions
                and practice areas
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Whether you're researching federal constitutional law or local zoning ordinances, our AI has access to the most comprehensive legal database available.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#355e66] p-3 rounded-full flex items-center justify-center text-white text-sm font-bold">
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
                  <div className="w-8 h-8 bg-[#d47b0f] p-3 rounded-full flex items-center justify-center text-white text-sm font-bold">
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
                  <div className="w-8 h-8 p-3 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
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
                  <div className="w-8 h-8 p-3 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
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
      <MoreFeatures/>

      <Footer />
    </div>
  );
};

export const ResearchInterfaceCards = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-16 relative">
      {/* Top Card with Input */}
      <div className="bg-white rounded-2xl px-8 py-4 shadow-lg border border-gray-200 relative z-10 w-full md:w-[70%] mx-auto">
        <div className="space-y-4 mb-6">
          <div className="h-2 bg-gray-200 rounded-full w-full"></div>
          <div className="h-2 bg-gray-200 rounded-full w-3/4 "></div>
          <div className="h-2 bg-gray-200 rounded-full w-1/2"></div>
         
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask any legal question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 text-sm focus:ring-[#355e66] focus:border-transparent"
          />
          <button className="bg-[#355e66] hover:bg-[#2a4d54] text-white px-4 text-sm py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
            <span>Search</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Connecting Lines */}
      <div className="absolute top-16 left-1/2 transform  z-0">
        {/* Vertical line down */}
        <div className="w-0.5 h-[500px] md:h-16 bg-gray-300"></div>
        {/* Horizontal line */}
        <div className="hidden md:block w-96 h-0.5 bg-gray-300 -ml-48"></div>
        {/* Three vertical lines down to cards */}
        <div className="hidden md:flex justify-between w-96 -ml-48 ">
          <div className="w-0.5 h-16 bg-gray-300"></div>
          <div className="w-0.5 h-16 bg-gray-300"></div>
          <div className="w-0.5 h-16 bg-gray-300"></div>
        </div>
      </div>

      {/* Bottom Row - Three Research Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 relative z-10">
        {/* Federal Cases Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-start mb-4 gap-4">
           
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Case Law
          </h3>
          </div>
          
          
          
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full w-full"></div>
            <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded-full w-1/2"></div>
          </div>
        </div>
        {/* State Statutes Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-start gap-4 mb-4">
           
             <Loader className="w-8 h-8 text-[#4a7279]" />
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Statutes
          </h3>
          </div>
          
          
          
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full w-full"></div>
            <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded-full w-1/2"></div>
          </div>
        </div>
      
        {/* Regulations Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-start gap-4 mb-4">
           
             <Loader className="w-8 h-8 text-[#4a7279]" />
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Regulations
          </h3>
          </div>
          
          
          
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full w-full"></div>
            <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded-full w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export const ResearchSourcesWorkflow = () => {
  return (
    <div className="max-w-4xl mx-auto bg-primary p-8 rounded-3xl">
      {/* Top Card */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-3 justify-between">
          <h2 className="text-md font-semibold text-gray-900">
            Search Legal Authorities & Case Law
          </h2>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Bottom Card with Workflow Steps */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="space-y-6">
          {/* Step 1 - Completed */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-medium text-gray-900">
            Verifying legal sources
            </span>
          </div>

          {/* Step 2 - In Progress */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Loader className="w-6 h-6 text-primary animate-spin" />
            </div>
            <span className="text-lg font-medium text-gray-900">
              Getting related case law
            </span>
          </div>

          {/* Step 3 - Pending */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Circle className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-lg font-medium text-gray-500">
              Create citations
            </span>
          </div>

          {/* Step 4 - Pending */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Circle className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-lg font-medium text-gray-500">
              Generate response
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


export default LegalResearchPage;