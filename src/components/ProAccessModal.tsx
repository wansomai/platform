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
  Globe,
  Crown
} from "lucide-react";
import ProAccessModal from "@/components/modals/ProAccess";

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

function MessageSquare(props: React.SVGProps<SVGSVGElement>) {
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

type ProAccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRequestAccess: () => void;
  isLoading: boolean;
};

export default function ProAccessModal({ isOpen, onClose, onRequestAccess, isLoading }: ProAccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            Unlock premium features by upgrading to our Pro plan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Pro Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Unlimited integrations</li>
              <li>• Priority support</li>
              <li>• Advanced analytics</li>
            </ul>
          </div>
          <Button 
            onClick={onRequestAccess} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Requesting...' : 'Request Pro Access'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [currentIntegration, setCurrentIntegration] = useState<Integration | null>(null);

  // Pro access modal states
  const [showProModal, setShowProModal] = useState(false);
  const [isRequestingPro, setIsRequestingPro] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Filter integrations based on category and search term
  const filteredIntegrations = integrations.filter((integration) => {
    const matchesCategory = activeCategory === 'all' || integration.category === activeCategory;
    const matchesSearch = 
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Toggle integration active status - now checks for Pro access
  const toggleIntegration = (id: string) => {
    const handleToggle = () => {
      setIntegrations((prevIntegrations) =>
        prevIntegrations.map((integration) =>
          integration.id === id ? { ...integration, isActive: !integration.isActive } : integration
        )
      );
    };
    
    // Simulate checking for Pro access
    const userHasProAccess = false; // This would come from your auth context or API
    
    if (userHasProAccess) {
      handleToggle();
    } else {
      // Store the pending action and show pro modal
      setPendingAction(() => handleToggle);
      setShowProModal(true);
    }
  };

  // Handle adding a new integration - now checks for Pro access
  const handleAddIntegration = (integrationId: string) => {
    const performAdd = () => {
      const integrationToAdd = availableIntegrations.find(i => i.id === integrationId);
      if (!integrationToAdd) return;
      
      const newIntegration: Integration = {
        ...integrationToAdd,
        id: `int-${Date.now()}`,
        status: 'pending',
        isActive: false
      };
      
      setIntegrations([...integrations, newIntegration]);
      setShowAddDialog(false);
    };
    
    // Simulate checking for Pro access
    const userHasProAccess = false; // This would come from your auth context or API
    
    if (userHasProAccess) {
      performAdd();
    } else {
      // Store the pending action and show pro modal
      setPendingAction(() => performAdd);
      setShowProModal(true);
      setShowAddDialog(false); // Close the add dialog
    }
  };

  // Handle Pro access request
  const handleRequestProAccess = () => {
    setIsRequestingPro(true);
    
    // Simulate API call to request pro access
    setTimeout(() => {
      setIsRequestingPro(false);
      setShowProModal(false);
      
      // Show a success message or redirect to subscription page
      alert('Pro access request has been submitted. Our team will contact you shortly.');
      
      // Clear the pending action
      setPendingAction(null);
    }, 2000);
  };

  // Open configuration dialog for an integration - now checks for Pro access
  const openConfigDialog = (integration: Integration) => {
    const openConfig = () => {
      setCurrentIntegration(integration);
      setShowConfigDialog(true);
    };
    
    // Simulate checking for Pro access
    const userHasProAccess = false; // This would come from your auth context or API
    
    if (userHasProAccess) {
      openConfig();
    } else {
      // Store the pending action and show pro modal
      setPendingAction(() => openConfig);
      setShowProModal(true);
    }
  };

  // Get status badge
  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>;
      case 'disconnected':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Disconnected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Handle add integration button click - now checks for Pro access
  const handleAddIntegrationClick = () => {
    // Simulate checking for Pro access
    const userHasProAccess = false; // This would come from your auth context or API
    
    if (userHasProAccess) {
      setShowAddDialog(true);
    } else {
      setShowProModal(true);
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
              <Button onClick={handleAddIntegrationClick}>
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
                      <CardFooter className="border-t p-4 flex justify-end">
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </CardFooter>
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
      
      {/* "Pro Feature" Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-full">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium">Pro Feature</h3>
            <p className="text-sm text-gray-600">Integrations are available as part of our Pro plan</p>
          </div>
        </div>
        <Button 
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          onClick={() => setShowProModal(true)}
        >
          <Crown className="mr-2 h-4 w-4" />
          Upgrade to Pro
        </Button>
      </div>
      
      {/* Integrations Categories */}
      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as IntegrationCategory)}>
        <TabsList className="mb-4">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center">
              <category.icon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
              <span className="sm:hidden">{category.id === 'all' ? 'All' : category.label.split(' ')[0]}</span>
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
              {searchTerm ? `No integrations match "${searchTerm}"` : 'Add integrations to extend functionality'}
            </p>
            <Button onClick={handleAddIntegrationClick}>
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
                {integration.status === 'connected' && (
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
                        <Label className="text-sm">{integration.isActive ? 'Active' : 'Inactive'}</Label>
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
                
                {integration.status === 'disconnected' && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                    <p className="text-sm text-gray-600 mb-4">This integration is disconnected</p>
                    <Button size="sm" onClick={() => toggleIntegration(integration.id)}>
                      <Link className="mr-2 h-3.5 w-3.5" />
                      Reconnect
                      </Button>
                  </div>
                )}
                
                {integration.status === 'pending' && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    <p className="text-sm text-gray-600 mb-2">Connection in progress</p>
                    <p className="text-xs text-gray-500">This may take a few moments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        }
      </div>
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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