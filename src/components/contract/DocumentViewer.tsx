// src/components/contract/DocumentViewer.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  Upload,
  FileText,
  Loader2,
  File,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Contract {
  id: string;
  title: string;
  fileName: string;
  status: "processing" | "ready" | "error";
  riskScore?: number;
  uploadedAt: string;
  fileSize: string;
  type: string;
  fileUrl?: string;
  mimeType?: string;
}

interface DocumentViewerProps {
  contract: Contract;
  onRemoveDocument: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  contract,
  onRemoveDocument,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [viewerError, setViewerError] = useState(false);

  // Reset viewer error when contract changes
  useEffect(() => {
    setViewerError(false);
    setIsLoading(true);
  }, [contract.id]);

  // Render appropriate viewer based on file type
  const renderDocumentViewer = () => {
    if (!contract.fileUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Document URL not available</p>
            <p className="text-sm text-gray-500">File: {contract.fileName}</p>
          </div>
        </div>
      );
    }

    const mimeType = contract.mimeType?.toLowerCase() || "";
    const fileName = contract.fileName.toLowerCase();

    // For development/debugging - show the URL and file info
    console.log("Document viewer:", {
      fileUrl: contract.fileUrl,
      mimeType,
      fileName,
      contract,
    });

    // PDF Viewer - try direct embed first, fallback to link
    if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <iframe
              src={contract.fileUrl}
              className="w-full h-full border-0"
              title={`PDF Viewer: ${contract.title}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error("PDF iframe failed to load");
                setIsLoading(false);
              }}
            />
          </div>
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-600">PDF Document</span>
            </div>
          </div>
        </div>
      );
    }

    // Image Viewer
    if (
      mimeType.includes("image") ||
      fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)
    ) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative max-w-full max-h-full">
              <Image
                src={contract.fileUrl}
                alt={contract.title}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  console.error("Image failed to load");
                  setIsLoading(false);
                }}
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Image Document</p>
                <p className="text-xs text-gray-500">
                  Text extraction via OCR is available when analyzing with AI
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Word Document Viewer
    if (mimeType.includes("word") || fileName.match(/\.(doc|docx)$/)) {
      if (viewerError) {
        // Fallback when viewer fails - show download option
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Word Document</h3>
              <p className="text-gray-600 mb-4">{contract.fileName}</p>
              <p className="text-sm text-gray-500 mb-4">
                Document preview is not available. This may be due to access restrictions or file format compatibility.
              </p>
              <Button
                onClick={() => window.open(contract.fileUrl, '_blank')}
                className="inline-flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Open Document
              </Button>
            </div>
          </div>
        );
      }

      // Try Microsoft Office Online viewer first
      const msViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(contract.fileUrl)}`;
      
      return (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <iframe
              src={msViewerUrl}
              className="w-full h-full border-0"
              title={`Word Viewer: ${contract.title}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error("Word document iframe failed to load");
                setIsLoading(false);
                setViewerError(true);
              }}
            />
          </div>
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Word Document</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(contract.fileUrl, '_blank')}
              >
                <FileText className="w-4 h-4 mr-1" />
                Open Original
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Excel Document Viewer
    if (
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      fileName.match(/\.(xls|xlsx)$/)
    ) {
      if (viewerError) {
        // Fallback when viewer fails - show download option
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <FileText className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Excel Spreadsheet</h3>
              <p className="text-gray-600 mb-4">{contract.fileName}</p>
              <p className="text-sm text-gray-500 mb-4">
                Document preview is not available. This may be due to access restrictions or file format compatibility.
              </p>
              <Button
                onClick={() => window.open(contract.fileUrl, '_blank')}
                className="inline-flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Open Document
              </Button>
            </div>
          </div>
        );
      }

      // Try Microsoft Office Online viewer
      const msViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(contract.fileUrl)}`;
      
      return (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <iframe
              src={msViewerUrl}
              className="w-full h-full border-0"
              title={`Excel Viewer: ${contract.title}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error("Excel document iframe failed to load");
                setIsLoading(false);
                setViewerError(true);
              }}
            />
          </div>
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Excel Spreadsheet</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(contract.fileUrl, '_blank')}
              >
                <FileText className="w-4 h-4 mr-1" />
                Open Original
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Generic file viewer for other types
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Document File</h3>
          <p className="text-gray-600 mb-2">{contract.fileName}</p>
          <p className="text-sm text-gray-500 mb-4">
            File Type: {contract.type}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        
            <div className="flex-1">
              <p className="text-sm text-gray-600">{contract.fileName}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveDocument}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove Document
            </Button>
      </div>

      <div className="flex-1 relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm text-gray-600">Loading document...</span>
            </div>
          </div>
        )}

        {/* Document Viewer */}
        {renderDocumentViewer()}
      </div>
    </div>
  );
};

export default DocumentViewer;
