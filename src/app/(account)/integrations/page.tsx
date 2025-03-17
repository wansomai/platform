// app/dashboard/integrations/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Plus,
  Calendar,
  FileText,
  Settings,
  Server,
  Database,
  Webhook,
  Link,
  ExternalLink,
  Folder,
  Lock,
  RefreshCw,
  Trash2,
  Cog,
  Filter,
  Code,
  Cloud,
  Check,
  AlertTriangle,
  HelpCircle,
  Mail,
  BookOpen,
  Globe
} from "lucide-react";

// Integration category type
type IntegrationCategory = "all" | "storage" | "calendar" | "communication" | "legal" | "auth";

// Integration status type
type IntegrationStatus = "connected" | "disconnected" | "pending";

// Integration interface
interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  status: IntegrationStatus;
  isActive: boolean;
  lastSync?: string;
  apiKey?: string;
  connectionDetails?: {
    username?: string;
    url?: string;
    scopes?: string[];
    apiKey?: string;
  }
}

// Mock integrations data
const mockIntegrations: Integration[] = [
  {
    id: "int1",
    name: "Dropbox",
    description: "Connect your Dropbox account to access and store documents",
    category: "storage",
    icon: Folder,
    status: "connected",
    isActive: true,
    lastSync: "2025-03-15T14:30:00",
    connectionDetails: {
      username: "legal@example.com",
      scopes: ["files.read", "files.write"]
    }
  },
  {
    id: "int2",
    name: "Google Drive",
    description: "Store and access documents from your Google Drive",
    category: "storage",
    icon: Cloud,
    status: "connected",
    isActive: true,
    lastSync: "2025-03-15T10:15:00",
    connectionDetails: {
      username: "legal@example.com",
      scopes: ["drive.read", "drive.file"]
    }
  },
  {
    id: "int3",
    name: "Microsoft 365",
    description: "Access Word documents, Excel sheets, and Outlook",
    category: "storage",
    icon: FileText,
    status: "disconnected",
    isActive: false
  },
  {
    id: "int4",
    name: "Database Storage",
    description: "Connect to SQL or NoSQL databases for document storage",
    category: "storage",
    icon: Database,
    status: "connected",
    isActive: true,
    lastSync: "2025-03-16T08:45:00",
    connectionDetails: {
      username: "dbadmin",
      url: "mongodb://legal-docs.example.com:27017"
    }
  },
  {
    id: "int5",
    name: "Google Calendar",
    description: "Sync legal deadlines and appointments",
    category: "calendar",
    icon: Calendar,
    status: "connected",
    isActive: true,
    lastSync: "2025-03-14T16:45:00",
    connectionDetails: {
      username: "legal@example.com",
      scopes: ["calendar.read", "calendar.events"]
    }
  },
  {
    id: "int6",
    name: "Slack",
    description: "Get notifications and share documents via Slack",
    category: "communication",
    icon: MessageSquare,
    status: "connected",
    isActive: true,
    lastSync: "2025-03-15T09:30:00",
    connectionDetails: {
      username: "Legal Department",
      url: "https://legalteam.slack.com"
    }
  },
  {
    id: "int7",
    name: "Email Integration",
    description: "Send and receive case updates and documents via email",
    category: "communication",
    icon: Mail,
    status: "connected",
    isActive: true,
    lastSync: "2025-03-17T09:15:00",
    connectionDetails: {
      username: "legal@example.com",
      scopes: ["mail.read", "mail.send"]
    }
  },
  {
    id: "int8",
    name: "Westlaw",
    description: "Legal research database integration",
    category: "legal",
    icon: Database,
    status: "pending",
    isActive: false,
    connectionDetails: {
      username: "legaluser123"
    }
  },
  {
    id: "int9",
    name: "DocuSign",
    description: "Send and receive legally binding signatures",
    category: "legal",
    icon: FileText,
    status: "connected",
    isActive: true,
    lastSync: "2025-03-12T11:20:00",
    apiKey: "****-****-****-7890"
  },
  {
    id: "int10",
    name: "Kenya Law",
    description: "Access Kenyan legal resources and case law database",
    category: "legal",
    icon: BookOpen,
    status: "connected",
    isActive: true,
    lastSync: "2025-03-16T14:20:00",
    connectionDetails: {
      username: "kenyalaw_user",
      scopes: ["cases.read", "statutes.read"]
    }
  },
  {
    id: "int11",
    name: "Web Access Portal",
    description: "Public web portal for client access to case information",
    category: "legal",
    icon: Globe,
    status: "connected",
    isActive: true,
    lastSync: "2025-03-17T11:30:00",
    connectionDetails: {
      url: "https://client-portal.example.com",
      apiKey: "****-****-****-3456"
    }
  },
  {
    id: "int12",
    name: "Auth0",
    description: "User authentication and access control",
    category: "auth",
    icon: Lock,
    status: "connected",
    isActive: true,
    lastSync: "2025-03-15T08:00:00",
    connectionDetails: {
      username: "admin@legalai.com"
    }
  }
];

// Available integrations to add
const availableIntegrations = [
  {
    id: "new1",
    name: "Zapier",
    description: "Connect your legal workflows to thousands of apps",
    category: "communication",
    icon: Webhook
  },
  {
    id: "new2",
    name: "OneDrive",
    description: "Microsoft cloud storage for document management",
    category: "storage",
    icon: Cloud
  },
  {
    id: "new3",
    name: "LexisNexis",
    description: "Legal and regulatory research database",
    category: "legal",
    icon: Database
  },
  {
    id: "new4",
    name: "iManage",
    description: "Document and email management for legal teams",
    category: "storage",
    icon: Folder
  },
  {
    id: "new5",
    name: "Okta",
    description: "Identity and access management platform",
    category: "auth",
    icon: Lock
  },
  {
    id: "new6",
    name: "Microsoft Teams",
    description: "Collaboration and communication platform",
    category: "communication",
    icon: MessageSquare
  }
];

// Integration categories
const categories = [
  { id: "all", label: "All Integrations", icon: Settings },
  { id: "storage", label: "Document Storage", icon: Folder },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "communication", label: "Communication", icon: MessageSquare },
  { id: "legal", label: "Legal Services", icon: FileText },
  { id: "auth", label: "Authentication", icon: Lock }
];

function MessageSquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [currentIntegration, setCurrentIntegration] = useState<Integration | null>(null);
  
  // Filter integrations based on category and search term
  const filteredIntegrations = integrations.filter((integration) => {
    const matchesCategory = activeCategory === "all" || integration.category === activeCategory;
    const matchesSearch = 
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  // Toggle integration active status
  const toggleIntegration = (id: string) => {
    setIntegrations((prevIntegrations) =>
      prevIntegrations.map((integration) =>
        integration.id === id ? { ...integration, isActive: !integration.isActive } : integration
      )
    );
  };
  
  // Handle adding a new integration
  const handleAddIntegration = (integrationId: string) => {
    const integrationToAdd = availableIntegrations.find(i => i.id === integrationId);
    if (!integrationToAdd) return;
    
    const newIntegration: Integration = {
      ...integrationToAdd,
      id: `int-${Date.now()}`,
      status: "pending",
      isActive: false
    };
    
    setIntegrations([...integrations, newIntegration]);
    setShowAddDialog(false);
    
    // In a real app, you would initiate the OAuth flow or API key entry here
  };
  
  // Open configuration dialog for an integration
  const openConfigDialog = (integration: Integration) => {
    setCurrentIntegration(integration);
    setShowConfigDialog(true);
  };
  
  // Get status badge
  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>;
      case "disconnected":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Disconnected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-gray-500">Connect your legal workspace with other services</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Integration</DialogTitle>
                <DialogDescription>
                  Connect your workspace with other services to extend functionality.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search available integrations..."
                    className="pl-10"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableIntegrations.map((integration) => (
                    <Card key={integration.id} className="hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="rounded-full p-2 bg-gray-100">
                            <integration.icon className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <h3 className="font-medium">{integration.name}</h3>
                            <p className="text-sm text-gray-500">{integration.description}</p>
                            <Button 
                              size="sm" 
                              className="mt-2"
                              onClick={() => handleAddIntegration(integration.id)}
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              Connect
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select 
          value={activeCategory} 
          onValueChange={(value) => setActiveCategory(value as IntegrationCategory)}
        >
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <category.icon className="mr-2 h-4 w-4" />
                  <span>{category.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Integrations Categories */}
      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as IntegrationCategory)}>
        <TabsList className="mb-4">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center">
              <category.icon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
              <span className="sm:hidden">{category.id === "all" ? "All" : category.label.split(" ")[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      {/* Integrations Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-64 border rounded-lg bg-gray-50">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <Link className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No integrations found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm ? `No integrations match "${searchTerm}"` : "Add integrations to extend functionality"}
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </div>
        ) : (
          filteredIntegrations.map((integration) => (
            <Card key={integration.id} className="overflow-hidden hover:shadow-md transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-gray-100">
                      <integration.icon className="h-6 w-6 text-gray-600" />
                    </div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                  {getStatusBadge(integration.status)}
                </div>
                <CardDescription>{integration.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-4">
                {integration.status === "connected" && (
                  <div className="space-y-4">
                    {integration.lastSync && (
                      <div className="flex items-center text-xs text-gray-500">
                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                        Last synced: {new Date(integration.lastSync).toLocaleString()}
                      </div>
                    )}
                    {integration.connectionDetails?.username && (
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="h-3.5 w-3.5 mr-2" />
                        Connected as: {integration.connectionDetails.username}
                      </div>
                    )}
                    {integration.apiKey && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Key className="h-3.5 w-3.5 mr-2" />
                        API Key: {integration.apiKey}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={integration.isActive}
                          onCheckedChange={() => toggleIntegration(integration.id)}
                        />
                        <Label className="text-sm">{integration.isActive ? "Active" : "Inactive"}</Label>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openConfigDialog(integration)}
                      >
                        <Cog className="mr-2 h-3.5 w-3.5" />
                        Configure
                      </Button>
                    </div>
                  </div>
                )}
                
                {integration.status === "disconnected" && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                    <p className="text-sm text-gray-600 mb-4">This integration is disconnected</p>
                    <Button size="sm">
                      <Link className="mr-2 h-3.5 w-3.5" />
                      Reconnect
                    </Button>
                  </div>
                )}
                
                {integration.status === "pending" && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    <p className="text-sm text-gray-600 mb-2">Connection in progress</p>
                    <p className="text-xs text-gray-500">This may take a few moments</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t p-4 flex justify-end">
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Remove
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Integration Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        {currentIntegration && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-gray-100">
                  <currentIntegration.icon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <DialogTitle>{currentIntegration.name} Settings</DialogTitle>
                  <DialogDescription>Configure connection preferences</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    currentIntegration.status === "connected" ? "bg-green-500" : 
                    currentIntegration.status === "pending" ? "bg-yellow-500" : "bg-gray-400"
                  }`}></div>
                  <span className="font-medium">
                    {currentIntegration.status === "connected" ? "Connected" : 
                     currentIntegration.status === "pending" ? "Connection Pending" : "Disconnected"}
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  {currentIntegration.status === "connected" ? "Reconnect" : "Connect"}
                </Button>
              </div>
              
              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Integration Status</h3>
                  <p className="text-sm text-gray-500">Enable or disable this integration</p>
                </div>
                <Switch
                  checked={currentIntegration.isActive}
                  onCheckedChange={() => toggleIntegration(currentIntegration.id)}
                />
              </div>
              
              {/* Permissions section */}
              <div>
                <h3 className="font-medium mb-2">Permissions & Scopes</h3>
                <div className="space-y-2">
                  {currentIntegration.connectionDetails?.scopes ? (
                    currentIntegration.connectionDetails.scopes.map((scope, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">{scope}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No permissions configured</p>
                  )}
                </div>
              </div>
              
              {/* API Key section (if applicable) */}
              {currentIntegration.apiKey && (
                <div>
                  <h3 className="font-medium mb-2">API Key</h3>
                  <div className="flex gap-2">
                    <Input value={currentIntegration.apiKey} className="font-mono" readOnly />
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Rotate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    API keys are encrypted and stored securely
                  </p>
                </div>
              )}
              
              {/* Connection details section */}
              {currentIntegration.connectionDetails?.url && (
                <div>
                  <h3 className="font-medium mb-2">Connection URL</h3>
                  <Input value={currentIntegration.connectionDetails.url} readOnly />
                </div>
              )}
              
              {/* Custom settings section */}
              <div>
                <h3 className="font-medium mb-2">Sync Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Auto-sync</h4>
                      <p className="text-xs text-gray-500">
                        Automatically sync data with this integration
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Sync frequency</h4>
                      <p className="text-xs text-gray-500">
                        How often to sync data with this integration
                      </p>
                    </div>
                    <Select defaultValue="60">
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="360">6 hours</SelectItem>
                        <SelectItem value="720">12 hours</SelectItem>
                        <SelectItem value="1440">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Danger zone */}
              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-600 mb-4">
                  These actions cannot be undone. Please be certain.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete Integration
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowConfigDialog(false)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

// Additional icon components to avoid errors
function User(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

function Key(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
    </svg>
  );
}