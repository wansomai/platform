"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FileText, 
  Bot, 
  Settings, 
  Search, 
  Plus, 
  Link as LinkIcon,
  FileQuestion,
  BookOpen,
  Save
} from "lucide-react"
import { useChatStore } from "@/store/chat.store"
import { useProjectStore } from "@/store/project.store"
import { useUIStore } from "@/store/ui.store"

export function ConversationDetails() {
  const params = useParams()
  const projectId = params.id as string
  
  const [activeTab, setActiveTab] = useState("context")
  const [searchTerm, setSearchTerm] = useState("")
  const [instructions, setInstructions] = useState("")
  const [isEditingInstructions, setIsEditingInstructions] = useState(false)
  
  const { currentProject } = useProjectStore()
  const { currentConversation } = useChatStore()
  const { addToast } = useUIStore()
  
  // Filter documents based on search term
  const filteredDocuments = currentProject?.knowledge_base?.documents?.filter(
    doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []
  
  // Handlers for instructions
  const saveInstructions = () => {
    // In a real implementation, this would save to the API
    setIsEditingInstructions(false)
    addToast({
      message: "Instructions saved successfully",
      type: "success"
    })
  }
  
  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="flex justify-start border-b rounded-none px-4">
          <TabsTrigger value="context">Context</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          {/* Context Tab */}
          <TabsContent value="context" className="p-4 m-0 h-full">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search knowledge base"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Documents */}
              <div>
                <h3 className="font-medium text-sm mb-2">Project Documents</h3>
                <div className="space-y-2">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-secondary-50">
                        <Checkbox id={`doc-${doc.id}`} />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`doc-${doc.id}`} className="font-medium text-sm">
                            {doc.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">{doc.category}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? "No documents match your search" : "No documents available"}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">Instructions</h3>
                  {isEditingInstructions ? (
                    <Button variant="ghost" size="sm" onClick={saveInstructions}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingInstructions(true)}>
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
          
          {/* Actions Tab */}
          <TabsContent value="actions" className="p-4 m-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Available Actions</h3>
                <Button variant="ghost" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
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
                    <CardDescription className="text-xs">
                      Generate a document based on the conversation.
                    </CardDescription>
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
                    <CardDescription className="text-xs">
                      Research a legal question using external sources.
                    </CardDescription>
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
                    <CardDescription className="text-xs">
                      Create a summary of uploaded documents.
                    </CardDescription>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Use Action
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="p-4 m-0">
            <div className="space-y-4">
              <h3 className="font-medium">Assistant Settings</h3>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox id="use-all-docs" />
                  <div>
                    <Label htmlFor="use-all-docs" className="font-medium text-sm">
                      Include all documents
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      The assistant will consider all project documents for context.
                    </p>
                  </div>
                </div>
                
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
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}