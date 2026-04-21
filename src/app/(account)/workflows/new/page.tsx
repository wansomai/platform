'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  PracticeArea,
  PRACTICE_AREA_LABELS,
  CreateAssociateInput,
  KnowledgeBaseStatusPayload,
  AIAssociate,
} from '@/types/associates';
import { Plus, FileText, X, CircleChevronLeft, Loader2, MessageSquare, RotateCcw } from 'lucide-react';
import { useAssociates } from '@/hooks/useAssociates';
import { Card, CardContent } from '@/components/ui/card';
import { useDocumentsStore } from '@/store/documents.store';
import { useProjectStore } from '@/store/project.store';
import { useChatStore } from '@/store/chat.store';
import { useProfile } from '@/store/profile.store';
import { apiService } from '@/lib/api';
import { DraggableRulesList } from '@/components/associates/DraggableRulesList';
import { parseRulesForDisplay } from '@/lib/rulesFormatting';
import { AssociateSetupProgressModal } from '@/components/associates/AssociateSetupProgressModal';
import { useNotifications } from '@/hooks/useNotifications';

type SelectedKnowledgeFile = {
  file: File;
  source: 'upload' | 'vault';
  existingDocumentId?: string;
  existingTitle?: string;
};

const emptyForm = (): CreateAssociateInput => ({
  name: '',
  instructions: '',
  description: '',
  practiceAreas: [],
  knowledgeBase: [],
});

export default function CreateAssociatePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { user: profile } = useProfile();
  const { notify } = useNotifications();
  const { createProject } = useProjectStore();
  const { createConversation } = useChatStore();

  const [formData, setFormData] = useState<CreateAssociateInput>(emptyForm());
  const [selectedFiles, setSelectedFiles] = useState<SelectedKnowledgeFile[]>([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [kbStatus, setKbStatus] = useState<KnowledgeBaseStatusPayload | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupMessages, setSetupMessages] = useState<string[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tracks the associate after first successful creation
  const [savedAssociate, setSavedAssociate] = useState<AIAssociate | null>(null);
  const [savedFormData, setSavedFormData] = useState<CreateAssociateInput>(emptyForm());
  const [savedFiles, setSavedFiles] = useState<SelectedKnowledgeFile[]>([]);

  const { createAssociate, updateAssociate, isProcessing } = useAssociates();
  const { uploadDocument } = useDocumentsStore();

  // Detect unsaved changes relative to the last saved snapshot
  const hasChanges = useMemo(() => {
    if (!savedAssociate) return false;
    const sortedCurrent = [...formData.practiceAreas].sort().join(',');
    const sortedSaved = [...savedFormData.practiceAreas].sort().join(',');
    return (
      formData.name !== savedFormData.name ||
      formData.description !== savedFormData.description ||
      formData.instructions !== savedFormData.instructions ||
      sortedCurrent !== sortedSaved ||
      selectedFiles.length !== savedFiles.length
    );
  }, [formData, selectedFiles, savedAssociate, savedFormData, savedFiles]);

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

  // Upload queued files and return document IDs
  const uploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    pushSetupMessage(`Preparing upload queue for [${selectedFiles.length}] knowledge base document(s)...`);
    setIsUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    const existingDocs = await getExistingRootDocs();
    const existingByTitle = new Map(existingDocs.map((d) => [d.title.toLowerCase(), d]));
    const uploadedIds: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileItem = selectedFiles[i];
      const file = fileItem.file;
      pushSetupMessage(`Uploading [${i + 1}] ${file.name}...`);
      setUploadProgress({ current: i + 1, total: selectedFiles.length });

      const fileBaseName = file.name.replace(/\.[^/.]+$/, '');
      const existingDoc = existingByTitle.get(fileBaseName.toLowerCase());
      if (existingDoc) {
        uploadedIds.push(existingDoc.id);
        pushSetupMessage(`[${i + 1}] ${existingDoc.title} picked from vault.`);
        setSelectedFiles((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, source: 'vault', existingDocumentId: existingDoc.id, existingTitle: existingDoc.title }
              : item
          )
        );
        continue;
      }

      const fileFormData = new FormData();
      fileFormData.append('file', file);
      const uploadedDocument = await uploadDocument(fileFormData);
      if (!uploadedDocument) throw new Error(`Failed to upload ${file.name}`);
      uploadedIds.push(uploadedDocument.id);
      pushSetupMessage(`[${i + 1}] ${file.name} uploaded successfully.`);
    }

    setIsUploading(false);
    setUploadProgress(null);
    return uploadedIds;
  };

  const handleCreate = async () => {
    setShowSetupModal(true);
    setSetupComplete(false);
    setSetupMessages(['Initializing knowledge base setup...']);

    const uploadedIds = await uploadFiles();
    const associateData = { ...formData, knowledgeBase: Array.from(new Set(uploadedIds)) };

    pushSetupMessage(`Rules being retrieved from [${associateData.knowledgeBase.length}] knowledge base document(s)...`);
    const result = await createAssociate(associateData);
    if (!result?.associate) throw new Error('Failed to create associate');

    setKbStatus(result.knowledgeBaseStatus ?? null);
    (result.knowledgeBaseStatus?.documents ?? []).forEach((doc, i) => {
      pushSetupMessage(
        doc.rulesGenerated
          ? `[${i + 1}] ${doc.title}: document rules ready to be used.`
          : `[${i + 1}] ${doc.title}: rules are still processing in background.`
      );
    });

    pushSetupMessage(`Your associate ${result.associate.name} is ready to be used fully with updated rules.`);
    setSetupComplete(true);
    await wait(1200);

    // Snapshot the saved state so future edits are detected
    setSavedAssociate(result.associate);
    setSavedFormData({ ...formData });
    setSavedFiles([...selectedFiles]);
  };

  const handleUpdate = async () => {
    if (!savedAssociate) return;

    setShowSetupModal(true);
    setSetupComplete(false);
    setSetupMessages(['Updating associate...']);

    const uploadedIds = await uploadFiles();
    const updateData = { ...formData, knowledgeBase: Array.from(new Set(uploadedIds)) };

    pushSetupMessage('Applying changes...');
    const result = await updateAssociate(savedAssociate.id, updateData);
    if (!result?.associate) throw new Error('Failed to update associate');

    pushSetupMessage(`${result.associate.name} updated successfully.`);
    setSetupComplete(true);
    await wait(1200);

    setSavedAssociate(result.associate);
    setSavedFormData({ ...formData });
    setSavedFiles([...selectedFiles]);
  };

  const handleUseInChat = async () => {
    if (!savedAssociate) return;

    const organizationId =
      profile?.activeOrganizationId ||
      profile?.organizationId ||
      session?.user?.organization?.id;

    if (!organizationId) {
      notify.error('Please log in to use this feature');
      return;
    }

    notify.info(`Creating workspace with ${savedAssociate.name}...`);

    const now = new Date();
    const projectTitle = `${savedAssociate.name} - ${now.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;

    const newProject = await createProject({
      title: projectTitle,
      description: `Workspace with AI Associate: ${savedAssociate.name}`,
      organizationId,
    });

    if (!newProject) {
      notify.error('Failed to create workspace');
      return;
    }

    const conversation = await createConversation(newProject.id, `Chat with ${savedAssociate.name}`, savedAssociate.id);
    if (!conversation) {
      notify.error('Failed to create conversation');
      return;
    }

    notify.success(`Workspace created with ${savedAssociate.name}!`);
    router.push(`/projects/${newProject.id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.practiceAreas.length === 0) {
      setError('Please select at least one practice area');
      return;
    }

    if (isUploading || isProcessing) return;

    // If already created and no changes — use in chat
    if (savedAssociate && !hasChanges) {
      await handleUseInChat();
      return;
    }

    try {
      if (savedAssociate && hasChanges) {
        await handleUpdate();
      } else {
        await handleCreate();
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
      setIsUploading(false);
      setUploadProgress(null);
    } finally {
      setShowSetupModal(false);
      setSetupMessages([]);
      setSetupComplete(false);
    }
  };

  const handleCancel = () => {
    if (savedAssociate) {
      // Discard changes — revert to last saved snapshot
      setFormData({ ...savedFormData });
      setSelectedFiles([...savedFiles]);
      setError('');
    } else {
      router.push('/workflows');
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
    setFormData((prev) => ({
      ...prev,
      practiceAreas: prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter((a) => a !== area)
        : [...prev.practiceAreas, area],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files).map((file) => ({ file, source: 'upload' as const }))]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  // Derive button label / icon
  const isBusy = isUploading || isProcessing;
  const primaryLabel = isBusy
    ? isUploading && uploadProgress
      ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
      : savedAssociate
      ? 'Updating...'
      : 'Creating...'
    : savedAssociate && !hasChanges
    ? 'Use in Chat'
    : savedAssociate && hasChanges
    ? 'Update Associate'
    : 'Create Associate';

  const primaryIcon = isBusy ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : savedAssociate && !hasChanges ? (
    <MessageSquare className="h-4 w-4 mr-2" />
  ) : null;

  const cancelLabel = savedAssociate && hasChanges ? 'Discard Changes' : 'Cancel';
  const cancelIcon = savedAssociate && hasChanges ? <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      <AssociateSetupProgressModal
        open={showSetupModal}
        associateName={formData.name || 'Associate'}
        messages={setupMessages}
        isComplete={setupComplete}
      />

      <div className="container mx-auto px-6 py- max-w-6xl p-6 space-y-6">
        <div className="flex items-start gap-6">
          <CircleChevronLeft
            className={`h-10 w-10 mt-5 ${
              isBusy
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-secondary hover:text-[#2a4d54] cursor-pointer'
            }`}
            onClick={isBusy ? undefined : () => router.push('/workflows')}
          />

          <div className="grow">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <Label htmlFor="name" className="text-base">Associate Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Tax Associate, M&A Specialist, Contract Reviewer"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      className="mt-2"
                      disabled={isBusy}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-base">Brief Description</Label>
                    <Input
                      id="description"
                      placeholder="A short description of this associate's role"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="mt-2"
                      disabled={isBusy}
                    />
                  </div>

                  {/* Practice Areas */}
                  <div>
                    <Label className="text-base">Practice Areas * (select at least one)</Label>
                    <div className="grid grid-cols-2 gap-3 mt-3 p-4 border rounded-lg max-h-36 overflow-y-auto">
                      {Object.entries(PRACTICE_AREA_LABELS).map(([area, label]) => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={area}
                            checked={formData.practiceAreas.includes(area as PracticeArea)}
                            onCheckedChange={() => togglePracticeArea(area as PracticeArea)}
                            disabled={isBusy}
                          />
                          <label htmlFor={area} className="text-sm cursor-pointer">{label}</label>
                        </div>
                      ))}
                    </div>
                    {formData.practiceAreas.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {formData.practiceAreas.length} practice area{formData.practiceAreas.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>

                  {/* Instructions */}
                  <div>
                    <Label htmlFor="instructions" className="text-base">Instructions & Expertise *</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Describe this associate's expertise, approach, and how they should handle questions..."
                      value={formData.instructions}
                      onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
                      rows={8}
                      required
                      className="mt-2 h-32"
                      disabled={isBusy}
                    />
                  </div>

                  {/* Knowledge Base */}
                  <div>
                    <Label className="flex items-center gap-2 text-base">Knowledge Base</Label>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">
                      Upload documents that this associate should reference (optional)
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div
                      className={`flex items-center justify-between p-4 border-2 border-dashed rounded-lg transition-colors ${
                        isBusy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'
                      }`}
                      onClick={isBusy ? undefined : () => fileInputRef.current?.click()}
                    >
                      <span className="text-muted-foreground">
                        {isUploading && uploadProgress
                          ? `Uploading file ${uploadProgress.current} of ${uploadProgress.total}...`
                          : 'Add files for your associate to reference'}
                      </span>
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isBusy}>
                        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                      </Button>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedFiles.map((fileItem, index) => (
                            <div key={index} className="px-3 py-2 bg-[#E9F5F3] rounded-lg max-w-[420px]">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="bg-[#74C6B8] rounded-md p-1.5">
                                    <FileText className="h-4 w-4 text-white" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                                      {fileItem.source === 'vault'
                                        ? fileItem.existingTitle || fileItem.file.name.replace(/\.[^/.]+$/, '')
                                        : fileItem.file.name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                      {fileItem.source === 'vault' ? 'Picked from Vault' : 'Will be uploaded'}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (!isBusy) removeFile(index); }}
                                  className="hover:bg-blue-100 rounded-full p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  type="button"
                                  disabled={isBusy}
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

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isBusy}
                      className="min-w-[140px]"
                    >
                      {cancelIcon}
                      {cancelLabel}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isBusy}
                      className="min-w-[180px]"
                    >
                      {primaryIcon}
                      {primaryLabel}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
