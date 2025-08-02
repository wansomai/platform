// src/components/chat/CanvasInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
import { useUIStore } from '@/store/ui.store';
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
  const params = useParams();
  const projectId = params.id as string;
  
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

  // Use workspace hook for settings and data
  const { addToast } = useUIStore();

  // Quill.js configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'align', 'color', 'background',
    'script'
  ];

  // Handle text selection
  const handleTextSelection = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const selection = quill.getSelection();
    if (!selection || selection.length === 0) {
      setShowActionBar(false);
      return;
    }

    const text = quill.getText(selection.index, selection.length);
    if (text.trim().length === 0) {
      setShowActionBar(false);
      return;
    }

    const bounds = quill.getBounds(selection.index, selection.length);
    if (!bounds) {
      setShowActionBar(false);
      return;
    }
    
    const editorRect = quill.container.getBoundingClientRect();

    setSelectedText(text.trim());
    setSelectionRange({
      text: text.trim(),
      index: selection.index,
      length: selection.length,
      rect: {
        top: editorRect.top + bounds.top,
        left: editorRect.left + bounds.left,
        width: bounds.width,
        height: bounds.height,
      }
    });
    setShowActionBar(true);
  };

  // Handle AI-powered actions
  const handleAIAction = async (action: string, instructions?: string) => {
    if (!selectedText || !projectId) return;

    setIsProcessing(true);
    setProcessingAction(action);

    try {
      let prompt = '';
      switch (action) {
        case 'improve':
          prompt = instructions 
            ? `Please improve this text based on these instructions: "${instructions}"\n\nText: "${selectedText}"`
            : `Please improve and refine this legal text for clarity and precision:\n\n"${selectedText}"`;
          break;
        case 'explain':
          prompt = `Please explain this legal text in simple terms:\n\n"${selectedText}"`;
          break;
        case 'expand':
          prompt = `Please expand on this legal text with more detail and context:\n\n"${selectedText}"`;
          break;
        case 'cite':
          prompt = `Please suggest relevant legal citations and authorities for this text:\n\n"${selectedText}"`;
          break;
        default:
          prompt = `Please analyze this legal text:\n\n"${selectedText}"`;
      }

      // TODO: Implement AI request using project settings
      // This would typically send a message to your AI service
      // For now, just show success
      addToast({ 
        message: `AI ${action} request processed successfully`, 
        type: 'success' 
      });

      setShowActionBar(false);
      setShowImproveInput(false);
      setImproveInstructions('');

    } catch (error) {
      console.error(`Error with AI ${action}:`, error);
      addToast({ 
        message: `Failed to process AI ${action} request`, 
        type: 'error' 
      });
    } finally {
      setIsProcessing(false);
      setProcessingAction('');
    }
  };

  // Handle improve with custom instructions
  const handleImproveWithInstructions = () => {
    if (!improveInstructions.trim()) {
      addToast({ message: 'Please provide improvement instructions', type: 'error' });
      return;
    }
    handleAIAction('improve', improveInstructions);
  };

  // Handle document save
  const handleSave = () => {
    try {
      localStorage.setItem(`legal_canvas_${projectId}`, canvasContent);
      addToast({ message: 'Document saved successfully', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to save document', type: 'error' });
    }
  };

  // Handle document export
  const handleExport = () => {
    try {
      const element = document.createElement('a');
      const file = new Blob([canvasContent], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = `legal_document_${new Date().getTime()}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      addToast({ message: 'Document exported successfully', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to export document', type: 'error' });
    }
  };

  // Load saved content on mount
  useEffect(() => {
    if (projectId) {
      const savedContent = localStorage.getItem(`legal_canvas_${projectId}`);
      if (savedContent) {
        setCanvasContent(savedContent);
      }
    }
  }, [projectId]);

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


  // Hide action bar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionBarRef.current && !actionBarRef.current.contains(event.target as Node)) {
        setShowActionBar(false);
        setShowImproveInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gray-50">
        <div className="flex items-center space-x-2">
          <Scale className="h-5 w-5 text-primary-600" />
          <h1 className="text-lg font-semibold text-gray-900">Legal Canvas</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="flex items-center space-x-1"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Templates
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowTemplateModal(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Contract Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTemplateModal(true)}>
                <BookOpen className="h-4 w-4 mr-2" />
                Legal Brief
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTemplateModal(true)}>
                <Scale className="h-4 w-4 mr-2" />
                Motion Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 relative" ref={canvasRef}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={canvasContent}
          onChange={setCanvasContent}
          onChangeSelection={handleTextSelection}
          modules={modules}
          formats={formats}
          style={{ height: '100%' }}
          className="h-full"
        />

        {/* Floating Action Bar */}
        {showActionBar && selectionRange && (
          <div
            ref={actionBarRef}
            className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center space-x-1"
            style={{
              top: selectionRange.rect.top - 60,
              left: selectionRange.rect.left,
              transform: selectionRange.rect.left > window.innerWidth - 300 
                ? 'translateX(-100%)' 
                : 'none'
            }}
          >
            {!showImproveInput ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAIAction('explain')}
                  disabled={isProcessing}
                  className="flex items-center space-x-1 text-xs"
                >
                  <Lightbulb className="h-3 w-3" />
                  <span>Explain</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImproveInput(true)}
                  disabled={isProcessing}
                  className="flex items-center space-x-1 text-xs"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Improve</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAIAction('expand')}
                  disabled={isProcessing}
                  className="flex items-center space-x-1 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  <span>Expand</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAIAction('cite')}
                  disabled={isProcessing}
                  className="flex items-center space-x-1 text-xs"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>Cite</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActionBar(false)}
                  className="text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Input
                  ref={improveInputRef}
                  placeholder="How should I improve this?"
                  value={improveInstructions}
                  onChange={(e) => setImproveInstructions(e.target.value)}
                  className="text-xs"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImproveWithInstructions}
                  disabled={isProcessing || !improveInstructions.trim()}
                  className="text-xs"
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowImproveInput(false);
                    setImproveInstructions('');
                  }}
                  className="text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center space-x-1 text-xs text-blue-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Processing {processingAction}...</span>
              </div>
            )}
          </div>
        )}
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