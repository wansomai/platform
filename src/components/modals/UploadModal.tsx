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
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
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
  // Folder filter for the select tab (null = show all, 'root' = unfiled)
  const [selectedFilterFolder, setSelectedFilterFolder] = useState<string | null>(null);
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
    attachDocumentsToProject,
    removeDocumentFromProject
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

  // Set of already-attached document IDs for quick lookup
  const attachedDocIds = new Set(projectDocuments.map(doc => doc.id));

  // Filter and sort documents: attached first, then by title
  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFolder = selectedFilterFolder === null
        ? true
        : selectedFilterFolder === 'root'
          ? !doc.folderId
          : doc.folderId === selectedFilterFolder;
      return matchesSearch && matchesFolder;
    })
    .sort((a, b) => {
      const aAttached = attachedDocIds.has(a.id) ? 0 : 1;
      const bAttached = attachedDocIds.has(b.id) ? 0 : 1;
      return aAttached - bAttached;
    });

  // Effects
  useEffect(() => {
    if (open) {
      // Force-refresh so we never show a folder-filtered list from the vault page cache.
      // No folder filter here — we show all documents; folder browsing is handled below.
      fetchDocuments({ limit: 100 }, true);
      if (mode !== 'upload') {
        fetchFolders();
      }
    }
  }, [open, fetchDocuments, fetchFolders, mode]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setActiveTab(mode === 'select' ? 'select' : 'upload');
      setUploadFiles([]);
      setUploadError(null);
      setSelectedDocumentsToAdd([]);
      setSearchTerm("");
      setIsDragOver(false);
      setSelectedFilterFolder(null);
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
      setUploadFiles([]);
      setUploadError(null);
      return;
    }
    validateAndSetFiles(Array.from(files));
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
      validateAndSetFiles(Array.from(files));
    }
  };

  const validateAndSetFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validation = validateFile(file, undefined, MAX_FILE_SIZE);
      if (!validation.isValid) {
        errors.push(`${file.name}: ${validation.error || 'Invalid file'}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
    } else {
      setUploadError(null);
    }

    if (validFiles.length > 0) {
      setUploadFiles(prev => {
        const existing = new Set(prev.map(f => f.name + f.size));
        return [...prev, ...validFiles.filter(f => !existing.has(f.name + f.size))];
      });
    }
  };

  // Document operations
  const handleUploadDocument = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedDocs = [];
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        if (selectedFolder) {
          formData.append('folderId', selectedFolder);
        }

        const document = await uploadDocument(formData, (progress) => {
          // Show per-file progress scaled across the total
          const overall = Math.round(((i / uploadFiles.length) * 100) + (progress / uploadFiles.length));
          setUploadProgress(overall);
        });

        if (document) {
          uploadedDocs.push(document);
        }
      }

      setUploadProgress(100);

      if (uploadedDocs.length > 0) {
        if ((mode === 'upload-and-attach') && projectId) {
          const success = await attachDocumentsToProject(
            projectId,
            uploadedDocs.map(d => d.id)
          );

          if (success) {
            notify.success(`${uploadedDocs.length} file${uploadedDocs.length !== 1 ? 's' : ''} uploaded and added to conversation`);
          } else {
            notify.error("Files uploaded but failed to add to conversation");
          }
        } else {
          notify.success(`${uploadedDocs.length} file${uploadedDocs.length !== 1 ? 's' : ''} uploaded successfully`);
        }

        onDocumentsAdded?.(uploadedDocs);
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
  
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const toggleDocumentSelection = async (documentId: string) => {
    const isAttached = attachedDocIds.has(documentId);

    if (isAttached) {
      // Immediately remove from project
      if (projectId) {
        setIsRemoving(documentId);
        const success = await removeDocumentFromProject(projectId, documentId);
        setIsRemoving(null);
        if (success) {
          notify.success("Document removed from conversation");
        }
      }
    } else {
      // Toggle selection of a new document
      setSelectedDocumentsToAdd(prev =>
        prev.includes(documentId)
          ? prev.filter(id => id !== documentId)
          : [...prev, documentId]
      );
    }
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
    <div className="space-y-3">
      {/* Drop zone — compact when files are selected, full when empty */}
      <div
        className={`border-2 border-dashed rounded-lg cursor-pointer transition-all relative ${
          isDragOver
            ? 'border-primary-500 bg-primary-50 scale-[1.02] p-6'
            : uploadFiles.length > 0
              ? 'border-green-400 bg-green-50 p-4'
              : isUploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed p-8'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 hover:shadow-md p-8'
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

        {uploadFiles.length > 0 ? (
          /* Compact summary row when files are already selected */
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-green-700">
                {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="text-sm text-primary hover:underline flex-shrink-0"
            >
              + Add more
            </button>
          </div>
        ) : (
          <div className="text-center">
            <UploadCloud className={`mx-auto h-16 w-16 mb-4 transition-all ${
              isDragOver ? 'text-primary-500 scale-110' : 'text-gray-400'
            }`} />
            <div className="space-y-4">
              <p className={`text-lg font-semibold mb-2 ${
                isDragOver ? 'text-primary-700' : 'text-gray-800'
              }`}>
                {isDragOver ? 'Drop your files here!' : 'Drag & drop files here'}
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
                Select Files
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable file cards — visible once files are selected */}
      {uploadFiles.length > 0 && (
        <div className="overflow-y-auto max-h-44 border rounded-lg p-2 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {uploadFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2.5 rounded-lg border border-gray-200 transition-colors"
              >
                <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadFiles(prev => prev.filter((_, i) => i !== idx));
                      setUploadError(null);
                    }}
                    className="flex-shrink-0 h-5 w-5 rounded-full bg-gray-200 hover:bg-red-100 flex items-center justify-center transition-colors group"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3 text-gray-500 group-hover:text-red-600" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
        multiple
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

  // Select all documents in a specific folder
  const handleFolderClick = (folderId: string | null) => {
    setSelectedFilterFolder(folderId);
    if (folderId === null) return; // "All files" — just filter, don't bulk-select

    const folderDocs = documents.filter(doc => {
      if (folderId === 'root') return !doc.folderId;
      return doc.folderId === folderId;
    });
    const ids = folderDocs
      .filter(doc => !attachedDocIds.has(doc.id))
      .map(doc => doc.id);
    if (ids.length > 0) {
      setSelectedDocumentsToAdd(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  const renderSelectTab = () => (
    <div className="flex flex-col sm:flex-row gap-3 flex-1 min-h-0">
      {/* Folder list — horizontal scroll strip on mobile, vertical sidebar on sm+ */}
      {folders.length > 0 && (
        <div className="relative sm:contents">
          {/* Fade-right hint on mobile only */}
          <div className="sm:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
          <div className="flex sm:flex-col sm:w-36 sm:shrink-0 sm:border sm:rounded-lg sm:overflow-y-auto gap-1 sm:gap-0 overflow-x-auto pb-1 sm:pb-0 pr-6 sm:pr-0">
          <button
            className={`shrink-0 sm:w-full text-left px-3 py-1.5 sm:py-2 text-sm font-medium flex items-center gap-2 rounded-md sm:rounded-none transition-colors ${
              selectedFilterFolder === null ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-muted-foreground"
            }`}
            onClick={() => handleFolderClick(null)}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate whitespace-nowrap">All files</span>
          </button>
          <button
            className={`shrink-0 sm:w-full text-left px-3 py-1.5 sm:py-2 text-sm flex items-center gap-2 rounded-md sm:rounded-none transition-colors ${
              selectedFilterFolder === 'root' ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-muted-foreground"
            }`}
            onClick={() => handleFolderClick('root')}
            title="Click to filter and select all unfiled documents"
          >
            <Folder className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate whitespace-nowrap">Unfiled</span>
          </button>
          {folders.map((folder: any) => (
            <button
              key={folder.id}
              className={`shrink-0 sm:w-full text-left px-3 py-1.5 sm:py-2 text-sm flex items-center gap-2 rounded-md sm:rounded-none transition-colors ${
                selectedFilterFolder === folder.id ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-muted-foreground"
              }`}
              onClick={() => handleFolderClick(folder.id)}
              title={`Click to select all documents in "${folder.name}"`}
            >
              <Folder className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate whitespace-nowrap">{folder.name}</span>
            </button>
          ))}
        </div>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>

        <div className="border rounded-lg flex-1 overflow-y-auto min-h-[180px]">
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="divide-y">
              {filteredDocuments.map((doc) => {
                const isAttached = attachedDocIds.has(doc.id);
                const isNewlySelected = selectedDocumentsToAdd.includes(doc.id);
                const isBeingRemoved = isRemoving === doc.id;
                const isChecked = isAttached || isNewlySelected;

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center p-3 cursor-pointer transition-colors ${
                      isBeingRemoved
                        ? "bg-red-50 opacity-60 pointer-events-none"
                        : isAttached
                        ? "bg-green-50 hover:bg-green-100"
                        : isNewlySelected
                        ? "bg-green-50 hover:bg-green-100"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => !isBeingRemoved && toggleDocumentSelection(doc.id)}
                  >
                    {isBeingRemoved ? (
                      <Loader2 className="h-4 w-4 mr-3 animate-spin text-red-400" />
                    ) : (
                      <Checkbox
                        checked={isChecked}
                        className="mr-3"
                        onChange={() => toggleDocumentSelection(doc.id)}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Badge variant="outline" className="mr-2">{doc.fileType.toUpperCase()}</Badge>
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </div>
                    {isAttached && !isBeingRemoved && (
                      <button
                        className="ml-2 p-1 rounded-full hover:bg-red-100 transition-colors"
                        title="Remove from workspace"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDocumentSelection(doc.id);
                        }}
                      >
                        <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <FileText className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-center text-muted-foreground">
                {searchTerm ? "No documents match your search" : "No documents in this folder"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {mode === 'upload-and-attach' ? (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'select' | 'upload')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="select">Select Existing</TabsTrigger>
                <TabsTrigger value="upload">Upload New</TabsTrigger>
              </TabsList>
              <TabsContent value="select" className="mt-4 flex flex-col flex-1 min-h-0">
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
                ) : selectedDocumentsToAdd.length > 0 ? (
                  `Add ${selectedDocumentsToAdd.length} to chat`
                ) : (
                  'Add to chat'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleUploadDocument}
                disabled={uploadFiles.length === 0 || isUploading}
                className={`transition-all ${uploadFiles.length === 0 && !isUploading ? 'cursor-not-allowed' : ''}`}
                title={uploadFiles.length === 0 && !isUploading ? 'Please select files first' : ''}
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
                  Adding...
                </>
              ) : selectedDocumentsToAdd.length > 0 ? (
                `Add ${selectedDocumentsToAdd.length} to chat`
              ) : (
                'Add to chat'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleUploadDocument}
              disabled={uploadFiles.length === 0 || isUploading}
              className={`transition-all ${uploadFiles.length === 0 && !isUploading ? 'cursor-not-allowed' : ''}`}
              title={uploadFiles.length === 0 && !isUploading ? 'Please select files first' : ''}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  {uploadFiles.length > 1 ? `Upload ${uploadFiles.length} Files` : 'Upload File'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}