"use client";
import { useState, useEffect } from "react";
import { CheckCircle,ChevronDown, SquareArrowOutUpRight, ArrowUpRight} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VaultSection, { VaultDocs } from "@/components/home/vault";
import CookieConsent, { Cookies } from "react-cookie-consent";
import {
  ResearchInterfaceCards,
  ResearchSourcesWorkflow,
} from "./(landingpages)/ai-legal-research/LegalResearchPage";
import DocumentAutomation from "@/components/home/DocumentAutomation";
import KnowledgeBase from "@/components/home/Knowledgebase";
import LogoAnimation from "@/components/commons/LogoAnimation";
import { PatnerLogoSection } from "@/components/home/Partnerlogos";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
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
  if (status === 'loading') {
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
        <section className=" pt-24 md:pt-28  px-5 bg-primary relative overflow-hidden ">
          <div className="container mx-auto grid lg:grid-cols-1 gap-5 items-center">
            {/* Left Side - Content */}
            <div className="text-center space-y-8">
              <div className="space-y-6">
                <h1 className=" text-heading-1 mb-4 text-white text-shadow-2xs">
                  Collaborative AI workspace for legal teams
                </h1>

                <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8  text-[#f3f4f4]">
                  Wansom is the only legal AI that enables you to scale your firm's capacity to deliver big law results without big law budget
                </p>
                <button
                  className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-black hover:bg-[#2a4d54] rounded-md py-3 px-6 mb-10 mx-auto"
                  onClick={() => (window.location.href = "/register")}
                  aria-label="Try Wansom AI for free - Start your free trial"
                >
                  TRY WANSOM FOR FREE{" "}
                  <SquareArrowOutUpRight className="w-5 h-5 text-white" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right Side - Image */}
            <div className=" -mb-1 md:-mb-4 max-w-7xl mx-auto ">
              <img
                src="/home-demo.png"
                className="rounded-lg"
                alt="Modern law office workspace showing professional legal environment with Wansom AI collaborative tools"
              />
            </div>
          </div>
        </section>
        {/* <HeroSection /> */}
        <PatnerLogoSection />
<NewFeaturesSection />
        {/* <FeaturesSection /> */}
       
        <LegalDraftingSection />
        <LegalResearchSection />
        <DocumentAutomation />
        <DocumentReview />
 <KnowledgeBase />
        <AutomateProcesses />
       
        <VaultSection />
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
        We use cookies to personalize content, run ads, and analyze traffic.
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
      image:"/drafting-feature.jpg",
    },
    {
      title: "Collaborate Better",
      description:
        "Organize projects,files into shared team workspaces for seamless collaboration.",
      href: "/login",
      image:"/wansom-dashboard.jpg",
    },
    {
      title: "Get More Billable Hours",
      description:
        "Create Specialised AI associates to do quality work faster so you can bill more.",
      href: "/login",
      image:"/contract-negotiation.jpg",
    },
  ];

  return (
    <section className=" ">
      <div className="section-container">

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-lg py-6 px-3 transition-all duration-300 space-y-3"
            >
              <div className="mb-4">
                 <img src={feature.image} alt={feature.title} className="rounded-lg object-cover "/>
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
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300"
                aria-label={`Learn more about ${feature.title}`}
              >
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
        <div className="grid lg:grid-cols-2 gap-10 ">
          <div className="bg-primary rounded-lg p-6 flex items-center justify-center order-2 lg:order-1">
            <div className="bg-white rounded-xl p-8 shadow-lg border max-w-md w-full">
              <label htmlFor="jurisdiction-input" className="text-lg font-semibold mb-6 text-gray-900 block">
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

                <button onClick={() => window.location.href = "/login"}
                className="w-full bg-primary hover:bg-[#F18F01] text-white py-3 rounded-lg font-medium mt-6 transition-colors"
                aria-label="Generate document outline for Employment Agreement in London, UK jurisdiction"
                >
                Generate Document Outline
                </button>
            </div>
          </div>

          <div className="order-1 lg:order-2 ">
            <h2 className="text-heading-2 mb-4 text-gray-900">
              Draft Correct Legally formatted Documents and Clauses quickly with
              AI
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Wansom automatically detects the substance of your document to
              draft relevant, ready to use clauses.Start from Scratch or upload
              from a template library and collaborate with AI in an Inline
              document editor. Save and export ready Word documents .
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
    <section className="section-spacing bg-gray-50" id="legal-research">
      <div className="section-container pb-12">
        <div className="text-center mb-12 ">
          <h2 className="text-heading-2 text-gray-900 mb-2">
           Turn Days of Legal Research into Minutes 
          </h2>
          <p className="text-body-large text-gray-600 max-w-3xl mx-auto">
            Get instant answers to complex legal questions with AI that searches
            through cases, statutes, and legal authorities in seconds and return
            verified results.
          </p>
        </div>
        {/* Add your AI Legal Research component here */}
        <ResearchInterfaceCards />
      </div>
    </section>
  );
}
function AutomateProcesses() {
  const [expandedSections, setExpandedSections] = useState({
    tax: true,
    diligence: false,
    appointments: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <section className="section-spacing bg-gray-100" id="workflows">
      <div className="section-container pb-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-4">
            <h2 className="text-heading-2 mb-6 text-gray-900">
              Automate Legal Workflows
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Legal processes can be tedious and time-consuming. We save you
              time by automating them.
            </p>

            {/* Tax Filings & Compliance section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection('tax')}
                className="w-full flex items-center justify-between text-left group"
                aria-expanded={expandedSections.tax}
                aria-controls="tax-content"
                aria-label={`${expandedSections.tax ? 'Collapse' : 'Expand'} Tax Filings & Compliance section`}
              >
                <h3 className="font-semibold text-lg text-gray-900">
                  Tax Filings & Compliance
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.tax ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <div
                id="tax-content"
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.tax ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-gray-600">
                  Streamline tax preparation, automate regulatory filings, and
                  stay compliant with ever-changing legal requirements and
                  deadlines.
                </p>
              </div>
            </div>

            {/* Due Diligence section */}
            <div className="border-b border-gray-200 pb-4">
              <button
                onClick={() => toggleSection('diligence')}
                className="w-full flex items-center justify-between text-left group"
                aria-expanded={expandedSections.diligence}
                aria-controls="diligence-content"
                aria-label={`${expandedSections.diligence ? 'Collapse' : 'Expand'} Due Diligence section`}
              >
                <h3 className="font-semibold text-lg text-gray-900">
                  Due Diligence
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.diligence ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <div
                id="diligence-content"
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.diligence ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-gray-600">
                  Automate due diligence for mergers, acquisitions, and
                  investments with advanced document analysis and risk
                  assessment.
                </p>
              </div>
            </div>

            {/* Legal Appointments & Deadlines section */}
            <div className="pb-4">
              <button
                onClick={() => toggleSection('appointments')}
                className="w-full flex items-center justify-between text-left group"
                aria-expanded={expandedSections.appointments}
                aria-controls="appointments-content"
                aria-label={`${expandedSections.appointments ? 'Collapse' : 'Expand'} Legal Appointments & Deadlines section`}
              >
                <h3 className="font-semibold text-lg text-gray-900">
                  Legal Appointments & Deadlines
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
                    expandedSections.appointments ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <div
                id="appointments-content"
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.appointments ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-gray-600">
                  Automate scheduling, client onboarding, and deadline
                  tracking with smart reminders and calendar integration.
                </p>
              </div>
            </div>
          </div>
          <ResearchSourcesWorkflow />
        </div>
      </div>
    </section>
  );
}

function DocumentReview() {
  const [expandedSections, setExpandedSections] = useState({
    review: true,
    folders: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <section className="section-spacing bg-primary" id="legal-research">
      <div className="section-container ">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <VaultDocs />
          <div className="space-y-4">
            <h2 className="text-heading-2 mb-4 text-white">
              Secure Document Vault to store and manage all your legal documents in one place
            </h2>
            <p className="text-xl text-gray-100 mb-8">
              Wansom's Document Vault offers a secure, organized repository for
              all your legal documents, ensuring easy access and management
              whenever you need them.
            </p>

            {/* Enhanced AI Document Review section */}
            <div className="border-b border-gray-400 pb-4">
              <button
                onClick={() => toggleSection('review')}
                className="w-full flex items-center justify-between text-left group"
                aria-expanded={expandedSections.review}
                aria-controls="review-content"
                aria-label={`${expandedSections.review ? 'Collapse' : 'Expand'} Enhanced AI Document Review section`}
              >
                <h3 className="font-semibold text-lg text-gray-100">
                  Enhanced AI Document Review
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-gray-300 transition-transform duration-200 ${
                    expandedSections.review ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <div
                id="review-content"
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.review ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-gray-100">
                  Leverage advanced AI to review and analyze legal documents
                  for accuracy, compliance, and risk assessment.Suport for both word,PDFs,Images and scanned documents.
                </p>
              </div>
            </div>

            {/* Document Folders section */}
            <div className="pb-4">
              <button
                onClick={() => toggleSection('folders')}
                className="w-full flex items-center justify-between text-left group"
                aria-expanded={expandedSections.folders}
                aria-controls="folders-content"
                aria-label={`${expandedSections.folders ? 'Collapse' : 'Expand'} Document Folders section`}
              >
                <h3 className="font-semibold text-lg text-gray-100">
                  Document Folders
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-gray-300 transition-transform duration-200 ${
                    expandedSections.folders ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <div
                id="folders-content"
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.folders ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-gray-100">
                  Organize documents into customizable folders and
                  subfolders for easy retrieval and management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

