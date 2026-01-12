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

const LegalDraftingPage = () => {
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

                  <button className="w-full bg-primary text-white py-3 rounded-lg font-medium mt-6 hover:bg-black transition-colors">
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
      <div className="section-container pb-12">
        <div className="text-center mb-8 ">
          <h2 className="text-heading-1 font-serif text-primary mb-2">
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
  const [expandedSections, setExpandedSections] = useState({
    review: true,
    drafts: false,
    folders: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
            <h3 className="font-semibold text-lg text-black">
                 Generate Drafts Instantly
                </h3>
            <p className=" text-black mb-8">
     Start from Scratch or select from 1,000+ advocate-vetted templates and let AI refine documents in a unified editor.
            </p>

            {/* Enhanced AI Document Review section */}
            <div className="border-b border-gray-800 pb-4">
              <button
                onClick={() => toggleSection('review')}
                className="w-full flex items-center justify-between text-left group"
                aria-expanded={expandedSections.review}
                aria-controls="review-content"
                aria-label={`${expandedSections.review ? 'Collapse' : 'Expand'} Enhanced AI Document Review section`}
              >
                <h3 className="font-semibold text-lg text-black">
                Smarter Redlining
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-black transition-transform duration-200 ${
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
                <p className="text-black">
                 Wansom learns from your writing style, prior documents and guidelines to instantly mark up and redline entire agreements according to your set instructions.
                </p>
              </div>
            </div>
 {/* Document Folders section */}
            <div className="pb-4 ">
              <button
                onClick={() => toggleSection('drafts')}
                className="w-full flex items-center justify-between text-left group"
                aria-expanded={expandedSections.drafts}
                aria-controls="draft-content"
                aria-label={`${expandedSections.drafts ? 'Collapse' : 'Expand'} Document Review section`}
              >
                <h3 className="font-semibold text-lg text-black">
                Review with Precision
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-black transition-transform duration-200 ${
                    expandedSections.drafts ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <div
                id="folders-content"
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.drafts ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-black">
                  Leverage AI to identify risks, suggest improvements, and ensure compliance with legal standards in your documents.
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
                <h3 className="font-semibold text-lg text-black">
                Secure Document Storage
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-black transition-transform duration-200 ${
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
                <p className="text-black">
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
