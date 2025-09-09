// src/components/workspace/ConversationDetails.tsx
'use client';
import { useState, useEffect, useMemo } from "react";
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
import { useProjectSettingsStore } from "@/store/workspace-settings.store";
import { useProjectInstructionsStore } from "@/store/workspace-instructions.store";
import { useProjectDocumentsStore } from "@/store/workspace-documents.store";
import { RemoveConfirmationDialog } from "@/components/modals/ConfirmationDialog";
import { JurisdictionSelector } from "./JurisdictionSelector";
import { getJurisdictionById } from "@/lib/jurisdictions";
import { UploadDocumentModal } from "../modals/UploadModal";
import { Jurisdiction } from "@/types";

export function ConversationDetails() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [tempInstructions, setTempInstructions] = useState("");
  
  // Document management state
  const [documentToDelete, setDocumentToDelete] = useState<{id: string; name: string} | null>(null);
  const [isRemovingDocument, setIsRemovingDocument] = useState(false);
   const [showDocumentModal, setShowDocumentModal] = useState(false)
  
  // Get documents from workspace hook (core workspace data)
  const { fetchProjectDocuments,removeDocumentFromProject,isLoading:projectDocumentsLoading,documents:projectDocuments } = useProjectDocumentsStore()
  
  // Get settings and instructions from dedicated stores (lazy loaded)
  const { 
    settings, 
    isLoading: settingsLoading, 
    setJurisdiction,
    fetchSettings
  } = useProjectSettingsStore();
  
  const { 
    instructions, 
    isLoading: instructionsLoading, 
    saveInstructions,
    fetchInstructions
  } = useProjectInstructionsStore();
  
  const { addToast } = useUIStore();
  
  // Update temp instructions when instructions change
  useEffect(() => {
    if (!isEditingInstructions) {
      setTempInstructions(instructions);
    }
  }, [instructions, isEditingInstructions]);
  
  // Filter documents based on search term
const filteredDocuments = useMemo(() => {
  if (!projectDocuments || !Array.isArray(projectDocuments)) {
    return [];
  }
  
  if (!searchTerm.trim()) {
    return projectDocuments;
  }
  
  const searchLower = searchTerm.toLowerCase().trim();
  
  return projectDocuments.filter(doc => {
    if (!doc) return false;
    
    const titleMatch = doc.title?.toLowerCase().includes(searchLower) || false;
    const descriptionMatch = doc.description?.toLowerCase().includes(searchLower) || false;
    
    return titleMatch || descriptionMatch;
  });
}, [projectDocuments, searchTerm]);
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
     
        
      // Load project settings and instructions only when component mounts
      useEffect(() => {
        if (projectId) {
          // Parallel loading with error handling
          Promise.all([
            fetchSettings(projectId).catch(err => {}), 
            fetchInstructions(projectId).catch(err => {}), 
            fetchProjectDocuments(projectId).catch(err => {})
          ]);
        }
      }, [projectId, fetchSettings, fetchInstructions, fetchProjectDocuments]);
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div className="space-y-4">
          {/* Project Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ">
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
                  className="h-8 px-2 text-xs "
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Documents ({projectDocuments?.length || 0})
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDocumentModal(true)}
                  className="h-8 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              {/* Search Documents */}
              {projectDocuments && projectDocuments.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-8"
                  />
                </div>
              )}

              {/* Documents List */}
              <div className="space-y-2">
                {projectDocumentsLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
                  </div>
                ) : filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate max-w-[200px]">{doc.title}</p>
                        <p className="text-xs text-gray-500">
                          {doc.fileType} • {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Unknown size'}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">

                          <DropdownMenuItem 
                            onClick={() => setDocumentToDelete({ id: doc.id, name: doc.title })}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                ) : projectDocuments && projectDocuments.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No documents added</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDocumentModal(true)}
                      className="mt-2"
                    >
                      Add your first document
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">No documents found</p>
                  </div>
                )}
              </div>
            </div>
 
      </div>

      {/* Document Upload Modal */}
        <UploadDocumentModal
        open={showDocumentModal}
        mode="upload-and-attach"
        title="Add Documents to Project"
        description="Select existing documents or upload new ones to add to this conversation."
        onOpenChange={setShowDocumentModal}
        projectId={projectId}
        onDocumentsAdded={handleDocumentsAdded}
      />


      {/* Document Removal Confirmation */}
      <RemoveConfirmationDialog
        open={!!documentToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDocumentToDelete(null);
          }
        }}
        onConfirm={handleRemoveDocument}
        itemName={documentToDelete?.name}
        contextName="this conversation"
        isLoading={isRemovingDocument}
      />
    </ScrollArea>
  );
}