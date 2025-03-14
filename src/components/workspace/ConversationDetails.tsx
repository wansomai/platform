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
  Save,
  Upload,
  Mail,
  Calendar as CalendarIcon, 
  MessageSquare as SlackIcon, 
  FolderOpen as DropboxIcon, 
  Video as ZoomIcon,
  Github,
  FileSpreadsheet as ExcelIcon,
  Database as SqlIcon,
  PanelRight as ApiIcon,
  MoreVertical,
  Download,
  PenTool,
  Trash2,
  Eye,
  UserPlus,
  Users,
  Star,
  Shield,
  UserCircle,
  X,
  Send
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from '@/components/ui/switch';
import { useChatStore } from "@/store/chat.store"
import { useProjectStore } from "@/store/project.store"
import { useUIStore } from "@/store/ui.store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function ConversationDetails() {
  const params = useParams()
  const projectId = params.id as string
  
  const [activeTab, setActiveTab] = useState("context")
  const [searchTerm, setSearchTerm] = useState("")
  const [instructions, setInstructions] = useState("")
  const [isEditingInstructions, setIsEditingInstructions] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [selectedRole, setSelectedRole] = useState("member")
  
  const { currentProject } = useProjectStore()
  const { addToast, openUploadModal } = useUIStore()
  
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
  
  const handleUpload = () => {
    // In a real implementation, this would handle the upload
    setActiveModal(null)
    addToast({
      message: "Document uploaded successfully",
      type: "success"
    })
  }
  
  const handleViewDocument = (docId: string) => {
    // In a real implementation, this would open the document
    addToast({
      message: "Viewing document",
      type: "info"
    })
  }
  
  const handleDownloadDocument = (docId: string) => {
    // In a real implementation, this would download the document
    addToast({
      message: "Document download started",
      type: "info"
    })
  }
  
  const handleRenameDocument = (docId: string) => {
    // In a real implementation, this would show a rename dialog
    addToast({
      message: "Document renamed",
      type: "success"
    })
  }
  
  const handleDeleteDocument = (docId: string) => {
    // In a real implementation, this would show a confirmation dialog
    addToast({
      message: "Document deleted",
      type: "success"
    })
  }
  
  const handleInviteMember = () => {
    // In a real implementation, this would send an invite
    if (!inviteEmail) return
    
    setActiveModal(null)
    setInviteEmail("")
    
    addToast({
      message: `Invitation sent to ${inviteEmail}`,
      type: "success"
    })
  }
  
  const handleRemoveMember = (memberId: string) => {
    // In a real implementation, this would remove the member
    addToast({
      message: "Team member removed",
      type: "success"
    })
  }
  

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="flex justify-start border-b rounded-none px-1">
          <TabsTrigger value="context">Context</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          {/* Context Tab */}
          <TabsContent value="context" className="p-4 m-0 h-full">
            <div className="space-y-4">
      
              
              {/* Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">Instructions</h3>
                  {isEditingInstructions ? (
                    <Button variant="outline" size="sm" onClick={saveInstructions}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
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
          
          {/* Library Tab */}
          <TabsContent value="library" className="p-4 m-0 h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">Documents</h3>
                <Button onClick={() => setActiveModal("upload")} className="flex items-center" variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
              <div className="space-y-2">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary-50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-primary-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">
                            {doc.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{doc.category}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <PenTool className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? "No documents match your search" : "No documents available"}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Team Tab */}
          <TabsContent value="team" className="p-4 m-0 h-full">
            <div className="space-y-4">
            {currentProject&&currentProject?.knowledge_base?.team?.length > 0 &&( 
              <Button onClick={() => setActiveModal("invite")} className="flex items-center" variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
              <h3 className="font-medium text-sm mb-2">Team Members</h3>
              <div className="space-y-2">
                {currentProject&&currentProject?.knowledge_base?.team?.length > 0 ? (
                  <div className="space-y-2">
                    {currentProject?.knowledge_base?.team?.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary-50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-medium text-sm">
                            {member.name.split(' ').map(name => name[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary flex items-center">
                        {member.role === "admin" && <Shield className="h-3 w-3 mr-1 text-primary-600" />}
                        {member.role === "member" && <Users className="h-3 w-3 mr-1 text-blue-600" />}
                        {member.role === "viewer" && <Eye className="h-3 w-3 mr-1 text-green-600" />}
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="h-4 w-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Make Viewer
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveMember(member.id)}>
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}</div>
                ): (
                  <div className="text-center p-8 border border-dashed rounded-md">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">No team members yet</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Invite team members to collaborate on this project
                    </p>
                    <Button onClick={() => setActiveModal("invite")} variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
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
                {/* <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button> */}
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
            </div>
          </TabsContent>
          
          {/* Integrations Tab */}
          <TabsContent value="integrations" className="p-4 m-0">
            <h3 className="font-medium mb-4">Available Integrations</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm">Gmail</span>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm">Calendar</span>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  <SlackIcon className="h-4 w-4 mr-2 text-purple-600" />
                  <span className="text-sm">Slack</span>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  <DropboxIcon className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">Dropbox</span>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  <ZoomIcon className="h-4 w-4 mr-2 text-blue-700" />
                  <span className="text-sm">Zoom</span>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  <Github className="h-4 w-4 mr-2 text-gray-800" />
                  <span className="text-sm">GitHub</span>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  <ExcelIcon className="h-4 w-4 mr-2 text-green-700" />
                  <span className="text-sm">Excel Online</span>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  <SqlIcon className="h-4 w-4 mr-2 text-orange-600" />
                  <span className="text-sm">SQL Database</span>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  <ApiIcon className="h-4 w-4 mr-2 text-indigo-600" />
                  <span className="text-sm">Custom API</span>
                </div>
                <Switch />
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
      
      {/* Upload Document Dialog */}
      <Dialog open={activeModal === "upload"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document to add to the project library.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <Input id="file" type="file" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="e.g., Contracts, Research, Notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Invite Team Member Dialog */}
      <Dialog open={activeModal === "invite"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to collaborate on this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="colleague@example.com" 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={`border rounded-md p-3 cursor-pointer transition-colors flex flex-col items-center ${
                    selectedRole === "admin" ? "border-primary bg-primary-50" : "hover:border-primary"
                  }`}
                  onClick={() => setSelectedRole("admin")}
                >
                  <Shield className="h-5 w-5 mb-1 text-primary-600" />
                  <span className="text-sm">Admin</span>
                </div>
                <div
                  className={`border rounded-md p-3 cursor-pointer transition-colors flex flex-col items-center ${
                    selectedRole === "member" ? "border-primary bg-primary-50" : "hover:border-primary"
                  }`}
                  onClick={() => setSelectedRole("member")}
                >
                  <Users className="h-5 w-5 mb-1 text-blue-600" />
                  <span className="text-sm">Member</span>
                </div>
                <div
                  className={`border rounded-md p-3 cursor-pointer transition-colors flex flex-col items-center ${
                    selectedRole === "viewer" ? "border-primary bg-primary-50" : "hover:border-primary"
                  }`}
                  onClick={() => setSelectedRole("viewer")}
                >
                  <Eye className="h-5 w-5 mb-1 text-green-600" />
                  <span className="text-sm">Viewer</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedRole === "admin" && "Can manage team, edit all content, and change settings."}
                {selectedRole === "member" && "Can add and edit content, but can't manage team or settings."}
                {selectedRole === "viewer" && "Can only view content, but not edit or change anything."}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={!inviteEmail}>
              <Send className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}