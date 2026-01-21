// Legal Knowledge Service for CRUD operations
// Handles creating, updating, and managing legal knowledge entries with embeddings

import prisma from '@/lib/prisma';
import { ChunkingService } from './chunkingService';
import { EmbeddingService } from './embeddingService';
import {
  CreateLegalKnowledgeInput,
  UpdateLegalKnowledgeInput,
  LegalKnowledgeFilter,
  LegalKnowledge,
  LegalKnowledgeType,
  Jurisdiction
} from '@/types/legalKnowledge';
import { PracticeArea } from '@/prisma/client';

// Text extraction imports
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export class LegalKnowledgeService {
  /**
   * Create a new legal knowledge entry
   */
  static async create(
    input: CreateLegalKnowledgeInput,
    createdById: string
  ): Promise<LegalKnowledge> {
    // Create the legal knowledge entry
    const legalKnowledge = await prisma.legalKnowledge.create({
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        jurisdiction: input.jurisdiction,
        practiceAreas: input.practiceAreas || [],
        content: input.content,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        sourceType: input.sourceType || 'internal',
        sourceReference: input.sourceReference,
        effectiveDate: input.effectiveDate,
        tags: input.tags || [],
        createdById
      }
    });

    // Process and create chunks with embeddings in background
    this.processAndEmbedChunks(legalKnowledge.id, input.content).catch(err => {
      console.error(`Failed to process chunks for ${legalKnowledge.id}:`, err);
    });

    return legalKnowledge as LegalKnowledge;
  }

  /**
   * Create legal knowledge from uploaded file
   */
  static async createFromFile(
    file: Buffer,
    fileName: string,
    fileType: string,
    metadata: {
      title: string;
      description?: string;
      type: LegalKnowledgeType;
      jurisdiction: Jurisdiction;
      practiceAreas?: PracticeArea[];
      sourceType?: string;
      sourceReference?: string;
      effectiveDate?: Date;
      tags?: string[];
    },
    fileUrl: string,
    createdById: string
  ): Promise<LegalKnowledge> {
    // Extract text from file
    const content = await this.extractTextFromFile(file, fileType);

    if (!content || content.trim().length === 0) {
      throw new Error('Could not extract text from file');
    }

    return this.create(
      {
        ...metadata,
        content,
        fileUrl,
        fileType
      },
      createdById
    );
  }

  /**
   * Extract text from various file types
   */
  static async extractTextFromFile(
    file: Buffer,
    fileType: string
  ): Promise<string> {
    const mimeType = fileType.toLowerCase();

    if (mimeType.includes('pdf') || mimeType === 'application/pdf') {
      const data = await pdfParse(file);
      return data.text;
    }

    if (
      mimeType.includes('word') ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer: file });
      return result.value;
    }

    if (mimeType.includes('text/plain')) {
      return file.toString('utf-8');
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  }

  /**
   * Process text into chunks and generate embeddings
   */
  static async processAndEmbedChunks(
    legalKnowledgeId: string,
    content: string
  ): Promise<void> {
    console.log(`Processing chunks for legal knowledge ${legalKnowledgeId}`);

    // Delete existing chunks
    await prisma.legalKnowledgeChunk.deleteMany({
      where: { legalKnowledgeId }
    });

    // Chunk the content
    const chunks = ChunkingService.chunkText(content, {
      maxChunkSize: 4000,
      overlapSize: 800,
      preserveSections: true
    });

    console.log(`Created ${chunks.length} chunks`);

    // Generate embeddings and create chunks
    for (const chunk of chunks) {
      try {
        const embedding = await EmbeddingService.generateEmbedding(chunk.text);
        const embeddingStr = EmbeddingService.formatForPgVector(embedding);

        // Use raw SQL to insert with vector embedding
        await prisma.$executeRaw`
          INSERT INTO legal_knowledge_chunks
          (id, "legalKnowledgeId", "chunkIndex", "chunkText", "startOffset", "endOffset", embedding, "sectionTitle", "createdAt")
          VALUES (
            ${this.generateCuid()},
            ${legalKnowledgeId},
            ${chunk.index},
            ${chunk.text},
            ${chunk.startOffset},
            ${chunk.endOffset},
            ${embeddingStr}::vector,
            ${chunk.sectionTitle || null},
            NOW()
          )
        `;

        console.log(`Created chunk ${chunk.index + 1}/${chunks.length}`);
      } catch (error) {
        console.error(`Failed to create chunk ${chunk.index}:`, error);
        throw error;
      }
    }

    console.log(`Finished processing chunks for ${legalKnowledgeId}`);
  }

  /**
   * Get legal knowledge by ID
   */
  static async getById(id: string): Promise<LegalKnowledge | null> {
    const result = await prisma.legalKnowledge.findUnique({
      where: { id },
      include: {
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            chunkText: true,
            startOffset: true,
            endOffset: true,
            sectionTitle: true,
            createdAt: true
          },
          orderBy: { chunkIndex: 'asc' }
        }
      }
    });

    return result as LegalKnowledge | null;
  }

  /**
   * List legal knowledge with filters
   */
  static async list(
    filter?: LegalKnowledgeFilter,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: LegalKnowledge[]; total: number }> {
    const where: any = {};

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.jurisdiction) {
      where.jurisdiction = filter.jurisdiction;
    }

    if (filter?.practiceAreas && filter.practiceAreas.length > 0) {
      where.practiceAreas = {
        hasSome: filter.practiceAreas
      };
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.isPublished !== undefined) {
      where.isPublished = filter.isPublished;
    }

    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { tags: { has: filter.search } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.legalKnowledge.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.legalKnowledge.count({ where })
    ]);

    return {
      items: items as LegalKnowledge[],
      total
    };
  }

  /**
   * Update legal knowledge
   */
  static async update(
    id: string,
    input: UpdateLegalKnowledgeInput
  ): Promise<LegalKnowledge> {
    const existing = await prisma.legalKnowledge.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new Error('Legal knowledge not found');
    }

    const updated = await prisma.legalKnowledge.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.type && { type: input.type }),
        ...(input.jurisdiction && { jurisdiction: input.jurisdiction }),
        ...(input.practiceAreas && { practiceAreas: input.practiceAreas }),
        ...(input.content && { content: input.content }),
        ...(input.sourceReference !== undefined && { sourceReference: input.sourceReference }),
        ...(input.effectiveDate && { effectiveDate: input.effectiveDate }),
        ...(input.tags && { tags: input.tags }),
        ...(input.status && { status: input.status })
      }
    });

    // If content was updated, reprocess chunks
    if (input.content) {
      this.processAndEmbedChunks(id, input.content).catch(err => {
        console.error(`Failed to reprocess chunks for ${id}:`, err);
      });
    }

    return updated as LegalKnowledge;
  }

  /**
   * Publish legal knowledge for RAG
   */
  static async publish(id: string): Promise<LegalKnowledge> {
    const legalKnowledge = await prisma.legalKnowledge.findUnique({
      where: { id },
      include: { chunks: true }
    });

    if (!legalKnowledge) {
      throw new Error('Legal knowledge not found');
    }

    // Check if chunks exist and have embeddings
    if (legalKnowledge.chunks.length === 0) {
      throw new Error('Cannot publish: no chunks have been processed');
    }

    const updated = await prisma.legalKnowledge.update({
      where: { id },
      data: {
        isPublished: true,
        status: 'active'
      }
    });

    return updated as LegalKnowledge;
  }

  /**
   * Unpublish legal knowledge
   */
  static async unpublish(id: string): Promise<LegalKnowledge> {
    const updated = await prisma.legalKnowledge.update({
      where: { id },
      data: { isPublished: false }
    });

    return updated as LegalKnowledge;
  }

  /**
   * Delete legal knowledge (soft delete by setting status to archived)
   */
  static async delete(id: string): Promise<void> {
    await prisma.legalKnowledge.update({
      where: { id },
      data: {
        status: 'archived',
        isPublished: false
      }
    });
  }

  /**
   * Hard delete legal knowledge and all chunks
   */
  static async hardDelete(id: string): Promise<void> {
    // Chunks are deleted via cascade
    await prisma.legalKnowledge.delete({
      where: { id }
    });
  }

  /**
   * Reprocess chunks for a legal knowledge entry
   */
  static async reprocess(id: string): Promise<void> {
    const legalKnowledge = await prisma.legalKnowledge.findUnique({
      where: { id }
    });

    if (!legalKnowledge) {
      throw new Error('Legal knowledge not found');
    }

    await this.processAndEmbedChunks(id, legalKnowledge.content);
  }

  /**
   * Get statistics about the legal knowledge base
   */
  static async getStats(): Promise<{
    total: number;
    published: number;
    byType: Record<string, number>;
    byJurisdiction: Record<string, number>;
    totalChunks: number;
  }> {
    const [total, published, byType, byJurisdiction, totalChunks] = await Promise.all([
      prisma.legalKnowledge.count({ where: { status: 'active' } }),
      prisma.legalKnowledge.count({ where: { isPublished: true } }),
      prisma.legalKnowledge.groupBy({
        by: ['type'],
        _count: true,
        where: { status: 'active' }
      }),
      prisma.legalKnowledge.groupBy({
        by: ['jurisdiction'],
        _count: true,
        where: { status: 'active' }
      }),
      prisma.legalKnowledgeChunk.count()
    ]);

    return {
      total,
      published,
      byType: Object.fromEntries(byType.map(b => [b.type, b._count])),
      byJurisdiction: Object.fromEntries(byJurisdiction.map(b => [b.jurisdiction, b._count])),
      totalChunks
    };
  }

  /**
   * Generate a CUID-like ID
   */
  private static generateCuid(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `c${timestamp}${randomStr}`;
  }
}
