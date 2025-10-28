"use client";
import React, { useState } from "react";
import {
  FileText,

  Search,
  Folder,
  Lock,
  FolderLock,
  ShieldCheck,
  Archive,
  HardDrive,
  Layers,
  Filter,
  Star,
  Tag,
  Upload,
  Share2,
  ArrowUpRight,
  ChevronDown,
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
              <VaultDocs />
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

      {/* Footer placeholder */}
      <Footer />
    </div>
  );
};

// Document Vault Diagram Component
const DocumentVaultDiagram = () => {
  return (
    <div className="relative w-full h-96 flex items-center justify-center">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 400"
        className="max-w-md mx-auto"
      >
        {/* Connection lines */}
        <path
          d="M200 80 Q160 120 120 160"
          stroke="#60a5fa"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
          className="animate-pulse"
        />
        <path
          d="M200 80 Q240 120 280 160"
          stroke="#60a5fa"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
          className="animate-pulse"
        />
        <path
          d="M200 240 Q160 280 120 320"
          stroke="#22d3ee"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
          className="animate-pulse"
        />
        <path
          d="M200 240 Q240 280 280 320"
          stroke="#22d3ee"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
          className="animate-pulse"
        />

        {/* Top circle - ORGANIZE */}
        <circle
          cx="200"
          cy="80"
          r="45"
          fill="white"
          stroke="#a855f7"
          strokeWidth="3"
        />
        <foreignObject x="170" y="55" width="60" height="50">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Layers className="w-5 h-5 text-[#355e66] mb-1" />
            <span className="text-xs font-bold text-gray-900">ORGANIZE</span>
          </div>
        </foreignObject>

        {/* Center circle - DOCUMENTS */}
        <circle
          cx="200"
          cy="160"
          r="60"
          fill="white"
          stroke="#3b82f6"
          strokeWidth="4"
        />
        <foreignObject x="160" y="130" width="80" height="60">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Archive className="w-8 h-8 text-[#355e66] mb-2" />
            <span className="text-sm font-bold text-gray-900">DOCUMENTS</span>
          </div>
        </foreignObject>

        {/* Bottom circle - GOVERN */}
        <circle
          cx="200"
          cy="240"
          r="45"
          fill="white"
          stroke="#22d3ee"
          strokeWidth="3"
        />
        <foreignObject x="170" y="215" width="60" height="50">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShieldCheck className="w-5 h-5 text-[#355e66] mb-1" />
            <span className="text-xs font-bold text-gray-900">GOVERN</span>
          </div>
        </foreignObject>

        {/* Left side dots - UPLOAD */}
        <circle
          cx="60"
          cy="120"
          r="4"
          fill="#60a5fa"
          className="animate-pulse"
        />
        <circle
          cx="40"
          cy="140"
          r="3"
          fill="#60a5fa"
          className="animate-pulse"
        />
        <circle
          cx="80"
          cy="100"
          r="3"
          fill="#60a5fa"
          className="animate-pulse"
        />
        <circle
          cx="30"
          cy="160"
          r="2"
          fill="#60a5fa"
          className="animate-pulse"
        />
        <circle
          cx="70"
          cy="80"
          r="2"
          fill="#60a5fa"
          className="animate-pulse"
        />

        {/* Left label */}
        <foreignObject x="10" y="180" width="80" height="30">
          <div className="text-center">
            <span className="text-sm font-bold text-white">UPLOAD</span>
          </div>
        </foreignObject>

        {/* Right side dots - ACCESS */}
        <circle
          cx="340"
          cy="120"
          r="4"
          fill="#60a5fa"
          className="animate-pulse"
        />
        <circle
          cx="360"
          cy="140"
          r="3"
          fill="#60a5fa"
          className="animate-pulse"
        />
        <circle
          cx="320"
          cy="100"
          r="3"
          fill="#60a5fa"
          className="animate-pulse"
        />
        <circle
          cx="370"
          cy="160"
          r="2"
          fill="#60a5fa"
          className="animate-pulse"
        />
        <circle
          cx="330"
          cy="80"
          r="2"
          fill="#60a5fa"
          className="animate-pulse"
        />

        {/* Right label */}
        <foreignObject x="310" y="180" width="80" height="30">
          <div className="text-center">
            <span className="text-sm font-bold text-white">ACCESS</span>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};

// Vault Interface Component
const VaultInterface = () => {
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <span className="text-gray-600">Document Vault</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="bg-[#355e66] text-white px-4 py-2 rounded-lg text-sm flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4">
        {/* Sidebar */}
        <div className="bg-gray-50 border-r p-4">
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-900 mb-4">
              Categories
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                <Folder className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Contracts</span>
                <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded">
                  234
                </span>
              </div>

              <div className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer">
                <Folder className="w-4 h-4 text-green-600" />
                <span className="text-sm">Legal Briefs</span>
                <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded">
                  89
                </span>
              </div>

              <div className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer">
                <Folder className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Financial</span>
                <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded">
                  156
                </span>
              </div>

              <div className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer">
                <Folder className="w-4 h-4 text-orange-600" />
                <span className="text-sm">Compliance</span>
                <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded">
                  67
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 p-6">
          {/* Search and filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>

          {/* Document grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Document cards */}
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    Employment Contract - Smith.pdf
                  </h4>
                  <p className="text-sm text-gray-500">2.3 MB • 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Contract
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Active
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    Motion to Dismiss - Case 2024.docx
                  </h4>
                  <p className="text-sm text-gray-500">1.8 MB • 1 day ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    Legal Brief
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Draft
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    Q4 Financial Report.xlsx
                  </h4>
                  <p className="text-sm text-gray-500">5.2 MB • 3 days ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Financial
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Final
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Security Visualization Component
const SecurityVisualization = () => {
  return (
    <div className="bg-[#355e66] rounded-xl p-6 relative overflow-hidden">
      <div className="relative z-10">
        <div className="bg-white rounded-lg p-6 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Security Status</h4>
              <p className="text-sm text-gray-600">All systems protected</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Encryption</span>
              <span className="text-sm font-medium text-green-600">
                AES-256 Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Access Control</span>
              <span className="text-sm font-medium text-green-600">
                Role-based
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Backup</span>
              <span className="text-sm font-medium text-green-600">
                Automated
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-2 text-white">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Documents encrypted and secured</span>
          </div>
        </div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-16 h-16 border border-white rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 border border-white rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white rounded-full"></div>
      </div>
    </div>
  );
};

export default DocumentVaultPage;
