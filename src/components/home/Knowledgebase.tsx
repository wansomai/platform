
"use client";
import { useState, useEffect, useRef } from "react";
import { Loader2, Send, Settings, Paperclip, SlidersHorizontal, X, Plus, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

const KnowledgeBase=() =>{
    const router = useRouter();
    const [chatInput, setChatInput] = useState("Ask wansom anything...");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
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
        console.log('Navigating to register page...');
        // Navigate to register page when send is clicked
        router.push('/register');
      } catch (error) {
        console.error('Navigation error:', error);
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
    <section className="section-spacing bg-gray-50" id="knowledge-base">
      <div className="section-container pb-12">
        <div className="text-center mb-12 ">
          <h2 className="text-heading-2 text-gray-900 mb-2">
       Access verified legal authorities in one intelligent search
          </h2>
          <p className="text-body-large text-gray-600 max-w-3xl mx-auto">
         Wansom supports trusted legal data sources across multiple jursidictions removing hallucinations and errors from AI responses.
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
                        <button
                          className="h-8 w-fit px-3 py-2 rounded-lg shadow-lg flex gap-1 items-center border-gray-10 border cursor-not-allowed opacity-60"
                          disabled={true}
                          title="Settings (available after registration)"
                          aria-labelledby="settings"
                        >
                          <Settings className="h-4 w-4 text-gray-700 text-xs" />
                          Settings
                        </button>
                      </div>
      
                      <Textarea
                        ref={textareaRef}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about this document..."
                        className="border-0 resize-none rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-gray-600 min-h-[150px] max-h-[250px] px-6 py-4 pr-16 text-[13px] md:text-base"
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
                    <a href="https://eur-lex.europa.eu/homepage.html" target="_blank" className="text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
                      <img src="/logos/eu.jpg" alt="euro-lex" className="h-8 w-8 rounded-full" />
                      Euro Lex
                      <Plus className="h-4 w-4 text-gray-500" />
                    </a>
                      <a href="https://www.kenyalaw.org/" target="_blank" className="text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
                      <img src="/logos/kenya-law.jpg" alt="euro-lex" className="h-8 w-8 rounded-full" />
                      Kenya Law
                      <Plus className="h-4 w-4 text-gray-500" />
                    </a>
                    <a href="https://africanlii.org/en/indexes/case-indexes/case-indexes-commercial" target="_blank" className="text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
                      <img src="/logos/African+union.webp" alt="euro-lex" className="h-8 w-8 rounded-full" />
                   Afcomm
                      <Plus className="h-4 w-4 text-gray-500" />
                    </a>
                      <div className="text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
                      <img src="/logos/CommonLII.jpg" alt="euro-lex" className="h-8 w-8 rounded-full" />
                      CommonLII
                      <Plus className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
                      <img src="/logos/SAFLII_small.png" alt="euro-lex" className="h-8 w-8 rounded-full" />
                      SAFLII
                      <Plus className="h-4 w-4 text-gray-500" />
                    </div>
                     <a href="https://www.worldlii.org/" className="text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
                      <img src="/logos/WorldLII.gif" alt="euro-lex" className="h-8 w-8 rounded-full" />
                      WorldLII
                      <Plus className="h-4 w-4 text-gray-500" />
                    </a>
                     <div className="text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
                      <img src="/logos/ZambiaLII.webp" alt="euro-lex" className="h-8 w-8 rounded-full" />
                      ZambiaLII
                      <Plus className="h-4 w-4 text-gray-500" />
                    </div>
                      <div className="text-lg border border-gray-200 text-gray-500 rounded-lg px-4 py-2 flex items-center gap-2">
                      <Globe2 className="h-8 w-8 rounded-full" />
                      Web Search
                      <Plus className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                </div>
      
      </div>
    </section>
  );
}

export default KnowledgeBase;