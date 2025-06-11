'use client'
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  Download, 
  Bot, 
  User, 
  Search,
  Send,
  Edit3,
  Lightbulb,
  RefreshCw,
  Plus,
  Eye,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentSelectionModal } from '@/components/modals/DocumentSelectionModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

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

const LegalCanvasWorkspace: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showDocumentModal, setShowDocumentModal] = useState<boolean>(false);
  
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

  // Send chat message
  const sendChatMessage = (): void => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: chatMessages.length + 2,
        type: 'ai',
        content: `I understand your request about "${chatInput}". Let me help you with that section of the document. Would you like me to suggest specific language or provide legal research on this topic?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  // Handle key press in chat input
  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  };

  // Insert template content into Quill editor
  const insertTemplate = (template: Template): void => {
    const templateContent = `<h3>From ${template.name}:</h3><p>[Template content would be inserted here based on the selected template]</p><br/>`;
    
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const currentLength = quill.getLength();
      quill.insertText(currentLength, '\n\n');
      quill.clipboard.dangerouslyPasteHTML(currentLength + 2, templateContent);
      quill.setSelection(currentLength + templateContent.length + 2);
    }
  };

  // Handle documents added from modal
  const handleDocumentsAdded = (count: number): void => {
    // This would typically refresh the templates list
    console.log(`${count} document(s) added to templates`);
  };

  // Format file size (from your existing codebase pattern)
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Document Canvas */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Document Canvas */}
        <div className="flex-1 relative overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          
          <div
            ref={canvasRef}
            className="max-w-4xl mx-auto"
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
                      className="h-7 px-3 bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Improve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAIAction('Explain')}
                      className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white"
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
              {/* Custom File Menu Bar */}
              <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
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
              </div>
              
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
      </div>

      {/* Right Sidebar - using shadcn Tabs */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <Tabs defaultValue="assistant" className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="assistant" className="flex-1 flex flex-col m-0">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map(message => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-xs">
                            {message.type === 'ai' ? 'AI' : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs opacity-75">{message.timestamp}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">AI is working on your request...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Ask AI to help with your document..."
                  className="flex-1"
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || isProcessing}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs h-7">
                  Review Document
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7">
                  Check Citations
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7">
                  Improve Clarity
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7">
                  Add Legal Analysis
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 flex flex-col m-0">
            <div className="p-4">
              {/* Search Templates */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDocumentModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
            
            {/* Template List */}
            <ScrollArea className="flex-1 px-4 pb-4">
              <div className="space-y-3">
                {templates.map(template => (
                  <div key={template.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-primary-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{template.name}</p>
                          <p className="text-xs text-gray-500">{template.size} • Used {template.lastUsed}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => insertTemplate(template)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{template.description}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Selection Modal */}
      <DocumentSelectionModal
        open={showDocumentModal}
        onOpenChange={setShowDocumentModal}
        conversationId="canvas-templates" // Using a placeholder ID for canvas templates
        onDocumentsAdded={handleDocumentsAdded}
      />

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

export default LegalCanvasWorkspace;