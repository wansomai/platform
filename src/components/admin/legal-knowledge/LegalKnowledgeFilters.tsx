'use client';

import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LegalKnowledgeType, Jurisdiction } from '@/types/legalKnowledge';

interface LegalKnowledgeFiltersProps {
  type: LegalKnowledgeType | '';
  jurisdiction: Jurisdiction | '';
  status: 'active' | 'archived' | 'draft' | '';
  isPublished: boolean | undefined;
  search: string;
  onTypeChange: (value: LegalKnowledgeType | '') => void;
  onJurisdictionChange: (value: Jurisdiction | '') => void;
  onStatusChange: (value: 'active' | 'archived' | 'draft' | '') => void;
  onIsPublishedChange: (value: boolean | undefined) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const LEGAL_KNOWLEDGE_TYPES: { value: LegalKnowledgeType; label: string }[] = [
  { value: 'TEMPLATE', label: 'Template' },
  { value: 'CASE_LAW', label: 'Case Law' },
  { value: 'STATUTE', label: 'Statute' },
  { value: 'REGULATION', label: 'Regulation' },
  { value: 'LEGAL_OPINION', label: 'Legal Opinion' },
  { value: 'PRACTICE_GUIDE', label: 'Practice Guide' },
];

const JURISDICTIONS: { value: Jurisdiction; label: string }[] = [
  { value: 'KENYA_NATIONAL', label: 'Kenya (National)' },
  { value: 'KENYA_NAIROBI', label: 'Kenya (Nairobi)' },
  { value: 'INTERNATIONAL', label: 'International' },
  { value: 'GENERAL', label: 'General' },
];

export function LegalKnowledgeFilters({
  type,
  jurisdiction,
  status,
  isPublished,
  search,
  onTypeChange,
  onJurisdictionChange,
  onStatusChange,
  onIsPublishedChange,
  onSearchChange,
  onRefresh,
  isLoading,
}: LegalKnowledgeFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by title, description, or tags..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type Filter */}
        <Select value={type} onValueChange={(v) => onTypeChange(v as LegalKnowledgeType | '')}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {LEGAL_KNOWLEDGE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Jurisdiction Filter */}
        <Select value={jurisdiction} onValueChange={(v) => onJurisdictionChange(v as Jurisdiction | '')}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="All Jurisdictions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Jurisdictions</SelectItem>
            {JURISDICTIONS.map((j) => (
              <SelectItem key={j.value} value={j.value}>
                {j.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={status} onValueChange={(v) => onStatusChange(v as 'active' | 'archived' | 'draft' | '')}>
          <SelectTrigger className="w-full lg:w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Published Filter */}
        <Select
          value={isPublished === undefined ? '' : isPublished.toString()}
          onValueChange={(v) => onIsPublishedChange(v === '' ? undefined : v === 'true')}
        >
          <SelectTrigger className="w-full lg:w-[140px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="true">Published</SelectItem>
            <SelectItem value="false">Unpublished</SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
