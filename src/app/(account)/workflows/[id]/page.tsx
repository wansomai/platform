'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { KnowledgeBaseStatusPayload, PracticeArea, PRACTICE_AREA_LABELS, UpdateAssociateInput } from '@/types/associates';
import { Plus, FileText, X, CircleChevronLeft, Loader2, MessageSquare, RotateCcw, AlertCircle } from 'lucide-react';
import { useAssociates } from '@/hooks/useAssociates';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProjectStore } from '@/store/project.store';
import { useChatStore } from '@/store/chat.store';
import { useProfile } from '@/store/profile.store';
import { apiService } from '@/lib/api';
import LogoAnimation from '@/components/commons/LogoAnimation';
import { DraggableRulesList } from '@/components/associates/DraggableRulesList';
import { parseRulesForDisplay } from '@/lib/rulesFormatting';
import { AssociateSetupProgressModal } from '@/components/associates/AssociateSetupProgressModal';
import { useNotifications } from '@/hooks/useNotifications';
import ProAccessModal from '@/components/modals/ProAccess';
import AssociateGateModal from '@/components/modals/AssociateGateModal';

type SelectedKnowledgeFile = {
  key: string;
  file: File;
  source: 'upload' | 'vault';
  documentId?: string;
  isUploading: boolean;
  uploadError?: string;
  existingTitle?: string;
};

export default function AssociateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const associateId = params.id as string;
  const { data: session } = useSession();
  const { user: profile } = useProfile();
  const { notify } = useNotifications();
  const { createProject } = useProjectStore();
  const { createConversation } = useChatStore();

  const [formData, setFormData] = useState<UpdateAssociateInput>({
    name: '',
    instructions: '',
    description: '',
    practiceAreas: [],
  });
  const [selectedFiles, setSelectedFiles] = useState<SelectedKnowledgeFile[]>([]);
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [kbStatus, setKbStatus] = useState<KnowledgeBaseStatusPayload | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupMessages, setSetupMessages] = useState<string[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [associateOrgId, setAssociateOrgId] = useState<string | null>(null);
  const [existingKnowledgeDocs, setExistingKnowledgeDocs] = useState<Array<{
    id: string;
    title: string;
    fileType: string;
    contentLength: number;
    summaryGenerated: boolean;
    rulesGenerated?: boolean;
    textExtracted: boolean;
    summaryPreview: string | null;
    rulesPreview?: string | null;
    rulesFull?: string | null;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showAssociateGate, setShowAssociateGate] = useState(false);
  const [showProAccess, setShowProAccess] = useState(false);

  const [originalFormData, setOriginalFormData] = useState<UpdateAssociateInput>({
    name: '',
    instructions: '',
    description: '',
    practiceAreas: [],
  });
  const [originalKbDocIds, setOriginalKbDocIds] = useState<string[]>([]);
  const [originalKbDocs, setOriginalKbDocs] = useState<typeof existingKnowledgeDocs>([]);

  const { updateAssociate, isProcessing } = useAssociates();

  const isAnyFileUploading = selectedFiles.some((f) => f.isUploading);

  const hasChanges = useMemo(() => {
    if (!isInitialized) return false;
    const sortedCurrent = [...(formData.practiceAreas ?? [])].sort().join(',');
    const sortedOriginal = [...(originalFormData.practiceAreas ?? [])].sort().join(',');
    const currentKbIds = existingKnowledgeDocs.map((d) => d.id).sort().join(',');
    const originalKbSorted = [...originalKbDocIds].sort().join(',');
    return (
      formData.name !== originalFormData.name ||
      (formData.description ?? '') !== (originalFormData.description ?? '') ||
      formData.instructions !== originalFormData.instructions ||
      sortedCurrent !== sortedOriginal ||
      currentKbIds !== originalKbSorted ||
      selectedFiles.length > 0
    );
  }, [formData, existingKnowledgeDocs, selectedFiles, originalFormData, originalKbDocIds, isInitialized]);

  const pushSetupMessage = (message: string) => {
    setSetupMessages((prev) => (prev[prev.length - 1] === message ? prev : [...prev, message]));
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    if (isInitialized) return;

    const loadAssociateDetails = async () => {
      try {
        const response = await apiService.get<{
          status: number;
          data: {
            associate: {
              id: string;
              name: string;
              instructions: string;
              description?: string;
              organizationId?: string;
              practiceAreas: PracticeArea[];
              knowledgeBase: string[];
              knowledgeBaseDocuments?: Array<{
                id: string;
                title: string;
                fileType: string;
                contentLength: number;
                summaryGenerated: boolean;
                rulesGenerated?: boolean;
                textExtracted: boolean;
                summaryPreview: string | null;
                rulesPreview?: string | null;
                rulesFull?: string | null;
              }>;
            };
          };
        }>(`/api/associates/${associateId}`);

        const associate = response.data.associate;
        const loaded: UpdateAssociateInput = {
          name: associate.name,
          instructions: associate.instructions,
          description: associate.description || '',
          practiceAreas: associate.practiceAreas,
          knowledgeBase: associate.knowledgeBase || [],
        };
        const kbDocs = associate.knowledgeBaseDocuments || [];

        setFormData(loaded);
        setOriginalFormData(loaded);
        setAssociateOrgId(associate.organizationId ?? null);
        setExistingKnowledgeDocs(kbDocs);
        setOriginalKbDocIds(kbDocs.map((d) => d.id));
        setOriginalKbDocs(kbDocs);
        setIsInitialized(true);
      } catch {
        router.push('/workflows');
      }
    };

    loadAssociateDetails();
  }, [associateId, isInitialized, router]);

  // Upload a single file immediately after selection. The server returns existingDocumentId
  // on a 409 conflict so we handle deduplication there rather than with a pre-flight GET.
  const uploadSingleFile = async (key: string, file: File) => {
    try {
      const { uploadDocumentClientSide } = await import('@/lib/uploadDocument');
      const doc = await uploadDocumentClientSide(file, { organizationId: associateOrgId || null });
      const docId = doc.id;
      setSelectedFiles((prev) =>
        prev.map((f) => f.key === key ? { ...f, documentId: docId, isUploading: false } : f)
      );
    } catch (err: any) {
      const existingId: string | undefined = err?.response?.data?.existingDocumentId;
      if (existingId) {
        // 409: a document with this title already exists in the vault — reuse it
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.key === key
              ? { ...f, source: 'vault', documentId: existingId, isUploading: false }
              : f
          )
        );
      } else {
        const msg = err?.response?.data?.message || err?.message || `Failed to upload ${file.name}`;
        setSelectedFiles((prev) =>
          prev.map((f) => f.key === key ? { ...f, isUploading: false, uploadError: msg } : f)
        );
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // FileList is a live object — extract File references into a stable array
    // BEFORE clearing the input, otherwise the list is empty by the time we read it.
    const fileArray = Array.from(files);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const newItems: SelectedKnowledgeFile[] = fileArray.map((file) => ({
      key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      source: 'upload' as const,
      isUploading: true,
    }));

    setSelectedFiles((prev) => [...prev, ...newItems]);
    await Promise.all(newItems.map((item) => uploadSingleFile(item.key, item.file)));
  };

  const handleUseInChat = async () => {
    const organizationId =
      profile?.activeOrganizationId ||
      profile?.organizationId ||
      session?.user?.organization?.id;

    if (!organizationId) {
      notify.error('Please log in to use this feature');
      return;
    }

    notify.info(`Creating workspace with ${formData.name}...`);

    const now = new Date();
    const projectTitle = `${formData.name} - ${now.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;

    let newProject;
    try {
      newProject = await createProject({
        title: projectTitle,
        description: `Workspace with AI Associate: ${formData.name}`,
        organizationId,
      });
    } catch (err: any) {
      const code = err?.response?.status ?? err?.status;
      if (code === 403) {
        setShowAssociateGate(true);
      } else {
        notify.error(err?.message || 'Failed to create workspace');
      }
      return;
    }

    if (!newProject) {
      notify.error('Failed to create workspace');
      return;
    }

    try {
      const conversation = await createConversation(newProject.id, `Chat with ${formData.name}`, associateId);
      if (!conversation) {
        notify.error('Failed to create conversation');
        return;
      }
      notify.success(`Workspace created with ${formData.name}!`);
      router.push(`/projects/${newProject.id}`);
    } catch (err: any) {
      const code = err?.response?.status ?? err?.status;
      if (code === 403) {
        setShowAssociateGate(true);
      } else {
        notify.error(err?.message || 'Failed to create conversation');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setKbStatus(null);

    if (!formData.practiceAreas || formData.practiceAreas.length === 0) {
      setError('Please select at least one practice area');
      return;
    }

    if ((formData.instructions ?? '').trim().length < 10) {
      setError('Instructions must be at least 10 characters');
      return;
    }

    if (isAnyFileUploading || isProcessing || isSubmittingRef.current) return;

    if (!hasChanges) {
      await handleUseInChat();
      return;
    }

    isSubmittingRef.current = true;
    setShowSetupModal(true);
    setSetupComplete(false);
    setSetupMessages(['Updating associate...']);

    try {
      const newDocIds = selectedFiles
        .filter((f) => f.documentId && !f.uploadError)
        .map((f) => f.documentId!);

      const existing = existingKnowledgeDocs.map((doc) => doc.id);
      const updateData: UpdateAssociateInput = {
        ...formData,
        knowledgeBase: Array.from(new Set([...existing, ...newDocIds])),
      };

      if (newDocIds.length > 0) {
        pushSetupMessage(`Linking [${newDocIds.length}] new knowledge base document(s)...`);
      }

      const result = await updateAssociate(associateId, updateData);
      if (!result?.associate) throw new Error('Failed to update associate');

      setKbStatus(result.knowledgeBaseStatus ?? null);
      (result.knowledgeBaseStatus?.documents ?? []).forEach((doc, index) => {
        pushSetupMessage(
          doc.rulesGenerated
            ? `[${index + 1}] ${doc.title}: rules ready.`
            : `[${index + 1}] ${doc.title}: rules processing in background.`
        );
      });
      pushSetupMessage(`${result.associate.name} updated successfully.`);
      setSetupComplete(true);
      await wait(1200);

      // Rebuild the displayed KB list from the server's processed results so
      // newly uploaded docs appear immediately without a page reload.
      const processedById = new Map(
        (result.knowledgeBaseStatus?.documents ?? []).map((d) => [d.documentId, d])
      );
      const kbIds = updateData.knowledgeBase ?? [];
      const mergedKbDocs = kbIds.map((docId) => {
        const existing = existingKnowledgeDocs.find((d) => d.id === docId);
        const processed = processedById.get(docId);
        if (existing) {
          return {
            ...existing,
            summaryGenerated: processed?.summaryGenerated ?? existing.summaryGenerated,
            rulesGenerated: processed?.rulesGenerated ?? existing.rulesGenerated,
            textExtracted: processed?.textExtracted ?? existing.textExtracted,
            rulesFull: processed?.rulesForThinking ?? existing.rulesFull,
          };
        }
        // Newly uploaded doc — build entry from processed status
        return {
          id: docId,
          title: processed?.title ?? docId,
          fileType: processed?.fileType ?? '',
          contentLength: processed?.contentLength ?? 0,
          summaryGenerated: processed?.summaryGenerated ?? false,
          rulesGenerated: processed?.rulesGenerated ?? false,
          textExtracted: processed?.textExtracted ?? false,
          summaryPreview: null,
          rulesPreview: processed?.rulesForThinking ? processed.rulesForThinking.slice(0, 500) : null,
          rulesFull: processed?.rulesForThinking ?? null,
        };
      });

      setExistingKnowledgeDocs(mergedKbDocs);
      setOriginalFormData({ ...formData });
      setOriginalKbDocIds(mergedKbDocs.map((d) => d.id));
      setOriginalKbDocs([...mergedKbDocs]);
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.message || 'Failed to update associate');
    } finally {
      isSubmittingRef.current = false;
      setShowSetupModal(false);
      setSetupMessages([]);
      setSetupComplete(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowDiscardDialog(true);
    } else {
      router.push('/workflows');
    }
  };

  const confirmDiscard = () => {
    setFormData({ ...originalFormData });
    setExistingKnowledgeDocs([...originalKbDocs]);
    setSelectedFiles([]);
    setError('');
    setShowDiscardDialog(false);
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
      practiceAreas: prev.practiceAreas?.includes(area)
        ? prev.practiceAreas.filter((a) => a !== area)
        : [...(prev.practiceAreas || []), area],
    }));
  };

  const removeFile = (key: string) => setSelectedFiles((prev) => prev.filter((f) => f.key !== key));

  const removeExistingKnowledgeDoc = (documentId: string) => {
    setExistingKnowledgeDocs((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  const submitDisabled = isAnyFileUploading || isProcessing;

  const primaryLabel = isProcessing
    ? 'Updating...'
    : isAnyFileUploading
    ? 'Uploading files...'
    : hasChanges
    ? 'Update Associate'
    : 'Use in Chat';

  const primaryIcon = isProcessing || isAnyFileUploading ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : !hasChanges ? (
    <MessageSquare className="h-4 w-4 mr-2" />
  ) : null;

  const cancelLabel = hasChanges ? 'Discard Changes' : 'Cancel';
  const cancelIcon = hasChanges ? <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> : null;

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LogoAnimation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
      <AssociateGateModal
        open={showAssociateGate}
        onClose={() => setShowAssociateGate(false)}
        onUpgrade={() => setShowProAccess(true)}
      />
      <ProAccessModal
        isOpen={showProAccess}
        onClose={() => setShowProAccess(false)}
        limitType="associates"
      />

      <AssociateSetupProgressModal
        open={showSetupModal}
        associateName={formData.name || 'Associate'}
        messages={setupMessages}
        isComplete={setupComplete}
      />

      <AlertDialog open={!!error} onOpenChange={(open) => { if (!open) setError(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Something went wrong</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setError('')}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Discarding will revert the associate back to its last saved state. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-6 py- max-w-6xl p-6 space-y-6">
        <div className="flex items-start gap-6">
          <CircleChevronLeft
            className={`h-10 w-10 mt-5 ${
              isProcessing
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-secondary hover:text-[#2a4d54] cursor-pointer'
            }`}
            onClick={isProcessing ? undefined : () => router.push('/workflows')}
          />
          <div className="grow">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                            checked={formData.practiceAreas?.includes(area as PracticeArea)}
                            onCheckedChange={() => togglePracticeArea(area as PracticeArea)}
                            disabled={isProcessing}
                          />
                          <label htmlFor={area} className="text-sm cursor-pointer">{label}</label>
                        </div>
                      ))}
                    </div>
                    {formData.practiceAreas && formData.practiceAreas.length > 0 && (
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
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Knowledge Base */}
                  <div>
                    <Label className="flex items-center gap-2 text-base">Knowledge Base</Label>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">
                      Upload additional documents that this associate should reference. Files upload immediately.
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
                        isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'
                      }`}
                      onClick={isProcessing ? undefined : () => fileInputRef.current?.click()}
                    >
                      <span className="text-muted-foreground">Add files for your associate to reference</span>
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isProcessing}>
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedFiles.map((fileItem) => (
                            <div key={fileItem.key} className="px-3 py-2 bg-[#E9F5F3] rounded-lg max-w-[420px]">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`rounded-md p-1.5 ${fileItem.uploadError ? 'bg-red-400' : 'bg-[#74C6B8]'}`}>
                                    {fileItem.isUploading ? (
                                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                                    ) : fileItem.uploadError ? (
                                      <AlertCircle className="h-4 w-4 text-white" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                                      {fileItem.source === 'vault'
                                        ? (fileItem.existingTitle || fileItem.file.name.replace(/\.[^/.]+$/, ''))
                                        : fileItem.file.name}
                                    </span>
                                    <span className={`text-[11px] ${fileItem.uploadError ? 'text-red-500' : 'text-muted-foreground'}`}>
                                      {fileItem.isUploading
                                        ? 'Uploading...'
                                        : fileItem.uploadError
                                        ? fileItem.uploadError
                                        : fileItem.source === 'vault'
                                        ? 'From vault'
                                        : 'Uploaded'}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (!isProcessing) removeFile(fileItem.key); }}
                                  className="hover:bg-blue-100 rounded-full p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  type="button"
                                  disabled={isProcessing}
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

                    {existingKnowledgeDocs.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Existing Knowledge Base ({existingKnowledgeDocs.length})
                        </p>
                        <div className="space-y-2">
                          {existingKnowledgeDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-start justify-between gap-3 px-3 py-2 border rounded-lg bg-muted/20"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{doc.title}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {doc.summaryGenerated ? 'Summary generated' : 'Summary pending'}
                                  {' · '}
                                  {doc.rulesGenerated ? 'Rules generated' : 'Rules pending'}
                                  {' · '}
                                  {doc.textExtracted ? 'Text extracted' : 'Text extraction pending'}
                                  {' · '}
                                  {doc.fileType.toUpperCase()}
                                </p>
                                {doc.summaryPreview && (
                                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                                    {doc.summaryPreview}
                                  </p>
                                )}
                                {doc.rulesFull && parseRulesForDisplay(doc.rulesFull).length > 0 && (
                                  <DraggableRulesList rules={parseRulesForDisplay(doc.rulesFull)} />
                                )}
                              </div>
                              <div className="flex items-start gap-2 shrink-0">
                                <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                  Attached
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeExistingKnowledgeDoc(doc.id)}
                                  className="hover:bg-blue-100 rounded-full p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isProcessing}
                                  aria-label={`Remove ${doc.title} from knowledge base`}
                                >
                                  <X className="h-3.5 w-3.5 text-gray-600" />
                                </button>
                              </div>
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
                      disabled={isProcessing}
                      className="min-w-[140px]"
                    >
                      {cancelIcon}
                      {cancelLabel}
                    </Button>
                    <Button type="submit" disabled={submitDisabled} className="min-w-[180px]">
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
