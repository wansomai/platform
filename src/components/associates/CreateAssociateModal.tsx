'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PracticeArea, PRACTICE_AREA_LABELS, CreateAssociateInput } from '@/types/associates';
import { Plus, FileText, X } from 'lucide-react';
import { useAssociates } from '@/hooks/useAssociates';

interface CreateAssociateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (associate: any) => void;
}

export function CreateAssociateModal({ open, onClose, onSuccess }: CreateAssociateModalProps) {
  const [formData, setFormData] = useState<CreateAssociateInput>({
    name: '',
    instructions: '',
    description: '',
    practiceAreas: [],
    knowledgeBase: []
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createAssociate, isProcessing } = useAssociates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.practiceAreas.length === 0) {
      setError('Please select at least one practice area');
      return;
    }

    try {
      // Step 1: Upload files if any are selected
      const uploadedDocumentIds: string[] = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);

          const response = await fetch('/api/documents', {
            method: 'POST',
            body: fileFormData
          });

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          const result = await response.json();
          uploadedDocumentIds.push(result.data.id);
        }
      }

      // Step 2: Create associate with uploaded document IDs
      const associateData = {
        ...formData,
        knowledgeBase: uploadedDocumentIds
      };

      const newAssociate = await createAssociate(associateData);

      if (newAssociate) {
        onSuccess(newAssociate);
        resetForm();
      } else {
        setError('Failed to create associate');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload files or create associate');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      instructions: '',
      description: '',
      practiceAreas: [],
      knowledgeBase: []
    });
    setSelectedFiles([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePracticeArea = (area: PracticeArea) => {
    setFormData(prev => ({
      ...prev,
      practiceAreas: prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter(a => a !== area)
        : [...prev.practiceAreas, area]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFilesClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create AI Associate</DialogTitle>
          <DialogDescription>
            Create a specialized AI associate to handle specific practice areas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <Label htmlFor="name">Associate Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Tax Associate, M&A Specialist"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Brief Description</Label>
            <Input
              id="description"
              placeholder="A short description of this associate's role"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Practice Areas */}
          <div>
            <Label>Practice Areas * (select at least one)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {Object.entries(PRACTICE_AREA_LABELS).map(([area, label]) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={area}
                    checked={formData.practiceAreas.includes(area as PracticeArea)}
                    onCheckedChange={() => togglePracticeArea(area as PracticeArea)}
                  />
                  <label htmlFor={area} className="text-sm cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
            {formData.practiceAreas.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formData.practiceAreas.length} selected
              </p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Instructions & Expertise *</Label>
            <Textarea
              id="instructions"
              placeholder="Describe this associate's expertise, approach, and how they should handle questions..."
              value={formData.instructions}
              onChange={e => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              These instructions will guide the AI associate's responses
            </p>
          </div>

          {/* Knowledge Base */}
          <div>
            <Label className="flex items-center gap-2">
              Knowledge Base
            </Label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Add files button */}
            <div
              className="mt-2 flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={handleAddFilesClick}
            >
              <span className="text-muted-foreground">
                Add files for your associate to reference
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#E9F5F3] rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-[#74C6B8] rounded-md p-1.5">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                            {file.name}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="hover:bg-blue-100 rounded-full p-1 transition-colors"
                        type="button"
                      >
                        <X className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? 'Creating...' : 'Create Associate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
