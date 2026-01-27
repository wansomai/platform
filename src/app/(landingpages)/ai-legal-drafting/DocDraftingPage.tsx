"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
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
  Loader2,
  Send,
  Plus,
  Globe2,
  Globe,
  BookCopy,
  ChevronDown,
  Zap,
  FilePlus,
  FileSearch,
  Sparkles,
} from "lucide-react";

// Import existing components
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VaultSection from "@/components/home/vault";
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
import BrandLogos, {PatnerLogoSection} from "@/components/home/Partnerlogos";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { JurisdictionSelector } from "@/components/workspace/JurisdictionSelector";
import { Jurisdiction } from "@/types";
import { VaultDocsHero } from "../document-vault/DocumentVaultPage";
import HerroPattern from "@/components/layout/HeroPattern";

const LegalDraftingPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    jurisdiction: "London, United Kingdom",
    customer: "New customer",
    fees: "$1000",
    paymentTerms: "Monthly",
  });

  return (
    <div className=" bg-white text-gray-900 overflow-x-hidden">
      <Navbar />
      <DraftPlus  title="Draft or Review legal documents with AI" subtitle=" Use Wansom's legally-trained AI to draft,redline, and review legal
            documents faster than ever."/>
<DraftFeatures/>



      {/* Wansom adapts section */}
      <section className="section-spacing bg-white">
        <div className="section-container">
          <div className="flex flex-col-reverse lg:flex-row gap-5 lg:gap-10">
           

            <div className="lg:basis-1/2">
              <h2 className="text-heading-2 mb-4 text-gray-900">
                 Review with Precision
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Leverage AI to identify risks, suggest improvements, and ensure compliance with legal standards in your documents.
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
             <div className="lg:basis-1/2">
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
                    className="w-full p-3 border border-gray-800 rounded-lg mb-6 focus:ring-2 focus:ring-[#355e66] focus:border-transparent"
                  />

                  <h4 className="font-medium mb-4 text-gray-700">
                    Drafting Settings
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div>Document Type: Employment Agreement</div>
                    <div>Writing Style: Formal</div>
                    <div>Clause Length: Standard</div>
                  </div>

                  <button className="w-full bg-primary text-white py-3 rounded-lg font-medium mt-6 hover:bg-black transition-colors" onClick={() => router.push('/register')}>
                    Generate Document Outline
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

           {/* Draft from scratch section */}
      <section className="section-spacing bg-white">
        <div className="section-container">
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-10">
             <div className="relative lg:basis-1/2">
              <div className="bg-primary p-4 rounded-lg shadow-2xl overflow-hidden">
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
                  <p className="text-gray-600 text-xs mb-6 leading-relaxed">
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
                    <button className="bg-primary text-white px-4 py-2 rounded font-medium hover:bg-black transition-colors" onClick={() => { router.push('/register'); }}>
                      Continue Editing
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:basis-1/2">
              <h2 className="text-heading-2 mb-6 text-black">
                Smarter Redlining
              </h2>
              <p className="text-xl text-black mb-8">
                Wansom learns from your writing style, prior documents and guidelines to instantly mark up and redline entire agreements according to your set instructions.
              </p>
            </div>

           
          </div>
        </div>
      </section>
     
                 {/* Draft from scratch section */}
      <section className=" bg-white pb-5">
        <div className="section-container">
          <div className="flex flex-col-reverse lg:flex-row gap-10">
            
            <div className="lg:basis-1/2">
              <h2 className="text-heading-2 mb-6 text-black">
                Secure Document Storage
              </h2>
              <p className="text-xl text-black mb-8">
               Organize and store documents into customizable folders and subfolders for easy retrieval and management.
              </p>
            </div>
 <div className="relative lg:basis-1/2">
              <VaultDocsHero/>
            </div>
           
          </div>
        </div>
      </section>
             {/* Draft from scratch section */}
      <section className="section-spacing bg-primary">
        <div className="section-container">
          <div className="flex gap-16 items-center justify-center">
            <div>
              <h2 className="text-heading-2 mb-6 text-white">
                1000<sup>+</sup> Professional Legal Templates
              </h2>
              <p className="text-xl text-gray-100 mb-8">
                Start from a professionally drafted legal template and customize
                it to your needs with Wansom's AI-powered drafting tools.
              </p>

              <button
                className="bg-[#d47b0f] hover:bg-[#b8690c] text-white px-5 py-2 rounded font-semibold transition-colors"
                onClick={() => (window.location.href = "/login")}
              >
                Explore Legal templates{" "}
                <ArrowUpRight className="w-6 h-6 inline-block ml-2" />
              </button>
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


export const DraftPlus = ({ title, subtitle }: { title?: string; subtitle?: string }) => {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showJurisdictionDropdown, setShowJurisdictionDropdown] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<Jurisdiction[]>([]);
  const [showDraftDropdown, setShowDraftDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Common drafting prompts
  const draftingPrompts = [
    "Draft a mutual NDA for partnership discussions",
    "Draft an independent contractor agreement",
    "Draft an Advisor Agreement for the UK",
    "Create a sales contract for goods",
    "Draft a SAFE agreement to raise $250k from an angel investor",
    "Draft a SaaS license for my first enterprise client",
  ];

  // Common legal templates
  const legalTemplates = [
    "Non-Disclosure Agreement (NDA)",
    "Employment Agreement",
    "Independent Contractor Agreement",
    "Service Level Agreement (SLA)",
    "Partnership Agreement",
    "Sales Contract",
    "Lease Agreement",
    "Consulting Agreement",
    "Software License Agreement",
    "Intellectual Property Assignment",
  ];

  // Placeholder rotation
  const placeholders = [
    "Create an NDA for Senior Software engineer",
    "Help me prepare for a civil litigation case",
    "Draft Lease Agreement for tenant in UK",
    "Review Employment Contract for remote worker",
    "Summarize Intellectual Property Agreement",
    "Create Sales Contract for Commercial Property",
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

  // Handle drafting prompt selection
  const handleDraftPromptSelect = (prompt: string) => {
    setChatInput(prompt);
    setShowDraftDropdown(false);
  };

  // Handle template selection
  const handleTemplateSelect = (templateName: string) => {
    // Create a mock file object to represent the template
    const mockFile = new File([], `${templateName}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    setSelectedFiles(prev => [...prev, mockFile]);

    // Populate input field with the template prompt
    setChatInput("Use this template to draft my legal document.");
    setShowTemplateDropdown(false);
  };

  // Handle review document button click (triggers file upload)
  const handleReviewDocumentClick = () => {
    fileInputRef.current?.click();
  };
  return (
    <section
      className="pt-24 lg:pt-32 relative"
      id="knowledge-base"
    >
            {/* SVG Background */}
   <HerroPattern />

      {/* Header positioned at top of hero container */}
      <div className="absolute top-0 left-0 right-0 z-20">
      </div>
      <div className="section-container pb-12">
        <div className="text-center mb-8 ">
          <h1 className="text-heading-1 font-serif text-primary mb-2">
            {title}
          </h1>
          <p className="text-body-large text-black max-w-4xl mx-auto">
           {subtitle}
          </p>
        </div>
        {/* Chat Input Area */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="w-full">
            <div className="bg-white rounded-xl border-2 border-gray-200 focus-within:border-primary-300 transition-colors relative shadow-sm focus-within:shadow-md">
              {/* Left side icons */}
              {/* Animated placeholder overlay */}
              {!chatInput && selectedFiles.length === 0 && (
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
                      <SlidersHorizontal className="h-6 w-6 text-gray-700" />{" "}Tools
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
                            Draft & Review
                          </Label>
                        </div>
                        <Switch
                          id="legal-drafting"
                          checked={true}
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
                  className="h-8 w-8 p-0 rounded-md hover:bg-gray-100"
                      title={
                        selectedJurisdictions.length > 0
                          ? `${selectedJurisdictions.length} jurisdiction${selectedJurisdictions.length !== 1 ? 's' : ''} selected`
                          : "Select jurisdiction"
                      }
                    >
                      <Globe className="h-5 w-5 text-gray-500" />
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-gray-100"> <Zap className="h-6 w-6 text-gray-700" /></Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Register to start new workflow</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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
                placeholder=""
                className={`border-0 resize-none rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-600 px-6 pr-16 text-[13px] md:text-base ${
                  selectedFiles.length > 0
                    ? "min-h-[100px] max-h-[200px] pt-2 pb-4"
                    : "min-h-[120px] max-h-[200px] py-4"
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
            {/* Draft From Scratch Dropdown */}
            <DropdownMenu
              open={showDraftDropdown}
              onOpenChange={setShowDraftDropdown}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  size={'sm'}
                  className="text-xs lg:text-sm  bg-primary  text-white rounded   flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-white" />
                  Draft A Contract
                  <ChevronDown className="h-4 w-4 text-white ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-[400px] p-2"
                side="top"
              >
                <div className="space-y-1">
                  {draftingPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleDraftPromptSelect(prompt)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
                {/* Review Document - File Upload Trigger */}
            <Button
              size={'sm'}
              className="text-xs lg:text-sm  bg-primary  text-white rounded  flex items-center gap-2"
              onClick={handleReviewDocumentClick}
            >
              <FileSearch className="h-4 w-4 text-white" />
              Review a Document
            </Button>

            {/* Draft From Template Dropdown */}
            <DropdownMenu
              open={showTemplateDropdown}
              onOpenChange={setShowTemplateDropdown}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  size={'sm'}
                  className="text-xs lg:text-sm  bg-primary  text-white rounded   flex items-center gap-2"
                >
                  <FilePlus className="h-4 w-4 text-white" />
                  Start from a Template
                  <ChevronDown className="h-4 w-4 text-white ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-[340px] p-2"
                side="top"
              >
                <div className="space-y-1">
                  {legalTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {template}.PDF
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

        

          </div>
           

        </div>
      </div>
      <BrandLogos />
    </section>
  );
};

function DraftFeatures() {

  return (
    <section className="section-spacing bg-white" id="legal-research">
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
            <h3 className="font-semibold text-heading-2 text-black">
                 Generate Drafts Instantly
                </h3>
            <p className=" text-black text-xl mb-8">
     Start from Scratch or select from 1,000+ advocate-vetted templates and let AI refine documents in a unified editor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
export default LegalDraftingPage;
