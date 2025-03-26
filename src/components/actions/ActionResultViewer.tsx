// src/components/actions/ActionResultViewer.tsx
"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, ExternalLink, BookOpen, Search, Clipboard } from "lucide-react"

interface ActionResultProps {
  actionType: string;
  result: any;
}

export function ActionResultViewer({ actionType, result }: ActionResultProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Handle document result
  if (actionType === 'generate-document') {
    return (
      <Card className="bg-secondary-50 mt-4 mb-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <FileText className="h-4 w-4 mr-2 text-primary-600" />
            Generated Document: {result.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{result.format.toUpperCase()}</Badge>
              <Badge variant="outline">{new Date(result.createdAt).toLocaleString()}</Badge>
            </div>
            
            {!expanded ? (
              <div className="text-sm bg-white border rounded p-2 max-h-32 overflow-hidden relative">
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                <div className="prose prose-sm">
                  {result.content.substring(0, 300)}...
                </div>
              </div>
            ) : (
              <div className="text-sm bg-white border rounded p-2 max-h-96 overflow-auto">
                <div className="prose prose-sm whitespace-pre-wrap">
                  {result.content}
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
                    navigator.clipboard.writeText(result.content);
                  }}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    // In a real app, this would download the document
                    if (result.resultUrl) {
                      window.open(result.resultUrl, '_blank');
                    } else {
                      // Fallback: create a download from the content
                      const blob = new Blob([result.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${result.title}.${result.format || 'txt'}`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
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
  
  // Handle research question result
  if (actionType === 'research-question') {
    return (
      <Card className="bg-secondary-50 mt-4 mb-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Search className="h-4 w-4 mr-2 text-primary-600" />
            Research Results: {result.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Research</Badge>
              <Badge variant="outline">{new Date(result.createdAt).toLocaleString()}</Badge>
            </div>
            
            <div className="text-sm bg-white border rounded p-2 max-h-96 overflow-auto">
              <div className="prose prose-sm">
                <div className="font-medium mb-2">Question:</div>
                <p>{result.question}</p>
                
                {!expanded ? (
                  <>
                    <div className="font-medium mt-4 mb-2">Summary:</div>
                    <p>{result.summary}</p>
                    <div className="text-center mt-2">
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => setExpanded(true)}
                      >
                        View Full Research
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium mt-4 mb-2">Full Research:</div>
                    <div className="whitespace-pre-wrap">
                      {result.content}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              {expanded && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setExpanded(false)}
                >
                  Show Less
                </Button>
              )}
              
              <div className="space-x-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(result.content);
                  }}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    // Export as PDF or text
                    const blob = new Blob([result.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${result.title}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Handle document summarization result
  if (actionType === 'summarize-document') {
    return (
      <Card className="bg-secondary-50 mt-4 mb-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <BookOpen className="h-4 w-4 mr-2 text-primary-600" />
            Document Summary: {result.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Summary</Badge>
              <Badge variant="outline">{result.documentCount} document(s)</Badge>
              <Badge variant="outline">{new Date(result.createdAt).toLocaleString()}</Badge>
            </div>
            
            {!expanded ? (
              <div className="text-sm bg-white border rounded p-2 max-h-40 overflow-hidden relative">
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                <div className="prose prose-sm">
                  {result.content.substring(0, 400)}...
                </div>
              </div>
            ) : (
              <div className="text-sm bg-white border rounded p-2 max-h-96 overflow-auto">
                <div className="prose prose-sm whitespace-pre-wrap">
                  {result.content}
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
                    navigator.clipboard.writeText(result.content);
                  }}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    // Export as PDF or text
                    const blob = new Blob([result.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${result.title}.${result.format || 'txt'}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Default fallback for unknown action types
  return (
    <Card className="bg-secondary-50 mt-4 mb-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          Action Result: {result.title || 'Unknown Action'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          {result.content || 'No content available'}
        </div>
      </CardContent>
    </Card>
  );
}