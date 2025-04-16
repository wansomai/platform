import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, UploadCloud, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDocumentsStore } from "@/store/documents.store";
import { useUIStore } from "@/store/ui.store";

export function DocumentUploadModal() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument } = useDocumentsStore();
  const { addToast } = useUIStore();

  // File size limit: 5MB (Vercel free tier limit)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [showUploadDialog]);

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
          {/* <DialogDescription>
            Upload a new document to the project. Maximum file size: 5MB.
          </DialogDescription> */}
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