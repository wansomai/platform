// components/document/DocumentPreview.tsx
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Download, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Clipboard, 
  Layers, 
  Image as ImageIcon,
  Table as TableIcon,
  Brain
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentSummary } from "./DocumentSummary";

// Import these if you're using PDF.js
// import { Viewer, Worker } from '@react-pdf-viewer/core';
// import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
// import '@react-pdf-viewer/core/lib/styles/index.css';
// import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface DocumentPreviewProps {
  document: {
    id: string;
    title: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
  };
  open: boolean;
  onClose: () => void;
}

export function DocumentPreview({ document, open, onClose }: DocumentPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  // PDF viewer plugin - uncomment if using PDF.js
  // const defaultLayoutPluginInstance = defaultLayoutPlugin();
  
  // Helper function to determine content type
  const getContentType = () => {
    const fileType = document.fileType.toLowerCase();
    
    if (['pdf'].includes(fileType)) {
      return 'pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileType)) {
      return 'image';
    } else if (['csv', 'xlsx', 'xls'].includes(fileType)) {
      return 'spreadsheet';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(fileType)) {
      return 'text';
    } else {
      return 'unknown';
    }
  };
  
  // Load document content for preview if needed
  useEffect(() => {
    if (!open) return;
    
    const contentType = getContentType();
    
    const loadDocumentContent = async () => {
      if (contentType === 'text' || contentType === 'spreadsheet') {
        setPreviewLoading(true);
        
        try {
          // Fetch document content
          const response = await fetch(`/api/documents/${document.id}/content`);
          
          if (!response.ok) {
            throw new Error('Failed to load document content');
          }
          
          const data = await response.json();
          setContent(data.data.content);
        } catch (error) {
          console.error('Error loading document:', error);
          setPreviewError('Failed to load document preview');
        } finally {
          setPreviewLoading(false);
        }
      }
    };
    
    loadDocumentContent();
  }, [open, document.id]);
  
  const downloadDocument = async () => {
    try {
      setDownloadLoading(true);
      
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (document.fileSize && document.fileSize > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit. Please upgrade your plan to download larger files.');
      }

      const response = await fetch(document.fileUrl);
      if (!response.ok) throw new Error('Failed to download file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.title;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setPreviewError(error instanceof Error ? error.message : 'Failed to download file');
    } finally {
      setDownloadLoading(false);
    }
  };
  
  // Zoom controls
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoomLevel(1);
  
  // Rotation control
  const rotateImage = () => setRotation(prev => (prev + 90) % 360);
  
  // Render preview based on file type
  const renderPreview = () => {
    const contentType = getContentType();
    
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }
    
    if (previewError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-red-500 mb-2">
            <Clipboard className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Preview Not Available</h3>
            <p>{previewError}</p>
          </div>
          <Button onClick={downloadDocument} className="mt-4">
            <Download className="mr-2 h-4 w-4" />
            Download Document
          </Button>
        </div>
      );
    }
    
    switch (contentType) {
      case 'pdf':
        return (
          <div className="w-full h-[600px]">
            {/* If using PDF.js, uncomment this */}
            {/*
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <Viewer 
                fileUrl={document.fileUrl} 
                plugins={[defaultLayoutPluginInstance]} 
                defaultScale={zoomLevel}
                onError={(error) => {
                  console.error('PDF viewer error:', error);
                  setPreviewError('Failed to load PDF');
                }}
              />
            </Worker>
            */}
            
            {/* Simplified fallback for now */}
            <div className="flex flex-col items-center justify-center h-full">
              <embed 
                src={document.fileUrl} 
                type="application/pdf" 
                width="100%" 
                height="600px" 
                className="border"
              />
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="relative max-h-[600px] overflow-auto">
              <img 
                src={document.fileUrl} 
                alt={document.title} 
                className="max-w-full h-auto object-contain transform transition-transform"
                style={{ 
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                onError={() => setPreviewError('Failed to load image')}
              />
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetZoom}>
                {Math.round(zoomLevel * 100)}%
              </Button>
              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={rotateImage}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 'spreadsheet':
        if (!content) {
          return (
            <div className="flex items-center justify-center h-full">
              <TableIcon className="h-12 w-12 text-gray-400 mb-4" />
              <p>Spreadsheet preview not available</p>
            </div>
          );
        }
        
        // Simple CSV display
        return (
          <div className="overflow-auto max-h-[600px] border rounded-md">
            <ScrollArea className="h-[600px]">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  {content.split('\n').map((line, rowIndex) => (
                    <tr key={rowIndex}>
                      {line.split(',').map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 text-sm">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        );
      
      case 'text':
        return (
          <div className="border rounded-md p-4 max-h-[600px] overflow-auto">
            <pre className="whitespace-pre-wrap break-words text-sm">
              {content || 'No text content available'}
            </pre>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Layers className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Preview Not Available</h3>
            <p>This file type doesn't support preview</p>
            <Button onClick={downloadDocument} className="mt-4">
              <Download className="mr-2 h-4 w-4" />
              Download Document
            </Button>
          </div>
        );
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate max-w-[80%]">{document.title}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="min-h-[400px]">
            {renderPreview()}
          </TabsContent>
          
          <TabsContent value="insights" className="min-h-[400px]">
            <DocumentSummary documentId={document.id} title={document.title} />
          </TabsContent>
          
          <TabsContent value="properties">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">File Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{document.title}</span>
                    
                    <span className="text-muted-foreground">Type:</span>
                    <span className="uppercase">{document.fileType}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={downloadDocument} disabled={downloadLoading}>
            <Download className="mr-2 h-4 w-4" />
            {downloadLoading ? 'Downloading...' : 'Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}