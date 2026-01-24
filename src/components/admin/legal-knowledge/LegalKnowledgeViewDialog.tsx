'use client';

import { format } from 'date-fns';
import { FileText, ExternalLink, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { LegalKnowledge, LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';

interface LegalKnowledgeViewDialogProps {
  item: LegalKnowledge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_LABELS: Record<LegalKnowledgeType, string> = {
  TEMPLATE: 'Template',
  CASE_LAW: 'Case Law',
  STATUTE: 'Statute',
  REGULATION: 'Regulation',
  LEGAL_OPINION: 'Legal Opinion',
  PRACTICE_GUIDE: 'Practice Guide',
};

const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  KENYA: 'Kenya',
  INTERNATIONAL: 'International',
  GENERAL: 'General',
};

const PRACTICE_AREA_LABELS: Record<string, string> = {
  CONTRACTS_COMMERCIAL: 'Contracts & Commercial',
  CORPORATE_GOVERNANCE: 'Corporate Governance',
  EMPLOYMENT_LABOR: 'Employment & Labor',
  INTELLECTUAL_PROPERTY: 'Intellectual Property',
  REAL_ESTATE: 'Real Estate',
  LITIGATION_DISPUTE_RESOLUTION: 'Litigation',
  BANKING_FINANCE: 'Banking & Finance',
  MERGERS_AND_ACQUISITIONS: 'M&A',
  TAX_LAW: 'Tax Law',
  COMPLIANCE_REGULATORY: 'Compliance & Regulatory',
  SECURITIES: 'Securities',
  ANTITRUST_COMPETITION: 'Antitrust',
  BANKRUPTCY_RESTRUCTURING: 'Bankruptcy',
  ENVIRONMENTAL_LAW: 'Environmental',
  HEALTHCARE_LIFE_SCIENCES: 'Healthcare',
  IMMIGRATION: 'Immigration',
  PRIVACY_DATA_PROTECTION: 'Privacy & Data',
  TECHNOLOGY_LICENSING: 'Technology',
  INTERNATIONAL_TRADE: 'International Trade',
  GENERAL_PRACTICE: 'General Practice',
};

export function LegalKnowledgeViewDialog({
  item,
  open,
  onOpenChange,
}: LegalKnowledgeViewDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {item.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="mt-1">{TYPE_LABELS[item.type]}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Jurisdiction</label>
                <p className="mt-1">{JURISDICTION_LABELS[item.jurisdiction]}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1 flex gap-2">
                  <Badge
                    variant={item.status === 'active' ? 'default' : 'secondary'}
                    className={
                      item.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {item.status}
                  </Badge>
                  <Badge
                    variant={item.isPublished ? 'default' : 'outline'}
                    className={item.isPublished ? 'bg-blue-100 text-blue-800' : ''}
                  >
                    {item.isPublished ? 'Published' : 'Unpublished'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Source Type</label>
                <p className="mt-1 capitalize">{item.sourceType}</p>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-700">{item.description}</p>
              </div>
            )}

            {/* Source Reference */}
            {item.sourceReference && (
              <div>
                <label className="text-sm font-medium text-gray-500">Source Reference</label>
                <p className="mt-1 text-gray-700">{item.sourceReference}</p>
              </div>
            )}

            {/* Practice Areas */}
            {item.practiceAreas && item.practiceAreas.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Practice Areas</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {item.practiceAreas.map((area) => (
                    <Badge key={area} variant="outline">
                      {PRACTICE_AREA_LABELS[area] || area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* File URL */}
            {item.fileUrl && (
              <div>
                <label className="text-sm font-medium text-gray-500">Original File</label>
                <div className="mt-1">
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View File ({item.fileType})
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm text-gray-600">
                  {format(new Date(item.createdAt), 'PPpp')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-600">
                  {format(new Date(item.updatedAt), 'PPpp')}
                </p>
              </div>
              {item.effectiveDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Effective Date</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {format(new Date(item.effectiveDate), 'PP')}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Chunks Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-500">
                  Processed Chunks ({item.chunks?.length || 0})
                </label>
              </div>
              {item.chunks && item.chunks.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {item.chunks.slice(0, 10).map((chunk, index) => (
                    <div
                      key={chunk.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          Chunk {chunk.chunkIndex + 1}
                          {chunk.sectionTitle && ` - ${chunk.sectionTitle}`}
                        </span>
                        <span className="text-xs text-gray-400">
                          {chunk.chunkText.length} chars
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {chunk.chunkText}
                      </p>
                    </div>
                  ))}
                  {(item.chunks?.length || 0) > 10 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      ... and {(item.chunks?.length || 0) - 10} more chunks
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No chunks processed yet. The document may still be processing.
                </p>
              )}
            </div>

            <Separator />

            {/* Content Preview */}
            <div>
              <label className="text-sm font-medium text-gray-500">Content Preview</label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-[400px] overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {item.content.substring(0, 5000)}
                  {item.content.length > 5000 && '\n\n... (content truncated)'}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total: {item.content.length.toLocaleString()} characters
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
