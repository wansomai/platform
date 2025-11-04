// components/FeaturesSection.tsx
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Star, Activity, PieChart, Grid, ArrowRight, FileText, 
 Sparkles, Atom,
  ChevronLeft, ChevronRight,
  Play,
  Gavel
} from 'lucide-react';
import {PatnerLogoSection} from './Partnerlogos';

const FeaturesSection: React.FC = () => {

  // Partner logos data



  return (
    <div className=" bg-white">
     
      {/* Partner Logos */}
      <PatnerLogoSection/>
      {/* Partner Support Section */}
      <PartnerSupportSection />

      {/* Automation Section */}
    </div>
  );
};

// Partner Support Section Component
const PartnerSupportSection: React.FC = () => {
  const features = [
    {
      icon: Sparkles,
      title: "Legal-Specific AI Models",
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
      title: "Legal Workflows",
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
            Our platform provides a secure, collaborative workspace powered by legal specific AI models that integrate directly into your firm's workflows.
            </p>
            <p className="text-body text-dim mb-8">
              Whether your goal is to streamline operations, improve legal outcomes, or handle complex matters, we ensure AI delivers measurable value for your practice and your clients.
            </p>
           
           
          </div>
          
          {/* Right Column - Image */}
          <div className="order-2 mb-4 lg:mb-0 relative">
             <div className="bg-[#355e66]  rounded-lg p-4 relative ">
                 <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full h-full">
                  <div className="flex items-center bg-gray-50 px-4 py-3 border-b ">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex ml-auto space-x-4 text-sm">
                      <button className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        Chat
                      </button>
                      <button className="flex items-center text-[#355e66] font-medium">
                        <span className="w-2 h-2 bg-[#355e66] rounded-full mr-2"></span>
                        Draft
                      </button>
                      <button className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        Review
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 text-gray-900">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#355e66] rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">Legal Drafting</h3>
                          <p className="text-sm text-gray-600">Draft a new clause or article</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Play className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Contract Review</h3>
                          <p className="text-sm text-gray-600">Get hidden insights from contracts</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Gavel className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Case prediction</h3>
                          <p className="text-sm text-gray-600">Prepare briefs confidently</p>
                        </div>
                      </div>
                      
                      <button className="text-sm text-gray-600 flex items-center">
                        2 More <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-center lg:text-left w-[60%] absolute top-1/2 right-1 md:right-8">
                  <div className="bg-white rounded-lg shadow-xl p-6">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-sm text-gray-600 mb-2">Preview Document</div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-300 rounded w-full"></div>
                        <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-300 rounded w-5/6"></div>
                        <div className="h-2 bg-[#355e66] rounded w-1/2"></div>
                        <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">Legal Document Preview</div>
                  </div>
                </div>
            
            </div>
            <div className="space-y-6">
            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;