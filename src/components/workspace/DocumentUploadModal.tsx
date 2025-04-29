// components/workspace/DocumentUploadModal.tsx - updated with folder selection
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, UploadCloud, RefreshCw, Folder } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDocumentsStore } from "@/store/documents.store";
import { useUIStore } from "@/store/ui.store";
import { useFolderStore } from "@/store/folder.store"; // New store for folders

export function DocumentUploadModal() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument } = useDocumentsStore();
  const { addToast } = useUIStore();
  const { folders, fetchFolders } = useFolderStore();

  // File size limit: 5MB (Vercel free tier limit)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Fetch folders when dialog opens
  useEffect(() => {
    if (showUploadDialog) {
      fetchFolders();
    }
  }, [showUploadDialog, fetchFolders]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFile(null);
      setSizeError(false);
      return;
    }
    
    const selectedFile = files[0];
    
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setSizeError(true);
      setFile(null);
    } else {
      setSizeError(false);
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    // Double-check file size
    if (file.size > MAX_FILE_SIZE) {
      setSizeError(true);
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Add folder ID if selected
      if (selectedFolder) {
        formData.append('folderId', selectedFolder);
      }
      
      // Upload the file
      const document = await uploadDocument(formData, (progress) => {
        setUploadProgress(progress);
      });
      
      if (document) {
        addToast({
          message: `${file.name} has been uploaded successfully.`,
          type: "success"
        });
        
        // Reset form
        setShowUploadDialog(false);
        setFile(null);
        setSelectedFolder(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Upload failed";
      
      addToast({
        message: errorMsg,
        type: "error"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Reset error when dialog is closed
  useEffect(() => {
    if (!showUploadDialog) {
      setSizeError(false);
      setFile(null);
      setSelectedFolder(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [showUploadDialog]);

  // Format folders for display in dropdown
  const formatFoldersForSelect = () => {
    // Create a recursive function to format folders with proper indentation
    const formatFolder = (folder: any, depth = 0) => {
      const indent = "—".repeat(depth);
      return {
        id: folder.id,
        label: `${indent} ${indent ? ' ' : ''}${folder.name}`,
      };
    };

    // Format all folders
    const formattedFolders: Array<{ id: string; label: string }> = [];
    
    // Add root option
    formattedFolders.push({ id: "root", label: "Root" });
    
    // Add all folders with proper indentation
    const processFolder = (folder: any, depth = 0) => {
      formattedFolders.push(formatFolder(folder, depth));
      
      if (folder.children && folder.children.length > 0) {
        folder.children.forEach((child: any) => {
          processFolder(child, depth + 1);
        });
      }
    };
    
    folders.forEach(folder => processFolder(folder));
    
    return formattedFolders;
  };

  return (
    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {sizeError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                File size exceeds the 5MB limit. Please upgrade your plan to upload larger files or select a smaller file.
              </AlertDescription>
            </Alert>
          )}
          
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
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  Size: {formatFileSize(file.size)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder" className="text-right">
              Folder
            </Label>
            <div className="col-span-3">
              <Select
                value={selectedFolder || "root"}
                onValueChange={(value) => setSelectedFolder(value === "root" ? null : value)}
                disabled={uploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">No folder (Root)</SelectItem>
                  {formatFoldersForSelect().map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {uploading && (
            <div className="mt-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center mt-1">{uploadProgress}%</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setShowUploadDialog(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!file || uploading || sizeError}
          >
            {uploading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}