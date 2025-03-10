// src/lib/documentProcessor.ts
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export class DocumentProcessor {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: MemoryVectorStore | null = null;

  constructor(apiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey
    });
  }

  async processDocumentText(text: string, metadata: any = {}): Promise<void> {
    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments([text], [metadata]);
    
    // Initialize vector store if needed
    if (!this.vectorStore) {
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        docs, 
        this.embeddings
      );
    } else {
      // Add to existing store
      await this.vectorStore.addDocuments(docs);
    }
  }

  async searchRelevantDocuments(query: string, k: number = 5): Promise<Document[]> {
    if (!this.vectorStore) {
      return [];
    }
    
    return this.vectorStore.similaritySearch(query, k);
  }
}