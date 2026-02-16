'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PracticeArea, PRACTICE_AREA_LABELS, UpdateAssociateInput } from '@/types/associates';
import { Plus, FileText, X, CircleChevronLeft, Loader2 } from 'lucide-react';
import { useAssociates } from '@/hooks/useAssociates';
import { Card, CardContent } from '@/components/ui/card';
import { useDocumentsStore } from '@/store/documents.store';
import LogoAnimation from '@/components/commons/LogoAnimation';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    associates,
    isLoading,
    fetchAssociates,
    getAssociateById,
    updateAssociate,
    isProcessing,
  } = useAssociates({
    onSuccess: () => {
      router.push('/workflows');
    },
  });

  const { uploadDocument } = useDocumentsStore();

  // Fetch associates if not loaded, then initialize form
  useEffect(() => {
    if (associates.length === 0) {
      fetchAssociates();
    }
  }, []);

  useEffect(() => {
    if (isInitialized || associates.length === 0) return;

    const associate = getAssociateById(associateId);
    if (associate) {
      setFormData({
        name: associate.name,
        instructions: associate.instructions,
        description: associate.description || '',
        practiceAreas: associate.practiceAreas,
      });
      setIsInitialized(true);
    } else if (!isLoading) {
      // Associate not found after loading
      router.push('/workflows');
    }
  }, [associates, associateId, isLoading, isInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.practiceAreas || formData.practiceAreas.length === 0) {
      setError('Please select at least one practice area');
      return;
    }

    if (isUploading || isProcessing) return;

    try {
      // Upload new files if any
      const uploadedDocumentIds: string[] = [];

      if (selectedFiles.length > 0) {
        setIsUploading(true);
        setUploadProgress({ current: 0, total: selectedFiles.length });

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setUploadProgress({ current: i + 1, total: selectedFiles.length });

          const fileFormData = new FormData();
          fileFormData.append('file', file);

          const uploadedDocument = await uploadDocument(fileFormData);
          if (!uploadedDocument) {
            throw new Error(`Failed to upload ${file.name}`);
          }
          uploadedDocumentIds.push(uploadedDocument.id);
        }

        setIsUploading(false);
        setUploadProgress(null);
      }

      // Build update payload
      const updateData: UpdateAssociateInput = { ...formData };
      if (uploadedDocumentIds.length > 0) {
        const existing = getAssociateById(associateId)?.knowledgeBase || [];
        updateData.knowledgeBase = [...existing, ...uploadedDocumentIds];
      }

      await updateAssociate(associateId, updateData);
    } catch (err: any) {
      setError(err.message || 'Failed to update associate');
      setIsUploading(false);
      setUploadProgress(null);
    }
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
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
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

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LogoAnimation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
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
