'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  useLegalKnowledgeStore,
  useLegalKnowledgeItems,
  useLegalKnowledgeStats,
  useLegalKnowledgePagination,
  useLegalKnowledgeFilters,
  useLegalKnowledgeLoading,
  useLegalKnowledgeError
} from '@/store/legal-knowledge.store';
import { LegalKnowledgeStats } from '@/components/admin/legal-knowledge/LegalKnowledgeStats';
import { LegalKnowledgeFilters } from '@/components/admin/legal-knowledge/LegalKnowledgeFilters';
import { LegalKnowledgeTable } from '@/components/admin/legal-knowledge/LegalKnowledgeTable';
import { LegalKnowledgeUploadDialog } from '@/components/admin/legal-knowledge/LegalKnowledgeUploadDialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useState } from 'react';

export default function LegalKnowledgePage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Store selectors
  const items = useLegalKnowledgeItems();
  const stats = useLegalKnowledgeStats();
  const pagination = useLegalKnowledgePagination();
  const filters = useLegalKnowledgeFilters();
  const isLoading = useLegalKnowledgeLoading();
  const error = useLegalKnowledgeError();

  // Store actions
  const {
    fetchLegalKnowledge,
    publish,
    unpublish,
    archive,
    reprocess,
    setFilter,
    setPage,
    refresh
  } = useLegalKnowledgeStore();

  // Initial fetch
  useEffect(() => {
    fetchLegalKnowledge();
  }, [fetchLegalKnowledge]);

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handlePublish = async (id: string) => {
    const success = await publish(id);
    if (success) {
      toast.success('Legal knowledge published successfully');
    }
  };

  const handleUnpublish = async (id: string) => {
    const success = await unpublish(id);
    if (success) {
      toast.success('Legal knowledge unpublished');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this legal knowledge?')) return;

    const success = await archive(id);
    if (success) {
      toast.success('Legal knowledge archived');
    }
  };

  const handleReprocess = async (id: string) => {
    const success = await reprocess(id);
    if (success) {
      toast.success('Reprocessing started');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Legal Knowledge Base</h1>
          <p className="text-gray-600 mt-1">
            Manage templates, statutes, case laws, and other legal reference materials.
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      {/* Stats */}
      <LegalKnowledgeStats
        stats={stats}
        isLoading={isLoading && items.length === 0}
      />

      {/* Filters */}
      <LegalKnowledgeFilters
        type={filters.type || ''}
        jurisdiction={filters.jurisdiction || ''}
        status={filters.status || ''}
        isPublished={filters.isPublished}
        search={filters.search || ''}
        onTypeChange={(v) => setFilter('type', v || undefined)}
        onJurisdictionChange={(v) => setFilter('jurisdiction', v || undefined)}
        onStatusChange={(v) => setFilter('status', v || undefined)}
        onIsPublishedChange={(v) => setFilter('isPublished', v)}
        onSearchChange={(v) => setFilter('search', v || undefined)}
        onRefresh={refresh}
        isLoading={isLoading}
      />

      {/* Table */}
      <LegalKnowledgeTable
        items={items}
        isLoading={isLoading && items.length === 0}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onDelete={handleDelete}
        onReprocess={handleReprocess}
      />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
            of {pagination.total} items
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(pagination.pages, pagination.page + 1))}
              disabled={pagination.page === pagination.pages}
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
          refresh();
        }}
      />
    </div>
  );
}
