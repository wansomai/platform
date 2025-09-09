// components/folder/FolderModal.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Folder } from 'lucide-react';

interface FolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, parentId: string | null) => Promise<void>;
  folders: Array<{ id: string; name: string; parentId?: string | null }>;
  editFolder?: { id: string; name: string; parentId: string | null } | null;
  title?: string;
}

export function FolderModal({
  open,
  onOpenChange,
  onSave,
  folders,
  editFolder = null,
  title = 'Create New Folder'
}: FolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Reset form when modal opens/closes or editFolder changes
  useEffect(() => {
    if (open) {
      if (editFolder) {
        setFolderName(editFolder.name);
        setParentId(editFolder.parentId);
      } else {
        setFolderName('');
        setParentId(null);
      }
      setError('');
    }
  }, [open, editFolder]);
  
  const handleSave = async () => {
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      await onSave(folderName, parentId);
      onOpenChange(false);
    } catch (err) {
      setError('Failed to save folder');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {error && (
            <div className="text-sm text-red-500 mb-2">{error}</div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="col-span-3"
              placeholder="Enter folder name"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parent" className="text-right">
              Parent
            </Label>
            <Select
              value={parentId || 'root'}
              onValueChange={(value) => setParentId(value === 'root' ? null : value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Root (No parent)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No parent)</SelectItem>
                {folders
                  .filter(f => !editFolder || f.id !== editFolder.id)
                  .map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : editFolder ? 'Update Folder' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}