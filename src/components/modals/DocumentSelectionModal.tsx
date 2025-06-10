// components/workspace/DocumentSelectionModal.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  FileText, 
  Search, 
  Upload,
  UploadCloud,
  X,
  RefreshCw,
  Loader2
} from "lucide-react";

import { useDocumentsStore } from "@/store/documents.store";
import { useConversationDocumentsStore } from "@/store/conversation-documents.store";
import { useNotifications } from "@/hooks/useNotifications";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface DocumentSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  onDocumentsAdded?: (count: number) => void;
}

export function DocumentSelectionModal({ 
  open, 
  onOpenChange, 
  conversationId,
  onDocumentsAdded 
}: DocumentSelectionModalProps) {
  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadMode, setUploadMode] = useState<'select' | 'upload'>('select');
  const [selectedDocumentsToAdd, setSelectedDocumentsToAdd] = useState<string[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAttachingDocuments, setIsAttachingDocuments] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { 
    documents, 
    fetchDocuments, 
    uploadDocument,
    isLoading: isLoadingDocuments 
  } = useDocumentsStore();
  
  const { 
    documents: conversationDocuments, 
    attachDocumentsToConversation
  } = useConversationDocumentsStore();
  
  const { notify } = useNotifications();
  
  // Available documents for selection (excluding already attached ones)
  const availableDocuments = documents.filter(doc => 
    !conversationDocuments.some(convDoc => convDoc.id === doc.id)
  );
  
  // Filter available documents based on search
  const filteredAvailableDocuments = availableDocuments.filter(
    doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Load documents when modal opens
  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open, fetchDocuments]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setUploadMode('select');
      setUploadFile(null);
      setUploadError(null);
      setSelectedDocumentsToAdd([]);
      setSearchTerm("");
      setIsDragOver(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);
  
  // Handle file selection for upload
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
  
  // Handle drag and drop
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
  
  // Validate file and set it
  const validateAndSetFile = (file: File) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size exceeds 5MB limit. Please upgrade your plan to upload larger files.');
      setUploadFile(null);
      return;
    }
    
    setUploadError(null);
    setUploadFile(file);
  };
  
  // Handle file upload
  const handleUploadDocument = async () => {
    if (!uploadFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      // Upload the file
      const document = await uploadDocument(formData, (progress) => {
        setUploadProgress(progress);
      });
      
      if (document) {
        // Automatically add the new document to the conversation
        const success = await attachDocumentsToConversation(
          conversationId, 
          [document.id]
        );
        
        if (success) {
          notify.success(`${uploadFile.name} uploaded and added to conversation`);
          
          // Notify parent component
          onDocumentsAdded?.(1);
          
          // Close modal
          onOpenChange(false);
        } else {
          notify.error("Document uploaded but failed to add to conversation");
        }
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
  
  // Handle document selection
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocumentsToAdd(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };
  
  // Handle adding selected documents to conversation
  const handleAddSelectedDocuments = async () => {
    if (selectedDocumentsToAdd.length === 0) return;
    
    try {
      setIsAttachingDocuments(true);
      const success = await attachDocumentsToConversation(
        conversationId, 
        selectedDocumentsToAdd
      );
      
      if (success) {
        notify.success("Documents added to conversation");
        
        // Notify parent component
        onDocumentsAdded?.(selectedDocumentsToAdd.length);
        
        // Close modal
        onOpenChange(false);
      }
    } catch (error) {
      notify.error("Failed to add documents");
      console.error("Error adding documents:", error);
    } finally {
      setIsAttachingDocuments(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Documents to Conversation</DialogTitle>
          <DialogDescription>
            Select existing documents from your vault or upload new ones.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {/* Mode Toggle */}
          <div className="flex border-b mb-4">
            <Button
              variant={uploadMode === 'select' ? 'default' : 'ghost'}
              onClick={() => setUploadMode('select')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Select Existing
            </Button>
            <Button
              variant={uploadMode === 'upload' ? 'default' : 'ghost'}
              onClick={() => setUploadMode('upload')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Upload New
            </Button>
          </div>
          
          {uploadMode === 'select' ? (
            // Select Mode
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search documents..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="h-[300px] overflow-y-auto border rounded-md">
                {isLoadingDocuments ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading documents...</span>
                  </div>
                ) : filteredAvailableDocuments.length > 0 ? (
                  <div className="divide-y">
                    {filteredAvailableDocuments.map((doc) => (
                      <div 
                        key={doc.id} 
                        className={`flex items-center p-3 hover:bg-secondary-50 cursor-pointer ${
                          selectedDocumentsToAdd.includes(doc.id) ? "bg-secondary-100" : ""
                        }`}
                        onClick={() => toggleDocumentSelection(doc.id)}
                      >
                        <div onClick={(e) => {
                            e.stopPropagation();
                          }}>
                          <Checkbox 
                            checked={selectedDocumentsToAdd.includes(doc.id)}
                            className="mr-3"
                            onCheckedChange={(checked) => {
                              toggleDocumentSelection(doc.id);
                            }}
                          />
                        </div>
                        <FileText className="h-4 w-4 mr-3 text-primary-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.title}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Badge variant="outline" className="mr-2">{doc.fileType.toUpperCase()}</Badge>
                            <span>{formatBytes(doc.fileSize)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <FileText className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-center text-muted-foreground">
                      {searchTerm ? "No documents match your search" : "No documents available"}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setUploadMode('upload')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Upload Mode
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
                        {formatBytes(uploadFile.size)} • {uploadFile.type}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the file input
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
                        {isDragOver 
                          ? 'Release to upload the document' 
                          : 'Upload documents to add to your vault and conversation'
                        }
                      </p>
                    </div>
                  )}
                  
                  {/* Hidden file input */}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
                  />
                  
                  {uploadError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
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
                    <div className="mt-4 space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
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
          
          {uploadMode === 'select' ? (
            <Button 
              onClick={handleAddSelectedDocuments}
              disabled={selectedDocumentsToAdd.length === 0 || isAttachingDocuments}
            >
              {isAttachingDocuments ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>Add Selected ({selectedDocumentsToAdd.length})</>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleUploadDocument}
              disabled={!uploadFile || isUploading || !!uploadError}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Add to Conversation
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility function to format bytes to human-readable format
function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}