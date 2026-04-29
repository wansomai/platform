// RAG (Retrieval Augmented Generation) Service
// Handles vector similarity search and context building for document generation

import prisma from '@/lib/prisma';
import { EmbeddingService } from './embeddingService';
import {
  RAGQuery,
  RAGResult,
  RAGChunkResult,
  IntentResult,
  Jurisdiction,
  LegalKnowledgeType
} from '@/types/legalKnowledge';
import { PracticeArea } from '@/prisma/client';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({
  apiKey: process.env.WANSOM_API_KEY || ''
});

// Default configuration
const DEFAULT_TOP_K = parseInt(process.env.RAG_DEFAULT_TOP_K || '5', 10);
const DEFAULT_MIN_SIMILARITY = parseFloat(process.env.RAG_MIN_SIMILARITY_SCORE || '0.7');

// Document type detection keywords
const DOCUMENT_TYPE_KEYWORDS: Record<string, string[]> = {
  NDA: ['non-disclosure', 'nda', 'confidentiality', 'confidential information', 'trade secret'],
  CONTRACT: ['contract', 'agreement', 'terms', 'conditions', 'parties'],
  EMPLOYMENT: ['employment', 'employee', 'employer', 'salary', 'benefits', 'termination'],
  LEASE: ['lease', 'rent', 'tenant', 'landlord', 'property', 'premises'],
  PARTNERSHIP: ['partnership', 'partner', 'profit sharing', 'business partner'],
  SERVICE: ['service agreement', 'service level', 'sla', 'consulting', 'professional services'],
  SALE: ['sale', 'purchase', 'buyer', 'seller', 'goods', 'delivery'],
  LICENSE: ['license', 'licensing', 'intellectual property', 'ip rights', 'royalty'],
  LOAN: ['loan', 'lending', 'borrower', 'lender', 'interest rate', 'repayment'],
  WILL: ['will', 'testament', 'estate', 'beneficiary', 'executor', 'inheritance'],
  POWER_OF_ATTORNEY: ['power of attorney', 'poa', 'attorney-in-fact', 'principal']
};

// Jurisdiction detection keywords
const JURISDICTION_KEYWORDS: Record<Jurisdiction, string[]> = {
  KENYA: ['kenya', 'kenyan law', 'laws of kenya', 'republic of kenya', 'nairobi'],
  INTERNATIONAL: ['international', 'cross-border', 'multi-jurisdiction', 'uncitral', 'icc'],
  GENERAL: []
};

export class RAGService {
  /**
   * Retrieve relevant legal knowledge chunks based on query
   */
  static async retrieve(query: RAGQuery): Promise<RAGResult> {
    const topK = query.topK || DEFAULT_TOP_K;
    const minScore = query.minSimilarityScore || DEFAULT_MIN_SIMILARITY;

    // Generate query embedding
    const queryEmbedding = await EmbeddingService.generateQueryEmbedding(query.query);
    const embeddingStr = EmbeddingService.formatForPgVector(queryEmbedding);

    // Build the filter conditions for the SQL query
    const jurisdictionFilter = query.jurisdiction ? `AND lk.jurisdiction = '${query.jurisdiction}'` : '';
    const typeFilter = query.documentTypes && query.documentTypes.length > 0
      ? `AND lk.type IN (${query.documentTypes.map(t => `'${t}'`).join(',')})`
      : '';

    // Build the full query string (using $queryRawUnsafe for dynamic filters)
    const sqlQuery = `
      SELECT
        lkc.id,
        lkc."chunkText" as chunk_text,
        lkc."sectionTitle" as section_title,
        1 - (lkc.embedding <=> '${embeddingStr}'::vector) as score,
        lk.id as lk_id,
        lk.title as lk_title,
        lk.type::text as lk_type,
        lk.jurisdiction::text as lk_jurisdiction,
        lk."sourceReference" as lk_source_reference
      FROM legal_knowledge_chunks lkc
      JOIN legal_knowledge lk ON lkc."legalKnowledgeId" = lk.id
      WHERE lk.status = 'active'
        AND lk."isPublished" = true
        AND lkc.embedding IS NOT NULL
        ${jurisdictionFilter}
        ${typeFilter}
      ORDER BY score DESC
      LIMIT ${topK}
    `;

    // Vector similarity search with filters using pgvector cosine distance
    const results = await prisma.$queryRawUnsafe<Array<{
      id: string;
      chunk_text: string;
      section_title: string | null;
      score: number;
      lk_id: string;
      lk_title: string;
      lk_type: string;
      lk_jurisdiction: string;
      lk_source_reference: string | null;
    }>>(sqlQuery);

    // Filter by minimum similarity score
    const filteredResults = results.filter(r => r.score >= minScore);

    // Transform to RAGChunkResult format
    const chunks: RAGChunkResult[] = filteredResults.map(r => ({
      id: r.id,
      chunkText: r.chunk_text,
      sectionTitle: r.section_title,
      score: r.score,
      legalKnowledge: {
        id: r.lk_id,
        title: r.lk_title,
        type: r.lk_type as LegalKnowledgeType,
        jurisdiction: r.lk_jurisdiction as Jurisdiction,
        sourceReference: r.lk_source_reference
      }
    }));

    return {
      chunks,
      query: query.query,
      totalResults: chunks.length
    };
  }

  /**
   * Build a context string from RAG results for prompt injection
   */
  static buildContextString(results: RAGResult): string {
    if (results.chunks.length === 0) {
      return '';
    }

    // Group chunks by source document
    const groupedBySource = new Map<string, RAGChunkResult[]>();
    for (const chunk of results.chunks) {
      const key = chunk.legalKnowledge.id;
      if (!groupedBySource.has(key)) {
        groupedBySource.set(key, []);
      }
      groupedBySource.get(key)!.push(chunk);
    }

    // Build context string with citations
    let context = '';
    let sourceIndex = 1;

    for (const [, chunks] of groupedBySource) {
      const source = chunks[0].legalKnowledge;
      context += `\n**[Source ${sourceIndex}]** ${source.title}`;
      context += source.sourceReference ? ` (${source.sourceReference})` : '';
      context += `\n_Type: ${source.type}, Jurisdiction: ${source.jurisdiction}_\n`;

      for (const chunk of chunks) {
        if (chunk.sectionTitle) {
          context += `\n### ${chunk.sectionTitle}\n`;
        }
        context += `${chunk.chunkText}\n`;
      }

      context += '\n---\n';
      sourceIndex++;
    }

    return context.trim();
  }

  /**
   * Detect document type and jurisdiction from user message
   */
  static async detectIntent(message: string): Promise<IntentResult> {
    const messageLower = message.toLowerCase();

    // Detect document type
    let detectedType: string | undefined;
    let typeConfidence = 0;

    for (const [type, keywords] of Object.entries(DOCUMENT_TYPE_KEYWORDS)) {
      const matchCount = keywords.filter(kw => messageLower.includes(kw)).length;
      const confidence = matchCount / keywords.length;
      if (confidence > typeConfidence) {
        typeConfidence = confidence;
        detectedType = type;
      }
    }

    // Detect jurisdiction
    let detectedJurisdiction: Jurisdiction | undefined;
    let jurisdictionConfidence = 0;

    for (const [jurisdiction, keywords] of Object.entries(JURISDICTION_KEYWORDS)) {
      if (keywords.length === 0) continue;
      const matchCount = keywords.filter(kw => messageLower.includes(kw)).length;
      const confidence = matchCount / keywords.length;
      if (confidence > jurisdictionConfidence) {
        jurisdictionConfidence = confidence;
        detectedJurisdiction = jurisdiction as Jurisdiction;
      }
    }

    // Detect practice areas from message
    const practiceAreas: PracticeArea[] = [];
    if (messageLower.includes('contract') || messageLower.includes('agreement')) {
      practiceAreas.push('CONTRACTS_COMMERCIAL');
    }
    if (messageLower.includes('employment') || messageLower.includes('labor')) {
      practiceAreas.push('EMPLOYMENT_LABOR');
    }
    if (messageLower.includes('intellectual property') || messageLower.includes('ip') || messageLower.includes('patent')) {
      practiceAreas.push('INTELLECTUAL_PROPERTY');
    }
    if (messageLower.includes('real estate') || messageLower.includes('property') || messageLower.includes('lease')) {
      practiceAreas.push('REAL_ESTATE');
    }
    if (messageLower.includes('corporate') || messageLower.includes('governance')) {
      practiceAreas.push('CORPORATE_GOVERNANCE');
    }
    if (messageLower.includes('merger') || messageLower.includes('acquisition') || messageLower.includes('m&a')) {
      practiceAreas.push('MERGERS_AND_ACQUISITIONS');
    }

    const overallConfidence = Math.max(typeConfidence, jurisdictionConfidence, 0.3);

    return {
      documentType: detectedType,
      jurisdiction: detectedJurisdiction,
      practiceAreas: practiceAreas.length > 0 ? practiceAreas : undefined,
      confidence: overallConfidence
    };
  }

  /**
   * Auto-match RAG results based on project context and user message
   * Combines project jurisdiction with message intent detection
   */
  static async autoMatch(
    projectContext: {
      jurisdiction?: string;
      practiceAreas?: PracticeArea[];
      instructions?: string;
    },
    message: string
  ): Promise<RAGResult> {
    // Detect intent from message
    const intent = await this.detectIntent(message);

    // Determine jurisdiction (project > detected > general)
    let jurisdiction: Jurisdiction | undefined;
    if (projectContext.jurisdiction) {
      jurisdiction = projectContext.jurisdiction as Jurisdiction;
    } else if (intent.jurisdiction) {
      jurisdiction = intent.jurisdiction;
    }

    // Combine practice areas
    const practiceAreas = [
      ...(projectContext.practiceAreas || []),
      ...(intent.practiceAreas || [])
    ];

    // Map detected document type to LegalKnowledgeType
    let documentTypes: LegalKnowledgeType[] | undefined;
    if (intent.documentType) {
      // Map common document types to LegalKnowledgeType.TEMPLATE
      documentTypes = ['TEMPLATE'];
    }

    // Build retrieval query
    const query: RAGQuery = {
      query: message,
      jurisdiction,
      practiceAreas: practiceAreas.length > 0 ? [...new Set(practiceAreas)] : undefined,
      documentTypes,
      topK: 5
    };

    return this.retrieve(query);
  }

  /**
   * Use AI to enhance intent detection for complex queries
   */
  static async detectIntentWithAI(message: string): Promise<IntentResult> {
    try {
      const prompt = `Analyze this legal document request and extract:
1. Document type (e.g., NDA, Employment Contract, Lease Agreement)
2. Jurisdiction if mentioned (Kenya, International, etc.)
3. Practice areas (e.g., Corporate, Employment, Real Estate)

Request: "${message}"

Respond in JSON format:
{
  "documentType": "string or null",
  "jurisdiction": "KENYA | INTERNATIONAL | GENERAL | null",
  "practiceAreas": ["array of practice areas"],
  "confidence": 0.0 to 1.0
}`;

      const result = await genAI.models.generateContent({
        model: process.env.WANSOM_MODEL || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.1,
          maxOutputTokens: 500
        }
      });

      const responseText = result.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          documentType: parsed.documentType || undefined,
          jurisdiction: parsed.jurisdiction as Jurisdiction || undefined,
          practiceAreas: parsed.practiceAreas || [],
          confidence: parsed.confidence || 0.5
        };
      }
    } catch (error) {
      console.error('AI intent detection failed:', error);
    }

    // Fall back to keyword-based detection
    return this.detectIntent(message);
  }

  /**
   * Search for similar legal knowledge entries (without embedding, text-based)
   */
  static async searchByText(
    searchTerm: string,
    filter?: {
      type?: LegalKnowledgeType;
      jurisdiction?: Jurisdiction;
      limit?: number;
    }
  ): Promise<Array<{
    id: string;
    title: string;
    type: LegalKnowledgeType;
    jurisdiction: Jurisdiction;
    excerpt: string;
  }>> {
    const where: any = {
      status: 'active',
      isPublished: true,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { has: searchTerm } }
      ]
    };

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.jurisdiction) {
      where.jurisdiction = filter.jurisdiction;
    }

    const results = await prisma.legal_knowledge.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        jurisdiction: true,
        content: true
      },
      take: filter?.limit || 10
    });

    return results.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type as LegalKnowledgeType,
      jurisdiction: r.jurisdiction as Jurisdiction,
      excerpt: r.content.substring(0, 200) + '...'
    }));
  }

  /**
   * Get the count of available knowledge for a given context
   */
  static async getAvailableKnowledgeCount(
    jurisdiction?: Jurisdiction,
    practiceAreas?: PracticeArea[]
  ): Promise<number> {
    const where: any = {
      status: 'active',
      isPublished: true
    };

    if (jurisdiction) {
      where.jurisdiction = jurisdiction;
    }

    if (practiceAreas && practiceAreas.length > 0) {
      where.practiceAreas = {
        hasSome: practiceAreas
      };
    }

    return prisma.legal_knowledge.count({ where });
  }
}
