// components/FeaturesSection.tsx
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Star, Activity, PieChart, Grid, ArrowRight, FileText, 
  CheckCircle, Calculator, BookOpen, FileSearch, Scale, 
  ShieldCheck, AlertCircle, Calendar, Sparkles, Atom,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Legal processes data
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

  // Partner logos data
  const partnerLogos = [
    { src: "/logos/1.png", alt: "Partner Law Firm 1" },
    { src: "/logos/2.png", alt: "Partner Law Firm 2" },
    { src: "/logos/3.png", alt: "Partner Law Firm 3" },
    { src: "/logos/4.png", alt: "Partner Law Firm 4" },
    { src: "/logos/5.png", alt: "Partner Law Firm 5" },
    { src: "/logos/6.png", alt: "Partner Law Firm 6" },
    { src: "/logos/7.png", alt: "Partner Law Firm 7" }
  ];

  const totalSlides = Math.ceil(legalProcesses.length / 3);

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="section-spacing bg-white">
      {/* Header Section */}
      <section className="section-container" id="ai-assistant">
        <div className="text-start md:text-center mb-12 lg:mb-16">
          <h2 className="text-heading-2 mb-6 max-w-5xl mx-auto">
            Built By Leading Law Firms and Advocates,<br />
            Powering End to End Legal Processes for Global Teams
          </h2>
        </div>
      </section>

      {/* Partner Logos */}
      <section className="section-container mb-16">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 items-center">
          {partnerLogos.map((logo, index) => (
            <div key={index} className="flex justify-center">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={160}
                height={80}
                className="h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Partner Support Section */}
      <PartnerSupportSection />

      {/* Automation Section */}
      <div className="section-spacing bg-gray-50" id="workflows">
        <div className="section-container">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-heading-2 mb-4">
              What You Can Automate with Wansom AI
            </h2>
            <p className="text-body-large text-muted max-w-3xl mx-auto">
              Legal processes can be tedious and time-consuming. We save you time by automating them.
            </p>
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {legalProcesses.slice(currentSlide * 3, (currentSlide * 3) + 3).map((process, index) => {
              // Every middle card gets highlighted
              const isHighlighted = index === 1;
              const actualIndex = currentSlide * 3 + index;
              
              return (
                <div 
                  key={actualIndex} 
                  className={`relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                    isHighlighted 
                      ? 'bg-primary text-white shadow-xl' 
                      : 'bg-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="p-8">
                    <div className="flex justify-center mb-6">
                      <div className={`p-4 rounded-full ${
                        isHighlighted 
                          ? 'bg-white/10 backdrop-blur-sm' 
                          : 'bg-primary'
                      }`}>
                        <process.icon className={`w-8 h-8 ${
                          isHighlighted ? 'text-white' : 'text-white'
                        }`} />
                      </div>
                    </div>
                    
                    <h3 className={`text-heading-5 text-center mb-4 ${
                      isHighlighted ? 'text-white' : 'text-gray-900'
                    }`}>
                      {process.title}
                    </h3>
                    
                    <p className={`text-body mb-6 ${
                      isHighlighted ? 'text-gray-100' : 'text-gray-600'
                    }`}>
                      {process.description}
                    </p>
                    
                    <div className="flex justify-center">
                      <button 
                        className={`inline-flex items-center text-sm font-semibold transition-all hover:gap-3 ${
                          isHighlighted 
                            ? 'text-white hover:text-gray-100' 
                            : 'text-primary hover:text-primary/80'
                        }`}
                        onClick={() => window.location.href = '/login'}
                        aria-label={`Try ${process.title}`}
                      >
                        <span>Try it out</span>
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slider Controls */}
          <div className="flex justify-center items-center gap-6">
            <button 
              className="p-3 rounded-full border border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-105 focus-ring" 
              onClick={handlePrevSlide}
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalSlides }, (_, i) => (
                <button 
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    currentSlide === i 
                      ? 'bg-primary scale-110' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => handleSlideChange(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            
            <button 
              className="p-3 rounded-full border border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-105 focus-ring" 
              onClick={handleNextSlide}
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Partner Support Section Component
const PartnerSupportSection = () => {
  const features = [
    {
      icon: Sparkles,
      title: "Custom AI Models",
      description: "Domain-specific AI models for the legal industry. Fine-tuned by jurisdiction, case types, and legal-specific document formats."
    },
    {
      icon: PieChart,
      title: "Collaborative Workspace",
      description: "Enable real-time collaboration across teams handling shared legal matters."
    },
    {
      icon: FileText,
      title: "Document Intelligence",
      description: "Extract insights, summarize, and review large documents in minutes with AI precision."
    },
    {
      icon: Activity,
      title: "Agentic Workflows",
      description: "Streamline processes like drafting, compliance reporting, research, onboarding, and more."
    },
    {
      icon: Atom,
      title: "Deep Research",
      description: "Enable web search and supplement your enterprise data with real-time legal insights and recommendations to help you make more informed decisions."
    }
  ];

  return (
    <div className="section-spacing bg-primary">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 ">
          {/* Left Column - Content */}
          <div className="order-1">
            <h2 className="text-heading-2 text-white mb-6">
              Protecting Client Confidentiality. Built for Collaboration
            </h2>
            <p className="text-body-large text-dim mb-8">
              AI is helping global legal teams achieve cost savings, increase productivity, and manage complex processes more effectively. Wansom AI provides a secure, collaborative workspace powered by custom legal AI models that integrate directly into your firm's workflows.
            </p>
            <p className="text-body text-dim mb-8">
              Whether your goal is to streamline operations, improve legal outcomes, or handle complex matters, we ensure AI delivers measurable value for your practice and your clients.
            </p>
             <div className="features-image-container">
              <img 
                src="/wansom-features.png" 
                alt="Wansom AI Features Dashboard showing collaborative tools and AI-powered legal workflows"
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            </div>
           
          </div>
          
          {/* Right Column - Image */}
          <div className="order-2">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-heading-5 text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-body text-gray-100">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;