// Legal Knowledge System (RAG) Types

import { PracticeArea } from '@/prisma/client';

export type LegalKnowledgeType =
  | 'TEMPLATE'
  | 'CASE_LAW'
  | 'STATUTE'
  | 'REGULATION'
  | 'LEGAL_OPINION'
  | 'PRACTICE_GUIDE';

export type Jurisdiction =
  | 'KENYA_NATIONAL'
  | 'KENYA_NAIROBI'
  | 'INTERNATIONAL'
  | 'GENERAL';

export type LegalKnowledgeStatus = 'active' | 'archived' | 'draft';

export interface LegalKnowledge {
  id: string;
  title: string;
  description?: string | null;
  type: LegalKnowledgeType;
  jurisdiction: Jurisdiction;
  practiceAreas: PracticeArea[];
  content: string;
  fileUrl?: string | null;
  fileType?: string | null;
  sourceType: string;
  sourceReference?: string | null;
  effectiveDate?: Date | null;
  tags: string[];
  status: string;
  isPublished: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  chunks?: LegalKnowledgeChunk[];
}

export interface LegalKnowledgeChunk {
  id: string;
  legalKnowledgeId: string;
  chunkIndex: number;
  chunkText: string;
  startOffset: number;
  endOffset: number;
  sectionTitle?: string | null;
  createdAt: Date;
  // Note: embedding is handled at the database level with pgvector
}

export interface CreateLegalKnowledgeInput {
  title: string;
  description?: string;
  type: LegalKnowledgeType;
  jurisdiction: Jurisdiction;
  practiceAreas?: PracticeArea[];
  content: string;
  fileUrl?: string;
  fileType?: string;
  sourceType?: string;
  sourceReference?: string;
  effectiveDate?: Date;
  tags?: string[];
}

export interface UpdateLegalKnowledgeInput {
  title?: string;
  description?: string;
  type?: LegalKnowledgeType;
  jurisdiction?: Jurisdiction;
  practiceAreas?: PracticeArea[];
  content?: string;
  sourceReference?: string;
  effectiveDate?: Date;
  tags?: string[];
  status?: LegalKnowledgeStatus;
}

export interface LegalKnowledgeFilter {
  type?: LegalKnowledgeType;
  jurisdiction?: Jurisdiction;
  practiceAreas?: PracticeArea[];
  status?: LegalKnowledgeStatus;
  isPublished?: boolean;
  search?: string;
}

// RAG Types

export interface RAGQuery {
  query: string;
  jurisdiction?: Jurisdiction;
  practiceAreas?: PracticeArea[];
  documentTypes?: LegalKnowledgeType[];
  topK?: number;
  minSimilarityScore?: number;
}

export interface RAGChunkResult {
  id: string;
  chunkText: string;
  sectionTitle?: string | null;
  score: number;
  legalKnowledge: {
    id: string;
    title: string;
    type: LegalKnowledgeType;
    jurisdiction: Jurisdiction;
    sourceReference?: string | null;
  };
}

export interface RAGResult {
  chunks: RAGChunkResult[];
  query: string;
  totalResults: number;
}

export interface IntentResult {
  documentType?: string;
  jurisdiction?: Jurisdiction;
  practiceAreas?: PracticeArea[];
  confidence: number;
}
