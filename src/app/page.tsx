"use client";
import { useState, useEffect } from "react";
import { CheckCircle, Globe, Zap, Target, Sparkles, Folder, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FeaturesSection from "@/components/home/features";
import VaultSection, { VaultDocs } from "@/components/home/vault";
import CookieConsent, { Cookies } from "react-cookie-consent";
import {
  ResearchInterfaceCards,
  ResearchSourcesWorkflow,
} from "./(landingpages)/ai-legal-research/LegalResearchPage";
import CreativeIntegrationsSection from "@/components/home/Security";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle navbar transparency on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <section className=" pt-24 md:pt-20 pl-5 lg:pl-20 bg-[#355e66] relative overflow-hidden">
          <div className="container mx-auto grid lg:grid-cols-2 gap-5 items-center">
            {/* Left Side - Content */}
            <div className="text-left space-y-8">
              <div className="space-y-6">
                <h1 className=" text-heading-1 mb-4 text-white text-shadow-2xs">
                  Collaborative AI workspace for legal teams
                </h1>

                <p className="text-lg md:text-xl max-w-4xl mx-auto mb-8  text-[#f3f4f4]">
                  Save time by automating routine legal processes with AI, so
                  you can focus on high-impact work.
                </p>
                <button
                  className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-[#d47b0f] hover:bg-[#355e66] rounded-md py-3 px-6 mb-10"
                  onClick={() => (window.location.href = "/register")}
                >
                  TRY WANSOM FOR FREE{" "}
                  <Sparkles className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Right Side - Form */}
            <div>
              <img src="/law-office.jpg" />
            </div>
          </div>
        </section>
        {/* <HeroSection /> */}

        <FeaturesSection />
        <LegalDraftingSection />
        <LegalResearchSection />
        <DocumentAutomation />
        <DocumentReview />

        <AutomateProcesses />
        <VaultSection />
        <CreativeIntegrationsSection />
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
        We use essential cookies to make our site function effectively. We’d
        like to set additional cookies to better understand site usage, enhance
        site improvements, and remember your settings. We also use cookies set
        by other sites to assist in delivering content from their services. View
        our
      </CookieConsent>
      <Footer />
    </>
  );
}

function LegalDraftingSection() {
  return (
    <section className="section-spacing  bg-white" id="legal-drafting">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-10 ">
          <div className="bg-primary rounded-lg p-6 flex items-center justify-center order-2 lg:order-1">
            <div className="bg-white rounded-xl p-8 shadow-lg border max-w-md w-full">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">
                Jurisdiction
              </h3>
              <input
                type="text"
                value="London, UK"
                readOnly
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

              <button className="w-full bg-[#355e66] text-white py-3 rounded-lg font-medium mt-6 hover:bg-[#2a4d54] transition-colors">
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
          <h2 className="text-heading-2 text-gray-900">
            Access verified legal authorities in one intelligent search
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
  return (
    <section className="section-spacing bg-gray-100" id="workflows">
      <div className="section-container pb-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-heading-2 mb-6 text-gray-900">
              Automate Legal Workflows
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Legal processes can be tedious and time-consuming. We save you
              time by automating them.
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#355e66] rounded-lg flex items-center justify-center p-3">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Tax Filings & Compliance
                  </h3>
                  <p className="text-gray-600">
                    Streamline tax preparation, automate regulatory filings, and
                    stay compliant with ever-changing legal requirements and
                    deadlines.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#d47b0f] rounded-lg flex items-center justify-center p-3">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Due Diligence</h3>
                  <p className="text-gray-600">
                    Automate due diligence for mergers, acquisitions, and
                    investments with advanced document analysis and risk
                    assessment.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center p-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Legal Appointments & Deadlines
                  </h3>
                  <p className="text-gray-600">
                    Automate scheduling, client onboarding, and deadline
                    tracking with smart reminders and calendar integration.
                  </p>
                </div>
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
  return (
    <section className="section-spacing bg-primary" id="legal-research">
      <div className="section-container ">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <VaultDocs />
          <div>
            <h2 className="text-heading-2 mb-4 text-white">
              Secure Document Vault to store and manage all your legal documents in one place
            </h2>
            <p className="text-xl text-gray-100 mb-8">
              Wansom's Document Vault offers a secure, organized repository for
              all your legal documents, ensuring easy access and management
              whenever you need them.
            </p>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#355e66] rounded-lg flex items-center justify-center p-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-100">
                    Enhanced AI Document Review
                  </h3>
                  <p className="text-gray-100">
                    Leverage advanced AI to review and analyze legal documents
                    for accuracy, compliance, and risk assessment.Suport for both word,PDFs,Images and scanned documents.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#d47b0f] rounded-lg flex items-center justify-center p-3">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-100">Document Folders</h3>
                  <p className="text-gray-100">
                    Organize documents into customizable folders and
                    subfolders for easy retrieval and management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DocumentAutomation() {
  const [activeTab, setActiveTab] = useState(2);

  const tabs = [
    {
      title: "Upload & Tag Documents",
      image: "/images/upload-document.png",
      alt: "document vault",
      description: "Select and upload documents,AI automaitcally analyses and tags them for easy organization and retrieval."
    },
    {
      title: "Review & Redline Contracts",
      image: "/images/redline-contract.png",
      alt: "redline contracts",
      description: "Get Deep insights from your documents in a unified chat interface and redline contracts with AI-powered suggestions."
    },
    {
      title: "Compare and Share Documents",
      image: "/images/legal-document-review.png",
      alt: "review legal documents",
      description: "Compare different versions of documents side by side and share securely with clients and colleagues."
    }
  ];

  return (
    <section className="section-spacing bg-white" id="document-automation">
      <div className="section-container pb-12">
        <h2 className="text-heading-2 mb-4 text-gray-900 text-center max-w-3xl mx-auto">
          Upload, Review and Redline Contracts with Automated Document Workflows
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
                    ? "text-[#d47b0f] border-b-2 border-[#d47b0f]"
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
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
            <div className="flex-1 text-left order-2 lg:order-1">
              <h3 className="font-semibold text-2xl mb-4 text-gray-900">
                {tabs[activeTab].title}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {tabs[activeTab].description}
              </p>
                   <button
                  className="text-sm font-medium uppercase flex gap-1 items-center  text-white bg-[#d47b0f] hover:bg-[#355e66] rounded-md py-3 px-6 my-5"
                  onClick={() => (window.location.href = "/login")}
                >
                  Get Started{" "}
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </button>
            </div>
            <div className="flex-1 lg:basis-1/3 order-1 lg:order-2">
              <img
                src={tabs[activeTab].image}
                className="rounded-lg w-full h-auto"
                alt={tabs[activeTab].alt}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 

