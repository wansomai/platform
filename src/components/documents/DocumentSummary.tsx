// components/document/DocumentSummary.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, RefreshCw, ZoomIn } from "lucide-react";
import { DocumentInsights } from "./DocumentInsights";

interface DocumentSummaryProps {
  documentId: string;
  title: string;
}

export function DocumentSummary({ documentId, title }: DocumentSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  
  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/documents/${documentId}/summarize`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      
      const data = await response.json();
      
      if (data.data && data.data.summary) {
        setSummary(data.data.summary);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setError('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center">
              <Brain className="h-4 w-4 mr-2 text-primary-600" />
              AI Summary
            </h3>
            
            <div className="flex gap-2">
              {summary && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInsights(true)}
                >
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Full Analysis
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={generateSummary}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : summary ? (
                  "Regenerate"
                ) : (
                  "Generate Summary"
                )}
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[120px] mt-2">
            {summary ? (
              <p className="text-sm">{summary}</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="h-5 w-5 animate-spin text-primary-600" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Generate an AI-powered summary of "{title}"
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      <DocumentInsights
        documentId={documentId}
        open={showInsights}
        onClose={() => setShowInsights(false)}
      />
    </>
  );
}