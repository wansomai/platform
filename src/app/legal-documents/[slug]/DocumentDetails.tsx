"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import {
  FileText,
  ChevronRight,
  ArrowUpRight,
  Paperclip,
  SlidersHorizontal,
  X,
  Globe,
  Loader2,
  Send,
  FileSearch,
  FilePlus,
  ChevronDown,
  Sparkles,
  Zap,
} from "lucide-react";
import { getAllLegalDocuments } from "@/lib/data/sanity";
import { adaptSanityLegalDocuments } from "@/lib/data/blogAdapter";
import { Jurisdiction } from "@/types";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { JurisdictionSelector } from "@/components/workspace/JurisdictionSelector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
// Lazy load Footer component
const Footer = dynamic(() => import("@/components/layout/Footer"), {
  ssr: false,
  loading: () => null,
});

interface PageProps {
  blog: any | null;
}

const DocDetailPageClient = ({ blog }: PageProps) => {
  const router = useRouter();
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  // Fetch related documents
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        // Fetch all documents from Sanity
        const allDocs = await getAllLegalDocuments();
        const adapted = adaptSanityLegalDocuments(allDocs);

        // Filter out current document and get up to 6 related
        const related = adapted
          .filter((doc: any) => doc.id !== blog?.id)
          .slice(0, 6);

        setRelatedPosts(related);
      } catch (error) {
        console.error('Error fetching related documents:', error);
      }
    };

    if (blog) {
      fetchRelated();
    }
  }, [blog]);

  const handleDownload = () => {
    if (blog?.template?.url) {
      window.open(blog.template.url, '_blank');
    }
  };

  if (!blog) {
    return (
      <div className="bg-gray-50 min-h-screen">
          <Navbar darkmode />
            <DraftPlus title="Write, review, negotiate, and manage legal contracts" initialPrompt={blog?.title ? `Draft a document using the "${blog.title}" template` : ""} initialTemplateName={blog?.title || ''} />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center flex items-center flex-col gap-3 justify-center">
            <h1 className="text-5xl font-semibold text-primary mb-4 font-serif">
              Oops!
            </h1>
            <p className="mb-6">The requested legal document could not be found.</p>
            <img src="/404.png" className="mx-auto -mt-20" alt="404"/>
            <Link
              href="/legal-documents"
              className="flex gap-1 items-center bg-teal-600 text-sm text-white px-6 py-2 rounded-md"
            >
              View More Documents
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
       <Navbar darkmode/>
     <DraftPlus title="Write, review, negotiate, and manage legal contracts" initialPrompt={blog?.title ? `Draft a document using the "${blog.title}" template` : ""} initialTemplateName={blog?.title || ''} />
      {/* Header Section with Breadcrumb */}
      <div className="section-spacing">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Title and Description */}
          <h1 className="text-xl lg:text-3xl font-serif font-bold text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: blog.title }}>
            
          </h1>

          {/* Preview with Show More */}
          {blog.contentHtml && (
            <div className="mb-6">
              <div
                className={`blog-content text-gray-600 text-lg leading-relaxed ${
                  isPreviewExpanded ? '' : 'line-clamp-3'
                }`}
                dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
              />
              <button
                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                className="mt-2 text-secondary hover:text-black font-medium flex items-center gap-1 text-sm"
              >
                {isPreviewExpanded ? (
                  <>
                    Show less
                    <ChevronRight className="w-4 h-4 rotate-[-90deg] transition-transform" />
                  </>
                ) : (
                  <>
                    View more
                    <ChevronRight className="w-4 h-4 rotate-90 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded hover:bg-black transition-colors font-medium"
            >
              Open in editor
              <ArrowUpRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
      

      {/* Main Content Area */}
      <div className="container mx-auto px-4  max-w-6xl">
        <div className="flex gap-8">
        </div>
        {/* Related Documents Section */}
        {relatedPosts.length > 0 && (
          <div className=" pb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              More documents in this category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={post.link}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2"  dangerouslySetInnerHTML={{ __html: post.title }}>
                      </h3>
                      <p className="text-sm text-gray-500">Wansom Legal Library</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};


const DraftPlus = ({ title, subtitle, initialPrompt, initialTemplateName }: { title?: string; subtitle?: string; initialPrompt?: string; initialTemplateName?: string }) => {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);
  const [showGeneratedModal, setShowGeneratedModal] = useState(false);
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

  // Prefill chat input from an initial prompt (e.g., template)
  useEffect(() => {
    if (initialPrompt) {
      setChatInput(initialPrompt);
    }
  }, [initialPrompt]);

  // If an initial template name is provided, add a mock file representing it
  const initialTemplateAddedRef = useRef(false);
  useEffect(() => {
    if (!initialTemplateName) return;

    const fileName = `${initialTemplateName}.docx`;

    // Avoid adding duplicate mock files (handles StrictMode double mount and re-renders)
    if (initialTemplateAddedRef.current) return;
    if (selectedFiles.some((f) => f.name === fileName)) {
      initialTemplateAddedRef.current = true;
      return;
    }

    try {
      const mockFile = new File([], fileName, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      setSelectedFiles((prev) => {
        initialTemplateAddedRef.current = true;
        return [...prev, mockFile];
      });
    } catch (e) {
      // File constructor might throw in some environments; ignore gracefully
      console.warn('Could not create mock file for template', e);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTemplateName]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [chatInput]);

  // Handle chat input send
  const handleSend = async () => {
    if (isSubmitting || isGenerating) return;

    setIsSubmitting(true);
    setIsGenerating(true);
    // Open modal immediately and show skeleton inside it
    setShowGeneratedModal(true);

    try {
      // Start a simulated progress updater
      setProgress(3);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      progressIntervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          const inc = Math.floor(Math.random() * 8) + 4; // random increment
          return Math.min(98, prev + inc);
        });
      }, 250);
      window.setTimeout(() => {
        // finish progress and stop interval
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setProgress(100);
        // small delay to allow bar to reach 100%
        window.setTimeout(() => {
          setIsGenerating(false);
          setIsSubmitting(false);
        }, 300);
      }, 2200);
    } catch (error) {
      console.error("Generation error:", error);
      setIsGenerating(false);
      setIsSubmitting(false);
    }
  };

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

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
    setChatInput("Draft a legal document starting with this template");
    setShowTemplateDropdown(false);
  };

  // Handle review document button click (triggers file upload)
  const handleReviewDocumentClick = () => {
    fileInputRef.current?.click();
  };
  return (
    <section
      className="relative pt-32"
      id="knowledge-base"
    >
      <div className="section-container">
        <div className="text-center mb-8 ">
          <h2 className="text-2xl lg:text-4xl font-serif text-primary mb-2">
            {title}
          </h2>
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
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <span className=" max-w-[140px] truncate">
                            {file.name}
                          </span>.docx
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
                disabled={isSubmitting || isGenerating}
              />

              {/* Send button positioned inside textarea */}
              <div className="absolute right-3 bottom-3 z-10">
                <Button
                  className="bg-primary hover:bg-[#d47b0f] text-white z-10 shadow-md h-10 w-10 rounded-lg"
                  disabled={isSubmitting || isGenerating}
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

          {/* page-level skeleton removed; generation UI now appears inside modal */}

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
                  className="text-xs lg:text-sm  bg-primary  text-white rounded   flex items-center gap-1"
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
              className="text-xs lg:text-sm  bg-primary  text-white rounded  flex items-center gap-1"
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
                  className="text-xs lg:text-sm  bg-primary  text-white rounded   flex items-center gap-1"
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
                      {template}.docx
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

        

          </div>
           

        </div>
      </div>

      {/* Generated Document Modal */}
      <Dialog
        open={showGeneratedModal}
        onOpenChange={(open) => {
          // Prevent closing while generation is in progress
          if (!isGenerating) setShowGeneratedModal(open);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{isGenerating ? 'Generating document…' : ''}</DialogTitle>
           
          </DialogHeader>

          <div className="py-3">
            {isGenerating ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-40 bg-gray-200 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 bg-gray-200 rounded w-24" />
                  <div className="h-10 bg-gray-200 rounded w-40" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                  <div className="text-4xl">🎉</div>
                </div>
                <h3 className="text-xl font-serif font-semibold">Your document is ready for preview</h3>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGeneratedModal(false)} disabled={isGenerating}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowGeneratedModal(false);
                router.push('/register');
              }}
              className="ml-2"
              disabled={isGenerating}
            >
              Open in Editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </section>
  );
};
export default DocDetailPageClient;
