// components/dashboard/ContentTable.tsx
'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  Loader2
} from 'lucide-react';
import { 
  useContentStore, 
  useContentList, 
  useContentFilters, 
  useContentSelection,
  ContentItem 
} from '@/store/content.store';

interface ContentTableProps {
  showCreateButton?: boolean;
  onCreateNew?: () => void;
  onDelete?: (content: ContentItem) => void;
  onView?: (content: ContentItem) => void;
  showActions?: boolean;
  itemsPerPage?: number;
}

const ContentTable: React.FC<ContentTableProps> = ({
  showCreateButton = false,
  onCreateNew,
  onDelete,
  onView,
  showActions = true,
  itemsPerPage = 15
}) => {
  const router = useRouter();
  const { content, loading, error, pagination } = useContentList();
  const { filters, setFilters, clearFilters, setSearch } = useContentFilters();
  const dummyContent=[]
  const { 
    selectedIds, 
    toggleSelection, 
    selectAllContent, 
    clearSelection, 
    hasSelection 
  } = useContentSelection();
  
  const { 
    fetchContent, 
    deleteContent, 
    bulkDelete, 
    publishContent, 
    unpublishContent,
    setSortBy 
  } = useContentStore();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch content on component mount
  // useEffect(() => {
  //   fetchContent(1, itemsPerPage);
  // }, [fetchContent, itemsPerPage]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters.search, setSearch]);

  const handleEdit = (contentItem: ContentItem) => {
    router.push(`/dashboard/content/${contentItem.id}/edit`);
  };

  const handlePageChange = (page: number) => {
    fetchContent(page, itemsPerPage);
  };

  const handleSort = (column: string) => {
    setSortBy(column);
  };

  const handleDelete = async (contentItem: ContentItem) => {
    if (window.confirm(`Are you sure you want to delete "${contentItem.title}"?`)) {
      const success = await deleteContent(contentItem.id);
      if (success && onDelete) {
        onDelete(contentItem);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected items?`)) {
      const success = await bulkDelete(selectedIds);
      if (success) {
        clearSelection();
      }
    }
  };

  const handlePublish = async (contentItem: ContentItem) => {
    const success = contentItem.status === 'published' 
      ? await unpublishContent(contentItem.id)
      : await publishContent(contentItem.id);
    
    if (success) {
      fetchContent(pagination.currentPage, itemsPerPage);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isAllSelected = content.length > 0 && selectedIds.length === content.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < content.length;

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          {showCreateButton && (
            <Button onClick={onCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Content
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {hasSelection && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Content Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={filters.contentType || 'all'}
                onChange={(e) => setFilters({ contentType: e.target.value === 'all' ? undefined : e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="foundation_page">Foundation Pages</option>
                <option value="blog_post">Blog Posts</option>
                <option value="faq">FAQ Pages</option>
              </select>
            </div>

            {/* Practice Area Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Practice Area
              </label>
              <select
                value={filters.practiceArea || 'all'}
                onChange={(e) => setFilters({ practiceArea: e.target.value === 'all' ? undefined : e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Practice Areas</option>
                <option value="Personal Injury">Personal Injury</option>
                <option value="Criminal Defense">Criminal Defense</option>
                <option value="Family Law">Family Law</option>
                <option value="Business Law">Business Law</option>
                <option value="Real Estate">Real Estate Law</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => setFilters({ status: e.target.value === 'all' ? undefined : e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {/* {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )} */}

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <button
                  onClick={() => isAllSelected ? clearSelection() : selectAllContent()}
                  className="flex items-center justify-center w-4 h-4"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : isIndeterminate ? (
                    <Square className="w-4 h-4 text-primary border-2" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 font-semibold hover:text-primary"
                >
                  Title
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Practice Area</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('views')}
                  className="flex items-center gap-1 font-semibold hover:text-primary"
                >
                  Views
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('updatedAt')}
                  className="flex items-center gap-1 font-semibold hover:text-primary"
                >
                  Last Updated
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              {showActions && <TableHead className="w-16">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-gray-500">Loading content...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 8 : 7} className="text-center py-8 text-gray-500">
                 {showCreateButton && "Let clients discover you.Create your first piece of content to get started."}
                </TableCell>
              </TableRow>
            ) : (
              content.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <button
                      onClick={() => toggleSelection(item.id)}
                      className="flex items-center justify-center w-4 h-4"
                    >
                      {selectedIds.includes(item.id) ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900 truncate">{item.title}</div>
                      {item.excerpt && (
                        <div className="text-sm text-gray-500 truncate mt-1">{item.excerpt}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 capitalize">
                      {item.contentType.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {item.practiceArea || '-'}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {item.views === 0 ? '-' : item.views.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(item.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => onView?.(item)}
                            className="flex items-center"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Content
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEdit(item)} 
                            className="flex items-center"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Content
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handlePublish(item)}
                            className="flex items-center"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {item.status === 'published' ? 'Unpublish' : 'Publish'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(item)} 
                            className="flex items-center text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * itemsPerPage) + 1} to {Math.min(pagination.currentPage * itemsPerPage, pagination.totalCount)} of {pagination.totalCount} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="flex items-center"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTable;