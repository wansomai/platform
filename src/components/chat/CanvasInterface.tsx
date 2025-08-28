// src/components/chat/CanvasInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Save, 
  Download,
  FileText,
  RefreshCw,
  X,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui.store';
import { useCanvasStore, useCanvasDocument, useCanvasSaving } from '@/store/canvas.store';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as mammoth from 'mammoth';

const LegalCanvas: React.FC = () => {
  const params = useParams();
  const projectId = params.id as string;

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<ReactQuill>(null);

  // Use store hooks for canvas data management
  const { addToast } = useUIStore();
  const { canvasDocument, isLoading, error, fetchCanvasDocument, refreshCanvasDocument } = useCanvasDocument();
  const { isSaving, saveCanvasDocument, deleteCanvasDocument } = useCanvasSaving();
  
  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      addToast({ message: error, type: 'error' });
    }
  }, [error, addToast]);

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



  // Handle manual save
  const handleSave = async () => {
    if (!quillRef.current) return;
    
    try {
      const editor = quillRef.current.getEditor();
      const content = editor.getContents();
      const htmlContent = editor.root.innerHTML;
      const plainText = editor.getText();

      const result = await saveCanvasDocument(projectId, content, htmlContent, plainText);
      
      if (result) {
        addToast({ message: 'Document saved successfully', type: 'success' });
      } else {
        addToast({ message: 'Failed to save document', type: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      addToast({ message: 'Failed to save document', type: 'error' });
    }
  };

  // Handle content changes (no auto-save)
  const handleContentChange = (content: string) => {
    // Content changed - could add debounced indicators here if needed
  };

  // Handle document export
  const handleExport = () => {
    try {
      const content = canvasDocument?.htmlContent || '';
      const element = document.createElement('a');
      const file = new Blob([content], { type: 'text/html' });
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

  // Fetch canvas document on mount
  useEffect(() => {
    if (projectId) {
      fetchCanvasDocument(projectId);
    }
  }, [projectId, fetchCanvasDocument]);

  // Load canvas document content when data is available
  useEffect(() => {
    if (canvasDocument?.content && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const currentContent = editor.getContents();
      
      // Check if content actually changed (not just initial load)
      const hasContentChanged = JSON.stringify(currentContent) !== JSON.stringify(canvasDocument.content);
      
      editor.setContents(canvasDocument.content);
      
      // Show update notification if content changed (likely from AI update)
      if (hasContentChanged && currentContent.ops && currentContent.ops.length > 1) {
        setShowUpdateNotification(true);
        setTimeout(() => setShowUpdateNotification(false), 3000); // Hide after 3 seconds
      }
    }
  }, [canvasDocument]);

  // Listen for canvas updates from chat (when AI updates the document)
  useEffect(() => {
    const handleCanvasUpdate = (event: any) => {
      if (projectId && event.detail?.projectId === projectId) {
        refreshCanvasDocument(projectId); // Refresh canvas data when chat updates it
      }
    };

    const handleFocusUpdate = () => {
      if (projectId) {
        refreshCanvasDocument(projectId);
      }
    };

    // Listen for custom canvas update events from chat
    window.addEventListener('canvasUpdate', handleCanvasUpdate);
    // Also refresh on focus as backup
    window.addEventListener('focus', handleFocusUpdate);
    
    return () => {
      window.removeEventListener('canvasUpdate', handleCanvasUpdate);
      window.removeEventListener('focus', handleFocusUpdate);
    };
  }, [projectId, refreshCanvasDocument]);

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
        
        // Save to API using store
        const editor = quillRef.current?.getEditor();
        if (editor) {
          editor.root.innerHTML = cleanHtml;
          const delta = editor.getContents();
          const plainText = editor.getText();
          
          const result = await saveCanvasDocument(projectId, delta, cleanHtml, plainText);
          if (!result) {
            throw new Error('Failed to save template to canvas');
          }
        }
        
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
      addToast({ 
        message: 'Failed to process template document', 
        type: 'error' 
      });
    } finally {
      setIsLoadingTemplate(false);
    }
  };
  const handleTextSelection = (range: any) => {
    // Handle text selection changes if needed
    // This can be used to update UI or perform actions based on selection
    console.log('Text selection changed:', range);
  }



  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3 flex items-center justify-between bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600"></span>
          {showUpdateNotification && (
            <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs animate-pulse">
              <CheckCircle className="h-3 w-3" />
              <span>Document updated</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const success = await deleteCanvasDocument(projectId);
              if (success) {
                if (quillRef.current) {
                  quillRef.current.getEditor()?.setContents([]);
                }
                addToast({ message: 'Document cleared successfully', type: 'success' });
              } else {
                addToast({ message: 'Failed to clear document', type: 'error' });
              }
            }}
            className="flex items-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </Button>
          
           <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Import Template</span>
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 relative" ref={canvasRef}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={canvasDocument?.htmlContent || ''}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          style={{ height: '100%' }}
          className="h-full"
        />

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
          height: calc(100vh - 200px) !important;
          overflow-y: auto !important;
         
        }

        .ql-container::-webkit-scrollbar {
          display: none;
        }

        .ql-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
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