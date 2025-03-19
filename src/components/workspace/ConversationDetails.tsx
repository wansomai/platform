import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Search, 
  Plus, 
  Upload,
  MoreVertical,
  Download,
  PenTool,
  Trash2,
  Eye,
  Save,
  BookOpen,
  FileQuestion,
  Sparkles,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useChatStore } from "@/store/chat.store";
import { useProjectStore } from "@/store/project.store";
import { useUIStore } from "@/store/ui.store";
import { useDocumentsStore } from "@/store/documents.store";
import { useConversationDocumentsStore } from "@/store/conversation-documents.store";
import { useConversationInstructionsStore } from "@/store/conversation-instructions.store";
import { useNotifications } from "@/hooks/useNotifications";

export function ConversationDetails() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [activeTab, setActiveTab] = useState("context");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  
  // Use the instructions store
  const { 
    instructions, 
    fetchInstructions, 
    saveInstructions, 
    setInstructions,
    isLoading: isLoadingInstructions 
  } = useConversationInstructionsStore();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDocumentSelectionDialog, setShowDocumentSelectionDialog] = useState(false);
  const [selectedDocumentsToAdd, setSelectedDocumentsToAdd] = useState<string[]>([]);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Hooks
  const { currentProject } = useProjectStore();
  const { currentConversation } = useChatStore();
  const { addToast } = useUIStore();
  const { documents, fetchDocuments, isLoading: isLoadingDocuments } = useDocumentsStore();
  const { 
    documents: conversationDocuments, 
    fetchConversationDocuments, 
    attachDocumentsToConversation,
    removeDocumentFromConversation,
    isLoading: isLoadingConversationDocuments
  } = useConversationDocumentsStore();
  const { notify } = useNotifications();
  
  // Fetch conversation documents and instructions when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      fetchConversationDocuments(currentConversation.id);
      fetchInstructions(currentConversation.id);
    }
  }, [currentConversation?.id, fetchConversationDocuments, fetchInstructions]);
  
  // Filter documents based on search term
  const filteredDocuments = conversationDocuments?.filter(
    doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Available documents for selection (excluding already attached ones)
  const availableDocuments = documents.filter(doc => 
    !conversationDocuments.some(convDoc => convDoc.id === doc.id)
  );
  
  // Filter available documents based on search
  const filteredAvailableDocuments = availableDocuments.filter(
    doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
    if (!currentConversation?.id || selectedDocumentsToAdd.length === 0) return;
    
    try {
      const success = await attachDocumentsToConversation(
        currentConversation.id, 
        selectedDocumentsToAdd
      );
      
      if (success) {
        notify.success("Documents added to conversation");
        setSelectedDocumentsToAdd([]);
        setShowDocumentSelectionDialog(false);
      }
    } catch (error) {
      notify.error("Failed to add documents");
      console.error("Error adding documents:", error);
    }
  };
  
  // Handle document removal from conversation
  const handleRemoveDocument = async () => {
    if (!currentConversation?.id || !documentToDelete) return;
    
    try {
      const success = await removeDocumentFromConversation(
        currentConversation.id, 
        documentToDelete
      );
      
      if (success) {
        notify.success("Document removed from conversation");
        setDocumentToDelete(null);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      notify.error("Failed to remove document");
      console.error("Error removing document:", error);
    }
  };
  
  // Load all documents when opening the document selection dialog
  const handleOpenDocumentSelection = () => {
    fetchDocuments();
    setShowDocumentSelectionDialog(true);
  };
  
  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="flex justify-center border-b rounded-none px-1">
          <TabsTrigger value="context">Context</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          {/* Context Tab */}
          <TabsContent value="context" className="p-4 m-0 h-full">
            <div className="space-y-4">
              {/* AI Settings */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">AI Assistant Settings</h3>
                
                <div className="flex items-start gap-2">
                  <Checkbox id="cite-sources" defaultChecked />
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
                  <Checkbox id="suggest-actions" defaultChecked />
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
                  <Checkbox id="web-search" />
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
                    onClick={handleOpenDocumentSelection} 
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
                            setDocumentToDelete(doc.id);
                            setShowDeleteConfirm(true);
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
                    <Button variant="outline" size="sm" onClick={handleOpenDocumentSelection}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Documents
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Actions Tab */}
          <TabsContent value="actions" className="p-4 m-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Available Actions</h3>
              </div>
              
              <div className="space-y-2">
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary-600" />
                      Generate Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground">
                      Generate a document based on the conversation.
                    </p>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Use Action
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm flex items-center">
                      <FileQuestion className="h-4 w-4 mr-2 text-primary-600" />
                      Research Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground">
                      Research a legal question using external sources.
                    </p>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Use Action
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-primary-600" />
                      Summarize Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground">
                      Create a summary of uploaded documents.
                    </p>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Use Action
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
      
      {/* Document Selection Dialog */}
      <Dialog open={showDocumentSelectionDialog} onOpenChange={setShowDocumentSelectionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Documents to Conversation</DialogTitle>
            <DialogDescription>
              Select documents from your vault to provide context to the AI assistant.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 overflow-x-hidden">
            <div className="relative mb-4">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search documents..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="h-[300px] overflow-y-auto  border rounded-md">
              {isLoadingDocuments ? (
                <p className="text-sm text-center py-4 text-muted-foreground">Loading documents...</p>
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
                      <Checkbox 
                        checked={selectedDocumentsToAdd.includes(doc.id)}
                        className="mr-3"
                        onCheckedChange={() => toggleDocumentSelection(doc.id)}
                      />
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
                <p className="text-sm text-center py-4 text-muted-foreground">
                  {searchTerm ? "No documents match your search" : "No documents available"}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentSelectionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSelectedDocuments}
              disabled={selectedDocumentsToAdd.length === 0}
            >
              Add Selected ({selectedDocumentsToAdd.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this document from the conversation context?
              The document will still be available in your vault.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveDocument}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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