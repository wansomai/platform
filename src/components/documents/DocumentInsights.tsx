// components/document/DocumentInsights.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Brain,
  ListChecks,
  UserRound,
  Building,
  Calendar,
  MapPin,
  X,
  RefreshCw
} from "lucide-react";

interface DocumentInsightsProps {
  documentId: string;
  open: boolean;
  onClose: () => void;
}

export function DocumentInsights({ documentId, open, onClose }: DocumentInsightsProps) {
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<{
    summary: string;
    keyPoints: string[];
    entities: {
      people?: string[];
      organizations?: string[];
      dates?: string[];
      locations?: string[];
      [key: string]: string[] | undefined;
    };
  } | null>(null);
  
  // Load insights on open
  useEffect(() => {
    if (open && documentId) {
      fetchInsights();
    }
  }, [open, documentId]);
  
  // Fetch document insights
  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get existing analysis
      const response = await fetch(`/api/documents/${documentId}/analyze`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }
      
      const data = await response.json();
      
      if (data.data) {
        setInsights({
          summary: data.data.summary || 'No summary available',
          keyPoints: data.data.keyPoints || [],
          entities: data.data.entities || {}
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      setError('Failed to analyze document. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-primary-600" />
              <span>Document Insights</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mb-4" />
            <p className="text-muted-foreground">Analyzing document...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p className="mb-4">{error}</p>
            <Button onClick={fetchInsights}>Try Again</Button>
          </div>
        ) : insights ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="keyPoints">Key Points</TabsTrigger>
              <TabsTrigger value="entities">Entities</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="py-4">
              <Card className="p-4">
                <p className="whitespace-pre-wrap">{insights.summary}</p>
              </Card>
            </TabsContent>
            
            <TabsContent value="keyPoints" className="py-4">
              <Card className="p-4">
                <div className="flex items-center mb-4">
                  <ListChecks className="h-5 w-5 mr-2 text-primary-600" />
                  <h3 className="font-medium">Key Points</h3>
                </div>
                
                <ul className="space-y-2">
                  {insights.keyPoints.map((point, index) => (
                    <li key={index} className="flex">
                      <span className="mr-2">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                
                {insights.keyPoints.length === 0 && (
                  <p className="text-muted-foreground">No key points identified</p>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="entities" className="py-4">
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {insights.entities.people && insights.entities.people.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <UserRound className="h-4 w-4 mr-2 text-blue-500" />
                        <h3 className="font-medium">People</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {insights.entities.people.map((person, index) => (
                          <Badge key={index} variant="outline">{person}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {insights.entities.organizations && insights.entities.organizations.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Building className="h-4 w-4 mr-2 text-green-500" />
                        <h3 className="font-medium">Organizations</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {insights.entities.organizations.map((org, index) => (
                          <Badge key={index} variant="outline">{org}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {insights.entities.dates && insights.entities.dates.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                        <h3 className="font-medium">Dates</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {insights.entities.dates.map((date, index) => (
                          <Badge key={index} variant="outline">{date}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {insights.entities.locations && insights.entities.locations.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-2 text-red-500" />
                        <h3 className="font-medium">Locations</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {insights.entities.locations.map((location, index) => (
                          <Badge key={index} variant="outline">{location}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Handle any other entity types dynamically */}
                  {Object.entries(insights.entities)
                    .filter(([key]) => !['people', 'organizations', 'dates', 'locations'].includes(key))
                    .map(([key, values]) => values && values.length > 0 && (
                      <div key={key}>
                        <h3 className="font-medium mb-2 capitalize">{key}</h3>
                        <div className="flex flex-wrap gap-2">
                          {values.map((value, index) => (
                            <Badge key={index} variant="outline">{value}</Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  }
                  
                  {Object.keys(insights.entities).length === 0 && (
                    <p className="text-muted-foreground col-span-2">No entities identified</p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No insights available</p>
            <Button onClick={fetchInsights}>Analyze Document</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}