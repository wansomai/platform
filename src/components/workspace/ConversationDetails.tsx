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

import { useChatStore } from "@/store/chat.store";
import { useConversationDocumentsStore } from "@/store/conversation-documents.store";
import { useConversationInstructionsStore } from "@/store/conversation-instructions.store";
import { useConversationSettingsStore } from "@/store/conversation-settings.store";
import { useNotifications } from "@/hooks/useNotifications";
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
  
  // Hooks
  const { currentConversation } = useChatStore();
  const { 
    documents: conversationDocuments, 
    fetchConversationDocuments, 
    removeDocumentFromConversation,
    isLoading: isLoadingConversationDocuments
  } = useConversationDocumentsStore();
  
  const { 
    instructions, 
    fetchInstructions, 
    saveInstructions, 
    setInstructions,
    isLoading: isLoadingInstructions 
  } = useConversationInstructionsStore();

  const {
    settings,
    setJurisdiction,
    isLoading: isLoadingSettings
  } = useConversationSettingsStore();

  const { notify } = useNotifications();
  
  // Fetch conversation data when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      fetchConversationDocuments(currentConversation.id);
      fetchInstructions(currentConversation.id);
    }
  }, [currentConversation?.id, fetchConversationDocuments, fetchInstructions]);

  // Set temp instructions when instructions change
  useEffect(() => {
    setTempInstructions(instructions);
  }, [instructions]);
  
  // Filter documents based on search term
  const filteredDocuments = conversationDocuments?.filter(
    doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get current jurisdiction
  const currentJurisdiction = settings.jurisdiction ? 
    getJurisdictionById(settings.jurisdiction.id) : null;
  
  // Handlers for instructions
  const handleSaveInstructions = async () => {
    if (!currentConversation) return;
    
    const success = await saveInstructions(currentConversation.id, tempInstructions);
    if (success) {
      setIsEditingInstructions(false);
      notify.success('Instructions updated successfully');
    } else {
      notify.error('Failed to update instructions');
    }
  };

  const handleCancelEditInstructions = () => {
    setTempInstructions(instructions);
    setIsEditingInstructions(false);
  };

  // Handle jurisdiction change
  const handleJurisdictionChange = async (jurisdiction: Jurisdiction | null) => {
    if (!currentConversation) return;
    
    const success = await setJurisdiction(currentConversation.id, jurisdiction);
    if (success) {
      notify.success(jurisdiction ? 
        `Jurisdiction set to ${jurisdiction.name}` : 
        'Jurisdiction cleared'
      );
    } else {
      notify.error('Failed to update jurisdiction');
    }
  };
   // Handle documents added
  const handleDocumentsAdded = (documents: any[]) => {
    const count = documents.length;
    notify.success(`${count} document${count > 1 ? 's' : ''} added to conversation`);
    
    // Refresh documents list
    if (currentConversation?.id) {
      fetchConversationDocuments(currentConversation.id);
    }
  };
  // Handle document removal
  const handleRemoveDocument = async () => {
    if (!documentToDelete || !currentConversation) return;
    
    setIsRemovingDocument(true);
    try {
      const success = await removeDocumentFromConversation(
        currentConversation.id, 
        documentToDelete.id
      );
      
      if (success) {
        setDocumentToDelete(null);
        notify.success(`${documentToDelete.name} removed from conversation`);
      } else {
        notify.error('Failed to remove document');
      }
    } catch (error) {
      notify.error('Failed to remove document');
    } finally {
      setIsRemovingDocument(false);
    }
  };

  // Handle document actions
  const handleViewDocument = (documentId: string) => {
    // Implementation for viewing document
    console.log('View document:', documentId);
  };

  const handleDownloadDocument = (documentId: string, fileName: string) => {
    // Implementation for downloading document
    console.log('Download document:', documentId, fileName);
  };

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No conversation selected</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
       
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            
           

            {/* Custom Instructions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Custom Instructions
                </label>
                {!isEditingInstructions && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingInstructions(true)}
                    className="h-8 px-2 text-xs"
                  >
                    Edit
                  </Button>
                )}
              </div>
              
              {isEditingInstructions ? (
                <div className="space-y-2">
                  <Textarea
                    value={tempInstructions}
                    onChange={(e) => setTempInstructions(e.target.value)}
                    placeholder="Enter specific instructions for this conversation..."
                    className="min-h-[100px] resize-none"
                    disabled={isLoadingInstructions}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveInstructions}
                      disabled={isLoadingInstructions}
                      className="flex-1"
                    >
                      {isLoadingInstructions ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditInstructions}
                      disabled={isLoadingInstructions}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="min-h-[60px] p-3 bg-gray-50 rounded-md">
                  {instructions ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {instructions}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No custom instructions set for this conversation.
                    </p>
                  )}
                </div>
              )}
            </div>
             {/* Jurisdiction Selection */}
            <div>
              <JurisdictionSelector
                value={currentJurisdiction}
                onChange={handleJurisdictionChange}
                disabled={isLoadingSettings}
                placeholder="Select legal jurisdiction..."
              />
            </div>

            {/* Documents Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Documents ({conversationDocuments?.length || 0})
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDocumentSelectionDialog(true)}
                  className="h-8 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              {/* Search Documents */}
              {conversationDocuments && conversationDocuments.length > 0 && (
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
                {isLoadingConversationDocuments ? (
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
                        <p className="text-sm font-medium truncate">{doc.title}</p>
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
                          <DropdownMenuItem onClick={() => handleViewDocument(doc.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadDocument(doc.id, doc.title)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
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
                ) : conversationDocuments && conversationDocuments.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">No documents added</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDocumentSelectionDialog(true)}
                      className="mt-2"
                    >
                      Add your first document
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No documents match your search</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

  {/* Document Modal */}
      <UploadDocumentModal
        open={showDocumentSelectionDialog}
        onOpenChange={setShowDocumentSelectionDialog}
        mode="upload-and-attach"
        conversationId={currentConversation?.id}
        projectId={projectId}
        onDocumentsAdded={handleDocumentsAdded}
        title="Add Documents to Conversation"
        description="Select existing documents or upload new ones to add to this conversation."
      />

      {/* Remove Document Confirmation */}
      <RemoveConfirmationDialog
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
        onConfirm={handleRemoveDocument}
        itemName={documentToDelete?.name}
        contextName="this conversation"
        isLoading={isRemovingDocument}
      />
    </>
  );
}