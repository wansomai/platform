'use client'
import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  Download,
  Edit3,
  Lightbulb,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ChatInput } from '@/components/chat/ChatInput';
import { useConversationDocumentsStore } from "@/store/conversation-documents.store";

// TypeScript interfaces
interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface Template {
  id: number;
  name: string;
  type: string;
  size: string;
  lastUsed: string;
  description: string;
}

interface SelectionRange {
  text: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

const LegalCanvas: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [canvasContent, setCanvasContent] = useState<string>(`<h1>MEMORANDUM</h1>

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

<p>Based on the foregoing analysis, we recommend [specific recommendations].</p>`);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'ai',
      content: "I'm ready to help you draft this legal memorandum. You can select any text to get suggestions, or ask me questions in this chat.",
      timestamp: '10:30 AM'
    }
  ]);

  const [templates] = useState<Template[]>([
    { 
      id: 1, 
      name: 'Contract Amendment Template', 
      type: 'contract', 
      size: '2.3 MB',
      lastUsed: '2 days ago',
      description: 'Standard contract amendment format used by the firm'
    },
    { 
      id: 2, 
      name: 'Motion to Dismiss Template', 
      type: 'motion', 
      size: '1.8 MB',
      lastUsed: '1 week ago',
      description: 'Federal court motion template with standard arguments'
    },
    { 
      id: 3, 
      name: 'Legal Brief Template', 
      type: 'brief', 
      size: '2.1 MB',
      lastUsed: '3 days ago',
      description: 'Appellate brief template with proper citations'
    },
    { 
      id: 4, 
      name: 'Due Diligence Checklist', 
      type: 'checklist', 
      size: '500 KB',
      lastUsed: '5 days ago',
      description: 'M&A due diligence document checklist'
    },
    { 
      id: 5, 
      name: 'Employment Agreement Template', 
      type: 'contract', 
      size: '1.9 MB',
      lastUsed: '1 week ago',
      description: 'Standard employment agreement with confidentiality clauses'
    },
    { 
      id: 6, 
      name: 'Litigation Hold Notice', 
      type: 'notice', 
      size: '800 KB',
      lastUsed: '4 days ago',
      description: 'Template for litigation hold notifications'
    }
  ]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);


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
    'list', 'bullet', 'indent',
    'blockquote',
    'link', 'image'
  ];

  // Handle save to vault
  const handleSaveToVault = (): void => {
    console.log('Saving document to vault...');
    // Implementation would go here
  };

  // Handle export to Word
  const handleExportToWord = (): void => {
    console.log('Exporting to Word...');
    // Implementation would go here
  };

  // Handle Quill editor initialization and events
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      // Add selection change listener
      const handleSelection = (range: any, oldRange: any, source: any) => {
        if (range && range.length > 0) {
          const selectedText = quill.getText(range.index, range.length);
          if (selectedText.trim()) {
            setSelectedText(selectedText);
          }
        } else {
          setSelectedText('');
          setSelectionRange(null);
        }
      };

      quill.on('selection-change', handleSelection);
      
      // Cleanup
      return () => {
        quill.off('selection-change', handleSelection);
      };
    }
  }, []);

  // Handle AI actions on selected text
  const handleAIAction = (action: string): void => {
    if (!selectedText) return;
    
    setIsProcessing(true);
    
    // Add user message showing the action
    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      content: `${action} this text: "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    // Simulate AI processing
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: chatMessages.length + 2,
        type: 'ai',
        content: getAIResponse(action, selectedText),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
      
      // Clear selection
      setSelectedText('');
      setSelectionRange(null);
    }, 1500);
  };

  // Generate AI response based on action
  const getAIResponse = (action: string, text: string): string => {
    switch (action.toLowerCase()) {
      case 'improve':
        return `Here's an improved version of that text:\n\n"${text.replace(/\[.*?\]/g, 'specific details')}" \n\nI've made it more specific and legally precise. Would you like me to explain the changes?`;
      case 'explain':
        return `This section ${text.toLowerCase().includes('legal') ? 'establishes the legal framework' : 'provides important context'} for your argument. The language follows standard legal memo format and helps build your case systematically.`;
      case 'rewrite':
        return `Here's a rewritten version:\n\n"${text.split(' ').reverse().join(' ')}" \n\nThis version maintains the legal meaning while improving clarity and flow.`;
      default:
        return `I've analyzed the selected text and can help you ${action.toLowerCase()} it. What specific aspect would you like me to focus on?`;
    }
  };

  // Handle documents added to conversation
  const handleDocumentsAdded = (count: number) => {
    
    console.log(`${count} documents added to conversation context`);
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Document Canvas */}
      <div className="flex-1 relative overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        
        <div
          ref={canvasRef}
          className="max-w-4xl mx-auto pb-32"
        >
          {/* AI Action Buttons for Selected Text */}
          {selectedText && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  Selected: "{selectedText.substring(0, 50)}..."
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleAIAction('Improve')}
                    className="h-7 px-3 bg-primary-600 hover:bg-primary-700 text-black"
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Improve
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAIAction('Explain')}
                    className="h-7 px-3 bg-primary hover:bg-green-700 text-white"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Explain
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAIAction('Rewrite')}
                    className="h-7 px-3 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Rewrite
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Quill Rich Text Editor */}
          <div className="bg-white">
            
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={canvasContent}
              onChange={setCanvasContent}
              modules={modules}
              formats={formats}
              style={{
                height: '750px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Persistent Chat Input Component */}
      <ChatInput onDocumentsAdded={handleDocumentsAdded} />

      {/* Custom Styles for Quill Editor */}
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
        
        .ql-toolbar .ql-formats {
          margin-right: 15px !important;
        }
        
        .ql-toolbar .ql-formats:not(:last-child) {
          border-right: 1px solid #e5e7eb !important;
          padding-right: 15px !important;
        }
        
        .ql-toolbar button {
          border: none !important;
          border-radius: 4px !important;
          padding: 4px 6px !important;
          margin: 1px 2px !important;
          background: transparent !important;
          color: #374151 !important;
        }
        
        .ql-toolbar button:hover {
          background: #e5e7eb !important;
          color: #111827 !important;
        }
        
        .ql-toolbar button.ql-active {
          background: #dbeafe !important;
          color: #1d4ed8 !important;
        }
        
        .ql-toolbar .ql-picker {
          color: #374151 !important;
        }
        
        .ql-toolbar .ql-picker-label {
          border: none !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
        }
        
        .ql-toolbar .ql-picker-label:hover {
          background: #e5e7eb !important;
        }
        
        .ql-toolbar .ql-picker.ql-expanded .ql-picker-label {
          background: #e5e7eb !important;
        }
        
        .ql-container {
          border: none !important;
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important;
        }
      `}</style>
    </div>
  );
};

export default LegalCanvas;