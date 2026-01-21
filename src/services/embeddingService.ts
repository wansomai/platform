// Embedding Service for generating vector embeddings using Gemini
// Uses text-embedding-004 model (768 dimensions)

import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
});

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;

export class EmbeddingService {
  /**
   * Generate embedding for document content (storage/indexing)
   * Uses RETRIEVAL_DOCUMENT task type for better retrieval performance
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Truncate text if it's too long (model has ~2048 token limit for embedding)
      const truncatedText = this.truncateText(text, 8000);

      const result = await genAI.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: [{ parts: [{ text: truncatedText }] }],
        config: {
          taskType: 'RETRIEVAL_DOCUMENT'
        }
      });

      if (!result.embeddings || result.embeddings.length === 0) {
        throw new Error('No embedding returned from API');
      }

      const embedding = result.embeddings[0].values;

      if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(`Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding?.length}`);
      }

      return embedding;
    } catch (error: any) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embedding for search query
   * Uses RETRIEVAL_QUERY task type for better query matching
   */
  static async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const result = await genAI.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: [{ parts: [{ text: query }] }],
        config: {
          taskType: 'RETRIEVAL_QUERY'
        }
      });

      if (!result.embeddings || result.embeddings.length === 0) {
        throw new Error('No embedding returned from API');
      }

      const embedding = result.embeddings[0].values;

      if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(`Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding?.length}`);
      }

      return embedding;
    } catch (error: any) {
      console.error('Error generating query embedding:', error);
      throw new Error(`Failed to generate query embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * More efficient than calling generateEmbedding multiple times
   */
  static async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];

      // Process in batches of 5 to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.generateEmbedding(text));
        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < texts.length) {
          await this.delay(100);
        }
      }

      return embeddings;
    } catch (error: any) {
      console.error('Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Format embedding array for PostgreSQL pgvector
   */
  static formatForPgVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * Parse pgvector string back to number array
   */
  static parseFromPgVector(pgVectorString: string): number[] {
    const cleaned = pgVectorString.replace(/[\[\]]/g, '');
    return cleaned.split(',').map(Number);
  }

  /**
   * Calculate cosine similarity between two embeddings
   * Returns value between -1 and 1, where 1 is identical
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Truncate text to approximate character limit while preserving words
   */
  private static truncateText(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;

    // Find the last space before the limit
    const truncated = text.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
  }

  /**
   * Helper for delay between API calls
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the embedding model dimensions
   */
  static get dimensions(): number {
    return EMBEDDING_DIMENSIONS;
  }

  /**
   * Get the embedding model name
   */
  static get modelName(): string {
    return EMBEDDING_MODEL;
  }
}
