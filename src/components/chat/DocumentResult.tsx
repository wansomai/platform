// src/components/chat/MessageResultDisplay.tsx
"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Clipboard } from "lucide-react"

interface MessageResultProps {
  content: string;
  title?: string;
}

export function DocumentResult({ content, title = "Generated Document" }: MessageResultProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Function to download content as a document
  const downloadAsDocument = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className="bg-blue-50 border-blue-200 mt-4 mb-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {!expanded ? (
            <div className="text-sm bg-white border rounded p-2 max-h-40 overflow-hidden relative">
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
              <div className="prose prose-sm">
                {content.substring(0, 300)}...
              </div>
            </div>
          ) : (
            <div className="text-sm bg-white border rounded p-2 max-h-96 overflow-auto">
              <div className="prose prose-sm whitespace-pre-wrap">
                {content}
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show Less' : 'Show More'}
            </Button>
            
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(content);
                }}
              >
                <Clipboard className="h-4 w-4 mr-2" />
                Copy
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={downloadAsDocument}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}