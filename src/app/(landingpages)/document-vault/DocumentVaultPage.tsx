"use client";
import React, { useState } from "react";
import {
  FileText,
  Search,
  Folder,
  Lock,
  ShieldCheck,
  Archive,
  Layers,
  Filter,
  Upload,
  Share2,
  ArrowUpRight,
  ChevronDown,
  BarChart3,
  Building,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import VaultSection, { VaultDocs } from "@/components/home/vault";
import Footer from "@/components/layout/Footer";
import DocumentAutomation from "@/components/home/DocumentAutomation";

const DocumentVaultPage = () => {
  const [expandedSections, setExpandedSections] = useState({
    encryption: true,
    access: false,
    audit: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const partnerLogos = [
    { src: "/logos/1.png", alt: "CM Advocates" },
    { src: "/logos/2.png", alt: "Akoth Odipo Advocates" },
    { src: "/logos/7.png", alt: "Riskhouse International" },
    { src: "/logos/4.png", alt: "Netsheria" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar placeholder */}
      <Navbar />
      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 bg-primary relative overflow-hidden">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="relative flex flex-col lg:flex-row gap-12 items-center">
            <div className="text-white max-w-4xl lg:basis-3/5">
              <h1 className="text-heading-1 font-bold mb-4 text-shadow">
                Secure Document Vault
              </h1>

              <p className="text-xl mb-8 text-gray-100">
                Capture, store, organize, and retrieve documents in a secure
                centralized repository powered by AI intelligence.
              </p>

              <button
                className="bg-[#d47b0f] hover:bg-[#355e66] text-white px-5 py-3 rounded-lg font-semibold transition-colors mb-12"
                onClick={() => (window.location.href = "/login")}
              >
                Try The Vault
                <ArrowUpRight className="inline-block ml-2 w-6 h-6" />
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

            {/* Hero Diagram */}
            <div className="lg:basis-2/5 w-full max-w-lg">
              <VaultDocsHero />
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="section-spacing bg-white">
        <div className="section-container">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="space-y-4 lg:basis-[45%]">
              <h2 className="text-heading-2 font-bold mb-6 text-gray-900">
                Smart Document Organization
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Organize documents automatically with AI-powered tagging,
                categorization, and metadata extraction.
              </p>

              {/* End-to-End Encryption section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection("encryption")}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h3 className="font-semibold text-lg text-gray-900">
                    AI-Powered Search
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.encryption ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    expandedSections.encryption
                      ? "max-h-96 opacity-100 mt-6"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-gray-600">
                    Find any document instantly with intelligent search that
                    understands context and content.
                  </p>
                </div>
              </div>

              {/* Access Control section */}
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => toggleSection("access")}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h3 className="font-semibold text-lg text-gray-900">
                    Team Collaboration
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.access ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    expandedSections.access
                      ? "max-h-96 opacity-100 mt-6"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-gray-600">
                    Granular permissions and role-based access ensure only
                    authorized users can view sensitive documents.
                  </p>
                </div>
              </div>

              {/* Audit Trail section */}
              <div className="pb-4">
                <button
                  onClick={() => toggleSection("audit")}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h3 className="font-semibold text-lg text-gray-900">
                    Audit Trail
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                      expandedSections.audit ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    expandedSections.audit
                      ? "max-h-96 opacity-100 mt-6"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-gray-600">
                    Complete audit logs track every document access,
                    modification, and sharing activity.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary rounded-lg p-1 lg:basis-[55%] ">
              <img
                src="/wansom-vault.png"
                alt="Wansom AI Document Vault showing secure file management, folder organization, and document search capabilities for legal teams"
                className="w-full h-full object-contain object-top"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
      <DocumentAutomation />

    <VaultSection/>
      <Footer />
    </div>
  );
};


export const VaultDocsHero = () => {
  const documentCategories = [
    {
      title: "Financial Statements & Audits",
      rules: 16,
      icon: BarChart3,
      description:
        "Comprehensive analysis of financial data, cash flows, and audit reports",
    },
    {
      title: "Corporate Governance Documents",
      rules: 8,
      icon: Building,
      description:
        "Board resolutions, bylaws, and organizational structure analysis",
    },  ];

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
                  <span className="text-sm font-medium">
                    {category.rules} Documents
                  </span>
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
  );
};
export default DocumentVaultPage;
