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
import { ErrorAlert } from '@/components/ui/error-alert';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
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
  const { isLoading, error, execute, setError } = useAsyncOperation();

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
      setError(null);
    }
  }, [open, editFolder, setError]);

  // Real-time duplicate detection: check if a sibling at the same parent level has this name
  const isDuplicateName =
    folderName.trim().length > 0 &&
    folders.some(
      (f) =>
        f.name.toLowerCase() === folderName.trim().toLowerCase() &&
        (f.parentId ?? null) === (parentId ?? null) &&
        f.id !== editFolder?.id
    );

  const handleSave = async () => {
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    if (isDuplicateName) {
      setError(`A folder named "${folderName.trim()}" already exists here. Please choose a different name.`);
      return;
    }

    // execute() returns null on error (the store rethrows with the server message)
    // and the error is shown via ErrorAlert; the modal stays open.
    const result = await execute(async () => {
      return onSave(folderName, parentId);
    });

    // result is undefined on success (onSave returns void), null on error
    if (result !== null) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <ErrorAlert error={error} onDismiss={() => setError(null)} />

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="name"
                value={folderName}
                onChange={(e) => { setFolderName(e.target.value); setError(null); }}
                className={isDuplicateName ? 'border-red-400 focus-visible:ring-red-400' : ''}
                placeholder="Enter folder name"
              />
              {isDuplicateName && (
                <p className="text-xs text-red-600">
                  A folder with this name already exists here.
                </p>
              )}
            </div>
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
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || isDuplicateName}
          >
            {isLoading ? 'Saving...' : editFolder ? 'Update Folder' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
