"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Loader2,
  Send,
  Settings,
  Paperclip,
  SlidersHorizontal,
  X,
  Plus,
  Globe2,
  Globe,
  FileText,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { JurisdictionSelector } from "@/components/workspace/JurisdictionSelector";
import { Jurisdiction } from "@/types";

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
    <section className="section-spacing bg-gray-50" id="knowledge-base">
      <div className="section-container pb-12">
        <div className="text-center mb-12 ">
          <h2 className="text-heading-2 text-gray-900 mb-2">
            Access verified legal authorities in one intelligent search
          </h2>
          <p className="text-body-large text-gray-600 max-w-3xl mx-auto">
            Wansom supports trusted legal data sources across multiple
            jursidictions removing hallucinations and errors from AI responses.
          </p>
        </div>
        {/* Chat Input Area */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="w-full">
            <div className="bg-white rounded-xl border-2 border-gray-200 focus-within:border-primary-300 transition-colors relative shadow-sm focus-within:shadow-md">
              {/* Left side icons */}
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
                <button
                  className="h-8 w-fit px-3 py-2 rounded-lg  flex gap-1 items-center border-gray-10 border cursor-not-allowed opacity-60"
                  disabled={true}
                  title="Settings (available after registration)"
                  aria-labelledby="settings"
                >
                  <Zap className="h-4 w-4 text-gray-700 text-xs" />
                  Workflows
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

export default KnowledgeBase;
