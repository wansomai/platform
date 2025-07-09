"use client"

import { useState, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical,
  UploadCloud,
  File,
  FileSpreadsheet,
  FileImage,
  PenTool
} from "lucide-react"
import { useProjectStore } from "@/store/project.store"
import { useUIStore } from "@/store/ui.store"
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'
import { useDocumentsStore } from "@/store/documents.store"

export function Documents() {
  const params = useParams()
  const projectId = params.id as string
  
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { currentProject,deleteDocument, isLoading } = useProjectStore()
  const { uploadDocument } = useDocumentsStore()
  const { addToast } = useUIStore()
  const { data: session } = useSession()
  
  // Get documents from current project
  const documents = currentProject?.knowledge_base?.documents || []
  
  // Filter documents based on search term and active tab
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeTab === "all" || doc.category === activeTab
    return matchesSearch && matchesCategory
  })
  
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !session?.user?.id) return
    
    const file = files[0]
    setUploading(true)
    setUploadProgress(0)
    const formData = new FormData();
    formData.append('file', file);
    try {
      await uploadDocument(formData)
      
      addToast({
        message: `${file.name} uploaded successfully`,
        type: "success"
      })
      setShowUploadDialog(false)
    } catch (error) {
      addToast({
        message: `Failed to upload ${file.name}`,
        type: "error"
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }
  
  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(projectId, documentId)
      addToast({
        message: "Document deleted successfully",
        type: "success"
      })
    } catch (error) {
      addToast({
        message: "Failed to delete document",
        type: "error"
      })
    }
  }
  
  // File icon based on file type
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileImage className="h-4 w-4 text-blue-500" />
      case 'doc':
      case 'docx':
        return <File className="h-4 w-4 text-blue-600" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }
  
  // Format file size
  const formatFileSize = (sizeInBytes: number) => {
    const kb = sizeInBytes / 1024
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`
    }
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }
  
  // Document categories
  const categories = [
    { id: "all", label: "All Documents" },
    { id: "evidence", label: "Evidence" },
    { id: "pleadings", label: "Pleadings" },
    { id: "correspondence", label: "Correspondence" },
    { id: "contracts", label: "Contracts" },
    { id: "research", label: "Research" },
  ]
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Documents</h2>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a new document to the project. Supported file types: PDF, DOCX, XLSX, etc.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evidence">Evidence</SelectItem>
                    <SelectItem value="pleadings">Pleadings</SelectItem>
                    <SelectItem value="correspondence">Correspondence</SelectItem>
                    <SelectItem value="contracts">Contracts</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">
                  File
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="file" 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="mt-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-center mt-1">{uploadProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowUploadDialog(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>{cat.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    <p className="text-sm text-gray-500">Loading documents...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">
                      {searchTerm ? "No documents match your search" : "No documents yet"}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowUploadDialog(true)}
                    >
                      <UploadCloud className="h-4 w-4 mr-2" />
                      Upload a document
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {getFileIcon(doc.file_type)}
                      <span className="ml-2">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.category}</TableCell>
                  <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}</TableCell>
                  <TableCell>{doc.uploaded_by}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <PenTool className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteDocument(doc.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}