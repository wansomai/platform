// app/dashboard/vault/page.tsx
"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  Download,
  Trash2,
  Search,
  Plus,
  File,
  FileSpreadsheet,
  FileImage,
  Eye,
  FolderPlus,
  RefreshCw,
  FileIcon,
  Folder,
  Edit,
  FolderSymlinkIcon,
  Sparkles,
  MoreVertical,
  X,
  Loader2,
  Lock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useDocumentsStore } from "@/store/documents.store"
import { useDocuments } from "@/hooks/useDocuments"
import { useUIStore } from "@/store/ui.store"
import { useFolderStore } from "@/store/folder.store"
import { useProjectStore } from "@/store/project.store"
import { useProjectDocumentsStore } from "@/store/workspace-documents.store"
import { useProfile } from "@/store/profile.store"
import { useChatStore } from "@/store/chat.store"
import { formatDistanceToNow } from "date-fns"
import { apiService } from "@/lib/api"
import { FolderTree } from "@/components/documents/FolderTree"
import { FolderModal } from "@/components/documents/FolderModal"
import { FolderPermissionModal } from "@/components/documents/FolderPermissionModal"
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
    documents: rawDocuments,
    isLoading,
    error,
    pagination,
    fetchDocuments,
    selectedDocuments,
    toggleDocumentSelection,
    clearSelectedDocuments,
    deleteDocument: storeDeleteDocument,
    renameDocument
  } = useDocumentsStore();

  // Deduplicate by id — guards against race conditions where uploadDocument prepends a doc
  // that was already fetched, which would produce duplicate React keys in the table.
  const documents = useMemo(
    () => Array.from(new Map(rawDocuments.map((d: any) => [d.id, d])).values()),
    [rawDocuments]
  );
  
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
  const ITEMS_PER_PAGE = 20;
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string; name: string} | null>(null);
  const [documentToMove, setDocumentToMove] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ title: string; fileUrl: string; fileType: string } | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Stable total document count for the "All Documents" label — never changes when navigating folders
  const [totalAllDocs, setTotalAllDocs] = useState<number | undefined>(undefined);

  // Folder-related state
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editFolder, setEditFolder] = useState<{ id: string; name: string; parentId: string | null } | null>(null);
  const [showMoveFolderDialog, setShowMoveFolderDialog] = useState(false);
  const [targetFolder, setTargetFolder] = useState<string | null>(null);
  // Move conflict detection state
  // moveConflictIds: doc IDs that conflict with existing names in the target folder
  // moveTargetTitlesLower: lowercase titles already in the target folder (for real-time validation)
  const [moveConflictIds, setMoveConflictIds] = useState<string[]>([]);
  const [moveRenameMap, setMoveRenameMap] = useState<Record<string, string>>({});
  const [moveTargetTitlesLower, setMoveTargetTitlesLower] = useState<string[]>([]);
  const [isFetchingMoveConflicts, setIsFetchingMoveConflicts] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionFolder, setPermissionFolder] = useState<{ id: string; name: string } | null>(null);

  // Rename document state
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Add to Workspace state
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Ref that always holds the latest fetch params — used by the reprocessing effect to avoid stale closures
  const currentParamsRef = useRef<any>({});
  // Incrementing counter that forces a fetch even when activeFolder hasn't changed (same-folder re-click)
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Project store & profile for workspace integration
  const { createProject } = useProjectStore();
  const { attachDocumentsToProject } = useProjectDocumentsStore();
  const { user, fetchProfile } = useProfile();
  const router = useRouter();

  // Fetch documents and folders on mount — always force-refresh so createdBy/visibility are current
  useEffect(() => {
    fetchFolders(true);
    fetchProfile(); // ensure user.id is available for creator checks
  }, [fetchFolders, fetchProfile]);
  
  // Keep a ref of the current params so the reprocessing effect always reads the latest values
  useEffect(() => {
    const params: any = {
      search: searchTerm || undefined,
      type: fileType,
      sort: sortBy,
      page: currentPage,
      limit: 20,
      ...(activeFolder ? { folder: activeFolder } : {}),
    };
    currentParamsRef.current = params;
  }, [searchTerm, fileType, sortBy, currentPage, activeFolder]);

  // Fetch documents when filters change (fetchTrigger allows re-fetching the same folder)
  useEffect(() => {
    fetchDocuments({ ...currentParamsRef.current }, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDocuments, searchTerm, fileType, sortBy, currentPage, activeFolder, fetchTrigger]);

  // Keep the "All Documents" total stable — only update it when we're at the root with no filters
  useEffect(() => {
    if (!activeFolder && !searchTerm && !fileType && pagination) {
      setTotalAllDocs(pagination.total);
    }
  }, [pagination, activeFolder, searchTerm, fileType]);

  // Auto-reprocess documents that are stuck in "processing" state.
  // content_extracted=false means extraction failed at upload time (no background job is running).
  // We call the reprocess endpoint once per stuck document, then refresh the list.
  useEffect(() => {
    const stuckDocs = documents.filter((doc: any) => doc.contentExtracted === false);
    if (stuckDocs.length === 0) return;

    let cancelled = false;

    const reprocessAll = async () => {
      await Promise.allSettled(
        stuckDocs.map((doc: any) =>
          apiService.post(`/api/documents/${doc.id}/reprocess`, {})
        )
      );
      if (!cancelled) {
        // Use the ref to always get the latest params — avoids stale closure overwriting subfolder view
        fetchDocuments({ ...currentParamsRef.current }, true);
      }
    };

    reprocessAll();

    return () => { cancelled = true; };
  // We intentionally only run this when the list of stuck doc IDs changes, not on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents.map((d: any) => `${d.id}:${d.contentExtracted}`).join(',')]);
  
  // Error handling
  useEffect(() => {
    if (error) {
      addToast({
        message: error,
        type: "error"
      });
    }
  }, [error, addToast]);
  
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
    if (selectedDocuments.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const deletePromises = selectedDocuments.map(id => storeDeleteDocument(id));
      const results = await Promise.allSettled(deletePromises);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (successful > 0) {
        addToast({ message: `${successful} document${successful > 1 ? 's' : ''} deleted`, type: "success" });
      }
      if (failed > 0) {
        addToast({ message: `Failed to delete ${failed} document${failed > 1 ? 's' : ''}`, type: "error" });
      }

      clearSelectedDocuments();
      setShowBulkDeleteDialog(false);
    } catch (error) {
      addToast({ message: "Failed to delete documents", type: "error" });
    } finally {
      setIsBulkDeleting(false);
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
  
  // Handle document rename
  const handleRenameSubmit = async (docId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setIsRenaming(true);
    const success = await renameDocument(docId, trimmed);
    setIsRenaming(false);
    if (success) {
      addToast({ type: 'success', message: 'Document renamed successfully' });
      setRenamingDocId(null);
    } else {
      addToast({ type: 'error', message: 'A document with that name already exists' });
    }
  };

  // Handle folder selection — always increments fetchTrigger so clicking the same
  // folder a second time still reloads its content.
  const handleFolderSelect = useCallback((folderId: string | null) => {
    setActiveFolder(folderId);
    setCurrentPage(1);
    clearSelectedDocuments();
    setFetchTrigger(t => t + 1);
  }, [clearSelectedDocuments]);
  
  // Handle folder creation/update.
  // Errors are intentionally NOT caught here — they propagate up to FolderModal's execute()
  // so the inline ErrorAlert shows the exact server message and the modal stays open.
  const handleSaveFolder = async (name: string, parentId: string | null) => {
    if (editFolder) {
      const updated = await updateFolder(editFolder.id, name, parentId);
      if (updated) {
        addToast({ message: "Folder updated successfully", type: "success" });
      }
    } else {
      const folder = await createFolder(name, parentId);
      if (folder) {
        addToast({ message: "Folder created successfully", type: "success" });
      }
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
  
  // Detect title conflicts whenever the target folder or docs-to-move change.
  // Resets rename inputs to original titles on each folder change so the user
  // always types a fresh name in the new destination context.
  useEffect(() => {
    if (!showMoveFolderDialog) return;
    const docsToMove = documentToMove ? [documentToMove] : selectedDocuments;
    if (docsToMove.length === 0) return;

    let cancelled = false;
    const detect = async () => {
      setIsFetchingMoveConflicts(true);
      try {
        const folderParam = targetFolder ? `folder=${targetFolder}` : 'folder=root';
        const res = await apiService.get<{ data: any[] }>(`/api/documents?limit=100&${folderParam}`);
        if (cancelled) return;

        // Titles already in the target folder (excluding the docs being moved)
        const existingDocs = (res.data || []).filter((d: any) => !docsToMove.includes(d.id));
        const titlesLower = existingDocs.map((d: any) => (d.title as string).toLowerCase());
        const titlesSet = new Set(titlesLower);

        const conflictIds: string[] = [];
        const newRenameMap: Record<string, string> = {};
        for (const docId of docsToMove) {
          const doc = documents.find((d: any) => d.id === docId);
          if (!doc) continue;
          // Reset to original title so user types a fresh name for the new folder
          newRenameMap[docId] = doc.title;
          if (titlesSet.has(doc.title.toLowerCase())) {
            conflictIds.push(docId);
          }
        }
        setMoveConflictIds(conflictIds);
        setMoveRenameMap(newRenameMap);
        setMoveTargetTitlesLower(titlesLower);
      } catch {
        // ignore — server performs the authoritative conflict check
      } finally {
        if (!cancelled) setIsFetchingMoveConflicts(false);
      }
    };
    detect();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetFolder, showMoveFolderDialog, documentToMove, selectedDocuments.join(',')]);

  // Update the rename value for a conflicted doc — does NOT clear the conflict
  // section so the input stays mounted while the user finishes typing.
  const handleMoveRenameChange = (docId: string, newTitle: string) => {
    setMoveRenameMap(prev => ({ ...prev, [docId]: newTitle }));
  };

  // Handle moving documents to folder
  const handleMoveToFolder = async () => {
    const docsToMove = documentToMove ? [documentToMove] : selectedDocuments;
    if (docsToMove.length === 0) return;

    const targetSet = new Set(moveTargetTitlesLower);

    // All conflicted docs must have a non-empty rename that differs from the
    // original title AND doesn't itself collide with an existing title in the folder.
    const hasUnresolved = moveConflictIds.some((id) => {
      const val = moveRenameMap[id]?.trim() ?? '';
      const doc = documents.find((d: any) => d.id === id);
      return !val || val === doc?.title || targetSet.has(val.toLowerCase());
    });
    if (hasUnresolved) return;

    // Build renames — only conflicted docs that have a changed title
    const renames = moveConflictIds
      .map((docId) => ({ id: docId, newTitle: moveRenameMap[docId]?.trim() ?? '' }))
      .filter((r) => r.newTitle);

    setIsMoving(true);
    try {
      const success = await moveDocumentsToFolder(targetFolder, docsToMove, renames.length > 0 ? renames : undefined);
      if (success) {
        addToast({
          message: `${docsToMove.length} document(s) moved successfully`,
          type: "success"
        });
        clearSelectedDocuments();
        setDocumentToMove(null);
        setShowMoveFolderDialog(false);
        setMoveConflictIds([]);
        setMoveRenameMap({});
        setMoveTargetTitlesLower([]);

        await Promise.all([
          fetchFolders(true),
          fetchDocuments({
            search: searchTerm || undefined,
            type: fileType,
            sort: sortBy,
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            folder: activeFolder || undefined
          })
        ]);
      } else {
        addToast({ message: "Failed to move documents. Please check name conflicts.", type: "error" });
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

  // Handle "Add to Workspace" — creates a new workspace, attaches documents, sends review message, and navigates
  const handleAddToWorkspace = async (documentIds: string[]) => {
    if (documentIds.length === 0 || isCreatingWorkspace) return;

    const organizationId = user?.activeOrganizationId || user?.organizationId;
    if (!organizationId) {
      addToast({ message: "Something went wrong. Please try again.", type: "error" });
      return;
    }

    setIsCreatingWorkspace(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
      const dateStr = now.toLocaleDateString([], { month: "short", day: "numeric" });
      const projectTitle = `Wansom - ${dateStr} ${timeStr}`;

      const newProject = await createProject({
        title: projectTitle,
        description: "Created from Document Vault",
        organizationId,
      });

      if (newProject) {
        await attachDocumentsToProject(newProject.id, documentIds);

        // Store pending message so it auto-sends when workspace loads
        sessionStorage.setItem("pendingMessage", `Review the attached document${documentIds.length > 1 ? 's' : ''}`);

        // Store document metadata so attached-document preview cards appear on the message
        const docsMeta = documentIds
          .map(id => {
            const doc = documents.find(d => d.id === id);
            if (!doc) return null;
            return {
              id: doc.id,
              title: doc.title,
              fileType: doc.fileType,
              fileSize: doc.fileSize,
              fileUrl: doc.fileUrl,
            };
          })
          .filter(Boolean);
        if (docsMeta.length > 0) {
          sessionStorage.setItem("pendingMessageDocs", JSON.stringify(docsMeta));
        }

        // Pre-set conversation in chat store to avoid redundant fetch
        if (newProject.conversationId) {
          useChatStore.getState().setCurrentConversation({
            id: newProject.conversationId,
            title: newProject.conversationTitle || 'New Conversation',
            projectId: newProject.id,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPinned: false
          });
        }

        addToast({
          message: "AI workspace created!",
          type: "success"
        });
        clearSelectedDocuments();
        router.push(`/projects/${newProject.id}`);
      }
    } catch (error: any) {
      if (error.status === 403 && error.requiresUpgrade) {
        addToast({ message: "Upgrade to Pro to create more workspaces.", type: "error" });
      } else {
        addToast({ message: "Failed to create workspace. Please try again.", type: "error" });
      }
    } finally {
      setIsCreatingWorkspace(false);
    }
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
                className={`cursor-pointer ${selectedDocuments.includes(document.id) ? "bg-primary/10" : ""}`}
                onClick={() => toggleDocumentSelection(document.id)}
              >
                <TableCell onClick={(e) => renamingDocId === document.id && e.stopPropagation()}>
                  <div className="flex items-center space-x-2">
                    <DocumentTypeIcon fileType={document.fileType || ""} />
                    <div className="flex flex-col gap-0.5">
                      {renamingDocId === document.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit(document.id);
                              if (e.key === 'Escape') setRenamingDocId(null);
                            }}
                            className="h-7 text-sm max-w-[180px]"
                          />
                          <Button size="sm" className="h-7 px-2" disabled={isRenaming} onClick={() => handleRenameSubmit(document.id)}>
                            {isRenaming ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setRenamingDocId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium truncate max-w-[200px]">{document.title}</span>
                      )}
                      {document.contentExtracted === false && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
                          <span>Processing… Review when ready</span>
                        </span>
                      )}
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                          <DropdownMenuItem
                        disabled={isCreatingWorkspace}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToWorkspace([document.id]);
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Review in Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDocument({
                            title: document.title,
                            fileUrl: document.fileUrl,
                            fileType: (document.fileType || '').toLowerCase()
                          });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
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
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocumentToMove(document.id);
                          setMoveConflictIds([]);
                          setMoveRenameMap({});
                          setMoveTargetTitlesLower([]);
                          setShowMoveFolderDialog(true);
                        }}
                      >
                        <FolderSymlinkIcon className="h-4 w-4 mr-2" />
                        Move to Folder
                      </DropdownMenuItem>
                  
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingDocId(document.id);
                          setRenameValue(document.title);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
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
                totalDocumentCount={totalAllDocs}
              />
            )}
            
            {/* Folder actions */}
            {activeFolder && activeFolder !== 'root' && (() => {
              const allFolders = [...folders, ...folders.flatMap((f: any) => f.children ?? [])];
              const activeF = allFolders.find((f: any) => f.id === activeFolder);
              return (
                <div className="mt-4 pt-4 border-t flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      const folder = allFolders.find((f: any) => f.id === activeFolder);
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

                  {activeF?.createdBy === user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        if (activeF) {
                          setPermissionFolder({ id: activeF.id, name: activeF.name });
                          setShowPermissionModal(true);
                        }
                      }}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Permission
                    </Button>
                  )}

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
              );
            })()}
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
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
              
              <Select 
                value={fileType || "all"} 
                onValueChange={(value) => { setFileType(value === "all" ? undefined : value); setCurrentPage(1); }}
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
                onValueChange={(value) => { setSortBy(value as 'recent' | 'oldest' | 'name' | 'size'); setCurrentPage(1); }}
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
              <div className="flex flex-wrap items-center justify-between bg-green-50 p-4 rounded-lg gap-2">
                <div className="flex items-center">
                  <span className="font-medium">{selectedDocuments.length} selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                 
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isCreatingWorkspace}
                    onClick={() => handleAddToWorkspace(selectedDocuments)}
                    title="Add to Workspace"
                  >
                    <Sparkles className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Review in Chat</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setMoveConflictIds([]); setMoveRenameMap({}); setMoveTargetTitlesLower([]); setShowMoveFolderDialog(true); }}
                    title="Move to Folder"
                  >
                    <FolderSymlinkIcon className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Move to Folder</span>
                  </Button>

                 <Button variant="outline" size="sm" onClick={clearSelectedDocuments}>
                    <span className="sm:inline hidden">Cancel</span>
                    <X className="h-4 w-4 sm:hidden" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteDialog(true)}
                    title="Delete"
                  >
                    {isBulkDeleting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin sm:mr-2" />
                        <span className="hidden sm:inline">Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Delete</span>
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
              renderListView()
            )}
            
            {/* Pagination */}
            {pagination && pagination.total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                <p className="text-sm text-gray-500">
                  Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, pagination.total)}–{Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} of {pagination.total} document{pagination.total !== 1 ? 's' : ''}
                </p>

                {pagination.pages > 1 && (
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
                      let pageNum: number;
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
                          key={pageNum}
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
                )}
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
        title="Upload Files"
        description=""
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

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        itemName={`${selectedDocuments.length} document${selectedDocuments.length > 1 ? 's' : ''}`}
        itemType="document"
        isLoading={isBulkDeleting}
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

      {/* Folder Permission Modal */}
      {permissionFolder && (
        <FolderPermissionModal
          open={showPermissionModal}
          onClose={() => {
            setShowPermissionModal(false);
            setPermissionFolder(null);
            fetchFolders(true);
          }}
          folderId={permissionFolder.id}
          folderName={permissionFolder.name}
        />
      )}

      {/* Document Preview Drawer */}
      <Sheet open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
        <SheetContent side="right" className="w-[90vw] sm:max-w-2xl flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="truncate pr-8">{previewDocument?.title}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 px-6 pb-6">
            {previewDocument && (() => {
              const { fileType, fileUrl, title } = previewDocument;
              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType);
              const isPdf = fileType === 'pdf';

              if (isImage) {
                return (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg overflow-auto">
                    <img
                      src={fileUrl}
                      alt={title}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                );
              }

              if (isPdf) {
                return (
                  <iframe
                    src={fileUrl}
                    title={title}
                    className="w-full h-full rounded-lg border"
                  />
                );
              }

              // For other file types (docx, xlsx, csv, etc.), use Google Docs Viewer
              return (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                  title={title}
                  className="w-full h-full rounded-lg border"
                />
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Move to Folder Dialog */}
      <Dialog open={showMoveFolderDialog} onOpenChange={(open) => {
        setShowMoveFolderDialog(open);
        if (!open) { setMoveConflictIds([]); setMoveRenameMap({}); setMoveTargetTitlesLower([]); }
      }}>
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
                  {' '}
                  <span className="text-muted-foreground text-xs">({folder.documentCount ?? 0})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Conflict rename inputs */}
          {isFetchingMoveConflicts && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking for name conflicts…
            </p>
          )}
          {!isFetchingMoveConflicts && moveConflictIds.length > 0 && (() => {
            const targetSet = new Set(moveTargetTitlesLower);
            return (
              <div className="space-y-2">
                <p className="text-sm text-destructive font-medium">
                  Name conflicts detected — rename before moving:
                </p>
                {moveConflictIds.map((docId) => {
                  const doc = documents.find((d: any) => d.id === docId);
                  const val = moveRenameMap[docId] ?? doc?.title ?? '';
                  const isStillOriginal = val === doc?.title;
                  const isTargetConflict = !!val.trim() && !isStillOriginal && targetSet.has(val.trim().toLowerCase());
                  const showError = isStillOriginal || isTargetConflict;
                  return (
                    <div key={docId} className="space-y-1">
                      <p className="text-xs text-muted-foreground truncate">
                        &ldquo;{doc?.title}&rdquo; already exists in the target folder — enter a new name:
                      </p>
                      <Input
                        value={val}
                        onChange={(e) => handleMoveRenameChange(docId, e.target.value)}
                        placeholder="New name"
                        className={showError ? 'border-destructive h-8 text-sm' : 'h-8 text-sm'}
                        disabled={isMoving}
                        autoFocus={moveConflictIds.indexOf(docId) === 0}
                      />
                      {isTargetConflict && (
                        <p className="text-xs text-destructive">
                          That name also exists in this folder — choose a different one.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

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
              disabled={isMoving || isFetchingMoveConflicts || (() => {
                const targetSet = new Set(moveTargetTitlesLower);
                return moveConflictIds.some((id) => {
                  const val = moveRenameMap[id]?.trim() ?? '';
                  const doc = documents.find((d: any) => d.id === id);
                  return !val || val === doc?.title || targetSet.has(val.toLowerCase());
                });
              })()}
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
