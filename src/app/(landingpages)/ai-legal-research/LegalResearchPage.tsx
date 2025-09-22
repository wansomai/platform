"use client";
import React, { useState } from "react";
import {
  CheckCircle,
  Send,
  Loader,
  Circle,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VaultSection from "@/components/home/vault";

const LegalResearchPage = () => {
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
      <section className="pt-24 md:pt-32 pb-16 bg-[#355e66] relative overflow-hidden">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="relative flex flex-col lg:flex-row gap-12 items-center">
            <div className="text-white lg:basis-1/2 text-center lg:text-left">

              <h1 className="text-heading-1 mb-4 text-shadow font-serif">
               AI Built for Lawyers
              </h1>

              <p className="text-xl mb-8 text-white">
                Get instant answers to complex legal questions with AI that searches through verified cases, statutes, and legal authorities in seconds.
              </p>

              <button className="bg-[#d47b0f] hover:bg-[#355e66] text-white px-5 py-2 rounded-lg font-semibold transition-colors mb-12">
                Try Wansom For Free <ArrowUpRight className="inline-block ml-2 w-6 h-6" />
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
     <LegalResearchAssistant/>

       {/* workspace section */}  
      <CollaborativeWorkspaces/>         

      {/* More features section */}
   <VaultSection/>

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

const LegalResearchAssistant = () => {
  const [expandedSections, setExpandedSections] = useState({
    assistant: true,
    documents: false,
    web: false,
    jurisdictional: false,
    practice: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
   <section className="section-spacing bg-gray-50">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-4">
              {/* Main section - Your Legal Research Assistant */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('assistant')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h2 className="text-heading-2 text-gray-900">
                    Your Legal Research Assistant
                  </h2>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.assistant ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.assistant ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-xl text-gray-600">
                    Our AI searches through verified legal authorities in seconds, providing you with relevant cases, statutes, and expert analysis for any legal question.
                  </p>
                </div>
              </div>

              {/* Documents section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('documents')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h2 className="text-heading-4 text-gray-900">
                    Search Across Your Documents
                  </h2>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.documents ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.documents ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-xl text-gray-600">
                    Ask complex questions across multiple documents, unlocking insights in your firm's data.
                  </p>
                </div>
              </div>

              {/* Web search section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('web')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h2 className="text-heading-4 text-gray-900">
                    Search the Web for Verified Sources
                  </h2>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.web ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.web ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-xl text-gray-600">
                    Get real-time answers with citations from trusted legal websites and databases.
                  </p>
                </div>
              </div>

              {/* Multi-Jurisdictional Search section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('jurisdictional')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h2 className="text-heading-4 text-gray-900">
                    Multi-Jurisdictional Support
                  </h2>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.jurisdictional ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.jurisdictional ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-xl text-gray-600">
                    Search across federal, state, and local authorities simultaneously with jurisdiction-specific filtering.
                  </p>
                </div>
              </div>

              {/* Practice Area Intelligence section */}
              <div className="pb-4">
                <button
                  onClick={() => toggleSection('practice')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h2 className="text-heading-4 text-gray-900">
                    Practice Area Intelligence
                  </h2>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.practice ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.practice ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-xl text-gray-600">
                    AI understands practice area context to surface the most relevant authorities for your specific legal question.
                  </p>
                </div>
              </div>
            </div>
  <ResearchSourcesWorkflow/>
          
          </div>
        </div>
      </section>   
  );
}

const CollaborativeWorkspaces = () => {
  const [expandedSections, setExpandedSections] = useState({
    assistant: true,
    documents: false,
    web: false,
    jurisdictional: false,
    practice: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
   <section className="section-spacing bg-gray-100">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <img
              src="/images/collaborative-workspace.png"
              alt="Collaborative Workspaces"
              className="w-full rounded-2xl shadow-lg"
            />
            <div className="space-y-4">
              {/* Main section - Your Legal Research Assistant */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('assistant')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h2 className="text-heading-2 text-gray-900">
                    Collaborate on Legal Projects
                  </h2>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.assistant ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.assistant ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-xl text-gray-600">
                    Create secure, collaborative workspaces where legal teams can share documents, discuss strategies, and manage cases together.
                  </p>
                </div>
              </div>

              {/* Documents section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('documents')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h2 className="text-heading-4 text-gray-900">
                    Agentic workflows
                  </h2>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.documents ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.documents ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-xl text-gray-600">
                    Add AI agents (Associates) to your legal projects to help with specialised tasks.
                  </p>
                </div>
              </div>

              {/* Web search section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('web')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h2 className="text-heading-4 text-gray-900">
                   Custom Project Instructions
                  </h2>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.web ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.web ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-xl text-gray-600">
                    Tailor AI behavior for each project with custom instructions and guidelines.
                  </p>
                </div>
              </div>

              {/* Multi-Jurisdictional Search section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection('jurisdictional')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h2 className="text-heading-4 text-gray-900">
                  Access Control & Permissions
                  </h2>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.jurisdictional ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.jurisdictional ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-xl text-gray-600">
                    Control who can view, edit, and manage each workspace with granular permissions.
                  </p>
                </div>
              </div>
            </div>
          
          </div>
        </div>
      </section>   
  );
}



export default LegalResearchPage;