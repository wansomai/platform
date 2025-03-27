// components/FeaturesSection.tsx
'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, FileText, CheckCircle, Calculator, BookOpen, FileSearch, Scale, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';

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
      title: "Company Registration",
      description: "Simplify business formation with automated registration processes, document preparation, and compliance tracking across multiple jurisdictions.",
      icon: CheckCircle
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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Heading */}
        <div className="mb-16" id='ai-assistant'>
          <h2 className="text-2xl md:text-4xl font-bold mb-4 font-marcellus max-w-5xl mx-auto text-center">Built By Leading Lawfirms and Advocates,<br/>Powering End to End Legal processes for global teams</h2>
        </div>

        {/* Features with Image */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-20">
          {/* Image Side */}
          <div className="md:w-1/2">
            <div className="rounded-lg overflow-hidden">
              <Image 
                src="/images/features.png" 
                alt="Legal Dashboard" 
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Content Side */}
          <div className="md:w-1/2">
            <h3 className="text-2xl font-bold mb-6">Legal AI Assistant Trained on your enterprise Data</h3>
            <p className="text-gray-600 mb-6">
              Our Legal AI Assistant is trained on your enterprise data, providing personalized insights and recommendations to help you make informed decisions.
            </p>
            {/* Feature Item 1 */}
            <div className="mb-8">
              <div className="bg-gray-100 inline-block px-4 py-2 rounded-md mb-2">
                <h4 className="text-xl font-medium text-green-700">Dedicated Legal Workspaces</h4>
              </div>
              <p className="text-gray-600">
                Create dedicated legal workspaces to organize deep work and collaborate with your team. Provide instructions in natural language and collaborate with our AI agent for quicker results.
              </p>
            </div>
            
            {/* Feature Item 2 */}
            <div className="mb-8">
              <div className="bg-gray-100 inline-block px-4 py-2 rounded-md mb-2">
                <h4 className="text-xl font-medium text-green-700">Deep Research</h4>
              </div>
              <p className="text-gray-600">
               Enable web search and supplement your enterprise data with real-time legal insights and recommendations to help you make more informed decisions.
              </p>
            </div>
            
            {/* Feature Item 3 */}
            <div>
              <div className="bg-gray-100 inline-block px-4 py-2 rounded-md mb-2">
                <h4 className="text-xl font-medium text-green-700">Customizable Actions</h4>
              </div>
              <p className="text-gray-600">
                Define custom actions and workflows to automate routine tasks and improve efficiency directly within your legal workspace.
              </p>
            </div>
          </div>
        </div>

        {/* Everything You Need Section */}
        <div className="mb-10" id="workflows">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">What You Can Automate with Wakilichat</h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto mb-12">
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
                  className={`${isHighlighted ? ' bg-[#005c4d] p-8' : 'bg-gray-100 p-8'} rounded-lg relative`}
                >
                  {isHighlighted ? (
                    <div className="flex justify-center mb-5">
                      <div className="bg-white rounded-full p-3">
                        <process.icon className={`w-6 h-6 text-green-800`} />
                      </div>
                    </div>
                  ) : (
                    <div className={`flex justify-center mb-5 `}>
                      <div className="bg-[#005c4d] rounded-full p-3">
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
                      <button className={`flex items-center ${isHighlighted ? 'text-white' : 'text-green-700'} font-medium`} onClick={() => window.location.href = '/login'}>
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
                className={`w-3 h-3 rounded-full ${currentSlide === i ? 'bg-green-700' : 'bg-gray-300'}`}
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
    </section>
  );
};

export default FeaturesSection;