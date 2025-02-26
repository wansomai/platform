import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export function DocumentUploadModal() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    // Implement file upload logic here
    console.log("Uploading file:", file)
    // Reset the file state after upload
    setFile(null)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document to the project. Supported file types: PDF, DOCX, XLSX.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              File
            </Label>
            <Input id="file" type="file" className="col-span-3" onChange={handleFileChange} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleUpload} disabled={!file}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

