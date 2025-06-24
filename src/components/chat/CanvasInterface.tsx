import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  Download,
  Edit3,
  Lightbulb,
  Eye,
  FileText,
  RefreshCw,
  MessageSquare,
  Scale,
  BookOpen,
  Plus,
  X,
  Check,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as mammoth from 'mammoth';

// TypeScript interfaces
interface SelectionRange {
  text: string;
  index: number;
  length: number;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

interface AISuggestion {
  id: string;
  type: 'improve' | 'explain' | 'expand' | 'cite';
  originalText: string;
  suggestion: string;
  explanation?: string;
  confidence: number;
}

const LegalCanvas: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [showActionBar, setShowActionBar] = useState(false);
  const [showImproveInput, setShowImproveInput] = useState(false);
  const [improveInstructions, setImproveInstructions] = useState('');
  const [currentSuggestion, setCurrentSuggestion] = useState<AISuggestion | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<string>('');

  const [canvasContent, setCanvasContent] = useState<string>('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const actionBarRef = useRef<HTMLDivElement>(null);
  const improveInputRef = useRef<HTMLInputElement>(null);

  // Quill.js configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'align': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['blockquote'],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'align',
    'list', 'indent',
    'blockquote',
    'link', 'image'
  ];

  // Handle Quill editor selection changes
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      const handleSelection = (range: any, oldRange: any, source: any) => {
        if (range && range.length > 0) {
          const selectedText = quill.getText(range.index, range.length);
          if (selectedText.trim() && selectedText.trim().length > 3) {
            const bounds = quill.getBounds(range.index, range.length);
            const editorContainer = quill.container.getBoundingClientRect();
            
            if (bounds) {
              setSelectedText(selectedText.trim());
              setSelectionRange({
                text: selectedText.trim(),
                index: range.index,
                length: range.length,
                rect: {
                  top: bounds.top + editorContainer.top,
                  left: bounds.left + editorContainer.left,
                  width: bounds.width,
                  height: bounds.height,
                }
              });
              setShowActionBar(true);
              setShowImproveInput(false);
              setImproveInstructions('');
            }
          }
        } else {
          clearSelection();
        }
      };

      quill.on('selection-change', handleSelection);
      
      return () => {
        quill.off('selection-change', handleSelection);
      };
    }
  }, []);

  const clearSelection = () => {
    setSelectedText('');
    setSelectionRange(null);
    setShowActionBar(false);
    setShowImproveInput(false);
    setImproveInstructions('');
    setCurrentSuggestion(null);
  };

  // Handle AI actions on selected text
  const handleAIAction = async (action: string, customInstructions?: string) => {
    if (!selectedText || !selectionRange) return;
    
    setIsProcessing(true);
    setProcessingAction(action);
    
    // Simulate AI processing
    setTimeout(() => {
      const suggestion: AISuggestion = {
        id: Date.now().toString(),
        type: action as any,
        originalText: selectedText,
        suggestion: generateAISuggestion(action, selectedText, customInstructions),
        explanation: generateExplanation(action, selectedText),
        confidence: 0.85
      };
      
      setCurrentSuggestion(suggestion);
      setIsProcessing(false);
      setProcessingAction('');
      setShowImproveInput(false);
      setImproveInstructions('');
    }, 1500);
  };

  // Handle improve action with custom instructions
  const handleImproveAction = () => {
    setCurrentSuggestion(null); // Clear any existing suggestion
    setShowImproveInput(true);
    setTimeout(() => {
      improveInputRef.current?.focus();
    }, 100);
  };

  // Submit improve instructions
  const submitImproveInstructions = () => {
    if (!improveInstructions.trim()) return;
    handleAIAction('improve', improveInstructions);
  };

  const handleImproveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitImproveInstructions();
    } else if (e.key === 'Escape') {
      setShowImproveInput(false);
      setImproveInstructions('');
    }
  };

  // Generate AI suggestion based on action
  const generateAISuggestion = (action: string, text: string, customInstructions?: string): string => {
    switch (action.toLowerCase()) {
      case 'improve':
        const baseImprovement = text.replace(/\[.*?\]/g, 'specific legal parameters').replace(/analysis/g, 'comprehensive legal analysis');
        return customInstructions 
          ? `${baseImprovement} (Enhanced based on: ${customInstructions})`
          : baseImprovement;
      case 'explain':
        return `This section ${text.toLowerCase().includes('background') 
          ? 'establishes the factual foundation necessary for the legal analysis by providing essential context about the circumstances that give rise to the legal issues being examined' 
          : 'outlines the relevant legal principles and authorities that form the basis for the subsequent analysis, ensuring the reader understands the applicable legal framework'}.`;
      case 'expand':
        return `${text} Furthermore, it is important to consider the broader implications of this matter, including potential compliance requirements and risk mitigation strategies that should be addressed in the client's decision-making process.`;
      case 'cite':
        return `${text} See generally [Relevant Case Citation], [Statute Citation] (establishing the legal framework for this analysis).`;
      default:
        return text;
    }
  };

  const generateExplanation = (action: string, text: string): string => {
    switch (action.toLowerCase()) {
      case 'improve':
        return 'Enhanced for legal precision and clarity based on your specific requirements';
      case 'explain':
        return 'AI-generated explanation of this section\'s purpose and legal significance';
      case 'expand':
        return 'Added comprehensive analysis and practical considerations';
      case 'cite':
        return 'Added placeholder citations for legal authority';
      default:
        return 'AI-generated suggestion';
    }
  };

  // Accept AI suggestion
  const acceptSuggestion = (suggestion: AISuggestion) => {
    // For explanation, we don't replace the original text
    if (suggestion.type === 'explain') {
      clearSelection();
      return;
    }

    // For other actions, replace the selected text
    if (quillRef.current && selectionRange) {
      const quill = quillRef.current.getEditor();
      quill.deleteText(selectionRange.index, selectionRange.length);
      quill.insertText(selectionRange.index, suggestion.suggestion);
    }
    
    clearSelection();
  };

  // Reject AI suggestion
  const rejectSuggestion = () => {
    setCurrentSuggestion(null);
  };

  // Handle save and export
  const handleSaveToVault = (): void => {
    console.log('Saving document to vault...');
  };

  const handleExportToWord = (): void => {
    console.log('Exporting to Word...');
  };

  // Handle template insertion
  const handleInsertTemplate = async (file: File) => {
    setIsLoadingTemplate(true);
    
    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Use mammoth to extract HTML from the Word document
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.value) {
        // Clean up the HTML for better Quill compatibility
        let cleanHtml = result.value;
        
        // Basic HTML cleanup for Quill
        cleanHtml = cleanHtml
          // Remove Word-specific styles and classes
          .replace(/class="[^"]*"/g, '')
          .replace(/style="[^"]*"/g, '')
          // Ensure proper paragraph structure
          .replace(/<p><\/p>/g, '<br>')
          // Remove empty spans
          .replace(/<span[^>]*><\/span>/g, '')
          // Clean up extra whitespace
          .replace(/\s+/g, ' ')
          .trim();
        
        setCanvasContent(cleanHtml);
        setShowTemplateModal(false);
        
        // Log any conversion messages for debugging
        if (result.messages && result.messages.length > 0) {
          console.log('Mammoth conversion messages:', result.messages);
        }
        
        console.log('Template loaded successfully');
      } else {
        throw new Error('Failed to extract content from the document');
      }
      
    } catch (error) {
      console.error('Error processing template:', error);
      
      // Fallback to sample templates based on filename if mammoth fails
      const fileName = file.name.toLowerCase();
      let fallbackContent = '';
      
      if (fileName.includes('memo') || fileName.includes('memorandum')) {
        fallbackContent = `<h1>MEMORANDUM</h1>

<p><strong>TO:</strong> [Client Name]<br>
<strong>FROM:</strong> [Attorney Name]<br>
<strong>DATE:</strong> [Date]<br>
<strong>RE:</strong> [Matter Description]</p>

<h2>EXECUTIVE SUMMARY</h2>

<p>This memorandum provides an analysis of [legal issue] and recommends [recommended action]. Based on our review of applicable law and the facts presented, we conclude that [conclusion].</p>

<h2>I. BACKGROUND</h2>

<p>[Factual background of the matter]</p>

<h2>II. LEGAL ANALYSIS</h2>

<h3>A. Relevant Legal Framework</h3>

<p>[Discussion of applicable statutes, regulations, and case law]</p>

<h3>B. Application to Present Facts</h3>

<p>[Analysis of how the law applies to the specific facts]</p>

<h2>III. CONCLUSION AND RECOMMENDATIONS</h2>

<p>Based on the foregoing analysis, we recommend [specific recommendations].</p>`;
      } else if (fileName.includes('contract') || fileName.includes('agreement')) {
        fallbackContent = `<h1>SERVICE AGREEMENT</h1>

<p>This Service Agreement ("Agreement") is entered into on [Date] between [Company Name], a [State] corporation ("Company"), and [Client Name] ("Client").</p>

<h2>1. SERVICES</h2>

<p>Company agrees to provide the following services: [Description of Services]</p>

<h2>2. TERM</h2>

<p>This Agreement shall commence on [Start Date] and continue until [End Date], unless terminated earlier in accordance with the terms herein.</p>

<h2>3. COMPENSATION</h2>

<p>In consideration for the services, Client agrees to pay Company [Amount] according to the following schedule: [Payment Terms]</p>

<h2>4. TERMINATION</h2>

<p>Either party may terminate this Agreement with [Notice Period] written notice.</p>

<h2>5. GOVERNING LAW</h2>

<p>This Agreement shall be governed by the laws of [State/Jurisdiction].</p>

<p><strong>Company:</strong> _____________________</p>
<p><strong>Client:</strong> _____________________</p>`;
      } else if (fileName.includes('brief') || fileName.includes('motion')) {
        fallbackContent = `<h1>MOTION TO [RELIEF SOUGHT]</h1>

<p><strong>TO THE HONORABLE COURT:</strong></p>

<p>NOW COMES [Party Name], by and through undersigned counsel, and respectfully moves this Court for [relief sought] and in support thereof states as follows:</p>

<h2>I. INTRODUCTION</h2>

<p>[Brief introduction of the motion and relief sought]</p>

<h2>II. STATEMENT OF FACTS</h2>

<p>[Relevant factual background]</p>

<h2>III. ARGUMENT</h2>

<h3>A. Legal Standard</h3>

<p>[Applicable legal standard and authorities]</p>

<h3>B. Application</h3>

<p>[Application of law to facts]</p>

<h2>IV. CONCLUSION</h2>

<p>For the foregoing reasons, [Party Name] respectfully requests that this Court grant the motion for [relief sought].</p>

<p>Respectfully submitted,</p>
<p>_____________________<br>
[Attorney Name]<br>
[Bar Number]<br>
Attorney for [Party Name]</p>`;
      } else {
        fallbackContent = `<h1>[DOCUMENT TITLE]</h1>

<p>[Document introduction and purpose]</p>

<h2>SECTION 1</h2>

<p>[Content for section 1]</p>

<h2>SECTION 2</h2>

<p>[Content for section 2]</p>

<h2>SECTION 3</h2>

<p>[Content for section 3]</p>

<p><strong>Date:</strong> [Date]<br>
<strong>Prepared by:</strong> [Attorney Name]</p>`;
      }
      
      if (fallbackContent) {
        setCanvasContent(fallbackContent);
        setShowTemplateModal(false);
        console.log('Used fallback template due to processing error');
      }
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Document Canvas */}
      <div className="flex-1 relative overflow-y-auto scrollbar-hide pb-32" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <div ref={canvasRef} className="max-w-4xl mx-auto">
          
          {/* Quill Rich Text Editor */}
          <div className="bg-white relative">
            {/* Custom File Menu Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-sm text-gray-700 hover:bg-gray-100">
                      File
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleSaveToVault}>
                      <Save className="h-4 w-4 mr-2" />
                      Save to Vault
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportToWord}>
                      <Download className="h-4 w-4 mr-2" />
                      Export to Word
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTemplateModal(true)}
                  className="text-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Insert Template
                </Button>
              </div>

              {/* Document status */}
              <div className="text-xs text-gray-500">
                {canvasContent ? 'Document loaded' : 'Blank document'}
              </div>
            </div>
            
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={canvasContent}
              onChange={setCanvasContent}
              modules={modules}
              formats={formats}
              style={{ height: '750px' }}
            />

            {/* Enhanced Unified Action Bar */}
            {showActionBar && selectionRange && (
              <div
                ref={actionBarRef}
                className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
                style={{
                  top: Math.max(10, selectionRange.rect.top - 80),
                  left: Math.max(10, selectionRange.rect.left),
                }}
              >
                <div className="p-3">
                  {/* Show AI suggestion if available */}
                  {currentSuggestion ? (
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-900">
                          {currentSuggestion.type === 'explain' ? 'Explanation' : 
                           currentSuggestion.type === 'improve' ? 'Improvement' :
                           currentSuggestion.type === 'cite' ? 'Citation' : 'Suggestion'}
                        </h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={clearSelection}
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Show original only for improve action */}
                      {currentSuggestion.type === 'improve' && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Original:</div>
                          <div className="text-sm bg-gray-50 p-2 rounded border">
                            "{currentSuggestion.originalText.length > 100 
                              ? currentSuggestion.originalText.substring(0, 100) + '...'
                              : currentSuggestion.originalText}"
                          </div>
                        </div>
                      )}

                      {/* AI Response */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          {currentSuggestion.type === 'explain' ? 'Explanation:' : 'Suggested:'}
                        </div>
                        <div className={`text-sm p-3 rounded border ${
                          currentSuggestion.type === 'explain' ? 'bg-blue-50' :
                          currentSuggestion.type === 'improve' ? 'bg-green-50' :
                          currentSuggestion.type === 'cite' ? 'bg-purple-50' : 'bg-gray-50'
                        }`}>
                          {currentSuggestion.suggestion}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {currentSuggestion.type !== 'explain' && (
                          <Button
                            size="sm"
                            onClick={() => acceptSuggestion(currentSuggestion)}
                            className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={rejectSuggestion}
                          className="h-7 px-3"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {currentSuggestion.type === 'explain' ? 'Close' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  ) : showImproveInput ? (
                    /* Improve Input */
                    <div className="w-80">
                      <div className="text-xs text-gray-600 mb-2">
                        How would you like to improve this text?
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          ref={improveInputRef}
                          value={improveInstructions}
                          onChange={(e) => setImproveInstructions(e.target.value)}
                          onKeyDown={handleImproveKeyDown}
                          placeholder="e.g., make it more formal, add legal citations..."
                          className="h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={submitImproveInstructions}
                          disabled={!improveInstructions.trim() || isProcessing}
                          className="h-8 w-8 p-0"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowImproveInput(false);
                            setImproveInstructions('');
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Initial Action Buttons */
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAIAction('explain')}
                        disabled={isProcessing}
                        className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-700"
                        title="Explain this section"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Explain
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleImproveAction}
                        disabled={isProcessing}
                        className="h-8 px-2 text-xs hover:bg-green-50 hover:text-green-700"
                        title="Improve this text"
                      >
                        <Lightbulb className="h-3 w-3 mr-1" />
                        Improve
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAIAction('cite')}
                        disabled={isProcessing}
                        className="h-8 px-2 text-xs hover:bg-purple-50 hover:text-purple-700"
                        title="Add legal citations"
                      >
                        <Scale className="h-3 w-3 mr-1" />
                        Cite
                      </Button>

                      <div className="w-px h-6 bg-gray-200 mx-1" />
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearSelection}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        title="Close"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Processing indicator */}
                  {isProcessing && (
                    <div className="mt-3 flex items-center justify-center py-2 border-t">
                      <RefreshCw className="h-3 w-3 animate-spin mr-2 text-blue-600" />
                      <span className="text-xs text-blue-600">
                        {processingAction}ing...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Template Upload Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Insert Document Template</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTemplateModal(false)}
                disabled={isLoadingTemplate}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload a Word document (.docx) to use as a template for your legal document.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".docx,.doc"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInsertTemplate(file);
                    }
                  }}
                  disabled={isLoadingTemplate}
                  className="hidden"
                  id="template-upload"
                />
                <label
                  htmlFor="template-upload"
                  className={`cursor-pointer flex flex-col items-center ${
                    isLoadingTemplate ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FileText className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-sm font-medium">
                    {isLoadingTemplate ? 'Processing template...' : 'Click to upload template'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Supports .docx and .doc files
                  </span>
                </label>
              </div>

              {isLoadingTemplate && (
                <div className="flex items-center justify-center py-2">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Converting template...</span>
                </div>
              )}

              <div className="text-xs text-gray-500">
                <strong>Tip:</strong> You can also start with our built-in templates by uploading files named "memo.docx", "contract.docx", or "brief.docx" for different document types.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .ql-editor {
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important;
          font-size: 16px !important;
          line-height: 1.8 !important;
          color: #111827 !important;
          padding: 2rem !important;
          min-height: 750px !important;
        }
        
        .ql-editor h1 {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          margin: 1.5rem 0 1rem 0 !important;
        }
        
        .ql-editor h2 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin: 1.25rem 0 0.75rem 0 !important;
        }
        
        .ql-editor h3 {
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          margin: 1rem 0 0.5rem 0 !important;
        }
        
        .ql-editor p {
          margin: 0.75rem 0 !important;
        }
        
        .ql-toolbar {
          border: none !important;
          padding: 8px 16px !important;
          background: #f9fafb !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        
        .ql-container {
          border: none !important;
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important;
        }

        .ql-editor .ql-syntax {
          background-color: #f3f4f6 !important;
          color: #374151 !important;
          padding: 0.25rem 0.5rem !important;
          border-radius: 0.25rem !important;
          font-family: ui-monospace, monospace !important;
        }
      `}</style>
    </div>
  );
};

export default LegalCanvas;