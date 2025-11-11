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
  Folder
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
  
  const { folders, fetchFolders } = useFolderStore();
  const { notify } = useNotifications();

  // Computed values
  const modalTitle = title || {
    'upload': 'Upload Document',
    'select': 'Select Documents',
    'upload-and-attach': 'Add Documents to Conversation'
  }[mode];

  const modalDescription = description || {
    'upload': 'Upload a new document to your vault.',
    'select': 'Select documents from your vault.',
    'upload-and-attach': 'Select existing documents or upload new ones to add to the conversation.'
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

  // Render functions
  const renderUploadTab = () => (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${
          isDragOver 
            ? 'border-primary-500 bg-primary-50' 
            : uploadFile 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => {
          if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <UploadCloud className={`mx-auto h-12 w-12 mb-4 ${
            isDragOver ? 'text-primary-500' : 'text-gray-400'
          }`} />
          
          {uploadFile ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{uploadFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(uploadFile.size)} • {uploadFile.type}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadFile(null);
                  setUploadError(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <p className={`text-lg font-medium mb-2 ${
                isDragOver ? 'text-primary-700' : 'text-gray-700'
              }`}>
                {isDragOver ? 'Drop your file here' : 'Drop files here or click to browse'}
              </p>
              <p className={`text-sm ${
                isDragOver ? 'text-primary-600' : 'text-gray-500'
              }`}>
                Upload documents to your vault
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Folder Selection */}
      {folders.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="folder">Folder (Optional)</Label>
          <Select value={selectedFolder || ''} onValueChange={setSelectedFolder}>
            <SelectTrigger>
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">No folder</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  <div className="flex items-center">
                    <Folder className="h-4 w-4 mr-2" />
                    {folder.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <Input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
      />
      
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">!</span>
            </div>
            <div>
              <p className="font-medium">Upload failed</p>
              <p>{uploadError}</p>
            </div>
          </div>
        </div>
      )}
      
      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Uploading... {uploadProgress}%
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
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload & Add'
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
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}