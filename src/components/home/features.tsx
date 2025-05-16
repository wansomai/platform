// components/FeaturesSection.tsx
'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Activity, PieChart, Grid,ArrowRight, FileText, CheckCircle, Calculator, BookOpen, FileSearch, Scale, ShieldCheck, AlertCircle, Calendar, Sparkles, Atom } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Comprehensive list of legal processes that can be automated
  const legalProcesses = [
    {
      title: "Contract Review & Management",
      description: "Automate contract reviews, extract key terms, identify risks, and manage renewal deadlines—saving you hours of manual work.",
      icon: FileText
    },
  
    {
      title: "Tax Filings & Compliance",
      description: "Streamline tax preparation, automate regulatory filings, and stay compliant with ever-changing legal requirements and deadlines.",
      icon: Calculator
    },
    {
      title: "Legal Research",
      description: "Conduct comprehensive legal research across statutes, case law, and regulations with AI-powered analysis and relevant citation finding.",
      icon: BookOpen
    },
    {
      title: "Company Registration",
      description: "Simplify business formation with automated registration processes, document preparation, and compliance tracking across multiple jurisdictions.",
      icon: CheckCircle
    },
    {
      title: "Due Diligence",
      description: "Automate due diligence for mergers, acquisitions, and investments with advanced document analysis and risk assessment.",
      icon: FileSearch
    },
    {
      title: "Litigation Management",
      description: "Track case progress, manage court filings, automatically generate standard legal documents, and predict case outcomes.",
      icon: Scale
    },
    {
      title: "Intellectual Property Filings",
      description: "Streamline trademark searches, patent applications, and IP portfolio management with automated workflows.",
      icon: ShieldCheck
    },
    {
      title: "Regulatory Compliance",
      description: "Stay updated with changing regulations, automate compliance monitoring, and generate required documentation across industries.",
      icon: AlertCircle
    },
    {
      title: "Legal Appointments & Deadlines",
      description: "Automate scheduling, court date management, and deadline tracking with smart reminders and calendar integration.",
      icon: Calendar
    }
  ];
  return (
    <div className="py-8 md:py-16 bg-white ">
        {/* Section Heading */}
        <section className="container mx-auto px-4" id='ai-assistant'>
          <h2 className="text-2xl md:text-4xl font-bold mb-4 font-marcellus max-w-5xl mx-auto text-start md:text-center">Built By Leading Lawfirms and Advocates,<br/>Powering End to End Legal Processes for Global Teams</h2>
        </section>
       

<section className='flex items-center justify-center gap-5 container mx-auto px-4 mb-12'>
  {
    [1,2,3,4,5,6,7].map((item) => (
      <div key={item} className='w-1/3'>
        <img 
          src={`/logos/${item}.png`} 
          alt="Legal Dashboard" 
         
          className="h-20 w-40 mx-auto object-contain grayscale hover:grayscale-0 transition duration-300"
        />
      </div>
    ))
  }
</section>
 <PartnerSupportSection/>
      

        {/* Everything You Need Section */}
        <div className="mb-10 py-12 max-w-8xl px-4 mx-auto" id="workflows">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">What You Can Automate with Wansom AI</h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12 text-lg">
            Legal Processes can be tedious and time-consuming, We save you time by automating them.
          </p>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {legalProcesses.map((process, index) => {
              // Every third item (index % 3 === 1) gets the green background
              const isHighlighted = index % 3 === 1;
              
              return (
                <div 
                  key={process.title} 
                  className={`${isHighlighted ? ' bg-primary p-8' : 'bg-gray-100 p-8'} rounded-lg relative`}
                >
                  {isHighlighted ? (
                    <div className="flex justify-center mb-5">
                      <div className="bg-white rounded-full p-3">
                        <process.icon className={`w-6 h-6 text-green-800`} />
                      </div>
                    </div>
                  ) : (
                    <div className={`flex justify-center mb-5 `}>
                      <div className="bg-primary rounded-full p-3">
                        <process.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className={isHighlighted ? '' : 'border border-gray-200 rounded-lg p-8'}>
                    <h3 className={`text-xl font-bold mb-3 text-center ${isHighlighted ? 'text-white' : ''}`}>
                      {process.title}
                    </h3>
                    <p className={`${isHighlighted ? 'text-gray-100' : 'text-gray-600'} mb-4`}>
                      {process.description}
                    </p>
                    <div className="flex justify-center">
                      <button className={`flex items-center ${isHighlighted ? 'text-white' : 'text-secondary'} font-medium`} onClick={() => window.location.href = '/login'}>
                        Try it out <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }).slice(currentSlide * 3, (currentSlide * 3) + 3)}
          </div>
        </div>

        {/* Slider Controls */}
        <div className="flex justify-center items-center space-x-4 mt-10">
          <button 
            className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors" 
            aria-label="Previous slide"
            onClick={() => {
              setCurrentSlide(prev => (prev > 0 ? prev - 1 : Math.floor(legalProcesses.length / 3) - 1));
            }}
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: Math.ceil(legalProcesses.length / 3) }, (_, i) => (
              <button 
                key={i}
                className={`w-3 h-3 rounded-full ${currentSlide === i ? 'bg-primary' : 'bg-gray-300'}`}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => {
                  setCurrentSlide(i);
                }}
              />
            ))}
          </div>
          
          <button 
            className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors" 
            aria-label="Next slide"
            onClick={() => {
              setCurrentSlide(prev => (prev < Math.floor(legalProcesses.length / 3) - 1 ? prev + 1 : 0));
            }}
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
     
    </div>
  );
};

export default FeaturesSection;


const PartnerSupportSection = () => {
  return (
    <div className=" px-4 py-12 bg-primary ">
      {/* Main section with two columns on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row gap-8 container mx-auto ">
        {/* Left column - heading and ratings */}
        <div className="lg:w-1/2">
             <h2 className='text-2xl md:text-4xl font-bold mb-4 text-white max-w-5xl mx-auto text-start'>
           Protecting Client confidentiality. Built for collaboration 
          </h2>
          <p className='text-dim mb-6 text-lg'>
            AI is helping global legal teams achieve cost savings, increase productivity, and manage complex processes more effectively. Wansom AI  provides a secure, collaborative workspace powered by custom legal AI models that integrate directly into your firm’s workflows.<br/>
 Whether your goal is to streamline operations, improve legal outcomes, or handle complex matters, we ensure AI delivers measurable value for your practice and your clients
          </p>
          
        <img src='/wansom-features.png' alt="wansom AI Chat Interface" className="w-[140%] h-auto mx-auto rounded-lg  mb-8"/>
        </div>
        
        {/* Right column - feature cards */}
        <div className="lg:w-1/2">
          <div className="space-y-6">
            {/* Publishing Card */}
            <div className="flex gap-4 p-4">
              <div className="mt-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Sparkles className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Custom AI Models</h3>
                <p className="text-gray-100 text-lg">
                 Domain specific AI models for the legal industry. Fine-tuned by jurisdiction, case types, and legal specific document formats
                </p>
              </div>
            </div>
            
            {/* Analytics Card */}
            <div className="flex gap-4 p-4 ">
              <div className="mt-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <PieChart className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Collaborative Workspace</h3>
                <p className="text-gray-100 text-lg">
                  Enable real-time collaboration across teams handling shared legal matters.
                </p>
              </div>
            </div>
            
            {/* Engagement Card */}
            <div className="flex gap-4 p-4">
              <div className="mt-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FileText className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Document Intelligence</h3>
                <p className="text-gray-100 text-lg">
                  Extract insights, summarize, and review large documents in minutes with AI precision.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <div className="mt-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Agentic Workflows</h3>
                <p className="text-gray-100 text-lg">
                  Streamline processes like, Drafting, compliance reporting, Research, onboarding, and more.
                </p>
              </div>
            </div>

              <div className="flex gap-4 p-4">
              <div className="mt-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Atom className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Deep Research</h3>
                <p className="text-gray-100 text-lg">
                  Enable web search and supplement your enterprise data with real-time legal insights and recommendations to help you make more informed decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
