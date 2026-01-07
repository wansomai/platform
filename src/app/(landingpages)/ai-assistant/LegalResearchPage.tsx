"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import KnowledgeBase from "@/components/home/Knowledgebase";

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
     <HeroSection partnerLogos={partnerLogos}/>

      {/* Legal authorities database section */}
     <LegalResearchAssistant/>

       {/* workspace section */}
      <CollaborativeWorkspaces/>
<KnowledgeBase/>
      {/* More features section */}
   <VaultSection/>

      <Footer />
    </div>
  );
}
function HeroSection({partnerLogos}: {partnerLogos: {src: string; alt: string}[]}) {
  const router = useRouter();
  return (
    <section
      className="pt-24 md:pt-28 pb-5 bg-white  relative overflow-hidden"
    >
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

       <div className="section-container z-10 relative">
          <div className="relative flex flex-col lg:flex-row gap-12 items-center">
            <div className="text-primary lg:basis-1/2 text-center lg:text-left">

              <h1 className="text-heading-1 mb-4 text-shadow font-serif">
               AI Built for Lawyers
              </h1>

              <p className="text-xl mb-8 text-black">
                Get instant answers to complex legal questions with AI that searches through verified cases, statutes, and legal authorities in seconds.
              </p>

              <button className="bg-[#d47b0f] hover:bg-[#355e66] text-white px-5 py-2 rounded-lg font-semibold transition-colors mb-12" onClick={() => router.push('/login')}>
                Try Wansom For Free <ArrowUpRight className="inline-block ml-2 w-6 h-6" />
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
                        className="h-10 md:h-12 w-auto object-contain transition-all duration-300 hover:scale-105 brightness-0 "
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
  )
}


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
