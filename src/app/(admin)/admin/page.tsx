'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminStats } from '@/components/admin/AdminStats';
import { OrganizationFilters } from '@/components/admin/OrganizationFilters';
import { OrganizationsTable } from '@/components/admin/OrganizationsTable';
import type { OrganizationsResponse, FilterType } from '@/types/admin';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import { Download, Briefcase, Mail } from 'lucide-react';

export default function AdminPage() {
  const [data, setData] = useState<OrganizationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState<'professional' | 'personal' | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        search,
        page: page.toString(),
        limit: '20',
      });

      const response = await apiService.get<OrganizationsResponse>(`/api/admin/organizations?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const result: OrganizationsResponse = await response;
      setData(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load organizations'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Reset to first page
  };

  const handleExport = async (type: 'professional' | 'personal') => {
    setDownloading(type);
    try {
      // Use apiService so the request interceptor attaches the session token automatically.
      // responseType: 'text' tells axios to return the body as a plain string (not parsed JSON).
      const csv = await apiService.get<string>(
        `/api/admin/users/export?type=${type}`,
        { responseType: 'text' }
      );
      const blob = new Blob([csv as unknown as string], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wansom-users-${type}-emails-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
        <p className="text-gray-600 mt-1">
          Manage organization accounts and upgrade requests
        </p>
      </div>

      {/* Stats */}
      <AdminStats
        stats={
          data?.stats || {
            totalOrgs: 0,
            pendingUpgrades: 0,
            enterpriseAccounts: 0,
            personalAccounts: 0,
          }
        }
        isLoading={isLoading && !data}
      />

      {/* User Export */}
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Download className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Download Members</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Export all platform users as CSV, split by email type. Professional = custom domain; Personal = Gmail, Yahoo, Hotmail, etc.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('professional')}
            disabled={!!downloading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading === 'professional' ? (
              <span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
            ) : (
              <Briefcase className="h-4 w-4 text-gray-600" />
            )}
            Professional Emails
          </button>
          <button
            onClick={() => handleExport('personal')}
            disabled={!!downloading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading === 'personal' ? (
              <span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
            ) : (
              <Mail className="h-4 w-4 text-gray-600" />
            )}
            Personal Emails
          </button>
        </div>
      </div>

      {/* Filters */}
      <OrganizationFilters
        filter={filter}
        search={search}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onRefresh={fetchOrganizations}
        isLoading={isLoading}
      />

      {/* Organizations Table */}
      <OrganizationsTable
        organizations={data?.organizations || []}
        isLoading={isLoading && !data}
        onRefresh={fetchOrganizations}
      />

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
            {Math.min(
              data.pagination.page * data.pagination.limit,
              data.pagination.total
            )}{' '}
            of {data.pagination.total} organizations
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
