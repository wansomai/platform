// components/modals/UploadModal.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Search, 
  UploadCloud,
  X,
  Loader2,
  Folder,
  Plus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useDocumentsStore } from "@/store/documents.store";
import { useProjectDocumentsStore } from "@/store/workspace-documents.store";
import { useFolderStore } from "@/store/folder.store";
import { useNotifications } from "@/hooks/useNotifications";
import { formatFileSize, validateFile } from "@/lib/utils/file";
import { Document } from "@/types";

// Constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'upload' | 'select' | 'upload-and-attach';
  projectId?: string;
  onDocumentsAdded?: (documents: Document[]) => void;
  title?: string;
  description?: string;
}

export function UploadDocumentModal({ 
  open, 
  onOpenChange, 
  mode = 'upload',
  projectId,
  onDocumentsAdded,
  title,
  description
}: UploadDocumentModalProps) {
  // Local state
  const [activeTab, setActiveTab] = useState<'select' | 'upload'>(
    mode === 'select' ? 'select' : 'upload'
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocumentsToAdd, setSelectedDocumentsToAdd] = useState<string[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAttachingDocuments, setIsAttachingDocuments] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderSearchTerm, setFolderSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { 
    documents, 
    fetchDocuments, 
    uploadDocument,
    isLoading: isLoadingDocuments 
  } = useDocumentsStore();
  
  const { 
    documents: projectDocuments, 
    attachDocumentsToProject
  } = useProjectDocumentsStore();
  
  const { folders, fetchFolders, createFolder } = useFolderStore();
  const { notify } = useNotifications();

  // Computed values
  const modalTitle = title || {
    'upload': 'Upload Files',
    'select': 'Select Files',
    'upload-and-attach': 'Add Files to Conversation'
  }[mode];

  const modalDescription = description || {
    'upload': '',
    'select': 'Select files from your vault.',
    'upload-and-attach': 'Select existing files or upload new ones to add to the conversation.'
  }[mode];

  // Available documents for selection (excluding already attached ones)
  const availableDocuments = projectId 
    ? documents.filter(doc => 
        !projectDocuments.some(convDoc => convDoc.id === doc.id)
      )
    : documents;
  
  // Filter documents based on search
  const filteredDocuments = availableDocuments.filter(
    doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Effects
  useEffect(() => {
    if (open) {
      fetchDocuments();
      if (mode !== 'upload') {
        fetchFolders();
      }
    }
  }, [open, fetchDocuments, fetchFolders, mode]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setActiveTab(mode === 'select' ? 'select' : 'upload');
      setUploadFile(null);
      setUploadError(null);
      setSelectedDocumentsToAdd([]);
      setSearchTerm("");
      setIsDragOver(false);
      setSelectedFolder(null);
      setShowNewFolderInput(false);
      setNewFolderName("");
      setFolderSearchTerm("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open, mode]);

  // File handling functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setUploadFile(null);
      setUploadError(null);
      return;
    }
    
    const file = files[0];
    validateAndSetFile(file);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };
  
  const validateAndSetFile = (file: File) => {
    const validation = validateFile(file, undefined, MAX_FILE_SIZE);
    
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid file');
      setUploadFile(null);
      return;
    }
    
    setUploadError(null);
    setUploadFile(file);
  };

  // Document operations
  const handleUploadDocument = async () => {
    if (!uploadFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      if (selectedFolder) {
        formData.append('folderId', selectedFolder);
      }
      
      const document = await uploadDocument(formData, (progress) => {
        setUploadProgress(progress);
      });
      
      if (document) {
        const documentsToReturn = [document];
        
        // If mode includes attachment and we have a conversation ID
        if ((mode === 'upload-and-attach') && projectId) {
          const success = await attachDocumentsToProject(
            projectId, 
            [document.id]
          );
          
          if (success) {
            notify.success(`${uploadFile.name} uploaded and added to conversation`);
          } else {
            notify.error("Document uploaded but failed to add to conversation");
          }
        } else {
          notify.success(`${uploadFile.name} uploaded successfully`);
        }
        
        onDocumentsAdded?.(documentsToReturn);
        onOpenChange(false);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Upload failed";
      setUploadError(errorMsg);
      notify.error(errorMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocumentsToAdd(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };
  
  const handleAddSelectedDocuments = async () => {
    if (selectedDocumentsToAdd.length === 0) return;
    
    try {
      setIsAttachingDocuments(true);
      
      if (projectId) {
        const success = await attachDocumentsToProject(
          projectId, 
          selectedDocumentsToAdd
        );
        
        if (success) {
          notify.success(`${selectedDocumentsToAdd.length} document(s) added to conversation`);
        }
      }
      
      const selectedDocs = documents.filter(doc => 
        selectedDocumentsToAdd.includes(doc.id)
      );
      
      onDocumentsAdded?.(selectedDocs);
      onOpenChange(false);
    } catch (error) {
      notify.error("Failed to add documents");
    } finally {
      setIsAttachingDocuments(false);
    }
  };

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      notify.error("Please enter a folder name");
      return;
    }

    setIsCreatingFolder(true);
    try {
      const folder = await createFolder(newFolderName.trim(), null);
      if (folder) {
        notify.success(`Folder "${newFolderName}" created successfully`);
        setSelectedFolder(folder.id);
        setNewFolderName("");
        setShowNewFolderInput(false);
        setFolderSearchTerm(""); // Clear search
        await fetchFolders(); // Refresh folder list
      }
    } catch (error) {
      notify.error("Failed to create folder");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Render functions
  const renderUploadTab = () => (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all relative ${
          isDragOver
            ? 'border-primary-500 bg-primary-50 scale-[1.02]'
            : uploadFile
              ? 'border-green-400 bg-green-50'
              : isUploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 hover:shadow-md'
        } ${isUploading ? 'pointer-events-none' : ''}`}
        onClick={() => {
          if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Uploading...</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <UploadCloud className={`mx-auto h-16 w-16 mb-4 transition-all ${
            isDragOver ? 'text-primary-500 scale-110' : uploadFile ? 'text-green-500' : 'text-gray-400'
          }`} />

          {uploadFile ? (
            <div className="relative inline-flex items-center gap-3 bg-white px-4 py-3 pr-10 rounded-lg border border-green-300 shadow-sm">
              <FileText className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 max-w-xs truncate">{uploadFile.name}</p>
                <p className="text-xs text-gray-600">
                  {formatFileSize(uploadFile.size)} • {uploadFile.type || 'Unknown type'}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadFile(null);
                  setUploadError(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group"
                aria-label="Remove file"
              >
                <X className="h-4 w-4 text-gray-600 group-hover:text-gray-900" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className={`text-lg font-semibold mb-2 ${
                isDragOver ? 'text-primary-700' : 'text-gray-800'
              }`}>
                {isDragOver ? 'Drop your file here!' : 'Drag & drop your file here'}
              </p>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-sm text-gray-500 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              <Button
                type="button"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                className="w-full max-w-xs mx-auto bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Open File Selector
              </Button>
              {/* <p className="text-xs text-gray-500 mt-2">
                Select a file from your computer
              </p> */}
            </div>
          )}
        </div>
      </div>

      {/* Folder Selection */}
      <div className="space-y-2">
        <Label htmlFor="folder">Save to Folder (Optional)</Label>
        <Select
          value={selectedFolder || ''}
          onValueChange={(value) => {
            if (value !== 'create-new') {
              setSelectedFolder(value === 'root' ? null : value);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a folder" />
          </SelectTrigger>
          <SelectContent>
            {/* Search Input */}
            <div className="px-2 py-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search folders..."
                  value={folderSearchTerm}
                  onChange={(e) => setFolderSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Folder List */}
            <div className="max-h-48 overflow-y-auto">
              <SelectItem value="root">
                <div className="flex items-center">
                  <Folder className="h-4 w-4 mr-2" />
                  No folder (Root)
                </div>
              </SelectItem>
              {(() => {
                const filteredFolders = folders.filter(folder =>
                  folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase())
                );

                if (filteredFolders.length === 0 && folderSearchTerm) {
                  return (
                    <div className="px-2 py-4 text-center text-sm text-gray-500">
                      No folders found matching &quot;{folderSearchTerm}&quot;
                    </div>
                  );
                }

                return filteredFolders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2" />
                      {folder.name}
                    </div>
                  </SelectItem>
                ));
              })()}
            </div>

            {/* Separator */}
            <div className="px-2 py-1.5">
              <div className="border-t"></div>
            </div>

            {/* Create New Folder Section */}
            <div className="px-2 py-2 bg-gray-50">
              {!showNewFolderInput ? (
                <button
                  type="button"
                  className="w-full text-left text-sm text-gray-500 hover:text-gray-700 py-1.5 px-2 hover:bg-gray-100 rounded transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowNewFolderInput(true);
                  }}
                >
                  or create a new folder
                </button>
              ) : (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    placeholder="Enter new folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        handleCreateFolder();
                      }
                      if (e.key === 'Escape') {
                        setShowNewFolderInput(false);
                        setNewFolderName("");
                      }
                    }}
                    disabled={isCreatingFolder}
                    className="h-8 text-sm flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateFolder();
                    }}
                    disabled={!newFolderName.trim() || isCreatingFolder}
                    className="h-8 px-4 text-sm"
                  >
                    {isCreatingFolder ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Create'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>
      
      <Input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
      />
      
      {uploadError && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-sm text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-900 mb-1">Upload Failed</p>
              <p className="text-red-700 mb-2">{uploadError}</p>
              <p className="text-xs text-red-600">
                Please check that your file meets the requirements above and try again.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadError(null)}
              className="text-red-600 hover:text-red-800 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {isUploading && (
        <div className="space-y-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
              <p className="text-sm font-semibold text-primary-900">
                Uploading your file...
              </p>
            </div>
            <p className="text-sm font-bold text-primary-700">
              {uploadProgress}%
            </p>
          </div>
          <Progress value={uploadProgress} className="h-3" />
          <p className="text-xs text-primary-600">
            Please wait while we securely upload your file. Do not close this window.
          </p>
        </div>
      )}
    </div>
  );

  const renderSelectTab = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="border rounded-lg max-h-64 overflow-y-auto">
        {isLoadingDocuments ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="divide-y">
            {filteredDocuments.map((doc) => (
              <div 
                key={doc.id} 
                className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                  selectedDocumentsToAdd.includes(doc.id) ? "bg-blue-50" : ""
                }`}
                onClick={() => toggleDocumentSelection(doc.id)}
              >
                <Checkbox 
                  checked={selectedDocumentsToAdd.includes(doc.id)}
                  className="mr-3"
                  onChange={() => toggleDocumentSelection(doc.id)}
                />
                <FileText className="h-4 w-4 mr-3 text-primary-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.title}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Badge variant="outline" className="mr-2">{doc.fileType.toUpperCase()}</Badge>
                    <span>{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8">
            <FileText className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-center text-muted-foreground">
              {searchTerm ? "No documents match your search" : "No documents available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {mode === 'upload-and-attach' ? (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'select' | 'upload')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="select">Select Existing</TabsTrigger>
                <TabsTrigger value="upload">Upload New</TabsTrigger>
              </TabsList>
              <TabsContent value="select" className="mt-4">
                {renderSelectTab()}
              </TabsContent>
              <TabsContent value="upload" className="mt-4">
                {renderUploadTab()}
              </TabsContent>
            </Tabs>
          ) : mode === 'select' ? (
            renderSelectTab()
          ) : (
            renderUploadTab()
          )}
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isAttachingDocuments || isUploading}
          >
            Cancel
          </Button>
          
          {mode === 'upload-and-attach' ? (
            activeTab === 'select' ? (
              <Button 
                onClick={handleAddSelectedDocuments}
                disabled={selectedDocumentsToAdd.length === 0 || isAttachingDocuments}
              >
                {isAttachingDocuments ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add ${selectedDocumentsToAdd.length} Document${selectedDocumentsToAdd.length !== 1 ? 's' : ''}`
                )}
              </Button>
            ) : (
              <Button
                onClick={handleUploadDocument}
                disabled={!uploadFile || isUploading}
                className={`transition-all ${!uploadFile && !isUploading ? 'cursor-not-allowed' : ''}`}
                title={!uploadFile && !isUploading ? 'Please select a file first' : ''}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Upload & Add to Conversation
                  </>
                )}
              </Button>
            )
          ) : mode === 'select' ? (
            <Button 
              onClick={handleAddSelectedDocuments}
              disabled={selectedDocumentsToAdd.length === 0 || isAttachingDocuments}
            >
              {isAttachingDocuments ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Selecting...
                </>
              ) : (
                `Select ${selectedDocumentsToAdd.length} Document${selectedDocumentsToAdd.length !== 1 ? 's' : ''}`
              )}
            </Button>
          ) : (
            <Button
              onClick={handleUploadDocument}
              disabled={!uploadFile || isUploading}
              className={`transition-all ${!uploadFile && !isUploading ? 'cursor-not-allowed' : ''}`}
              title={!uploadFile && !isUploading ? 'Please select a file first' : ''}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}