'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  FileText,
  Scale,
  BookOpen,
  Gavel,
  ScrollText,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LegalKnowledge, LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';
import { LegalKnowledgeViewDialog } from './LegalKnowledgeViewDialog';

interface LegalKnowledgeTableProps {
  items: LegalKnowledge[];
  isLoading: boolean;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
}

const TYPE_CONFIG: Record<LegalKnowledgeType, { label: string; icon: React.ElementType; color: string }> = {
  TEMPLATE: { label: 'Template', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  CASE_LAW: { label: 'Case Law', icon: Gavel, color: 'bg-purple-100 text-purple-800' },
  STATUTE: { label: 'Statute', icon: Scale, color: 'bg-green-100 text-green-800' },
  REGULATION: { label: 'Regulation', icon: ScrollText, color: 'bg-orange-100 text-orange-800' },
  LEGAL_OPINION: { label: 'Legal Opinion', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' },
  PRACTICE_GUIDE: { label: 'Practice Guide', icon: BookOpen, color: 'bg-indigo-100 text-indigo-800' },
};

const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  KENYA_NATIONAL: 'Kenya (National)',
  KENYA_NAIROBI: 'Kenya (Nairobi)',
  INTERNATIONAL: 'International',
  GENERAL: 'General',
};

export function LegalKnowledgeTable({
  items,
  isLoading,
  onPublish,
  onUnpublish,
  onDelete,
  onReprocess,
}: LegalKnowledgeTableProps) {
  const [viewItem, setViewItem] = useState<LegalKnowledge | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center text-gray-500">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading legal knowledge...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-8 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No legal knowledge found</p>
          <p className="text-sm">Upload a document or create from text to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Chunks</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const typeConfig = TYPE_CONFIG[item.type];
              const TypeIcon = typeConfig.icon;

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 truncate max-w-[280px]">
                        {item.title}
                      </span>
                      {item.description && (
                        <span className="text-sm text-gray-500 truncate max-w-[280px]">
                          {item.description}
                        </span>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={typeConfig.color}>
                      <TypeIcon className="h-3 w-3 mr-1" />
                      {typeConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {JURISDICTION_LABELS[item.jurisdiction]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={item.status === 'active' ? 'default' : 'secondary'}
                        className={
                          item.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'archived'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {item.status}
                      </Badge>
                      {item.isPublished ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unpublished
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {item.chunks?.length || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewItem(item)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {item.isPublished ? (
                          <DropdownMenuItem onClick={() => onUnpublish(item.id)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Unpublish
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onPublish(item.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onReprocess(item.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reprocess Embeddings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <LegalKnowledgeViewDialog
        item={viewItem}
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
      />
    </>
  );
}
