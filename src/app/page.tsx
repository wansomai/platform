"use client";
import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  ChevronDown,
  SquareArrowOutUpRight,
  ArrowUpRight,
  Loader,
  Send,
  Folder,
  BarChart3,
  Building,
  Calendar,
  ChevronRight,
  Lock,
  Circle,
  FolderLock,
  FileText,
  X,
  Loader2,
  Plus,
  Globe2,
  Zap,
  Paperclip,
  SlidersHorizontal,
  Globe
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VaultSection from "@/components/home/vault";
import CookieConsent, { Cookies } from "react-cookie-consent";
import LogoAnimation from "@/components/commons/LogoAnimation";
import BrandLogos from "@/components/home/Partnerlogos";
import React from "react";
import { link } from "fs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Jurisdiction } from "@/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { JurisdictionSelector } from "@/components/workspace/JurisdictionSelector";
import HerroPattern from "@/components/layout/HeroPattern";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Handle navbar transparency on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <LogoAnimation />
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      <Navbar />

      <main>
        {/* <HeroSection /> */}
        <HeroSection />
        <NewFeaturesSection />
        <LegalResearchSection />
        <LegalDraftingSection />
         <DocumentReview />
<AutomateProcesses />
    <section className="section-spacing bg-white">
        <div className="section-container flex flex-col justify-between lg:flex-row gap-16">
          {/* Active Stats */}
          <div className="text-left mb-2 lg:mb-8">
            <p className="text-heading-4  text-gray-900 uppercase tracking-wider text-center lg:text-left">
              Get Immediate Return On Investment
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {/* Stat 1 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                30%
              </h3>
              <p className="text-md text-gray-600">
                Average measured
                <br />
                boost in productivity
              </p>
            </div>

            {/* Stat 2 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                +5hrs
              </h3>
              <p className="text-md text-gray-600">
                Weekly time savings
                <br />
              from routine tasks
              </p>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <h3 className="text-6xl lg:text-7xl font-serif text-gray-900 mb-4">
                $2.3m
              </h3>
              <p className="text-md text-gray-600">
                potential additional billing
                per 100 lawyers annually
              </p>
            </div>
          </div>
        </div>
      </section>
     <SolutionsForAllLawyers />
      
        <VaultSection />
        <KnowledgeBase />
      </main>
      <CookieConsent
        location="bottom"
        buttonText="Accept Cookies"
        cookieName="wansomCookies"
        style={{ background: "#2B373B" }}
        buttonStyle={{
          color: "#ffffff",
          fontSize: "13px",
          backgroundColor: "#005c4d",
        }}
        expires={150}
      >
        We use cookies to provide a better personalized experience.
      </CookieConsent>
      <Footer />
    </div>
  );
}

const NewFeaturesSection = () => {
  const features = [
    {
      title: "Work Smarter",
      description:
        "Automate routine legal tasks with AI so your team can focus on high-value work.",
      href: "/login",
      image: "/drafting-feature.webp",
    },
    {
      title: "Collaborate Better",
      description:
        "Organize projects,files into shared team workspaces for seamless collaboration.",
      href: "/login",
      image: "/wansom-dashboard.webp",
    },
    {
      title: "Get More Billable Hours",
      description:
        "Create Specialised AI associates to do quality work faster so you can bill more.",
      href: "/login",
      image: "/contract-negotiation.webp",
    },
  ];

  return (
    <section className="section-container ">
      <div className=" section-spacing">
        <h2 className="text-heading-2 mb-12 text-center text-gray-900">
          Safe. Flexible. Built for Legal Work.
        </h2>
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-lg py-6 px-3 transition-all duration-300 space-y-3"
              onClick={() => (window.location.href = "/login")}
            >
              <div className="mb-4">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={600}
                  height={400}
                  className="rounded-lg object-cover "
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                {feature.description}
              </p>

              {/* Arrow Link */}
              <a
                href={feature.href}
                className="inline-flex gap-2 items-center justify-center  group-hover:text-amber-500 transition-all duration-300"
                aria-label={`Learn more about ${feature.title}`}
              >
                Learn More
                <ArrowUpRight className="w-5 h-5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

function LegalDraftingSection() {
  return (
    <section className="section-spacing  bg-white" id="legal-drafting">
      <div className="section-container">
        <div className="flex flex-col-reverse lg:flex-row gap-10 items-center">
          <div className=" rounded-lg flex items-center justify-start md:basis-1/2 ">
          <div className="w-full md:max-w-4xl bg-draft p-6 rounded-lg">
            <div className="bg-white rounded-xl p-8 shadow-lg border w-full">
              <label
                htmlFor="jurisdiction-input"
                className="text-lg font-semibold mb-6 text-gray-900 block"
              >
                Jurisdiction
              </label>
              <input
                id="jurisdiction-input"
                type="text"
                value="London, UK"
                readOnly
                aria-label="Selected jurisdiction: London, United Kingdom"
                className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
              />

              <h4 className="font-medium mb-4 text-gray-700">
                Drafting Settings
              </h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div>Document Type: Employment Agreement</div>
                <div>Writing Style: Formal</div>
                <div>Clause Length: Standard</div>
              </div>

              <button
                onClick={() => (window.location.href = "/login")}
                className="w-full bg-primary hover:bg-[#F18F01] text-white py-3 rounded-lg font-medium mt-6 transition-colors"
                aria-label="Generate document outline for Employment Agreement in London, UK jurisdiction"
              >
                Generate Document Outline
              </button>
            </div></div>
          </div>

          <div className="lg:basis-1/2 ">
            <h2 className="text-heading-2 mb-4 text-gray-900">
              Draft, review, negotiate legal contracts
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Accelerate document creation, automatically flag high-risk
              clauses, and verify compliance against templates in minutes, not
              hours
            </p>

            <div className="space-y-4">
              <p className="font-medium text-gray-900">
                Wansom instantly understands:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-[#355e66] mr-3" />
                  <span className="text-gray-700">Contract Type</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-[#355e66] mr-3" />
                  <span className="text-gray-700">Jurisdiction</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-[#355e66] mr-3" />
                  <span className="text-gray-700">Party Details</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-[#355e66] mr-3" />
                  <span className="text-gray-700">Writing Style</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LegalResearchSection() {
  return (
    <section className="section-spacing bg-white" id="legal-research">
      <div className="section-container pb-12 flex flex-col lg:flex-row items-center">
        <div className=" lg:basis-1/2 mb-8 lg:mb-0 lg:pr-10">
          <h3 className="text-md font-light text-gray-600 mb-2">
            Your work companion
          </h3>
          <h2 className="text-heading-2 text-gray-900 mb-2">
            Legal AI Assistant
          </h2>
          <p className="text-body-large text-gray-600 max-w-3xl mx-auto mb-5">
            Get instant, cited answers to complex legal questions using Wansom's
            proprietary, jurisdiction-specific models built on verified case law
            and statutes
          </p>
          <button
            className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-[#2a4d54] rounded-md py-3 px-6 mb-10"
            onClick={() => (window.location.href = "/ai-assistant")}
            aria-label="Try Wansom AI for free - Start your free trial"
          >
            LEARN MORE{" "}
            <SquareArrowOutUpRight
              className="w-5 h-5 text-white"
              aria-hidden="true"
            />
          </button>
        </div>
        {/* Add your AI Legal Research component here */}
        <div>
    <ResearchInterfaceCards />
        </div>
      </div>
    </section>
  );
}
function AutomateProcesses() {

  return (
    <section className="section-spacing bg-white" id="workflows">
      <div className="section-container">
        <div className="flex flex-col-reverse lg:flex-row gap-5 md:gap-10 items-center">
         <div className="md:basis-1/2">
           <ResearchSourcesWorkflow />
         </div>
          <div className="md:basis-1/2">
               <h3 className="text-md font-light text-gray-600 mb-2">
            AI Associates
          </h3>
            <h2 className="text-heading-2 mb-6 text-gray-900">
              Automate Legal Workflows
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Reduce manual overhead by creating and 
training AI assistants to handle repetitive tasks 
such  Due Diligence, reporting,compliance and tax
filings
            </p>
            <button
            className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-[#2a4d54] rounded-md py-3 px-6 mb-10"
            onClick={() => (window.location.href = "/login")}
            aria-label="Try Wansom AI for free - Start your free trial"
          >
            Explore Workflows{" "}
            <SquareArrowOutUpRight
              className="w-5 h-5 text-white"
              aria-hidden="true"
            />
          </button>
          </div>

        </div>
      </div>
    </section>
  );
}

function DocumentReview() {
  const [expandedSections, setExpandedSections] = useState({
    review: true,
    folders: false,
  });


  return (
    <section className="section-spacing bg-white" id="legal-research">
      <div className="section-container ">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
         
          <div className="">
             <h3 className="text-md font-light text-gray-600 mb-2">
            Project workspaces
          </h3>
            <h2 className="text-heading-2 mb-4 text-black">
              Secure Document Vault
            </h2>
            <p className="text-xl text-black mb-8">
             Centralize and securely manage your firm's files,matters,and projects wwithin a collaborative AI workspace
            </p>
                    <button
            className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-[#2a4d54] rounded-md py-3 px-6 mb-10"
            onClick={() => (window.location.href = "/document-vault")}
            aria-label="Try Wansom AI for free - Start your free trial"
          >
            LEARN MORE{" "}
            <SquareArrowOutUpRight
              className="w-5 h-5 text-white"
              aria-hidden="true"
            />
          </button>
          </div>
           <VaultDocs />
        </div>
      </div>
    </section>
  );
}

function HeroSection() {
  return (
    <section className=" pt-20 md:pt-28  px-5 bg-white  relative overflow-hidden">
      {/* SVG Background */}
     <HerroPattern />

      {/* Header positioned at top of hero container */}
      <div className="absolute top-0 left-0 right-0 z-20"></div>

      <div className="section-container mx-auto grid lg:grid-cols-1 gap-5 items-center my-10  relative z-10">
        {/* Left Side - Content */}
        <div className=" space-y-8">
          <div className="space-y-6">
            <h1 className=" text-heading-1 mb-4 text-black text-shadow-2xs font-bold font-serif">
              Where Lawyers <br className="hidden lg:block" /> are doing their
              best work
            </h1>

            <p className="text-lg md:text-xl max-w-3xl  mb-8  text-gray-600Book">
              Wansom is the only legal AI that enables you to scale your ability
              to deliver big law results without the big law budget
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
            <button
              className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-[#2a4d54] rounded-md py-3 px-6 md:mb-10 w-fit min-w-[130px]"
              onClick={() => (window.location.href = "/register")}
              aria-label="Try Wansom AI for free - Start your free trial"
            >
              TRY WANSOM AI{" "}
              <SquareArrowOutUpRight
                className="w-5 h-5 text-white"
                aria-hidden="true"
              />
            </button>
              <button
              className="text-sm font-medium uppercase flex gap-1 items-center  text-black bg-transparent border-black border  rounded-md py-3 px-6 mb-10 w-fit min-w-[130px]"
              onClick={() => (window.location.href = "/demo")}
              aria-label="Try Wansom AI for free - Start your free trial"
            >
              SCHEDULE A DEMO{" "}
              <SquareArrowOutUpRight
                className="w-5 h-5 text-white"
                aria-hidden="true"
              />
            </button></div>
          </div>
        </div>
      </div>
      <BrandLogos />
    </section>
  );
}
export const ResearchInterfaceCards = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="lg:max-w-4xl mx-auto space-y-6 md:space-y-16 relative bg-research-card p-6 rounded-lg">
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
        <div className="w-0.5 h-[500px] md:h-16 bg-white"></div>
        {/* Horizontal line */}
        <div className="hidden md:block w-96 h-0.5 bg-white -ml-48"></div>
        {/* Three vertical lines down to cards */}
        <div className="hidden md:flex justify-between w-96 -ml-48 ">
          <div className="w-0.5 h-16 bg-white"></div>
          <div className="w-0.5 h-16 bg-white"></div>
          <div className="w-0.5 h-16 bg-white"></div>
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
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hidden md:block">
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
function VaultDocs() {
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
    },

  ];

  return (
    <div className="relative bg-primary bg-vault-docs rounded-xl shadow-xl overflow-hidden p-6 w-full">
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

 const ResearchSourcesWorkflow = () => {
  return (
    <div className="max-w-4xl  bg-primary p-6 rounded-lg">
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
        <div className="space-y-4">
          {/* Step 1 - Completed */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-md font-medium text-gray-900">
            Verifying legal sources
            </span>
          </div>

          {/* Step 2 - In Progress */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Loader className="w-6 h-6 text-primary animate-spin" />
            </div>
            <span className="text-md font-medium text-gray-900">
              Getting related case law
            </span>
          </div>

          {/* Step 3 - Pending */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Circle className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-md font-medium text-gray-500">
              Create citations
            </span>
          </div>

          {/* Step 4 - Pending */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Circle className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-md font-medium text-gray-500">
              Generate response
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SolutionsForAllLawyers = () => {
  const [activeTab, setActiveTab] = useState(2);

  const tabs = [
    {
      title: "In-House Counsel",
      image: "/images/in-house-counsel.jpg",
      alt: "document vault",
      description: "Automate contract review, streamline compliance, and manage legal risks effectively with Wansom AI.",
      link: "/solutions/in-house-counsel"
    },
    {
      title: "Litigation lawyers",
      image: "/images/supreme-court.jpg",
      alt: "redline contracts",
      description: "Leverage AI to analyze case law, draft pleadings, and manage discovery with unparalleled efficiency.",
      link: "/solutions/litigation-lawyers"

    },
    {
      title: "M&A Lawyers",
      image: "/images/law-firm-boardroom.jpg",
      alt: "review legal documents",
      description: "Streamline due diligence, contract drafting, and regulatory compliance with Wansom AI's powerful automation tools.",
      link: "/solutions/ma-lawyers"
    }
  ];

  return (
    <section className="section-spacing bg-white" id="document-automation">
      <div className="section-container pb-12">
        <h2 className="text-heading-2 mb-4 text-gray-900 text-center max-w-3xl mx-auto">
          How Lawyers Use Wansom AI
        </h2>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12 pt-5">
          <div className="flex space-x-0 border-b border-gray-300">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-8 py-4 font-medium transition-all relative ${
                  activeTab === index
                    ? "text-[#355e66] border-b-2 border-[#355e66]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content - Flex Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center  gap-10">
            <div className="text-left lg:basis-1/2 max-w-lg">
              
              <p className="text-lg text-gray-600 leading-relaxed ">
                {tabs[activeTab].description}
              </p>
                   <button
                  className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-amber-500 rounded-md py-3 px-6 my-5"
                  onClick={() => (window.location.href = tabs[activeTab].link)}
                >
                  View Solutions{" "}
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </button>
            </div>
            <div className="flex-1 lg:basis-1/2 order-1 lg:order-2">
              <Image
                src={tabs[activeTab].image}
                width={800}
                height={600}
                className="rounded-lg w-full h-auto"
                alt={tabs[activeTab].alt}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const KnowledgeBase = () => {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("Ask wansom anything...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showJurisdictionDropdown, setShowJurisdictionDropdown] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<Jurisdiction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [chatInput]);

  // Handle chat input send
  const handleSend = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Navigate to register page when send is clicked
      router.push("/register");
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Trigger file input click
  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  // Handle jurisdiction change
  const handleJurisdictionsChange = (jurisdictions: Jurisdiction[]) => {
    setSelectedJurisdictions(jurisdictions);
  };
  return (
    <section className="section-spacing bg-cta" id="knowledge-base">
      <div className="section-container pb-12">
        <div className="text-center mb-12 ">
          <h2 className="text-heading-1 text-gray-900 mb-2">
            Ready to put AI to work?
          </h2>
        </div>
        {/* Chat Input Area */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="w-full">
            <div className="bg-white rounded-xl border-2 border-gray-200 focus-within:border-primary-300 transition-colors relative shadow-sm focus-within:shadow-md">
              {/* Left side icons */}
              <div className="absolute flex items-center gap-2 z-10 w-full left-4 right-4 bottom-3 pr-20">
                {/* Documents Tool */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePaperclipClick}
                  className="h-8 w-8 p-0 rounded-md hover:bg-gray-100"
                  title={
                    selectedFiles.length > 0
                      ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected`
                      : "Attach files"
                  }
                  aria-labelledby="upload documents"
                >
                  <Paperclip className="h-6 w-6 text-gray-600" />
                </Button>

                {/* Tools Dropdown */}
                <DropdownMenu
                  open={showToolsDropdown}
                  onOpenChange={setShowToolsDropdown}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-fit px-2 rounded-md hover:bg-gray-100"
                      title="AI Tools (preview - will be configurable after registration)"
                      aria-labelledby="AI tools"
                    >
                      <SlidersHorizontal className="h-6 w-6 text-gray-700" />{" "}
                      Tools
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-72 p-4 mb-2"
                    side="top"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-700">
                          Available AI Tools
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowToolsDropdown(false)}
                          className="h-6 w-6 p-0"
                          aria-labelledby="Close Tools"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="web-search"
                            className="font-medium text-sm"
                          >
                            Deep Research
                          </Label>
                        </div>
                        <Switch
                          id="web-search"
                          checked={false}
                          disabled={true}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="legal-drafting"
                            className="font-medium text-sm"
                          >
                            Draft & Review
                          </Label>
                        </div>
                        <Switch
                          id="legal-drafting"
                          checked={false}
                          disabled={true}
                        />
                      </div>
    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="contract-review"
                            className="font-medium text-sm flex items-center gap-2"
                          >
                           <img src={'/icons/calendar.svg'} className="w-6 h-6"/> Google Calendar
                          </Label>
                        </div>
                        <Switch
                          id="contract-review"
                          checked={false}
                          disabled={true}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="case-preparation"
                            className="font-medium text-sm flex items-center gap-2"
                          > <img src={'/icons/gmail.svg'} className="w-6 h-6"/>
                            Gmail
                          </Label>
                        </div>
                        <Switch
                          id="case-preparation"
                          checked={false}
                          disabled={true}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="case-preparation"
                            className="font-medium text-sm"
                          >
                            Case Preparation
                          </Label>
                        </div>
                        <Switch
                          id="case-preparation"
                          checked={false}
                          disabled={true}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label
                              htmlFor="cite-sources"
                              className="font-medium text-sm"
                            >
                              Cite sources
                            </Label>
                          </div>
                          <Switch
                            id="cite-sources"
                            checked={false}
                            disabled={true}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label
                              htmlFor="suggest-actions"
                              className="font-medium text-sm"
                            >
                              Suggest actions
                            </Label>
                          </div>
                          <Switch
                            id="suggest-actions"
                            checked={false}
                            disabled={true}
                          />
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Jurisdiction Selector Dropdown */}
                <DropdownMenu
                  open={showJurisdictionDropdown}
                  onOpenChange={setShowJurisdictionDropdown}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                  variant="ghost"
                  size="sm"
                       className="h-8 w-fit px-2 rounded-md hover:bg-gray-100"
                      title={
                        selectedJurisdictions.length > 0
                          ? `${selectedJurisdictions.length} jurisdiction${selectedJurisdictions.length !== 1 ? 's' : ''} selected`
                          : "Select jurisdiction"
                      }
                      aria-labelledby="Select jurisdiction">
                      <Globe className="h-5 w-5 text-gray-500" />
                      Jurisdictions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[340px] p-3 mb-2"
                    side="top"
                  >
                    <JurisdictionSelector
                      inline={true}
                      multiSelect={true}
                      values={selectedJurisdictions}
                      onChangeMulti={handleJurisdictionsChange}
                      placeholder="Search jurisdictions..."
                      maxSelections={5}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Settings Button */}
                <button
                  className="h-8 w-fit px-3 py-2 rounded-lg  flex gap-1 items-center  cursor-not-allowed opacity-60"
                  disabled={true}
                  title="Settings (available after registration)"
                  aria-labelledby="settings"
                >
                  <Zap className="h-4 w-4 text-black text-xs" />
                  Workflows
                </button>
                  <button
                  className="h-8 w-fit px-3 py-2 rounded-lg  flex gap-1 items-center  cursor-not-allowed text-sm "
                  disabled={true}
                  title="projects (available after registration)"
                  aria-labelledby="projects"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-black">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
                        </svg>
                  Projects
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Selected Files Chips - Show above textarea */}
              {selectedFiles.length > 0 && (
                <div className="px-6 pt-4 pb-2 flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#E9F5F3] rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-[#74C6B8] rounded-md p-1.5">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 max-w-[150px] truncate">
                            {file.name}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="hover:bg-blue-100 rounded-full p-1 transition-colors"
                        type="button"
                      >
                        <X className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedFiles.length > 0
                    ? "Ask anything about your document..."
                    : "Ask wansom anything..."
                }
                className={`border-0 resize-none rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-600 px-6 pr-16 text-[13px] md:text-base ${
                  selectedFiles.length > 0
                    ? "min-h-[100px] max-h-[250px] pt-2 pb-4"
                    : "min-h-[150px] max-h-[250px] py-4"
                }`}
                disabled={isSubmitting}
              />

              {/* Send button positioned inside textarea */}
              <div className="absolute right-3 bottom-3 z-10">
                <Button
                  className="bg-primary hover:bg-[#d47b0f] text-white z-10 shadow-md h-10 w-10 rounded-lg"
                  disabled={isSubmitting}
                  onClick={handleSend}
                  aria-label="Send message"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin text-white h-5 w-5" />
                  ) : (
                    <Send className="text-white h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Helper text */}
          <div className="flex items-center justify-center flex-wrap gap-5 mt-4">
            <a
              href="https://eur-lex.europa.eu/homepage.html"
              target="_blank"
              className="tex-sm lg:text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <img
                src="/logos/eu.jpg"
                alt="euro-lex"
                className="h-8 w-8 rounded-full"
              />
              Euro Lex
              <Plus className="h-4 w-4 text-gray-500" />
            </a>
            <a
              href="https://www.kenyalaw.org/"
              target="_blank"
              className="tex-sm lg:text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <img
                src="/logos/kenya-law.jpg"
                alt="Kenya Law"
                className="h-8 w-8 rounded-full"
              />
              Kenya Law
              <Plus className="h-4 w-4 text-gray-500" />
            </a>
            <a
              href="https://africanlii.org/en/indexes/case-indexes/case-indexes-commercial"
              target="_blank"
              className="tex-sm lg:text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <img
                src="/logos/African+union.webp"
                alt="Afcomm"
                className="h-8 w-8 rounded-full"
              />
              Afcomm
              <Plus className="h-4 w-4 text-gray-500" />
            </a>
            <div className="tex-sm lg:text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
              <img
                src="/logos/CommonLII.jpg"
                alt=" CommonLII"
                className="h-8 w-8 rounded-full"
              />
              CommonLII
              <Plus className="h-4 w-4 text-gray-500" />
            </div>
            <div className="tex-sm lg:text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
              <img
                src="/logos/SAFLII_small.png"
                alt=" SAFLII"
                className="h-8 w-8 rounded-full"
              />
              SAFLII
              <Plus className="h-4 w-4 text-gray-500" />
            </div>
                      <div className="tex-sm lg:text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
              <img
                src="/logos/TANZII.png"
                alt=" TANZII"
                className="h-8 w-20 rounded-full object-contain"
              />
              
              <Plus className="h-4 w-4 text-gray-500" />
            </div>
            <a
              href="https://www.worldlii.org/"
              className="tex-sm lg:text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <img
                src="/logos/WorldLII.gif"
                alt=" WorldLII"
                className="h-8 w-8 rounded-full"
              />
              WorldLII
              <Plus className="h-4 w-4 text-gray-500" />
            </a>
            <div className="tex-xs lg:text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
              <img
                src="/logos/ZambiaLII.webp"
                alt="ZambiaLII"
                className="h-6 md:h-8 w-6 md:w-8 rounded-full"
              />
              ZambiaLII
              <Plus className="h-4 w-4 text-gray-500" />
            </div>
            <div className="tex-xs lg:text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
              <Globe2 className="h-6 md:h-8 w-6 md:w-8 rounded-full" />
              Web Search
              <Plus className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
