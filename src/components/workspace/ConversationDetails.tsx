import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { useNotifications } from "@/hooks/useNotifications";
import { useConversationSettingsStore } from "@/store/conversation-settings.store";
import { DocumentSelectionModal } from "@/components/modals/DocumentSelectionModal";
import { DeleteConfirmationDialog } from "@/components/modals/DeleteConfirmationDialog";

export function ConversationDetails() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [activeTab, setActiveTab] = useState("context");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [isSettingChanged, setIsSettingChanged] = useState(false);
  
  // Document management state
  const [showDocumentSelectionDialog, setShowDocumentSelectionDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string; name: string} | null>(null);
  const [isRemovingDocument, setIsRemovingDocument] = useState(false);
  
  // Use the instructions store
  const { 
    instructions, 
    fetchInstructions, 
    saveInstructions, 
    setInstructions,
    isLoading: isLoadingInstructions 
  } = useConversationInstructionsStore();

  // Use the settings store
  const {
    settings,
    fetchSettings,
    updateSetting,
    isLoading: isLoadingSettings
  } = useConversationSettingsStore();
  
  // Hooks
  const { currentConversation } = useChatStore();
  const { 
    documents: conversationDocuments, 
    fetchConversationDocuments, 
    removeDocumentFromConversation,
    isLoading: isLoadingConversationDocuments
  } = useConversationDocumentsStore();
  const { notify } = useNotifications();
  
  // Fetch conversation documents, instructions and settings when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      fetchConversationDocuments(currentConversation.id);
      fetchInstructions(currentConversation.id);
      fetchSettings(currentConversation.id);
    }
  }, [currentConversation?.id, fetchConversationDocuments, fetchInstructions, fetchSettings]);
  
  // Filter documents based on search term
  const filteredDocuments = conversationDocuments?.filter(
    doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Handlers for instructions
  const handleSaveInstructions = async () => {
    if (!currentConversation) return;
    
    try {
      const success = await saveInstructions(currentConversation.id, instructions);
      
      if (success) {
        setIsEditingInstructions(false);
        notify.success("Instructions saved successfully");
      }
    } catch (error) {
      notify.error("Failed to save instructions");
      console.error("Error saving instructions:", error);
    }
  };
  
  // Handler for settings changes
  const handleSettingChange = async (settingKey: keyof typeof settings, value: boolean) => {
    if (!currentConversation) return;
    
    try {
      // Optimistically update the UI
      setIsSettingChanged(true);
      
      // Update the setting in the database
      const success = await updateSetting(currentConversation.id, settingKey, value);
      
      if (success) {
        notify.success(`${settingKey} setting updated`);
      } else {
        notify.error(`Failed to update ${settingKey} setting`);
      }
    } catch (error) {
      notify.error("Failed to save setting");
      console.error("Error saving setting:", error);
    } finally {
      setIsSettingChanged(false);
    }
  };
  
  // Handle document removal from conversation
  const handleRemoveDocument = async () => {
    if (!currentConversation?.id || !documentToDelete) return;
    
    try {
      setIsRemovingDocument(true);
      const success = await removeDocumentFromConversation(
        currentConversation.id, 
        documentToDelete.id
      );
      
      if (success) {
        notify.success("Document removed from conversation");
        setDocumentToDelete(null);
      }
    } catch (error) {
      notify.error("Failed to remove document");
      console.error("Error removing document:", error);
    } finally {
      setIsRemovingDocument(false);
    }
  };
  
  // Handle successful document addition
  const handleDocumentsAdded = (count: number) => {
    // Refresh the conversation documents
    if (currentConversation?.id) {
      fetchConversationDocuments(currentConversation.id);
    }
    
    // Show success message
    const message = count === 1 
      ? "Document added to conversation" 
      : `${count} documents added to conversation`;
    notify.success(message);
  };
  
  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="flex justify-center border-b rounded-none px-1">
          <TabsTrigger value="context">Context</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          {/* Context Tab */}
          <TabsContent value="context" className="p-4 m-0 h-full">
            <div className="space-y-4">
              {/* AI Settings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">AI Assistant Settings</h3>
                  {isSettingChanged && (
                    <span className="text-xs text-muted-foreground">Saving...</span>
                  )}
                </div>
                
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="cite-sources" 
                    checked={settings.citeSources}
                    disabled={isLoadingSettings || isSettingChanged}
                    onCheckedChange={(checked) => {
                      handleSettingChange('citeSources', checked === true);
                    }}
                  />
                  <div>
                    <Label htmlFor="cite-sources" className="font-medium text-sm">
                      Cite sources
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      The assistant will provide citations when referencing documents.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="suggest-actions" 
                    checked={settings.suggestActions}
                    disabled={isLoadingSettings || isSettingChanged}
                    onCheckedChange={(checked) => {
                      handleSettingChange('suggestActions', checked === true);
                    }}
                  />
                  <div>
                    <Label htmlFor="suggest-actions" className="font-medium text-sm">
                      Suggest actions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      The assistant will suggest relevant actions when appropriate.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="web-search" 
                    checked={settings.webSearch}
                    disabled={isLoadingSettings || isSettingChanged}
                    onCheckedChange={(checked) => {
                      handleSettingChange('webSearch', checked === true);
                    }}
                  />
                  <div>
                    <Label htmlFor="web-search" className="font-medium text-sm">
                      Enable web search
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow the assistant to search the web for information.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">Custom Instructions</h3>
                  {isEditingInstructions ? (
                    <Button variant="outline" size="sm" onClick={handleSaveInstructions} disabled={isLoadingInstructions}>
                      {isLoadingInstructions ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingInstructions(true)}>
                      Edit
                    </Button>
                  )}
                </div>
                
                {isEditingInstructions ? (
                  <Textarea 
                    value={instructions} 
                    onChange={(e) => setInstructions(e.target.value)} 
                    placeholder="Add specific instructions for the AI assistant..."
                    className="min-h-[120px]"
                  />
                ) : (
                  <div className="rounded-md border p-3 text-sm">
                    {instructions ? (
                      <p>{instructions}</p>
                    ) : (
                      <p className="text-muted-foreground">
                        No special instructions. Click 'Edit' to add specific guidance for the AI assistant.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents" className="p-4 m-0 h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">Active Documents</h3>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setShowDocumentSelectionDialog(true)} 
                    className="flex items-center" 
                    variant="outline" 
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Documents
                  </Button>
                </div>
              </div>
              
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search documents..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Document List */}
              <div className="space-y-2">
                {isLoadingConversationDocuments ? (
                  <p className="text-sm text-center py-4 text-muted-foreground">Loading documents...</p>
                ) : filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary-50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-primary-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">
                            {doc.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.fileType.toUpperCase()} · {formatBytes(doc.fileSize)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => {
                            setDocumentToDelete({
                              id: doc.id,
                              name: doc.title
                            });
                          }}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove from Context
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">No documents in this conversation</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {searchTerm ? "No documents match your search" : "Add documents to enhance the AI's responses"}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowDocumentSelectionDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Documents
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
      
      {/* Document Selection Modal */}
      {currentConversation && (
        <DocumentSelectionModal
          open={showDocumentSelectionDialog}
          onOpenChange={setShowDocumentSelectionDialog}
          conversationId={currentConversation.id}
          onDocumentsAdded={handleDocumentsAdded}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!documentToDelete}
        onOpenChange={(open) => {
          if (!open) setDocumentToDelete(null);
        }}
        onConfirm={handleRemoveDocument}
        variant="document"
        itemName={documentToDelete?.name}
        isLoading={isRemovingDocument}
      />
    </div>
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