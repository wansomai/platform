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
      <section className="pt-24 md:pt-32 pb-16 relative overflow-hidden">
                   {/* SVG Background */}
              <div className="absolute inset-0 z-0">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 1220 810"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <g clipPath="url(#clip0_186_1134)">
                    <mask
                      id="mask0_186_1134"
                      style={{ maskType: "alpha" }}
                      maskUnits="userSpaceOnUse"
                      x="10"
                      y="-1"
                      width="1200"
                      height="812"
                    >
                      <rect x="10" y="-0.84668" width="1200" height="811.693" fill="url(#paint0_linear_186_1134)" />
                    </mask>
                    <g mask="url(#mask0_186_1134)">
                      {/* Grid Rectangles */}
                      {[...Array(35)].map((_, i) => (
                        <React.Fragment key={`row1-${i}`}>
                          <rect
                            x={-20.0891 + i * 36}
                            y="9.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="45.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="81.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="117.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="153.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="189.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="225.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="261.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="297.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="333.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="369.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="405.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="441.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="477.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="513.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="549.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="585.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="621.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="657.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="693.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="729.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                          <rect
                            x={-20.0891 + i * 36}
                            y="765.2"
                            width="35.6"
                            height="35.6"
                            stroke="hsl(var(--foreground))"
                            strokeOpacity="0.11"
                            strokeWidth="0.4"
                            strokeDasharray="2 2"
                          />
                        </React.Fragment>
                      ))}
                      {/* Specific Rectangles with fill */}
                      <rect x="699.711" y="81" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.08" />
                      <rect x="195.711" y="153" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="1023.71" y="153" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="123.711" y="225" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="1095.71" y="225" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="951.711" y="297" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="231.711" y="333" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.07" />
                      <rect x="303.711" y="405" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.07" />
                      <rect x="87.7109" y="405" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="519.711" y="405" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.08" />
                      <rect x="771.711" y="405" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.09" />
                      <rect x="591.711" y="477" width="36" height="36" fill="hsl(var(--foreground))" fillOpacity="0.07" />
                    </g>
        
                    <g filter="url(#filter0_f_186_1134)">
                      <path
                        d="M1447.45 -87.0203V-149.03H1770V1248.85H466.158V894.269C1008.11 894.269 1447.45 454.931 1447.45 -87.0203Z"
                        fill="url(#paint1_linear_186_1134)"
                      />
                    </g>
        
                    <g filter="url(#filter1_f_186_1134)">
                      <path
                        d="M1383.45 -151.02V-213.03H1706V1184.85H402.158V830.269C944.109 830.269 1383.45 390.931 1383.45 -151.02Z"
                        fill="url(#paint2_linear_186_1134)"
                        fillOpacity="0.69"
                      />
                    </g>
        
                    <g style={{ mixBlendMode: "lighten" }} filter="url(#filter2_f_186_1134)">
                      <path
                        d="M1567.45 -231.02V-293.03H1890V1104.85H586.158V750.269C1128.11 750.269 1567.45 310.931 1567.45 -231.02Z"
                        fill="url(#paint3_linear_186_1134)"
                      />
                    </g>
        
                    <g style={{ mixBlendMode: "overlay" }} filter="url(#filter3_f_186_1134)">
                      <path
                        d="M65.625 750.269H284.007C860.205 750.269 1327.31 283.168 1327.31 -293.03H1650V1104.85H65.625V750.269Z"
                        fill="url(#paint4_radial_186_1134)"
                        fillOpacity="0.64"
                      />
                    </g>
                  </g>
        
                  <rect
                    x="0.5"
                    y="0.5"
                    width="1219"
                    height="809"
                    rx="15.5"
                    stroke="hsl(var(--foreground))"
                    strokeOpacity="0.06"
                  />
        
                  <defs>
                    <filter
                      id="filter0_f_186_1134"
                      x="147.369"
                      y="-467.818"
                      width="1941.42"
                      height="2035.46"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="159.394" result="effect1_foregroundBlur_186_1134" />
                    </filter>
                    <filter
                      id="filter1_f_186_1134"
                      x="-554.207"
                      y="-1169.39"
                      width="3216.57"
                      height="3310.61"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="478.182" result="effect1_foregroundBlur_186_1134" />
                    </filter>
                    <filter
                      id="filter2_f_186_1134"
                      x="426.762"
                      y="-452.424"
                      width="1622.63"
                      height="1716.67"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="79.6969" result="effect1_foregroundBlur_186_1134" />
                    </filter>
                    <filter
                      id="filter3_f_186_1134"
                      x="-253.163"
                      y="-611.818"
                      width="2221.95"
                      height="2035.46"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="159.394" result="effect1_foregroundBlur_186_1134" />
                    </filter>
                    <linearGradient
                      id="paint0_linear_186_1134"
                      x1="35.0676"
                      y1="23.6807"
                      x2="903.8"
                      y2="632.086"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="hsl(var(--foreground))" stopOpacity="0" />
                      <stop offset="1" stopColor="hsl(var(--muted-foreground))" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear_186_1134"
                      x1="1118.08"
                      y1="-149.03"
                      x2="1118.08"
                      y2="1248.85"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="hsl(var(--foreground))" />
                      <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
                      <stop offset="1" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                    <linearGradient
                      id="paint2_linear_186_1134"
                      x1="1054.08"
                      y1="-213.03"
                      x2="1054.08"
                      y2="1184.85"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="hsl(var(--foreground))" />
                      <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
                      <stop offset="1" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                    <linearGradient
                      id="paint3_linear_186_1134"
                      x1="1238.08"
                      y1="-293.03"
                      x2="1238.08"
                      y2="1104.85"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="hsl(var(--foreground))" />
                      <stop offset="0.578125" stopColor="hsl(var(--primary-light))" />
                      <stop offset="1" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                    <radialGradient
                      id="paint4_radial_186_1134"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(989.13 557.24) rotate(47.9516) scale(466.313 471.424)"
                    >
                      <stop stopColor="hsl(var(--foreground))" />
                      <stop offset="0.157789" stopColor="hsl(var(--primary-light))" />
                      <stop offset="1" stopColor="hsl(var(--primary))" />
                    </radialGradient>
                    <clipPath id="clip0_186_1134">
                      <rect width="1220" height="810" rx="16" fill="hsl(var(--foreground))" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
        
              {/* Header positioned at top of hero container */}
              <div className="absolute top-0 left-0 right-0 z-20">
              </div>
        <div className="section-container mx-auto px-4 z-10 relative">
          <div className="relative flex flex-col lg:flex-row gap-12 items-center">
            <div className="text-primary max-w-4xl lg:basis-3/5">
              <h1 className="text-heading-1 font-bold mb-4 text-shadow">
                Secure Document Vault
              </h1>

              <p className="text-xl mb-8 text-black">
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
                <p className="text-black text-lg mb-4">
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
                        className="h-10 md:h-12 w-auto object-contain transition-all duration-300 hover:scale-105 brightness-0"
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
