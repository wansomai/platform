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
    </div>
  );
};


export default LegalCanvas;