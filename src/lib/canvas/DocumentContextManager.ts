// lib/canvas/DocumentContextManager.ts
import { PrismaClient } from '@prisma/client';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import LRUCache from 'lru-cache';

interface DocumentContext {
  id: string;
  title: string;
  content: string;
  embeddings: number[][];
  metadata: Record<string, any>;
  lastAccessed: Date;
}

interface DocumentChunk {
  documentId: string;
  documentTitle: string;
  text: string;
  page?: number;
  relevanceScore: number;
  chunkIndex: number;
}

export class DocumentContextManager {
  private prisma: PrismaClient;
  private embeddings: OpenAIEmbeddings;
  private documentCache: LRUCache<string, DocumentContext[]>;
  private vectorStoreCache: LRUCache<string, MemoryVectorStore>;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: "text-embedding-ada-002"
    });
    
    // Cache up to 100 documents for 1 hour
    this.documentCache = new LRUCache({
      max: 100,
      ttl: 1000 * 60 * 60 // 1 hour
    });
    
    // Cache vector stores for faster retrieval
    this.vectorStoreCache = new LRUCache({
      max: 50,
      ttl: 1000 * 60 * 30 // 30 minutes
    });
  }

  /**
   * Get all documents related to a project
   */
  async getProjectContext(projectId: string): Promise<DocumentContext[]> {
    const cacheKey = `project-${projectId}`;
    let cached = this.documentCache.get(cacheKey);
    
    if (!cached) {
      try {
        const documents = await this.prisma.document.findMany({
          where: {
            OR: [
              { project_id: projectId },
              { projectReferences: { some: { project_id: projectId } } }
            ],
            status: 'active'
          },
          include: {
            content: true,
            embeddings: {
              orderBy: { chunkIndex: 'asc' },
              take: 50 // Limit embeddings for performance
            }
          },
          take: 50 // Limit total documents
        });
        
        const processedDocs = await this.processDocuments(documents);
        this.documentCache.set(cacheKey, processedDocs);
        return processedDocs;
      } catch (error) {
        console.error('Error fetching project documents:', error);
        return [];
      }
    }
    
    return Array.isArray(cached) ? cached : [cached];
  }

  /**
   * Get documents related to a specific conversation
   */
  async getConversationContext(conversationId: string): Promise<DocumentContext[]> {
    const cacheKey = `conversation-${conversationId}`;
    let cached = this.documentCache.get(cacheKey);
    
    if (!cached) {
      try {
        const documents = await this.prisma.document.findMany({
          where: {
            conversationReferences: {
              some: { conversation_id: conversationId }
            },
            status: 'active'
          },
          include: {
            content: true,
            embeddings: {
              orderBy: { chunkIndex: 'asc' },
              take: 50
            }
          },
          take: 20 // Fewer documents for conversation context
        });
        
        const processedDocs = await this.processDocuments(documents);
        this.documentCache.set(cacheKey, processedDocs);
        return processedDocs;
      } catch (error) {
        console.error('Error fetching conversation documents:', error);
        return [];
      }
    }
    
    return Array.isArray(cached) ? cached : [cached];
  }

  /**
   * Get relevant document chunks based on a query
   */
  async getRelevantChunks(
    query: string,
    projectId: string,
    conversationId?: string,
    maxChunks: number = 10
  ): Promise<DocumentChunk[]> {
    try {
      const vectorStoreKey = `${projectId}-${conversationId || 'global'}`;
      let vectorStore = this.vectorStoreCache.get(vectorStoreKey);
      
      if (!vectorStore) {
        vectorStore = await this.buildVectorStore(projectId, conversationId);
        if (vectorStore) {
          this.vectorStoreCache.set(vectorStoreKey, vectorStore);
        }
      }
      
      if (!vectorStore) {
        console.warn('No vector store available for query');
        return [];
      }
      
      const results = await vectorStore.similaritySearchWithScore(query, maxChunks);
      
      return results.map(([doc, score]) => ({
        documentId: doc.metadata.documentId,
        documentTitle: doc.metadata.title,
        text: doc.pageContent,
        page: doc.metadata.page || null,
        relevanceScore: 1 - score, // Convert distance to similarity
        chunkIndex: doc.metadata.chunkIndex || 0
      }));
    } catch (error) {
      console.error('Error getting relevant chunks:', error);
      return [];
    }
  }

  /**
   * Build vector store from documents
   */
  private async buildVectorStore(
    projectId: string,
    conversationId?: string
  ): Promise<MemoryVectorStore | undefined> {
    try {
      // Get all relevant documents
      const whereClause = conversationId 
        ? {
            OR: [
              { project_id: projectId },
              { conversationReferences: { some: { conversation_id: conversationId } } }
            ],
            status: 'active'
          }
        : { 
            OR: [
              { project_id: projectId },
              { projectReferences: { some: { project_id: projectId } } }
            ],
            status: 'active'
          };
      
      const documents = await this.prisma.document.findMany({
        where: whereClause,
        include: {
          content: true,
          embeddings: {
            orderBy: { chunkIndex: 'asc' }
          }
        },
        take: 50 // Limit for performance
      });
      
      if (documents.length === 0) {
        return undefined;
      }
      
      // Convert to LangChain documents
      const langChainDocs: Document[] = [];
      
      for (const doc of documents) {
        if (!doc.content?.content) continue;
        
        if (doc.embeddings.length > 0) {
          // Use existing embeddings
          for (const embedding of doc.embeddings) {
            langChainDocs.push(new Document({
              pageContent: embedding.chunkText,
              metadata: {
                documentId: doc.id,
                title: doc.title,
                chunkIndex: embedding.chunkIndex,
                type: doc.file_type,
                section: doc.section
              }
            }));
          }
        } else {
          // Create chunks from content if no embeddings exist
          const chunks = this.chunkText(doc.content.content, doc.title, doc.id);
          langChainDocs.push(...chunks);
        }
      }
      
      if (langChainDocs.length === 0) {
        return undefined;
      }
      
      return await MemoryVectorStore.fromDocuments(langChainDocs, this.embeddings);
    } catch (error) {
      console.error('Error building vector store:', error);
      return undefined;
    }
  }

  /**
   * Process raw documents into DocumentContext format
   */
  private async processDocuments(documents: any[]): Promise<DocumentContext[]> {
    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content?.content || '',
      embeddings: doc.embeddings?.map((e: any) => {
        try {
          return JSON.parse(e.vector);
        } catch {
          return [];
        }
      }) || [],
      metadata: {
        type: doc.file_type,
        section: doc.section,
        createdAt: doc.created_at,
        fileSize: doc.file_size,
        status: doc.status
      },
      lastAccessed: new Date()
    }));
  }

  /**
   * Chunk text into smaller pieces for better retrieval
   */
  private chunkText(text: string, title: string, documentId: string, chunkSize: number = 1000): Document[] {
    const chunks: Document[] = [];
    const overlap = 200; // Character overlap between chunks
    
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunk = text.substring(i, i + chunkSize);
      
      if (chunk.trim().length > 50) { // Only include meaningful chunks
        chunks.push(new Document({
          pageContent: chunk.trim(),
          metadata: {
            documentId,
            title,
            chunkIndex: Math.floor(i / (chunkSize - overlap)),
            type: 'text',
            startIndex: i,
            endIndex: i + chunk.length
          }
        }));
      }
    }
    
    return chunks;
  }

  /**
   * Find most frequently referenced documents for a project
   */
  async getFrequentlyReferencedDocuments(projectId: string, userId?: string, limit: number = 10): Promise<string[]> {
    try {
      const where: any = { projectId };
      if (userId) where.userId = userId;

      const interactions = await this.prisma.documentInteraction.groupBy({
        by: ['documentId'],
        where,
        _sum: { frequency: true },
        _max: { lastUsed: true },
        orderBy: [
          { _sum: { frequency: 'desc' } },
          { _max: { lastUsed: 'desc' } }
        ],
        take: limit
      });

      return interactions.map(interaction => interaction.documentId);
    } catch (error) {
      console.error('Error getting frequently referenced documents:', error);
      return [];
    }
  }

  /**
   * Update document interaction tracking
   */
  async trackDocumentUsage(
    userId: string,
    documentId: string,
    projectId: string,
    interactionType: string,
    context?: string
  ): Promise<void> {
    try {
      await this.prisma.documentInteraction.upsert({
        where: {
          userId_documentId_projectId: {
            userId,
            documentId,
            projectId
          }
        },
        update: {
          frequency: { increment: 1 },
          lastUsed: new Date(),
          context: context?.substring(0, 1000) // Limit context size
        },
        create: {
          userId,
          documentId,
          projectId,
          interactionType,
          context: context?.substring(0, 1000),
          frequency: 1
        }
      });
    } catch (error) {
      console.error('Error tracking document usage:', error);
      // Don't throw error - this is non-critical
    }
  }

  /**
   * Get document usage analytics for a project
   */
  async getDocumentAnalytics(projectId: string, days: number = 30): Promise<any> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const interactions = await this.prisma.documentInteraction.findMany({
        where: {
          projectId,
          lastUsed: { gte: since }
        },
        include: {
          document: {
            select: { id: true, title: true, file_type: true }
          }
        }
      });

      // Group by document
      const documentStats = interactions.reduce<Record<string, {
        document: any;
        totalFrequency: number;
        recentUsage: number;
        interactionTypes: Set<string>;
        lastUsed: Date;
      }>>((acc, interaction) => {
        const docId = interaction.documentId;
        if (!acc[docId]) {
          acc[docId] = {
            document: interaction.document,
            totalFrequency: 0,
            recentUsage: 0,
            interactionTypes: new Set(),
            lastUsed: interaction.lastUsed
          };
        }

        acc[docId].totalFrequency += interaction.frequency;
        acc[docId].recentUsage += 1;
        acc[docId].interactionTypes.add(interaction.interactionType);
        
        if (interaction.lastUsed > acc[docId].lastUsed) {
          acc[docId].lastUsed = interaction.lastUsed;
        }

        return acc;
      }, {});

      // Convert to array and sort
      return Object.values(documentStats)
        .map((stats: any) => ({
          ...stats,
          interactionTypes: Array.from(stats.interactionTypes)
        }))
        .sort((a: any, b: any) => b.totalFrequency - a.totalFrequency);

    } catch (error) {
      console.error('Error getting document analytics:', error);
      return [];
    }
  }

  /**
   * Clear cache for specific keys or all
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      // Clear specific cache entries
      for (const key of this.documentCache.keys()) {
        if (key.includes(pattern)) {
          this.documentCache.delete(key);
        }
      }
      for (const key of this.vectorStoreCache.keys()) {
        if (key.includes(pattern)) {
          this.vectorStoreCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.documentCache.clear();
      this.vectorStoreCache.clear();
    }
  }

  /**
   * Preload documents for a project to warm the cache
   */
  async preloadProjectDocuments(projectId: string): Promise<void> {
    try {
      console.log(`Preloading documents for project ${projectId}`);
      
      // Load project context
      await this.getProjectContext(projectId);
      
      // Build vector store
      const vectorStore = await this.buildVectorStore(projectId);
      if (vectorStore) {
        this.vectorStoreCache.set(`${projectId}-global`, vectorStore);
      }
      
      console.log(`Preloading completed for project ${projectId}`);
    } catch (error) {
      console.error(`Error preloading project ${projectId}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return {
      documentCache: {
        size: this.documentCache.size,
        maxSize: this.documentCache.max,
        hit_rate: this.documentCache.calculatedSize
      },
      vectorStoreCache: {
        size: this.vectorStoreCache.size,
        maxSize: this.vectorStoreCache.max
      }
    };
  }

  /**
   * Search documents by content similarity
   */
  async searchDocumentsByContent(
    query: string,
    projectId: string,
    options: {
      maxResults?: number;
      minScore?: number;
      documentTypes?: string[];
    } = {}
  ): Promise<any[]> {
    try {
      const {
        maxResults = 20,
        minScore = 0.7,
        documentTypes = []
      } = options;

      // Build where clause for document filtering
      const whereClause: any = {
        OR: [
          { project_id: projectId },
          { projectReferences: { some: { project_id: projectId } } }
        ],
        status: 'active'
      };

      if (documentTypes.length > 0) {
        whereClause.file_type = { in: documentTypes };
      }

      // Get documents with embeddings
      const documents = await this.prisma.document.findMany({
        where: whereClause,
        include: {
          content: true,
          embeddings: {
            orderBy: { chunkIndex: 'asc' }
          }
        }
      });

      if (documents.length === 0) {
        return [];
      }

      // Create query embedding
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Score each document chunk
      const scoredChunks: any[] = [];

      for (const doc of documents) {
        for (const embedding of doc.embeddings) {
          try {
            const chunkEmbedding = JSON.parse(embedding.vector);
            const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
            
            if (similarity >= minScore) {
              scoredChunks.push({
                documentId: doc.id,
                documentTitle: doc.title,
                documentType: doc.file_type,
                chunkText: embedding.chunkText,
                chunkIndex: embedding.chunkIndex,
                similarity,
                metadata: {
                  section: doc.section,
                  createdAt: doc.created_at,
                  fileSize: doc.file_size
                }
              });
            }
          } catch (error) {
            console.error('Error parsing embedding:', error);
          }
        }
      }

      // Sort by similarity and return top results
      return scoredChunks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);

    } catch (error) {
      console.error('Error searching documents by content:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Cleanup method for graceful shutdown
   */
  async cleanup(): Promise<void> {
    try {
      this.clearCache();
      await this.prisma.$disconnect();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}