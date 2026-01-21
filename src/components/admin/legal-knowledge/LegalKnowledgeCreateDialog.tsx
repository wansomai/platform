'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
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
import { apiService } from '@/lib/api';
import type { LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';
import { PracticeArea } from '@/prisma/client';

interface LegalKnowledgeCreateDialogProps {
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

export function LegalKnowledgeCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: LegalKnowledgeCreateDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<LegalKnowledgeType>('TEMPLATE');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('KENYA_NATIONAL');
  const [practiceAreas, setPracticeAreas] = useState<PracticeArea[]>([]);
  const [sourceReference, setSourceReference] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter content');
      return;
    }

    setIsCreating(true);

    try {
      const tagsArray = tags.trim()
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await apiService.post(
        '/api/admin/legal-knowledge',
        {
          title: title.trim(),
          description: description.trim() || undefined,
          content: content.trim(),
          type,
          jurisdiction,
          practiceAreas: practiceAreas.length > 0 ? practiceAreas : undefined,
          sourceReference: sourceReference.trim() || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      toast.success('Legal knowledge created successfully. Processing in background.');
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContent('');
    setType('TEMPLATE');
    setJurisdiction('KENYA_NATIONAL');
    setPracticeAreas([]);
    setSourceReference('');
    setTags('');
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
          <DialogTitle>Create Legal Knowledge</DialogTitle>
          <DialogDescription>
            Create a new legal knowledge entry by pasting or typing text content directly.
            The content will be processed and split into chunks for RAG retrieval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="create-title">Title *</Label>
            <Input
              id="create-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Non-Disclosure Agreement Template"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="create-description">Description</Label>
            <Textarea
              id="create-description"
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

          {/* Content */}
          <div>
            <Label htmlFor="create-content">Content *</Label>
            <Textarea
              id="create-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type the full legal document content here..."
              className="mt-1 font-mono text-sm"
              rows={12}
            />
            <p className="text-xs text-gray-500 mt-1">
              {content.length.toLocaleString()} characters
            </p>
          </div>

          {/* Source Reference */}
          <div>
            <Label htmlFor="create-sourceReference">Source Reference / Citation</Label>
            <Input
              id="create-sourceReference"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              placeholder="e.g., Contract Act, Cap 23, Laws of Kenya"
              className="mt-1"
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="create-tags">Tags (comma-separated)</Label>
            <Input
              id="create-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., nda, confidentiality, software"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating || !title.trim() || !content.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
