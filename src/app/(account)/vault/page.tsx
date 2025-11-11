// app/dashboard/vault/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  Plus, 
  MoreVertical,
  File,
  FileSpreadsheet,
  FileImage,
  Eye,
  FolderPlus,
  Grid,
  List,
  RefreshCw,
  FileIcon,
  Folder,
  Edit,
  FolderSymlinkIcon,
} from "lucide-react"
import { useDocumentsStore } from "@/store/documents.store"
import { useDocuments } from "@/hooks/useDocuments"
import { useUIStore } from "@/store/ui.store"
import { useFolderStore } from "@/store/folder.store"
import { formatDistanceToNow } from "date-fns"
import { FolderTree } from "@/components/documents/FolderTree"
import { FolderModal } from "@/components/documents/FolderModal"
import { ComponentLoading, EmptyDocuments } from "@/components/commons/LoadingState"
import { UploadDocumentModal } from "@/components/modals/UploadModal"
import { DeleteConfirmationDialog } from "@/components/modals/ConfirmationDialog"

// Document Type Icons component
const DocumentTypeIcon = ({ fileType }: { fileType: string }) => {
  const type = fileType.toLowerCase();
  
  if (type === "pdf") {
    return <FileText className="h-5 w-5 text-red-500" />;
  } else if (["xlsx", "xls", "csv"].includes(type)) {
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  } else if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(type)) {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  } else if (["doc", "docx"].includes(type)) {
    return <File className="h-5 w-5 text-blue-600" />;
  } else {
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  }
};

// Main component
export default function VaultPage() {
  
  // Get state from stores
  const { 
    documents, 
    isLoading, 
    error, 
    pagination, 
    fetchDocuments, 
    selectedDocuments,
    toggleDocumentSelection,
    clearSelectedDocuments
  } = useDocumentsStore();
  
  const {
    folders,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    moveDocumentsToFolder,
    isLoading: foldersLoading
  } = useFolderStore();
  
  const { addToast } = useUIStore();
  
  // Enhanced useDocuments hook for document operations
  const {
    deleteDocument,
    deleteSelectedDocuments,
    downloadDocument,
    isProcessing
  } = useDocuments();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [fileType, setFileType] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name' | 'size'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isClient, setIsClient] = useState(false);
  
  // Set responsive view mode on client
  useEffect(() => {
    setIsClient(true);
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? "grid" : "list");
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string; name: string} | null>(null);
  const [documentToMove, setDocumentToMove] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  
  // Folder-related state
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editFolder, setEditFolder] = useState<{ id: string; name: string; parentId: string | null } | null>(null);
  const [showMoveFolderDialog, setShowMoveFolderDialog] = useState(false);
  const [targetFolder, setTargetFolder] = useState<string | null>(null);

  // Fetch documents and folders on mount
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);
  
  // Fetch documents when filters change
  useEffect(() => {
    const params: any = {
      search: searchTerm || undefined,
      type: fileType,
      sort: sortBy,
      page: currentPage,
      limit: 20
    };
    
    if (activeFolder) {
      params.folder = activeFolder;
    }
    
    fetchDocuments(params);
  }, [fetchDocuments, searchTerm, fileType, sortBy, currentPage, activeFolder]);
  
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

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      const success = await deleteDocument(documentToDelete.id);
      if (success) {
        setShowDeleteDialog(false);
        setDocumentToDelete(null);
      }
    } catch (error) {
      // Delete error occurred
    }
  };
  
  // Handle bulk document deletion
  const handleBulkDelete = async () => {
    try {
      await deleteSelectedDocuments();
    } catch (error) {
      // Bulk delete error occurred
    }
  };
  
  // Handle file download
  const handleDownloadDocument = async (document: any) => {
    try {
      await downloadDocument(document.id, document.title);
    } catch (error) {
      // Download error occurred
    }
  };
  
  // Handle folder selection
  const handleFolderSelect = (folderId: string | null) => {
    setActiveFolder(folderId);
    setCurrentPage(1);
    clearSelectedDocuments();
  };
  
  // Handle folder creation/update
  const handleSaveFolder = async (name: string, parentId: string | null) => {
    try {
      if (editFolder) {
        const updated = await updateFolder(editFolder.id, name, parentId);
        if (updated) {
          addToast({
            message: "Folder updated successfully",
            type: "success"
          });
        }
      } else {
        const folder = await createFolder(name, parentId);
        if (folder) {
          addToast({
            message: "Folder created successfully",
            type: "success"
          });
        }
      }
    } catch (error) {
      addToast({
        message: "Failed to save folder",
        type: "error"
      });
    }
  };
  
  // Handle folder deletion
  const handleDeleteFolder = async (id: string) => {
    try {
      const success = await deleteFolder(id);
      if (success) {
        addToast({
          message: "Folder deleted successfully",
          type: "success"
        });
        
        if (activeFolder === id) {
          setActiveFolder(null);
        }
      }
    } catch (error) {
      addToast({
        message: "Failed to delete folder",
        type: "error"
      });
    }
  };
  
  // Handle moving documents to folder
  const handleMoveToFolder = async () => {
    const docsToMove = documentToMove ? [documentToMove] : selectedDocuments;
    if (docsToMove.length === 0) return;
    
    setIsMoving(true);
    try {
      const success = await moveDocumentsToFolder(targetFolder, docsToMove);
      if (success) {
        addToast({
          message: `${docsToMove.length} document(s) moved successfully`,
          type: "success"
        });
        clearSelectedDocuments();
        setDocumentToMove(null);
        setShowMoveFolderDialog(false);
        
        await Promise.all([
          fetchFolders(),
          fetchDocuments({
            search: searchTerm || undefined,
            type: fileType,
            sort: sortBy,
            page: currentPage,
            limit: 20,
            folder: activeFolder || undefined
          })
        ]);
      }
    } catch (error) {
      addToast({
        message: "Failed to move documents",
        type: "error"
      });
    } finally {
      setIsMoving(false);
    }
  };

  // Handle upload success
  const handleDocumentUploaded = (documents: any[]) => {
    const count = documents.length;
    addToast({
      message: `${count} document${count > 1 ? 's' : ''} uploaded successfully`,
      type: "success"
    });
    
    // Refresh documents list
    fetchDocuments({
      search: searchTerm || undefined,
      type: fileType,
      sort: sortBy,
      page: currentPage,
      limit: 20,
      folder: activeFolder || undefined
    });
  };
  
  // File type options
  const fileTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "pdf", label: "PDF Documents" },
    { value: "docx", label: "Word Documents" },
    { value: "xlsx", label: "Excel Spreadsheets" },
    { value: "csv", label: "CSV Files" },
    { value: "image", label: "Images" }
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
  
  // Format file size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
  
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {documents.map((document) => (
        <Card 
          key={document.id} 
          className={`overflow-hidden hover:shadow-md transition-all cursor-pointer ${
            selectedDocuments.includes(document.id) ? "ring-2 ring-primary-500" : ""
          }`}
          onClick={() => toggleDocumentSelection(document.id)}
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(document.fileUrl, '_blank');
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                     
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocumentToMove(document.id);
                          setShowMoveFolderDialog(true);
                        }}
                      >
                        <FolderSymlinkIcon className="h-4 w-4 mr-2" />
                        Move
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadDocument(document);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocumentToDelete({
                            id: document.id,
                            name: document.title
                          });
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
                className={`cursor-pointer ${selectedDocuments.includes(document.id) ? "bg-primary-50" : ""}`}
                onClick={() => toggleDocumentSelection(document.id)}
              >
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <DocumentTypeIcon fileType={document.fileType || ""} />
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">{document.title}</span>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(document.fileUrl, '_blank');
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDocument(document);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocumentToMove(document.id);
                        setShowMoveFolderDialog(true);
                      }}
                    >
                      <FolderSymlinkIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocumentToDelete({
                          id: document.id,
                          name: document.title
                        });
                        setShowDeleteDialog(true);
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
  
  useEffect(() => {
    if (!showMoveFolderDialog) {
      setDocumentToMove(null);
    }
  }, [showMoveFolderDialog]);

  return (
    <>
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header with title and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Document Vault</h1>
            <p className="text-gray-500">Manage your organization's document library</p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
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
            
            <Button variant="outline" onClick={() => {
              setEditFolder(null);
              setShowFolderModal(true);
            }}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>
        
        {/* Main content with sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Folder sidebar */}
          <div className="col-span-1 bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Folders</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setEditFolder(null);
                  setShowFolderModal(true);
                }}
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
            
            {foldersLoading ? (
              <ComponentLoading text="Loading folders..." />
            ) : (
              <FolderTree 
                folders={folders} 
                activeFolder={activeFolder} 
                onFolderSelect={handleFolderSelect} 
              />
            )}
            
            {/* Folder actions */}
            {activeFolder && activeFolder !== 'root' && (
              <div className="mt-4 pt-4 border-t flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const folder = folders.find(f => f.id === activeFolder);
                    if (folder) {
                      setEditFolder({
                        id: folder.id,
                        name: folder.name,
                        parentId: folder.parentId
                      });
                      setShowFolderModal(true);
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Folder
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-red-600"
                  onClick={() => handleDeleteFolder(activeFolder)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Folder
                </Button>
              </div>
            )}
          </div>
          
          {/* Main document area */}
          <div className="col-span-1 md:col-span-3 space-y-6">
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
                onValueChange={(value) => setFileType(value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {fileTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
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
            
            {/* Folder path breadcrumb */}
            {activeFolder && (
              <div className="flex items-center text-sm text-gray-500">
                <span>Location:</span>
                {activeFolder === 'root' ? (
                  <span className="ml-2 inline-flex items-center">
                    <Folder className="h-4 w-4 mr-1" />
                    Root
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center">
                    <Folder className="h-4 w-4 mr-1" />
                    {folders.find(f => f.id === activeFolder)?.name || 'Unknown Folder'}
                  </span>
                )}
              </div>
            )}
            
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowMoveFolderDialog(true)}
                  >
                    <FolderSymlinkIcon className="mr-2 h-4 w-4" />
                    Move to Folder
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Documents Display */}
            {isLoading ? (
              <ComponentLoading text="Loading documents..." />
            ) : documents.length === 0 ? (
              <EmptyDocuments onUpload={() => setShowUploadModal(true)} />
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
          </div>
        </div>
      </div>
      
      {/* Upload Modal */}
      <UploadDocumentModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        mode="upload"
        onDocumentsAdded={handleDocumentUploaded}
        title="Upload Document"
        description="Upload a new document to your vault."
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
        onConfirm={handleDeleteDocument}
        itemName={documentToDelete?.name}
        itemType="document"
        isLoading={isProcessing}
      />
      
      {/* Folder Modal */}
      <FolderModal
        open={showFolderModal}
        onOpenChange={setShowFolderModal}
        onSave={handleSaveFolder}
        folders={folders}
        editFolder={editFolder}
        title={editFolder ? 'Edit Folder' : 'Create New Folder'}
      />
      
      {/* Move to Folder Dialog */}
      <Dialog open={showMoveFolderDialog} onOpenChange={setShowMoveFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
          </DialogHeader>
          <p>Select destination folder for {documentToMove ? '1' : selectedDocuments.length} document(s):</p>
          
          <Select
            value={targetFolder || "root"}
            onValueChange={(value) => setTargetFolder(value === "root" ? null : value)}
            disabled={isMoving}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select destination folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Root (No folder)</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowMoveFolderDialog(false)}
              disabled={isMoving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMoveToFolder}
              disabled={isMoving}
            >
              {isMoving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Moving...
                </>
              ) : (
                'Move Documents'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
