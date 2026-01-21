'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import { LegalKnowledgeStats } from '@/components/admin/legal-knowledge/LegalKnowledgeStats';
import { LegalKnowledgeFilters } from '@/components/admin/legal-knowledge/LegalKnowledgeFilters';
import { LegalKnowledgeTable } from '@/components/admin/legal-knowledge/LegalKnowledgeTable';
import { LegalKnowledgeUploadDialog } from '@/components/admin/legal-knowledge/LegalKnowledgeUploadDialog';
import { LegalKnowledgeCreateDialog } from '@/components/admin/legal-knowledge/LegalKnowledgeCreateDialog';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import type { LegalKnowledge, LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';

interface LegalKnowledgeResponse {
  success: boolean;
  data: LegalKnowledge[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    total: number;
    published: number;
    byType: Record<string, number>;
    byJurisdiction: Record<string, number>;
    totalChunks: number;
  };
}

export default function LegalKnowledgePage() {
  const [data, setData] = useState<LegalKnowledgeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState<LegalKnowledgeType | ''>('');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | ''>('');
  const [status, setStatus] = useState<'active' | 'archived' | 'draft' | ''>('');
  const [isPublished, setIsPublished] = useState<boolean | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchLegalKnowledge = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (type) params.set('type', type);
      if (jurisdiction) params.set('jurisdiction', jurisdiction);
      if (status) params.set('status', status);
      if (isPublished !== undefined) params.set('isPublished', isPublished.toString());
      if (search) params.set('search', search);

      const response = await apiService.get<LegalKnowledgeResponse>(
        `/api/admin/legal-knowledge?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      setData(response);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load legal knowledge'
      );
    } finally {
      setIsLoading(false);
    }
  }, [type, jurisdiction, status, isPublished, search, page]);

  useEffect(() => {
    fetchLegalKnowledge();
  }, [fetchLegalKnowledge]);

  const handlePublish = async (id: string) => {
    try {
      await apiService.post(`/api/admin/legal-knowledge/${id}/publish`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      toast.success('Legal knowledge published successfully');
      fetchLegalKnowledge();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to publish'
      );
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await apiService.delete(`/api/admin/legal-knowledge/${id}/publish`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      toast.success('Legal knowledge unpublished');
      fetchLegalKnowledge();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to unpublish'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this legal knowledge?')) return;

    try {
      await apiService.delete(`/api/admin/legal-knowledge/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      toast.success('Legal knowledge archived');
      fetchLegalKnowledge();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to archive'
      );
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await apiService.post(`/api/admin/legal-knowledge/${id}/reprocess`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      toast.success('Reprocessing started');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to start reprocessing'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legal Knowledge Base</h1>
          <p className="text-gray-600 mt-1">
            Manage templates, statutes, case laws, and other legal references for RAG
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create from Text
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Stats */}
      <LegalKnowledgeStats
        stats={data?.stats || {
          total: 0,
          published: 0,
          byType: {},
          byJurisdiction: {},
          totalChunks: 0,
        }}
        isLoading={isLoading && !data}
      />

      {/* Filters */}
      <LegalKnowledgeFilters
        type={type}
        jurisdiction={jurisdiction}
        status={status}
        isPublished={isPublished}
        search={search}
        onTypeChange={(v) => { setType(v); setPage(1); }}
        onJurisdictionChange={(v) => { setJurisdiction(v); setPage(1); }}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        onIsPublishedChange={(v) => { setIsPublished(v); setPage(1); }}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onRefresh={fetchLegalKnowledge}
        isLoading={isLoading}
      />

      {/* Table */}
      <LegalKnowledgeTable
        items={data?.data || []}
        isLoading={isLoading && !data}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onDelete={handleDelete}
        onReprocess={handleReprocess}
      />

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
            {Math.min(
              data.pagination.page * data.pagination.limit,
              data.pagination.total
            )}{' '}
            of {data.pagination.total} items
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <LegalKnowledgeUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => {
          setUploadDialogOpen(false);
          fetchLegalKnowledge();
        }}
      />

      {/* Create Dialog */}
      <LegalKnowledgeCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          fetchLegalKnowledge();
        }}
      />
    </div>
  );
}
