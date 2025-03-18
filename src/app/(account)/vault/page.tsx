// app/dashboard/vault/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ListFilter,
  SlidersHorizontal,
  Grid,
  List,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle
} from "lucide-react";
import { useDocumentsStore } from "@/store/documents.store";
import { useUIStore } from "@/store/ui.store";
import { formatDistanceToNow } from "date-fns";

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

// Main component
export default function VaultPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get state from stores
  const { 
    documents, 
    isLoading, 
    error, 
    pagination, 
    fetchDocuments, 
    uploadDocument, 
    deleteDocument,
    selectedDocuments,
    toggleDocumentSelection,
    clearSelectedDocuments
  } = useDocumentsStore();
  
  const { addToast } = useUIStore();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [fileType, setFileType] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name' | 'size'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileDescription, setFileDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  
  // Fetch documents on mount and when filters change
  useEffect(() => {
    fetchDocuments({
      search: searchTerm || undefined,
      type: fileType,
      sort: sortBy,
      page: currentPage,
      limit: 20
    });
  }, [fetchDocuments, searchTerm, fileType, sortBy, currentPage]);
  
  // Error handling
  useEffect(() => {
    if (error) {
      addToast({
        message: error,
        type: "error"
      });
    }
  }, [error, addToast]);
  
  // Clear selected documents when view changes
  useEffect(() => {
    clearSelectedDocuments();
  }, [viewMode, clearSelectedDocuments]);
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      if (fileDescription) {
        formData.append('description', fileDescription);
      }
      
      // Upload the file with progress tracking
      const document = await uploadDocument(formData);
      
      if (document) {
        addToast({
          message: `${file.name} has been uploaded successfully.`,
          type: "success"
        });
        setShowUploadDialog(false);
        setFileDescription("");
      }
    } catch (error) {
      addToast({
        message: "Upload Failed",
        type: "error"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  // Handle document deletion
  const handleDeleteDocument = async (id: string) => {
    try {
      const success = await deleteDocument(id);
      
      if (success) {
        addToast({
          message: "Document Deleted",
          type: "success"
        });
        setShowDeleteConfirm(false);
        setDocumentToDelete(null);
      }
    } catch (error) {
      addToast({
        message: "Deletion Failed",
        type: "error"
      });
    }
  };
  
  // Handle bulk document deletion
  const handleBulkDelete = async () => {
    try {
      // Process each selected document sequentially
      let successCount = 0;
      
      for (const docId of selectedDocuments) {
        const success = await deleteDocument(docId);
        if (success) successCount++;
      }
      
      if (successCount > 0) {
        addToast({
          message: `${successCount} documents have been deleted successfully.`,
          type: "success"
        });
        clearSelectedDocuments();
      }
    } catch (error) {
      addToast({
        message: "Deletion Failed",
        type: "error"
      });
    }
  };
  
  // Handle file download
  const handleDownloadDocument = (document: any) => {
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // File type options
  const fileTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "pdf", label: "PDF Documents" },
    { value: "doc", label: "Word Documents" },
    { value: "xls", label: "Excel Spreadsheets" },
    { value: "csv", label: "CSV Files" },
    { value: "jpg", label: "Images" }
  ];
  
  // Sort options
  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "oldest", label: "Oldest First" },
    { value: "name", label: "Name (A-Z)" },
    { value: "size", label: "Size (Largest)" }
  ];
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };
  
  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {documents.map((document) => (
        <Card 
          key={document.id} 
          className={`overflow-hidden hover:shadow-md transition-all ${
            selectedDocuments.includes(document.id) ? "ring-2 ring-primary-500" : ""
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-1">
                <DocumentTypeIcon fileType={document.fileType || ""} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base truncate">{document.title}</CardTitle>
                  <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(document.fileUrl, '_blank')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => {
                    setDocumentToDelete(document.id);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
                </div>
                {/* <CardDescription className="text-xs truncate">
                  {document.description || "No description"}
                </CardDescription> */}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Type:</span>{" "}
                <Badge variant="outline" className="ml-1">{document.fileType}</Badge>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>{" "}
                <span>{formatBytes(document.fileSize)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Uploaded:</span>{" "}
                <span>{formatDate(document.createdAt)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">By:</span>{" "}
                <span>{document.createdBy}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  // Render list view
  const renderListView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead className="w-[30px]">
                <Checkbox
                  checked={selectedDocuments.length > 0 && selectedDocuments.length === documents.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Select all documents
                      const allIds = documents.map(doc => doc.id);
                      clearSelectedDocuments();
                      allIds.forEach(id => toggleDocumentSelection(id));
                    } else {
                      // Deselect all
                      clearSelectedDocuments();
                    }
                  }}
                />
              </TableHead> */}
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow 
                key={document.id}
                className={selectedDocuments.includes(document.id) ? "bg-primary-50" : ""}
              >
                {/* <TableCell>
                  <Checkbox
                    checked={selectedDocuments.includes(document.id)}
                    onCheckedChange={() => toggleDocumentSelection(document.id)}
                  />
                </TableCell> */}
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <DocumentTypeIcon fileType={document.fileType || ""} />
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">{document.title}</span>
                      {/* <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {document.description || "No description"}
                      </span> */}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{document.fileType}</Badge>
                </TableCell>
                <TableCell>{formatBytes(document.fileSize)}</TableCell>
                <TableCell>{formatDate(document.createdAt)}</TableCell>
                <TableCell>{document.createdBy}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => window.open(document.fileUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleDownloadDocument(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-600"
                      onClick={() => {
                        setDocumentToDelete(document.id);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Document Vault</h1>
          <p className="text-gray-500">Manage your organization's document library</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? (
              <>
                <List className="h-4 w-4 mr-2" />
                List View
              </>
            ) : (
              <>
                <Grid className="h-4 w-4 mr-2" />
                Grid View
              </>
            )}
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
                  Upload a document to your organization's vault.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file" className="text-right">
                    File
                  </Label>
                  <div className="col-span-3">
                    <Input 
                      id="file" 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
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
                
                {/* <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter a description (optional)"
                    className="col-span-3"
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    disabled={uploading}
                  />
                </div> */}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current?.files?.length) {
                      handleFileUpload({ target: { files: fileInputRef.current.files } } as React.ChangeEvent<HTMLInputElement>);
                    }
                  }}
                  disabled={uploading || (fileInputRef.current ? !fileInputRef.current.files?.length : true)}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
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
        
        <Select 
          value={fileType || "all"} 
          onValueChange={(value) => setFileType(value as string | undefined)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {fileTypeOptions.map((option) => (
              <SelectItem key={option.label} value={option.value || ""}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={sortBy} 
          onValueChange={(value) => setSortBy(value as 'recent' | 'oldest' | 'name' | 'size')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Selected Documents Actions */}
      {selectedDocuments.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="font-medium">{selectedDocuments.length} documents selected</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearSelectedDocuments}>
              Cancel
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}
      
      {/* Documents Display */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-2">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-gray-500">Loading documents...</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-gray-50">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No documents found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || fileType ? 'No documents match your search criteria' : 'Upload your first document to get started'}
          </p>
          <Button onClick={() => setShowUploadDialog(true)}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      ) : (
        viewMode === "grid" ? renderGridView() : renderListView()
      )}
      
      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              // Calculate page numbers to show based on current page
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={i}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(p + 1, pagination.pages))}
              disabled={currentPage === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => documentToDelete && handleDeleteDocument(documentToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function for formatting bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}