'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PracticeArea, PRACTICE_AREA_LABELS, CreateAssociateInput, KnowledgeBaseStatusPayload } from '@/types/associates';
import { Plus, FileText, X } from 'lucide-react';
import { useAssociates } from '@/hooks/useAssociates';
import { useDocumentsStore } from '@/store/documents.store';
import { apiService } from '@/lib/api';
import { DraggableRulesList } from '@/components/associates/DraggableRulesList';
import { parseRulesForDisplay } from '@/lib/rulesFormatting';
import { AssociateSetupProgressModal } from '@/components/associates/AssociateSetupProgressModal';

interface CreateAssociateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (associate: any) => void;
}

export function CreateAssociateModal({ open, onClose, onSuccess }: CreateAssociateModalProps) {
  type SelectedKnowledgeFile = {
    file: File;
    source: 'upload' | 'vault';
    existingDocumentId?: string;
    existingTitle?: string;
  };
  const [formData, setFormData] = useState<CreateAssociateInput>({
    name: '',
    instructions: '',
    description: '',
    practiceAreas: [],
    knowledgeBase: []
  });
  const [selectedFiles, setSelectedFiles] = useState<SelectedKnowledgeFile[]>([]);
  const [error, setError] = useState('');
  const [kbStatus, setKbStatus] = useState<KnowledgeBaseStatusPayload | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupMessages, setSetupMessages] = useState<string[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createAssociate, isProcessing } = useAssociates();
  const { uploadDocument } = useDocumentsStore();

  const getExistingRootDocs = async (): Promise<Array<{ id: string; title: string }>> => {
    const res = await apiService.get<{ status: number; message: string; data: Array<{ id: string; title: string }> }>(
      '/api/documents?titlesOnly=true&folder=root'
    );
    return res.data ?? [];
  };

  const pushSetupMessage = (message: string) => {
    setSetupMessages((prev) => (prev[prev.length - 1] === message ? prev : [...prev, message]));
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setKbStatus(null);

    if (formData.practiceAreas.length === 0) {
      setError('Please select at least one practice area');
      return;
    }

    setShowSetupModal(true);
    setSetupComplete(false);
    setSetupMessages(['Initializing knowledge base setup...']);

    try {
      // Step 1: Upload files if any are selected
      const uploadedDocumentIds: string[] = [];

      if (selectedFiles.length > 0) {
        pushSetupMessage(`Preparing upload queue for [${selectedFiles.length}] knowledge base document(s)...`);
        const existingDocs = await getExistingRootDocs();
        const existingByTitle = new Map(existingDocs.map((d) => [d.title.toLowerCase(), d]));

        for (let i = 0; i < selectedFiles.length; i++) {
          const fileItem = selectedFiles[i];
          const file = fileItem.file;
          pushSetupMessage(`Uploading [${i + 1}] ${file.name}...`);
          const fileBaseName = file.name.replace(/\.[^/.]+$/, '');
          const existingDoc = existingByTitle.get(fileBaseName.toLowerCase());

          if (existingDoc) {
            uploadedDocumentIds.push(existingDoc.id);
            pushSetupMessage(`[${i + 1}] ${existingDoc.title} picked from vault.`);
            setSelectedFiles((prev) =>
              prev.map((item, idx) =>
                idx === i
                  ? {
                      ...item,
                      source: 'vault',
                      existingDocumentId: existingDoc.id,
                      existingTitle: existingDoc.title,
                    }
                  : item
              )
            );
            continue;
          }

          const fileFormData = new FormData();
          fileFormData.append('file', file);
          const uploadedDocument = await uploadDocument(fileFormData);
          if (!uploadedDocument) {
            throw new Error(`Failed to upload ${file.name}`);
          }
          uploadedDocumentIds.push(uploadedDocument.id);
          pushSetupMessage(`[${i + 1}] ${file.name} uploaded successfully.`);
        }
      }

      // Step 2: Create associate with uploaded document IDs
      const associateData = {
        ...formData,
        knowledgeBase: Array.from(new Set(uploadedDocumentIds))
      };

      pushSetupMessage(`Rules being retrieved from [${associateData.knowledgeBase.length}] knowledge base document(s)...`);
      const result = await createAssociate(associateData);

      if (result?.associate) {
        setKbStatus(result.knowledgeBaseStatus ?? null);
        const docStatuses = result.knowledgeBaseStatus?.documents ?? [];
        docStatuses.forEach((doc, index) => {
          const ruleMessage = doc.rulesGenerated
            ? `[${index + 1}] ${doc.title}: document rules ready to be used.`
            : `[${index + 1}] ${doc.title}: rules are still processing in background.`;
          pushSetupMessage(ruleMessage);
        });
        pushSetupMessage(`Your associate ${result.associate.name} is ready to be used fully with updated rules.`);
        setSetupComplete(true);
        await wait(1200);
        onSuccess(result.associate);
        resetForm(false);
      } else {
        setError('Failed to create associate');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload files or create associate');
      setShowSetupModal(false);
      setSetupMessages([]);
      setSetupComplete(false);
      return;
    }

    setShowSetupModal(false);
    setSetupMessages([]);
    setSetupComplete(false);
  };

  const resetForm = (clearStatus = true) => {
    setFormData({
      name: '',
      instructions: '',
      description: '',
      practiceAreas: [],
      knowledgeBase: []
    });
    setSelectedFiles([]);
    setError('');
    if (clearStatus) {
      setKbStatus(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const normalizeTitle = (value: string) => value.replace(/\.[^/.]+$/, '').trim().toLowerCase();

  const getRulesForFile = (fileItem: SelectedKnowledgeFile): string[] => {
    if (!kbStatus?.documents?.length) return [];
    const candidateTitles = [
      fileItem.existingTitle,
      fileItem.file.name,
      fileItem.file.name.replace(/\.[^/.]+$/, ''),
    ].filter(Boolean) as string[];
    const match = kbStatus.documents.find((doc) =>
      candidateTitles.some((title) => normalizeTitle(title) === normalizeTitle(doc.title))
    );
    return parseRulesForDisplay(match?.rulesForThinking);
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
      const newFiles = Array.from(files).map((file) => ({
        file,
        source: 'upload' as const,
      }));
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
      <AssociateSetupProgressModal
        open={showSetupModal}
        associateName={formData.name || 'Associate'}
        messages={setupMessages}
        isComplete={setupComplete}
      />
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
                  {selectedFiles.map((fileItem, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-[#E9F5F3] rounded-lg max-w-[420px]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#74C6B8] rounded-md p-1.5">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                              {fileItem.source === 'vault'
                                ? (fileItem.existingTitle || fileItem.file.name.replace(/\.[^/.]+$/, ''))
                                : fileItem.file.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {fileItem.source === 'vault' ? 'Picked from Vault' : 'Will be uploaded'}
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
                      {getRulesForFile(fileItem).length > 0 && (
                        <DraggableRulesList rules={getRulesForFile(fileItem)} />
                      )}
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
