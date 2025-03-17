// app/dashboard/vault/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  UploadCloud,
  Filter,
  Clock,
  Calendar,
  MoreVertical,
  Download,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  Plus,
  RefreshCw,
  Tag
} from "lucide-react";
import { useProjectStore } from "@/store/project.store";
import { useUIStore } from "@/store/ui.store";
import { formatDistanceToNow, format } from "date-fns";

// Document Type Icons
const DocumentTypeIcon = ({ fileType }: { fileType: string }) => {
  const type = fileType.toLowerCase();
  
  if (type === "pdf") {
    return <FileText className="h-5 w-5 text-red-500" />;
  } else if (["xlsx", "xls", "csv"].includes(type)) {
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  } else if (["jpg", "jpeg", "png"].includes(type)) {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  } else if (["doc", "docx"].includes(type)) {
    return <File className="h-5 w-5 text-blue-600" />;
  } else {
    return <File className="h-5 w-5 text-gray-500" />;
  }
};

// Format File Size
const formatFileSize = (sizeInBytes: number) => {
  if (!sizeInBytes) return "Unknown";
  
  const kb = sizeInBytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

export default function VaultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  // Get the action from search params (if any)
  const action = searchParams.get("action");
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(action === "upload");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("latest");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get project state
  const { currentProject, fetchProjectById, uploadDocument, deleteDocument, isLoading } = useProjectStore();
  const { addToast } = useUIStore();
  
  // Mock project ID for now - in a real app, you would get this from the current context
  const projectId = "project-123";
  
  // Fetch project data on mount
  useEffect(() => {
    if (!currentProject) {
      fetchProjectById(projectId);
    }
  }, [currentProject, fetchProjectById, projectId]);
  
  // Get documents from the current project
  const allDocuments = currentProject?.knowledge_base?.documents || [];
  
  // Filter and sort documents
  const filteredDocuments = allDocuments.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === "latest") {
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "size") {
      return b.file_size - a.file_size;
    }
    return 0;
  });
  
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !session?.user?.id) return;
    
    const file = files[0];
    setUploading(true);
    setUploadProgress(0);
    
    try {
      await uploadDocument(projectId, file, uploadCategory, session.user.id, (progress) => {
        setUploadProgress(progress);
      });
      
      addToast({
        message: `${file.name} uploaded successfully`,
        type: "success"
      });
      setShowUploadDialog(false);
    } catch (error) {
      addToast({
        message: `Failed to upload ${file.name}`,
        type: "error"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(projectId, documentId);
      addToast({
        message: "Document deleted successfully",
        type: "success"
      });
      
      // Clear selection if the deleted document was selected
      if (selectedDocs.includes(documentId)) {
        setSelectedDocs(selectedDocs.filter(id => id !== documentId));
      }
    } catch (error) {
      addToast({
        message: "Failed to delete document",
        type: "error"
      });
    }
  };
  
  // Toggle document selection
  const toggleDocSelection = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };
  
  // Bulk actions
  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedDocs.map(id => deleteDocument(projectId, id)));
      addToast({
        message: `${selectedDocs.length} documents deleted successfully`,
        type: "success"
      });
      setSelectedDocs([]);
    } catch (error) {
      addToast({
        message: "Failed to delete some documents",
        type: "error"
      });
    }
  };
  
  // Document categories
  const categories = [
    { id: "all", label: "All Documents" },
    { id: "general", label: "General" },
    { id: "evidence", label: "Evidence" },
    { id: "pleadings", label: "Pleadings" },
    { id: "correspondence", label: "Correspondence" },
    { id: "contracts", label: "Contracts" },
    { id: "research", label: "Research" },
  ];
  
  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {sortedDocuments.map((doc) => (
        <Card key={doc.id} className={`overflow-hidden hover:shadow-md transition-shadow ${selectedDocs.includes(doc.id) ? 'ring-2 ring-primary-500' : ''}`}>
          <div className="p-4 flex items-center justify-between">
            <div className="p-2 bg-gray-100 rounded">
              <DocumentTypeIcon fileType={doc.file_type} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(doc.file_url, '_blank')}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Download</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDocument(doc.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardContent className="p-4 pt-0">
            <h3 className="font-medium truncate" title={doc.name}>{doc.name}</h3>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Badge variant="outline" className="mr-2">{doc.category}</Badge>
              <span>{formatFileSize(doc.file_size)}</span>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
            </div>
            <input 
              type="checkbox" 
              checked={selectedDocs.includes(doc.id)} 
              onChange={() => toggleDocSelection(doc.id)}
              className="h-4 w-4"
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
  
  // Render list view
  const renderListView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-left w-10">
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocs(sortedDocuments.map(d => d.id));
                      } else {
                        setSelectedDocs([]);
                      }
                    }}
                    checked={selectedDocs.length === sortedDocuments.length && sortedDocuments.length > 0}
                    className="h-4 w-4"
                  />
                </th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Size</th>
                <th className="py-3 px-4 text-left">Uploaded</th>
                <th className="py-3 px-4 text-left">By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedDocuments.map((doc) => (
                <tr key={doc.id} className={`hover:bg-gray-50 ${selectedDocs.includes(doc.id) ? 'bg-blue-50' : ''}`}>
                  <td className="py-3 px-4">
                    <input 
                      type="checkbox" 
                      checked={selectedDocs.includes(doc.id)} 
                      onChange={() => toggleDocSelection(doc.id)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <DocumentTypeIcon fileType={doc.file_type} />
                      <span className="ml-2 truncate max-w-[200px]" title={doc.name}>{doc.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{doc.category}</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{formatFileSize(doc.file_size)}</td>
                  <td className="py-3 px-4 text-gray-500">
                    {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                  </td>
                  <td className="py-3 px-4 text-gray-500">{doc.uploaded_by}</td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(doc.file_url, '_blank')}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDocument(doc.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Document Vault</h1>
          <p className="text-gray-500">Manage all your legal documents in one place</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? (
              <FileText className="h-4 w-4 mr-2" />
            ) : (
              <div className="grid grid-cols-2 gap-1 mr-2">
                <div className="h-1.5 w-1.5 bg-current rounded"></div>
                <div className="h-1.5 w-1.5 bg-current rounded"></div>
                <div className="h-1.5 w-1.5 bg-current rounded"></div>
                <div className="h-1.5 w-1.5 bg-current rounded"></div>
              </div>
            )}
            {viewMode === "grid" ? "List View" : "Grid View"}
          </Button>
          
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Add a new document to your vault. We support PDF, Word, Excel, and image files.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="pleadings">Pleadings</SelectItem>
                      <SelectItem value="correspondence">Correspondence</SelectItem>
                      <SelectItem value="contracts">Contracts</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file" className="text-right">
                    File
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    {uploading && (
                      <div className="mt-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-center mt-1">{uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
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
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <Clock className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="size">Size (Largest)</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Selected Documents Actions */}
      {selectedDocs.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="font-medium">{selectedDocs.length} documents selected</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedDocs([])}>
              Cancel
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Tag className="mr-2 h-4 w-4" />
              Categorize
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}
      
      {/* Document Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="mb-4">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>{category.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      {/* Documents Display */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-2"></div>
          <p className="text-gray-500">Loading documents...</p>
        </div>
      ) : sortedDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-gray-50">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No documents found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? `No documents match "${searchTerm}"` : "Upload a document to get started"}
          </p>
          <Button onClick={() => setShowUploadDialog(true)}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      ) : (
        viewMode === "grid" ? renderGridView() : renderListView()
      )}
      
      {/* Pagination (when needed) */}
      {sortedDocuments.length > 20 && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" size="sm" className="mx-1">1</Button>
          <Button variant="outline" size="sm" className="mx-1">2</Button>
          <Button variant="outline" size="sm" className="mx-1">3</Button>
          <span className="mx-1 flex items-center text-gray-500">...</span>
          <Button variant="outline" size="sm" className="mx-1">10</Button>
        </div>
      )}
    </div>
  );
}