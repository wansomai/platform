"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  FileText,
  CheckCircle,
  Play,
  ArrowRight,
  BookOpen,
  ArrowUpRight,
  Paperclip,
  SlidersHorizontal,
  X,
  Settings,
  Loader2,
  Send,
  Plus,
  Globe2,
  BookCopy,
  ChevronDown,
} from "lucide-react";

// Import existing components
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VaultSection from "@/components/home/vault";
import KnowledgeBase from "@/components/home/Knowledgebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {PatnerLogoSection} from "@/components/home/Partnerlogos";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LegalDraftingPage = () => {
  const [formData, setFormData] = useState({
    jurisdiction: "London, United Kingdom",
    customer: "New customer",
    fees: "$1000",
    paymentTerms: "Monthly",
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Navbar />
      <DraftPlus />
 {/* Partner Logos */}
 <PatnerLogoSection/>
<DraftFeatures/>



      {/* Wansom adapts section */}
      <section className="section-spacing bg-white">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-10 ">
           

            <div>
              <h2 className="text-heading-2 mb-4 text-gray-900">
                Wansom adapts to your documents
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Wansom automatically detects the substance of your document to
                draft relevant, ready to use clauses. Collaborate with AI to
                achieve tasks faster.
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
             <div>
              <div className="bg-primary rounded-lg p-6 flex items-center justify-center">
                <div className="bg-white rounded-xl p-8 shadow-lg border max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">
                    Jurisdiction
                  </h3>
                  <input
                    type="text"
                    value={formData.jurisdiction}
                    onChange={(e) =>
                      setFormData({ ...formData, jurisdiction: e.target.value })
                    }
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
            </div>
          </div>
        </div>
      </section>

           {/* Draft from scratch section */}
      <section className="section-spacing bg-primary">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-heading-2 mb-6 text-white">
                1000<sup>+</sup> Professional Legal Templates
              </h2>
              <p className="text-xl text-gray-100 mb-8">
                Start from a professionally drafted legal template and customize
                it to your needs with Wansom's AI-powered drafting tools.
              </p>

              <button
                className="bg-[#d47b0f] hover:bg-[#b8690c] text-white px-5 py-2 rounded-lg font-semibold transition-colors"
                onClick={() => (window.location.href = "/login")}
              >
                Explore Legal templates{" "}
                <ArrowUpRight className="w-6 h-6 inline-block ml-2" />
              </button>
            </div>

            <div className="relative">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">1 of 4</span>
                    <div className="flex space-x-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        ←
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        →
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">
                    CONFIDENTIALITY AND USE OF SUBCONTRACTORS
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    Each party (the "Receiving Party") understands that the
                    other party (the "Disclosing Party") has disclosed or may
                    disclose business, technical, or financial information
                    relating to the Disclosing Party's business (hereinafter
                    referred to as "Proprietary Information"). The Receiving
                    Party agrees to: (i) take reasonable precautions to protect
                    such Proprietary Information...
                  </p>
                  <div className="flex space-x-2">
                    <button className="p-2 border border-gray-200 rounded hover:bg-gray-50">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 border border-gray-200 rounded hover:bg-gray-50">
                      <BookOpen className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="bg-[#355e66] text-white px-4 py-2 rounded font-medium hover:bg-[#2a4d54] transition-colors">
                      Continue Editing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* More spells section */}
      <VaultSection />
      <Footer />
    </div>
  );
};

const DraftPlus = () => {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Placeholder rotation
  const placeholders = [
    "Create an NDA for Software engineer",
    "Draft Lease Agreement for tenant in UK",
    "Write Employment Contract for Remote Worker",
    "Generate Service Agreement for Consulting Services",
    "Draft Partnership Agreement for Tech Startup",
    "Create Sales Contract for Commercial Property",
    "Write Freelance Agreement for Graphic Designer",
    "Draft Non-Compete Agreement for Executive",
  ];
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

  // Rotate placeholders every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
  return (
    <section
      className="pt-24 lg:pt-32 bg-primary"
      id="knowledge-base"
    >
      <div className="section-container pb-12">
        <div className="text-center mb-12 ">
          <h2 className="text-heading-1 font-serif text-white mb-2">
            Draft or Review legal documents with AI
          </h2>
          <p className="text-body-large text-gray-50 max-w-4xl mx-auto">
            Use Wansom's legally-trained AI to draft,redline, and review legal
            documents faster than ever.
          </p>
        </div>
        {/* Chat Input Area */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="w-full">
            <div className="bg-white rounded-xl border-2 border-gray-200 focus-within:border-primary-300 transition-colors relative shadow-sm focus-within:shadow-md">
              {/* Left side icons */}
              {/* Animated placeholder overlay */}
              {!chatInput && (
                <div className="absolute left-6 top-4 pointer-events-none overflow-hidden h-6">
                  <div
                    key={currentPlaceholderIndex}
                    className="text-gray-600 text-[13px] md:text-base animate-slide-up"
                  >
                    {placeholders[currentPlaceholderIndex]}
                  </div>
                </div>
              )}

              <div className="absolute flex items-center gap-1 z-10 w-full left-6 bottom-3">
                {/* Documents Tool */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-md cursor-not-allowed opacity-60"
                  title="Documents (available after registration)"
                  disabled={true}
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
                      variant="outline"
                      size="sm"
                      className="h-8 w-fit px-2 rounded-md hover:bg-gray-100"
                      title="AI Tools (preview - will be configurable after registration)"
                      aria-labelledby="AI tools"
                    >
                      <SlidersHorizontal className="h-6 w-6 text-gray-700" />{" "}
                      Settings
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
                          Workspace Settings
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
                            Legal drafting
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
                            className="font-medium text-sm"
                          >
                            Contract Review
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

                {/* Settings Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" className="flex gap-1 items-center"> <BookCopy className="h-4 w-4 text-gray-700 text-xs" />Templates</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Register to Use Templates</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
          
              </div>

              <Textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=""
                className="border-0 resize-none rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-600 min-h-[120px] max-h-[200px] px-6 py-4 pr-16 text-[13px] md:text-base"
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
              className="tex-sm lg:text-lg border border-gray-200 text-gray-50 rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <img
                src="/logos/eu.jpg"
                alt="euro-lex"
                className="h-8 w-8 rounded-full"
              />
              Euro Lex
              <Plus className="h-4 w-4 text-gray-50" />
            </a>
            <a
              href="https://www.kenyalaw.org/"
              target="_blank"
              className="tex-sm lg:text-lg border border-gray-200 text-gray-50 rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <img
                src="/logos/kenya-law.jpg"
                alt="Kenya Law"
                className="h-8 w-8 rounded-full"
              />
              Kenya Law
              <Plus className="h-4 w-4 text-gray-50" />
            </a>
            <a
              href="https://africanlii.org/en/indexes/case-indexes/case-indexes-commercial"
              target="_blank"
              className="tex-sm lg:text-lg border border-gray-200 text-gray-50 rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <img
                src="/logos/African+union.webp"
                alt="Afcomm"
                className="h-8 w-8 rounded-full"
              />
              Afcomm
              <Plus className="h-4 w-4 text-gray-50" />
            </a>
            <div className="tex-sm lg:text-lg border border-gray-200 text-gray-50 rounded-lg px-4 py-2 flex items-center gap-2">
              <img
                src="/logos/CommonLII.jpg"
                alt=" CommonLII"
                className="h-8 w-8 rounded-full"
              />
              CommonLII
              <Plus className="h-4 w-4 text-gray-500" />
            </div>
            <div className="tex-sm lg:text-lg border border-gray-200 text-gray-50 rounded-lg px-4 py-2 flex items-center gap-2">
              <img
                src="/logos/SAFLII_small.png"
                alt=" SAFLII"
                className="h-8 w-8 rounded-full"
              />
              SAFLII
              <Plus className="h-4 w-4 text-gray-500" />
            </div>
            <a
              href="https://www.worldlii.org/"
              className="tex-sm lg:text-lg border border-gray-200 text-gray-50 rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <img
                src="/logos/WorldLII.gif"
                alt=" WorldLII"
                className="h-8 w-8 rounded-full"
              />
              WorldLII
              <Plus className="h-4 w-4 text-gray-500" />
            </a>
            <div className="tex-xs lg:text-lg border border-gray-200 text-gray-50 rounded-lg px-4 py-2 flex items-center gap-2">
              <img
                src="/logos/ZambiaLII.webp"
                alt="ZambiaLII"
                className="h-6 md:h-8 w-6 md:w-8 rounded-full"
              />
              ZambiaLII
              <Plus className="h-4 w-4 text-gray-500" />
            </div>
            <div className="tex-xs lg:text-lg border border-gray-200 text-gray-50 rounded-lg px-4 py-2 flex items-center gap-2">
              <Globe2 className="h-6 md:h-8 w-6 md:w-8 rounded-full" />
              Web Search
              <Plus className="h-4 w-4 text-gray-50" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function DraftFeatures() {
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
            <div className="bg-primary  rounded-lg pb-4 px-4 relative   md:min-w-[500px] w-full lg:basis-1/2">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden lg:w-[75%]">
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
                      <h3 className="font-medium">New Clause</h3>
                      <p className="text-sm text-gray-600">
                        Draft a new clause or article
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">New Document</h3>
                      <p className="text-sm text-gray-600">
                        Draft a full document from scratch
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Play className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Autocomplete</h3>
                      <p className="text-sm text-gray-600">
                        Place your cursor and keep writing
                      </p>
                    </div>
                  </div>

                  <button className="text-sm text-gray-600 flex items-center">
                    2 More <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center lg:text-left w-[60%] absolute top-1/2 right-1 md:right-10">
              <div className="bg-white rounded-lg shadow-xl p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Preview Document
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-300 rounded w-full"></div>
                    <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-300 rounded w-5/6"></div>
                    <div className="h-2 bg-[#355e66] rounded w-1/2"></div>
                    <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                    <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-300 rounded w-5/6"></div>
                    <div className="h-2 bg-[#355e66] rounded w-1/2"></div>
                  </div>
                </div>
        
              </div>
            </div>
          </div>
          <div className="space-y-4 mt-24 lg:mt-0">
            <h3 className="font-semibold text-lg text-gray-100">
                 Generate Drafts Instantly
                </h3>
            <p className=" text-gray-100 mb-8">
     Start from Scratch or select from 1,000+ advocate-vetted templates and let AI refine documents in a unified editor.
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
                Smarter Redlining
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
                 Wansom learns from your writing style, prior documents and guidelines to instantly mark up and redline entire agreements according to your set instructions.
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
                Secure Document Storage
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
                  Organize and store documents into customizable folders and
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
export default LegalDraftingPage;
