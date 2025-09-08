// components/VaultSection.tsx
'use client';
import React,{useState} from 'react';
import {
  Shield,
  BarChart3,
  Building,
  Calendar,
  Folder,
  Lock,
  FolderLock,
  ShieldCheck,
} from "lucide-react";

const VaultSection: React.FC = () => {
   const securityFeatures = [
      {
        icon: FolderLock,
        title: "Data Encrypted in Transit and at Rest",
        description: "End-to-end encryption protects your sensitive legal documents and communications."
      },
      {
        icon: Shield,
        title: "No AI Training on User Data",
        description: "Your confidential information stays private and is never used to train our AI models."
      },
      {
        icon: ShieldCheck,
        title: "On-premise Deployment Available",
        description: "Deploy Wansom AI within your own infrastructure for maximum security control."
      }]
  return (
    <section className="pt-12 bg-primary overflow-hidden md:-mt-24" id="document-vault">
      <div className="section-container flex flex-col md:flex-row gap-8">
         {/* Image Container with proper cropping */}
        <div className='md:basis-1/2'>
          <img
            src="/wansom-features.png"
            alt="Document Vault"
            className="h-full object-cover object-left-top"
          />
        </div>
        <div className="md:basis-1/2 mb-12 lg:mb-16">
          <h2 className="text-heading-4 text-white mb-6">
            Wansom AI is built with enterprise-level security at its core, ensuring your firm's sensitive data remains confidential and protected.
          </h2>    
                <div className="mt-5">
              {securityFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="mb-5 bg-primary rounded-lg space-y-3"
                >
                  <div className=" flex gap-4">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm w-fit h-fit flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                       <h3 className="text-xl font-semibold text-gray-100">
                      {feature.title}
                    </h3>
                     <p className="text-md text-dim">
                      {feature.description}
                    </p>
                    </div>
                    
                  </div>
                 
                </div>
              ))}
            </div>
        </div>
        
       
        
      </div>
    </section>
  );
};

export const VaultDocs=() => {
  
    const documentCategories = [
    {
      title: "Financial Statements & Audits",
      rules: 16,
      icon: BarChart3,
      description: "Comprehensive analysis of financial data, cash flows, and audit reports"
    },
    {
      title: "Corporate Governance Documents", 
      rules: 8,
      icon: Building,
      description: "Board resolutions, bylaws, and organizational structure analysis"
    },
    {
      title: "Operational & Commercial Agreements",
      rules: 39,
      icon: Calendar,
      description: "Customer contracts, supplier agreements, and operational policies"
    }
  ];
   
  return (
  <div className="relative bg-primary rounded-xl shadow-xl overflow-hidden p-6 w-full">
            <div className="space-y-3">
              {documentCategories.map((category, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Lock className="w-5 h-5 text-[#355e66]" />
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Folder className="w-4 h-4" />
                        <span className="text-sm font-medium">{category.rules} Documents</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {category.title}
                  </h3>
                  
                  <div className="space-y-2">
                    {/* Placeholder content bars */}
                    <div className="flex space-x-2">
                      <div className="h-2 bg-gray-200 rounded-full flex-1"></div>
                      <div className="h-2 bg-gray-200 rounded-full flex-1"></div>
                      <div className="h-2 bg-gray-200 rounded-full w-16"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-2 bg-gray-200 rounded-full w-24"></div>
                      <div className="h-2 bg-gray-200 rounded-full flex-1"></div>
                      <div className="h-2 bg-gray-200 rounded-full w-20"></div>
                    </div>
                  
                  </div>
                </div>
              ))}
            </div>
          </div>
  )
}

export default VaultSection;