'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { KnowledgeBaseStatusPayload, PracticeArea, PRACTICE_AREA_LABELS, UpdateAssociateInput } from '@/types/associates';
import { Plus, FileText, X, CircleChevronLeft, Loader2 } from 'lucide-react';
import { useAssociates } from '@/hooks/useAssociates';
import { Card, CardContent } from '@/components/ui/card';
import { useDocumentsStore } from '@/store/documents.store';
import { apiService } from '@/lib/api';
import LogoAnimation from '@/components/commons/LogoAnimation';
import { DraggableRulesList } from '@/components/associates/DraggableRulesList';
import { parseRulesForDisplay } from '@/lib/rulesFormatting';
import { AssociateSetupProgressModal } from '@/components/associates/AssociateSetupProgressModal';

export default function AssociateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const associateId = params.id as string;

  const [formData, setFormData] = useState<UpdateAssociateInput>({
    name: '',
    instructions: '',
    description: '',
    practiceAreas: [],
  });
  type SelectedKnowledgeFile = {
    file: File;
    source: 'upload' | 'vault';
    existingDocumentId?: string;
    existingTitle?: string;
  };
  const [selectedFiles, setSelectedFiles] = useState<SelectedKnowledgeFile[]>([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [kbStatus, setKbStatus] = useState<KnowledgeBaseStatusPayload | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupMessages, setSetupMessages] = useState<string[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
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

  const {
    isLoading,
    updateAssociate,
    isProcessing,
  } = useAssociates();

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

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7696/ingest/24738c3c-68fc-4ae6-ac56-64af16841ff6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'886eee'},body:JSON.stringify({sessionId:'886eee',runId:'pre-fix-1',hypothesisId:'H3',location:'src/app/(account)/workflows/[id]/page.tsx:82',message:'AssociateDetailPage setup modal state changed',data:{showSetupModal,setupComplete,setupMessagesCount:setupMessages.length,associateName:formData.name || null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [showSetupModal, setupComplete, setupMessages.length, formData.name]);

  // Load full associate details (including KB document details/summaries)
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
        setFormData({
          name: associate.name,
          instructions: associate.instructions,
          description: associate.description || '',
          practiceAreas: associate.practiceAreas,
          knowledgeBase: associate.knowledgeBase || [],
        });
        setExistingKnowledgeDocs(associate.knowledgeBaseDocuments || []);
        setIsInitialized(true);
      } catch {
        if (!isLoading) {
          router.push('/workflows');
        }
      }
    };

    loadAssociateDetails();
  }, [associateId, isInitialized, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setKbStatus(null);

    if (!formData.practiceAreas || formData.practiceAreas.length === 0) {
      setError('Please select at least one practice area');
      return;
    }

    if (isUploading || isProcessing) return;

    setShowSetupModal(true);
    setSetupComplete(false);
    setSetupMessages(['Initializing knowledge base update...']);

    try {
      // Upload new files if any — reuse vault docs when a title match exists
      const uploadedDocumentIds: string[] = [];

      if (selectedFiles.length > 0) {
        pushSetupMessage(`Preparing upload queue for [${selectedFiles.length}] knowledge base document(s)...`);
        setIsUploading(true);
        setUploadProgress({ current: 0, total: selectedFiles.length });

        const existingDocs = await getExistingRootDocs();
        const existingByTitle = new Map(
          existingDocs.map((d) => [d.title.toLowerCase(), d])
        );

        for (let i = 0; i < selectedFiles.length; i++) {
          const fileItem = selectedFiles[i];
          const file = fileItem.file;
          pushSetupMessage(`Uploading [${i + 1}] ${file.name}...`);
          setUploadProgress({ current: i + 1, total: selectedFiles.length });

          const fileBaseName = file.name.replace(/\.[^/.]+$/, '');
          const existingDoc = existingByTitle.get(fileBaseName.toLowerCase());
          if (existingDoc) {
            uploadedDocumentIds.push(existingDoc.id);
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
          if (!uploadedDocument) {
            throw new Error(`Failed to upload ${file.name}`);
          }
          uploadedDocumentIds.push(uploadedDocument.id);
          pushSetupMessage(`[${i + 1}] ${file.name} uploaded successfully.`);
        }

        setIsUploading(false);
        setUploadProgress(null);
      }

      // Build update payload — persist KB removals/additions explicitly
      const updateData: UpdateAssociateInput = { ...formData };
      const existing = existingKnowledgeDocs.map((doc) => doc.id);
      updateData.knowledgeBase = Array.from(new Set([...existing, ...uploadedDocumentIds]));

      pushSetupMessage(`Rules being retrieved from [${updateData.knowledgeBase.length}] knowledge base document(s)...`);
      const result = await updateAssociate(associateId, updateData);
      if (!result?.associate) {
        throw new Error('Failed to update associate');
      }
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
    } catch (err: any) {
      setError(err.message || 'Failed to update associate');
      setIsUploading(false);
      setUploadProgress(null);
      setShowSetupModal(false);
      setSetupMessages([]);
      setSetupComplete(false);
      return;
    }

    setShowSetupModal(false);
    setSetupMessages([]);
    setSetupComplete(false);
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
      practiceAreas: prev.practiceAreas?.includes(area)
        ? prev.practiceAreas.filter(a => a !== area)
        : [...(prev.practiceAreas || []), area],
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingKnowledgeDoc = (documentId: string) => {
    setExistingKnowledgeDocs(prev => prev.filter((doc) => doc.id !== documentId));
  };

  const handleAddFilesClick = () => {
    fileInputRef.current?.click();
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LogoAnimation />
      </div>
    );
  }

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
              isUploading || isProcessing
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-secondary hover:text-[#2a4d54] cursor-pointer'
            }`}
            onClick={isUploading || isProcessing ? undefined : () => router.push('/workflows')}
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
                    <Label htmlFor="name" className="text-base">
                      Associate Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Tax Associate, M&A Specialist, Contract Reviewer"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="mt-2"
                      disabled={isUploading || isProcessing}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-base">
                      Brief Description
                    </Label>
                    <Input
                      id="description"
                      placeholder="A short description of this associate's role"
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-2"
                      disabled={isUploading || isProcessing}
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
                            disabled={isUploading || isProcessing}
                          />
                          <label htmlFor={area} className="text-sm cursor-pointer">
                            {label}
                          </label>
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
                    <Label htmlFor="instructions" className="text-base">
                      Instructions & Expertise *
                    </Label>
                    <Textarea
                      id="instructions"
                      placeholder="Describe this associate's expertise, approach, and how they should handle questions..."
                      value={formData.instructions}
                      onChange={e => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                      rows={8}
                      required
                      className="mt-2 h-32"
                      disabled={isUploading || isProcessing}
                    />
                  </div>

                  {/* Knowledge Base */}
                  <div>
                    <Label className="flex items-center gap-2 text-base">
                      Knowledge Base
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">
                      Upload additional documents that this associate should reference (optional)
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
                        isUploading || isProcessing
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer hover:bg-accent/50'
                      }`}
                      onClick={isUploading || isProcessing ? undefined : handleAddFilesClick}
                    >
                      <span className="text-muted-foreground">
                        {isUploading && uploadProgress
                          ? `Uploading file ${uploadProgress.current} of ${uploadProgress.total}...`
                          : 'Add files for your associate to reference'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={isUploading || isProcessing}
                      >
                        {isUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

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
                                    if (!isUploading && !isProcessing) {
                                      removeFile(index);
                                    }
                                  }}
                                  className="hover:bg-blue-100 rounded-full p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  type="button"
                                  disabled={isUploading || isProcessing}
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
                                  disabled={isUploading || isProcessing}
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
                      onClick={() => router.push('/workflows')}
                      disabled={isUploading || isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUploading || isProcessing} className="min-w-[180px]">
                      {isUploading && uploadProgress ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading {uploadProgress.current}/{uploadProgress.total}...
                        </>
                      ) : isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
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
