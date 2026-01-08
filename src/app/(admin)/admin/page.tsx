'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminStats } from '@/components/admin/AdminStats';
import { OrganizationFilters } from '@/components/admin/OrganizationFilters';
import { OrganizationsTable } from '@/components/admin/OrganizationsTable';
import type { OrganizationsResponse, FilterType } from '@/types/admin';
import { toast } from 'sonner';

export default function AdminPage() {
  const [data, setData] = useState<OrganizationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        search,
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/admin/organizations?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const result: OrganizationsResponse = await response.json();
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
