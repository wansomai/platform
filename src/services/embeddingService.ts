// Embedding Service for generating vector embeddings using the Gemini REST API.
//
// The @google/genai SDK defaults to v1beta, where text-embedding-004 and
// embedding-001 may return 404 depending on the API key type. We call the REST
// API directly so we can control the API version (v1 is the stable channel
// where text-embedding-004 is published).
//
// Endpoint: https://generativelanguage.googleapis.com/{version}/models/{model}:embedContent?key=KEY

const API_BASE = 'https://generativelanguage.googleapis.com';

// Prefer GEMINI_API_KEY; GOOGLE_API_KEY is the fallback.
// The @google/genai SDK warns when both are set because it reads env vars directly;
// here we control which key we use explicitly.
function getApiKey(): string {
  return process.env.GEMINI_API_KEY ||'';
}

// Default: text-embedding-004 (768 dims, stable v1). Override with GEMINI_EMBEDDING_MODEL.
const CONFIGURED_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;

// API versions to try in order. v1 is the stable channel; v1beta is the preview channel.
const API_VERSIONS = ['v1', 'v1beta'] as const;

// Fallback model list tried in order when the primary model returns 404 on all API versions.
// All produce 768-dimensional embeddings (gemini-embedding-exp-03-07 via outputDimensionality).
const FALLBACK_MODELS = ['embedding-001', 'gemini-embedding-exp-03-07'] as const;

interface EmbedContentRequest {
  model: string;
  content: { parts: Array<{ text: string }> };
  taskType: string;
  outputDimensionality?: number;
}

interface EmbedContentResponse {
  embedding?: { values?: number[] };
}

async function callEmbedRest(
  modelName: string,
  text: string,
  taskType: string,
  apiVersion: string
): Promise<number[]> {
  const apiKey = getApiKey();
  const url = `${API_BASE}/${apiVersion}/models/${modelName}:embedContent?key=${encodeURIComponent(apiKey)}`;

  const body: EmbedContentRequest = {
    model: `models/${modelName}`,
    content: { parts: [{ text }] },
    taskType,
  };

  // gemini-embedding-exp-03-07 defaults to 3072 dims; pin to 768 to match stored embeddings.
  if (modelName === 'gemini-embedding-exp-03-07') {
    body.outputDimensionality = EMBEDDING_DIMENSIONS;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const err: any = new Error(
      `Embedding API error ${response.status} (${apiVersion}/${modelName}): ${errorText}`
    );
    err.status = response.status;
    throw err;
  }

  const data: EmbedContentResponse = await response.json();
  const values = data.embedding?.values;
  if (!values || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid embedding dimensions from "${modelName}" via ${apiVersion}: ` +
      `expected ${EMBEDDING_DIMENSIONS}, got ${values?.length ?? 0}`
    );
  }
  return values;
}

/** Try one model across all API versions. Returns the embedding or throws the last error. */
async function tryModelAllVersions(
  modelName: string,
  text: string,
  taskType: string,
  errors: string[]
): Promise<number[] | null> {
  for (const version of API_VERSIONS) {
    try {
      return await callEmbedRest(modelName, text, taskType, version);
    } catch (err: any) {
      const is404 = err?.status === 404 || err?.message?.includes('404');
      if (is404) {
        errors.push(`${version}/${modelName}: 404`);
        continue;
      }
      // Non-404 error — propagate immediately (don't swallow auth/rate-limit errors)
      throw err;
    }
  }
  return null; // all versions returned 404
}

async function embedWithFallback(text: string, taskType: string): Promise<number[]> {
  const errors: string[] = [];
  const modelsToTry = [CONFIGURED_MODEL, ...FALLBACK_MODELS.filter(m => m !== CONFIGURED_MODEL)];

  for (const model of modelsToTry) {
    const result = await tryModelAllVersions(model, text, taskType, errors);
    if (result !== null) return result;
  }

  throw new Error(
    `[EmbeddingService] All embedding models returned 404 on all API versions. ` +
    `Tried: ${modelsToTry.join(', ')} × (${API_VERSIONS.join(', ')}). ` +
    `Check that your API key has access to embedding models and set ` +
    `GEMINI_EMBEDDING_MODEL to an available model in your .env file. ` +
    `Details: ${errors.join('; ')}`
  );
}

export class EmbeddingService {
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const truncated = this.truncateText(text, 8000);
      return await embedWithFallback(truncated, 'RETRIEVAL_DOCUMENT');
    } catch (error: any) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  static async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      return await embedWithFallback(query, 'RETRIEVAL_QUERY');
    } catch (error: any) {
      console.error('Error generating query embedding:', error);
      throw new Error(`Failed to generate query embedding: ${error.message}`);
    }
  }

  static async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];
      const batchSize = 5;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(t => this.generateEmbedding(t)));
        embeddings.push(...results);
        if (i + batchSize < texts.length) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
      return embeddings;
    } catch (error: any) {
      console.error('Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  static formatForPgVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  static parseFromPgVector(pgVectorString: string): number[] {
    return pgVectorString.replace(/[\[\]]/g, '').split(',').map(Number);
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Embeddings must have same dimensions');
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot   += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private static truncateText(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    const cut = text.substring(0, maxChars);
    const lastSpace = cut.lastIndexOf(' ');
    return lastSpace > 0 ? cut.substring(0, lastSpace) : cut;
  }

  static get dimensions(): number { return EMBEDDING_DIMENSIONS; }
  static get modelName(): string  { return CONFIGURED_MODEL; }
}
