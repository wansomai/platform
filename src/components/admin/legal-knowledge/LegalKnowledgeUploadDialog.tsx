'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';
import { PracticeArea } from '@/prisma/client';

interface LegalKnowledgeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const LEGAL_KNOWLEDGE_TYPES: { value: LegalKnowledgeType; label: string }[] = [
  { value: 'TEMPLATE', label: 'Template' },
  { value: 'CASE_LAW', label: 'Case Law' },
  { value: 'STATUTE', label: 'Statute' },
  { value: 'REGULATION', label: 'Regulation' },
  { value: 'LEGAL_OPINION', label: 'Legal Opinion' },
  { value: 'PRACTICE_GUIDE', label: 'Practice Guide' },
];

const JURISDICTIONS: { value: Jurisdiction; label: string }[] = [
  { value: 'KENYA_NATIONAL', label: 'Kenya (National)' },
  { value: 'KENYA_NAIROBI', label: 'Kenya (Nairobi)' },
  { value: 'INTERNATIONAL', label: 'International' },
  { value: 'GENERAL', label: 'General' },
];

const PRACTICE_AREAS: { value: PracticeArea; label: string }[] = [
  { value: 'CONTRACTS_COMMERCIAL', label: 'Contracts & Commercial' },
  { value: 'CORPORATE_GOVERNANCE', label: 'Corporate Governance' },
  { value: 'EMPLOYMENT_LABOR', label: 'Employment & Labor' },
  { value: 'INTELLECTUAL_PROPERTY', label: 'Intellectual Property' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'LITIGATION_DISPUTE_RESOLUTION', label: 'Litigation' },
  { value: 'BANKING_FINANCE', label: 'Banking & Finance' },
  { value: 'MERGERS_AND_ACQUISITIONS', label: 'M&A' },
  { value: 'TAX_LAW', label: 'Tax Law' },
  { value: 'COMPLIANCE_REGULATORY', label: 'Compliance & Regulatory' },
];

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.txt';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function LegalKnowledgeUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: LegalKnowledgeUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<LegalKnowledgeType>('TEMPLATE');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('KENYA_NATIONAL');
  const [practiceAreas, setPracticeAreas] = useState<PracticeArea[]>([]);
  const [sourceReference, setSourceReference] = useState('');
  const [tags, setTags] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    // Auto-fill title from filename if empty
    if (!title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    if (droppedFile.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const ext = droppedFile.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc', 'txt'].includes(ext || '')) {
      toast.error('Invalid file type. Please upload PDF, DOCX, DOC, or TXT files.');
      return;
    }

    setFile(droppedFile);
    if (!title) {
      const nameWithoutExt = droppedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('type', type);
      formData.append('jurisdiction', jurisdiction);

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      if (practiceAreas.length > 0) {
        formData.append('practiceAreas', JSON.stringify(practiceAreas));
      }

      if (sourceReference.trim()) {
        formData.append('sourceReference', sourceReference.trim());
      }

      if (tags.trim()) {
        const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
        formData.append('tags', JSON.stringify(tagsArray));
      }

      const response = await fetch('/api/admin/legal-knowledge/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      toast.success('File uploaded successfully. Processing in background.');
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setType('TEMPLATE');
    setJurisdiction('KENYA_NATIONAL');
    setPracticeAreas([]);
    setSourceReference('');
    setTags('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePracticeArea = (area: PracticeArea) => {
    setPracticeAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : [...prev, area]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Legal Document</DialogTitle>
          <DialogDescription>
            Upload a PDF, DOCX, or TXT file to add to the legal knowledge base.
            The document will be processed and split into chunks for RAG retrieval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label>Document File</Label>
            <div
              className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Drag and drop a file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOCX, DOC, or TXT (max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Non-Disclosure Agreement Template"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this document..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Type and Jurisdiction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as LegalKnowledgeType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_KNOWLEDGE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jurisdiction *</Label>
              <Select value={jurisdiction} onValueChange={(v) => setJurisdiction(v as Jurisdiction)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map((j) => (
                    <SelectItem key={j.value} value={j.value}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Practice Areas */}
          <div>
            <Label>Practice Areas</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PRACTICE_AREAS.map((area) => (
                <Badge
                  key={area.value}
                  variant={practiceAreas.includes(area.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => togglePracticeArea(area.value)}
                >
                  {area.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Source Reference */}
          <div>
            <Label htmlFor="sourceReference">Source Reference / Citation</Label>
            <Input
              id="sourceReference"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              placeholder="e.g., Contract Act, Cap 23, Laws of Kenya"
              className="mt-1"
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., nda, confidentiality, software"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading || !file || !title.trim()}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
