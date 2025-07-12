// src/components/workspace/ConversationDetails.tsx
'use client';
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Search, 
  Plus, 
  MoreVertical,
  Download,
  Eye,
  Save,
  Trash2,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useUIStore } from "@/store/ui.store";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectSettingsStore } from "@/store/workspace-settings.store";
import { useProjectInstructionsStore } from "@/store/workspace-instructions.store";
import { useProjectDocumentsStore } from "@/store/workspace-documents.store";
import { RemoveConfirmationDialog } from "@/components/modals/ConfirmationDialog";
import { JurisdictionSelector } from "./JurisdictionSelector";
import { getJurisdictionById, type Jurisdiction } from "@/lib/jurisdictions";
import { UploadDocumentModal } from "../modals/UploadModal";

export function ConversationDetails() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [tempInstructions, setTempInstructions] = useState("");
  
  // Document management state
  const [showDocumentSelectionDialog, setShowDocumentSelectionDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string; name: string} | null>(null);
  const [isRemovingDocument, setIsRemovingDocument] = useState(false);
   const [showDocumentModal, setShowDocumentModal] = useState(false)
  
  // Get documents from workspace hook (core workspace data)
  const { isLoading: workspaceLoading } = useWorkspace(projectId);
  const { fetchProjectDocuments,removeDocumentFromProject,isLoading:projectDocumentsLoading,documents } = useProjectDocumentsStore()
  
  // Get settings and instructions from dedicated stores (lazy loaded)
  const { 
    settings, 
    isLoading: settingsLoading, 
    fetchSettings, 
    setJurisdiction 
  } = useProjectSettingsStore();
  
  const { 
    instructions, 
    isLoading: instructionsLoading, 
    fetchInstructions, 
    saveInstructions 
  } = useProjectInstructionsStore();
  
  const { addToast } = useUIStore();
  
  // Load project settings and instructions only when component mounts (lazy loading)
  useEffect(() => {
    if (projectId) {
      fetchSettings(projectId);
      fetchInstructions(projectId);
      fetchInstructions(projectId);
    }
  }, [projectId, fetchSettings, fetchInstructions]);
  
  // Update temp instructions when instructions change
  useEffect(() => {
    if (!isEditingInstructions) {
      setTempInstructions(instructions);
    }
  }, [instructions, isEditingInstructions]);
  
  // Filter documents based on search term
  const filteredDocuments = documents?.filter(
    doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Handle instructions save - connected to working store
  const handleSaveInstructions = async () => {
    if (!projectId) return;
    
    try {
      const success = await saveInstructions(projectId, tempInstructions);
      if (success) {
        setIsEditingInstructions(false);
        addToast({ message: 'Project instructions updated successfully', type: 'success' });
      }
    } catch (error) {
      addToast({ message: 'Failed to update project instructions', type: 'error' });
    }
  };
  
  // Handle instructions cancel
  const handleCancelInstructions = () => {
    setTempInstructions(instructions);
    setIsEditingInstructions(false);
  };
  
  // Handle document removal - connected to working store
  const handleRemoveDocument = async () => {
    if (!documentToDelete || !projectId) return;
    
    setIsRemovingDocument(true);
    try {
      const success = await removeDocumentFromProject(projectId, documentToDelete.id);
      if (success) {
        addToast({ message: `${documentToDelete.name} removed from project`, type: 'success' });
        setDocumentToDelete(null);
      }
    } catch (error) {
      addToast({ message: 'Failed to remove document from project', type: 'error' });
    } finally {
      setIsRemovingDocument(false);
    }
  };
  
  // Handle jurisdiction change - connected to working store  
  const handleJurisdictionChange = async (jurisdiction: Jurisdiction | null) => {
    if (!projectId) return;
    
    try {
      const success = await setJurisdiction(projectId, jurisdiction);
      if (success) {
        addToast({ 
          message: jurisdiction ? `Jurisdiction set to ${jurisdiction.name}` : 'Jurisdiction cleared',
          type: 'success'
        });
      }
    } catch (error) {
      addToast({ message: 'Failed to update jurisdiction', type: 'error' });
    }
  };

    // Handle documents added
    const handleDocumentsAdded = (documents: any[]) => {
      const count = documents.length
      // Show success notification
      const { addToast } = useUIStore.getState()
      addToast({
        message: `${count} document${count !== 1 ? 's' : ''} added to project`,
        type: "success"
      })
      
      // Refresh project documents
      if (projectId) {
        fetchProjectDocuments(projectId)
      }
    }
  
  // Get current jurisdiction from project settings
   const currentJurisdiction = settings?.jurisdiction ? 
    getJurisdictionById(settings.jurisdiction.id) : 
    null;
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Project Settings</h2>
          
          {/* Project Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Project Instructions
              </label>
              {!isEditingInstructions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTempInstructions(instructions);
                    setIsEditingInstructions(true);
                  }}
                  className="h-8 px-2 text-xs"
                  disabled={instructionsLoading}
                >
                  Edit
                </Button>
              )}
            </div>
            
            {isEditingInstructions ? (
              <div className="space-y-3">
                <Textarea
                  value={tempInstructions}
                  onChange={(e) => setTempInstructions(e.target.value)}
                  placeholder="Enter project instructions..."
                  className="min-h-[100px] text-sm"
                  disabled={instructionsLoading}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveInstructions}
                    disabled={instructionsLoading}
                    className="h-8 px-3 text-xs"
                  >
                    {instructionsLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Save className="w-3 h-3 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelInstructions}
                    disabled={instructionsLoading}
                    className="h-8 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md min-h-[60px] flex items-center">
                {instructionsLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading instructions...
                  </div>
                ) : (
                  instructions || "No project instructions set"
                )}
              </div>
            )}
          </div>
          
          {/* Jurisdiction Selector */}
          <div className="space-y-3">
          <JurisdictionSelector
              value={currentJurisdiction}
              onChange={handleJurisdictionChange}
              disabled={settingsLoading}
            />
            {settingsLoading && (
              <div className="flex items-center text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Loading settings...
              </div>
            )}
          </div>
        </div>

        {/* Documents Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <Button
              size="sm"
              onClick={() => setShowDocumentModal(true)}
              className="h-8 px-3 text-xs"
              disabled={workspaceLoading}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Documents
            </Button>
          </div>

          {/* Search Documents */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>

          {/* Documents List */}
          <div className="space-y-2">
            {workspaceLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading documents...</span>
              </div>
            ) : filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.fileUrl;
                          link.download = doc.title;
                          link.click();
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDocumentToDelete({ id: doc.id, name: doc.title })}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No documents found</p>
                <p className="text-xs text-gray-400 mt-1">Add documents to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
        <UploadDocumentModal
        open={showDocumentModal}
        mode="upload-and-attach"
        onOpenChange={setShowDocumentModal}
        projectId={projectId}
        onDocumentsAdded={handleDocumentsAdded}
      />


      {/* Document Removal Confirmation */}
      {documentToDelete && (
        <RemoveConfirmationDialog
          open={!!documentToDelete}
          onClose={() => setDocumentToDelete(null)}
          onConfirm={handleRemoveDocument}
          title="Remove Document"
          description={`Are you sure you want to remove "${documentToDelete.name}" from this project?`}
          isLoading={isRemovingDocument}
        />
      )}
    </ScrollArea>
  );
}