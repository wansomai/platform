import {
  Annotation,
  END,
  messagesStateReducer,
  START,
  StateGraph,
  CompiledStateGraph, 
  StateGraphArgs
} from '@langchain/langgraph';

import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { DocumentContextManager } from '@/lib/canvas/DocumentContextManager';

type CanvasGraphNodes =
  | "context_gathering"
  | "document_retrieval"
  | "action_processing"
  | "citation_generation"
  | "response_formatting";

interface SelectionRange {
  start: number;
  end: number;
  offset?: number;
}

interface AgentDocumentContext {
  id: string;
  title: string;
  type: string;
  content: string;
  embeddings?: number[][];
  metadata: Record<string, any>;
}

interface DocumentChunk {
  documentId: string;
  documentTitle: string;
  text: string;
  page?: number;
  relevanceScore: number;
  chunkIndex: number;
}

interface Citation {
  documentId: string;
  documentTitle: string;
  text: string;
  page?: number;
  relevance: number;
}

interface AISuggestion {
  type: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  confidence: number;
  citations: Citation[];
}

interface UserPreferences {
  preferredCitationStyle: string;
  writingStyle: string;
  complexityLevel: string;
  autoApplySuggestions: boolean;
  preferredModel: string;
  temperature: number;
  maxTokens: number;
  customInstructions?: string;
}

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

interface ProcessorResult {
  response: string;
  suggestions: AISuggestion[];
  confidence: number;
  metadata: Record<string, any>;
  tokenUsage?: TokenUsage;
}

interface StreamingCallbacks {
  onProgress: (step: string, data: any) => void;
  onToken: (token: string) => void;
  onComplete: (result: any) => void;
  onError: (error: any) => void;
}

/** Define the state annotation */
const CanvasStateAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  // Core context
  projectId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  canvasId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  conversationId: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  
  // Canvas awareness
  canvasContent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  selectedText: Annotation<{
    text: string;
    range: SelectionRange;
    context: string;
  } | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  
  // Document context
  projectDocuments: Annotation<AgentDocumentContext[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  conversationDocuments: Annotation<AgentDocumentContext[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  
  // User context
  userInstructions: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  actionType: Annotation<'explain' | 'improve' | 'cite' | 'expand' | 'rewrite'>({
    reducer: (x, y) => y ?? x,
    default: () => 'improve' as const,
  }),
  userPreferences: Annotation<UserPreferences>({
    reducer: (x, y) => y ?? x,
    default: () => ({
      preferredCitationStyle: 'bluebook',
      writingStyle: 'formal',
      complexityLevel: 'intermediate',
      autoApplySuggestions: false,
      preferredModel: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000
    }),
  }),
  customInstructions: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  
  // Processing state
  relevantChunks: Annotation<DocumentChunk[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  citations: Annotation<Citation[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  suggestions: Annotation<AISuggestion[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  
  // Output
  response: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  confidence: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  metadata: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  
  // Internal state
  processingStep: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "initializing",
  }),
  tokenUsage: Annotation<TokenUsage | undefined>({
    reducer: (x, y) => y ?? x,
  }),
});

type CanvasAgentState = typeof CanvasStateAnnotation.State;

const documentManager = new DocumentContextManager();

/** Define the nodes */
// Context gathering node
export const contextGatheringNode = async (state: CanvasAgentState): Promise<Partial<CanvasAgentState>> => {
  try {
    let projectDocuments: AgentDocumentContext[] = [];
    let conversationDocuments: AgentDocumentContext[] = [];

    // Get project documents if not already loaded
    if (state.projectDocuments.length === 0) {
      const docs = await documentManager.getProjectContext(state.projectId);
      projectDocuments = docs.map((doc: any) => ({ ...doc, type: 'project' }));
    }

    // Get conversation documents if conversation exists
    if (state.conversationId && state.conversationDocuments.length === 0) {
      const docs = await documentManager.getConversationContext(state.conversationId);
      conversationDocuments = docs.map(doc => ({ ...doc, type: 'conversation' }));
    }

    return {
      projectDocuments,
      conversationDocuments,
      processingStep: 'context_gathered'
    };
  } catch (error) {
    console.error('Error in context gathering:', error);
    return { processingStep: 'context_gathering_failed' };
  }
};

// Document retrieval node
export const documentRetrievalNode = async (state: CanvasAgentState): Promise<Partial<CanvasAgentState>> => {
  try {
    const query = state.selectedText?.text || state.canvasContent.substring(0, 500);
    
    const relevantChunks = await documentManager.getRelevantChunks(
      query,
      state.projectId,
      state.conversationId,
      10 // Max chunks
    );

    return {
      relevantChunks,
      processingStep: 'documents_retrieved'
    };
  } catch (error) {
    console.error('Error in document retrieval:', error);
    return { processingStep: 'document_retrieval_failed' };
  }
};

// Action processing node - the core AI processing
export const actionProcessingNode = async (state: CanvasAgentState): Promise<Partial<CanvasAgentState>> => {
  try {
    const processor = getActionProcessor(state.actionType);
    const result = await processor.process(state);
    
    return {
      response: result.response,
      suggestions: result.suggestions,
      confidence: result.confidence,
      metadata: { ...state.metadata, ...result.metadata },
      tokenUsage: result.tokenUsage,
      processingStep: 'action_processed'
    };
  } catch (error) {
    console.error('Error in action processing:', error);
    return {
      processingStep: 'action_processing_failed',
      response: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0
    };
  }
};

// Citation generation node
export const citationGenerationNode = async (state: CanvasAgentState): Promise<Partial<CanvasAgentState>> => {
  try {
    const citations = await generateCitations(
      state.relevantChunks,
      state.selectedText?.text || '',
      state.userPreferences.preferredCitationStyle
    );
    
    return {
      citations,
      processingStep: 'citations_generated'
    };
  } catch (error) {
    console.error('Error in citation generation:', error);
    return { processingStep: 'citation_generation_failed' };
  }
};

// Response formatting node
export const responseFormattingNode = async (state: CanvasAgentState): Promise<Partial<CanvasAgentState>> => {
  try {
    let formattedSuggestions = state.suggestions;
    if (state.citations.length > 0 && state.suggestions.length > 0) {
      formattedSuggestions = state.suggestions.map(suggestion => ({
        ...suggestion,
        citations: state.citations.filter(citation => 
          citation.text.toLowerCase().includes(suggestion.originalText.toLowerCase()) ||
          suggestion.suggestedText.toLowerCase().includes(citation.text.toLowerCase())
        )
      }));
    }

    return {
      suggestions: formattedSuggestions,
      processingStep: 'completed'
    };
  } catch (error) {
    console.error('Error in response formatting:', error);
    return { processingStep: 'formatting_failed' };
  }
};

// Conditional logic methods
export const shouldRetrieveDocuments = (state: CanvasAgentState): "action_processing" | "document_retrieval" => {
  const simpleActions = ['explain', 'rewrite'];
  const hasDocuments = state.projectDocuments.length > 0 || state.conversationDocuments.length > 0;
  
  if (simpleActions.includes(state.actionType) || !hasDocuments) {
    return "action_processing";
  }
  
  return "document_retrieval";
};

export const shouldGenerateCitations = (state: CanvasAgentState): "citation_generation" | "response_formatting" => {
  const citationActions = ['cite', 'improve', 'expand'];
  const hasCitableContent = state.relevantChunks.length > 0;
  
  if (citationActions.includes(state.actionType) && hasCitableContent) {
    return "citation_generation";
  }
  
  return "response_formatting";
};

/** Create the workflow graph */
const workflow = new StateGraph(CanvasStateAnnotation)
  .addNode('context_gathering', contextGatheringNode)
  .addNode('document_retrieval', documentRetrievalNode)
  .addNode('action_processing', actionProcessingNode)
  .addNode('citation_generation', citationGenerationNode)
  .addNode('response_formatting', responseFormattingNode)
  
  // Connecting Edges
  .addEdge(START, 'context_gathering')
  .addConditionalEdges('context_gathering', shouldRetrieveDocuments, {
    "document_retrieval": "document_retrieval",
    "action_processing": "action_processing"
  })
  .addEdge('document_retrieval', 'action_processing')
  .addConditionalEdges('action_processing', shouldGenerateCitations, {
    "citation_generation": "citation_generation",
    "response_formatting": "response_formatting"
  })
  .addEdge('citation_generation', 'response_formatting')
  .addEdge('response_formatting', END);

/** Compile and export the graph */
export const canvasGraph = workflow.compile();
canvasGraph.name = 'Canvas Legal AI Agent';

/** Helper functions */

// Citation generation helper
const generateCitations = async (
  chunks: DocumentChunk[], 
  selectedText: string, 
  citationStyle: string
): Promise<Citation[]> => {
  const citations: Citation[] = [];
  
  for (const chunk of chunks.slice(0, 5)) { // Top 5 most relevant
    if (chunk.relevanceScore > 0.7) { // Only high-confidence matches
      citations.push({
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        text: chunk.text.substring(0, 200) + '...',
        page: chunk.page,
        relevance: chunk.relevanceScore
      });
    }
  }

  return citations;
};

// Action processor factory
const getActionProcessor = (actionType: string): ActionProcessor => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!
  });

  switch (actionType) {
    case 'improve':
      return new ImproveActionProcessor(embeddings);
    case 'explain':
      return new ExplainActionProcessor(embeddings);
    case 'cite':
      return new CiteActionProcessor(embeddings);
    case 'expand':
      return new ExpandActionProcessor(embeddings);
    case 'rewrite':
      return new RewriteActionProcessor(embeddings);
    default:
      return new ImproveActionProcessor(embeddings);
  }
};

/** Main agent class for backward compatibility and additional functionality */
export class CanvasLangGraphAgent {
  private graph: typeof canvasGraph;
  private documentManager: DocumentContextManager;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.documentManager = new DocumentContextManager();
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!
    });
    this.graph = canvasGraph;
  }

  // Main processing method
  async processAction(initialState: Partial<CanvasAgentState>): Promise<any> {
    try {
      const result = await this.graph.invoke(initialState);
      return {
        response: result.response,
        suggestions: result.suggestions,
        citations: result.citations,
        confidence: result.confidence,
        metadata: result.metadata,
        tokenUsage: result.tokenUsage
      };
    } catch (error) {
      console.error('Agent processing error:', error);
      throw new Error(`AI processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Streaming processing method
  async processActionWithStreaming(
    actionData: any,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    try {
      callbacks.onProgress('initializing', { message: 'Setting up AI processing...' });

      const state = {
        ...actionData,
        projectId: actionData.projectId || '',
        canvasId: actionData.canvasId || '',
        canvasContent: actionData.canvasContent || '',
        actionType: actionData.actionType || 'improve',
        userPreferences: actionData.userPreferences || {
          preferredCitationStyle: 'bluebook',
          writingStyle: 'formal',
          complexityLevel: 'intermediate',
          autoApplySuggestions: false,
          preferredModel: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000
        },
        projectDocuments: [],
        conversationDocuments: [],
        relevantChunks: [],
        citations: [],
        suggestions: [],
        response: '',
        confidence: 0,
        metadata: {},
        processingStep: 'initializing'
      } as CanvasAgentState;

      callbacks.onProgress('context_gathering', { message: 'Gathering document context...' });
      const contextState = await contextGatheringNode(state);
      Object.assign(state, contextState);

      if (shouldRetrieveDocuments(state) === 'document_retrieval') {
        callbacks.onProgress('document_retrieval', { message: 'Finding relevant documents...' });
        const retrievalState = await documentRetrievalNode(state);
        Object.assign(state, retrievalState);
      }

      callbacks.onProgress('action_processing', { message: 'Processing with AI...' });
      
      const processor = getActionProcessor(state.actionType);
      await processor.processWithStreaming(state, callbacks);

      if (shouldGenerateCitations(state) === 'citation_generation') {
        callbacks.onProgress('citation_generation', { message: 'Generating citations...' });
        const citationState = await citationGenerationNode(state);
        Object.assign(state, citationState);
      }

      callbacks.onProgress('response_formatting', { message: 'Formatting response...' });
      const finalState = await responseFormattingNode(state);
      Object.assign(state, finalState);

      callbacks.onComplete({
        response: state.response,
        suggestions: state.suggestions,
        citations: state.citations,
        confidence: state.confidence,
        metadata: state.metadata
      });

    } catch (error) {
      callbacks.onError(error);
    }
  }
}

// Base action processor
abstract class ActionProcessor {
  protected model: ChatOpenAI;
  protected embeddings: OpenAIEmbeddings;
  
  constructor(embeddings: OpenAIEmbeddings) {
    this.embeddings = embeddings;
    this.model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: process.env.OPENAI_MODEL || "gpt-4",
      temperature: 0.7,
      streaming: false
    });
  }
  
  abstract process(state: CanvasAgentState): Promise<ProcessorResult>;
  
  async processWithStreaming(state: CanvasAgentState, callbacks: StreamingCallbacks): Promise<void> {
    const streamingModel = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: state.userPreferences.preferredModel || "gpt-4",
      temperature: state.userPreferences.temperature || 0.7,
      streaming: true,
      callbacks: [{
        handleLLMNewToken: (token: string) => {
          callbacks.onToken(token);
        }
      }]
    });

    const prompt = await this.buildPrompt(state);
    const response = await streamingModel.invoke(prompt);
    
    // Parse the streaming response and update state
    const result = await this.parseResponse(response.content as string, state);
    
    state.response = result.response;
    state.suggestions = result.suggestions;
    state.confidence = result.confidence;
    state.metadata = result.metadata;
  }

  protected abstract buildPrompt(state: CanvasAgentState): Promise<BaseMessage[]>;
  protected abstract parseResponse(response: string, state: CanvasAgentState): Promise<ProcessorResult>;

  protected formatRelevantContext(chunks: DocumentChunk[]): string {
    if (chunks.length === 0) return "No relevant documents found.";
    
    return chunks.map(chunk => 
      `Document: ${chunk.documentTitle}\nContent: ${chunk.text}\nRelevance: ${chunk.relevanceScore.toFixed(2)}\n`
    ).join('\n---\n');
  }

  protected extractSelectionContext(content: string, selection?: { text: string; range: SelectionRange }): string {
    if (!selection) return content.substring(0, 500);
    
    const contextSize = 200;
    const start = Math.max(0, selection.range.start - contextSize);
    const end = Math.min(content.length, selection.range.end + contextSize);
    
    return content.substring(start, end);
  }
}

// Improve action processor
class ImproveActionProcessor extends ActionProcessor {
  async process(state: CanvasAgentState): Promise<ProcessorResult> {
    const prompt = await this.buildPrompt(state);
    const response = await this.model.invoke(prompt);
    
    return this.parseResponse(response.content as string, state);
  }

  protected async buildPrompt(state: CanvasAgentState): Promise<BaseMessage[]> {
    const relevantContext = this.formatRelevantContext(state.relevantChunks);
    const selectionContext = this.extractSelectionContext(state.canvasContent, state.selectedText);

    const systemPrompt = `You are a legal writing expert specializing in ${state.userPreferences.preferredCitationStyle} citation style and ${state.userPreferences.writingStyle} writing style.

Your task is to improve the selected text to be more precise, clear, and legally sound while maintaining the original meaning and intent.

Writing Style: ${state.userPreferences.writingStyle}
Complexity Level: ${state.userPreferences.complexityLevel}
Citation Style: ${state.userPreferences.preferredCitationStyle}

${state.customInstructions ? `Special Instructions: ${state.customInstructions}` : ''}

Provide your response as a JSON object with the following structure:
{
  "improvedText": "The improved version of the text",
  "explanation": "Clear explanation of what was changed and why",
  "confidence": 0.85,
  "keyChanges": ["list", "of", "key", "improvements"],
  "preservedElements": ["elements", "that", "were", "kept", "unchanged"]
}`;

    const humanPrompt = `Please improve this legal text:

SELECTED TEXT:
"${state.selectedText?.text}"

SURROUNDING CONTEXT:
${selectionContext}

RELEVANT LEGAL AUTHORITIES:
${relevantContext}

USER INSTRUCTIONS:
${state.userInstructions || "No specific instructions provided"}

Focus on improving legal precision, clarity, and professional tone while maintaining the original meaning.`;

    return [
      new AIMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ];
  }

  protected async parseResponse(response: string, state: CanvasAgentState): Promise<ProcessorResult> {
    try {
      const parsed = JSON.parse(response);
      
      const suggestion: AISuggestion = {
        type: 'improve',
        originalText: state.selectedText?.text || '',
        suggestedText: parsed.improvedText,
        explanation: parsed.explanation,
        confidence: parsed.confidence || 0.8,
        citations: []
      };

      return {
        response: parsed.explanation,
        suggestions: [suggestion],
        confidence: parsed.confidence || 0.8,
        metadata: {
          keyChanges: parsed.keyChanges || [],
          preservedElements: parsed.preservedElements || [],
          processingType: 'improve'
        }
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        response: response,
        suggestions: [{
          type: 'improve',
          originalText: state.selectedText?.text || '',
          suggestedText: response,
          explanation: 'AI-generated improvement',
          confidence: 0.6,
          citations: []
        }],
        confidence: 0.6,
        metadata: { processingType: 'improve', parseError: true }
      };
    }
  }
}

// Additional action processors would follow the same pattern...
class ExplainActionProcessor extends ActionProcessor {
  async process(state: CanvasAgentState): Promise<ProcessorResult> {
    const prompt = await this.buildPrompt(state);
    const response = await this.model.invoke(prompt);
    
    return this.parseResponse(response.content as string, state);
  }

  protected async buildPrompt(state: CanvasAgentState): Promise<BaseMessage[]> {
    const selectionContext = this.extractSelectionContext(state.canvasContent, state.selectedText);

    const systemPrompt = `You are a legal education expert who explains complex legal concepts in an accessible way.

Your task is to explain the legal significance and purpose of the selected text in the context of the document.

Complexity Level: ${state.userPreferences.complexityLevel}
- Basic: Simple explanations for non-lawyers
- Intermediate: Moderate detail for legal professionals  
- Advanced: Comprehensive analysis for experts

Focus on:
1. What this section accomplishes legally
2. Why it's important in this context
3. Any legal concepts or terms involved
4. How it fits into the broader legal framework`;

    const humanPrompt = `Please explain this legal text:

SELECTED TEXT:
"${state.selectedText?.text}"

DOCUMENT CONTEXT:
${selectionContext}

Provide a clear, educational explanation that helps understand the legal significance of this text.`;

    return [
      new AIMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ];
  }

  protected async parseResponse(response: string, state: CanvasAgentState): Promise<ProcessorResult> {
    return {
      response: response,
      suggestions: [],
      confidence: 0.9,
      metadata: { 
        processingType: 'explain',
        complexityLevel: state.userPreferences.complexityLevel
      }
    };
  }
}

// Additional processors would be implemented similarly...
class CiteActionProcessor extends ActionProcessor {
  async process(state: CanvasAgentState): Promise<ProcessorResult> {
    return {
      response: "Citation processor implementation",
      suggestions: [],
      confidence: 0.8,
      metadata: { processingType: 'cite' }
    };
  }

  protected async buildPrompt(state: CanvasAgentState): Promise<BaseMessage[]> {
    return [new HumanMessage("Cite placeholder")];
  }

  protected async parseResponse(response: string, state: CanvasAgentState): Promise<ProcessorResult> {
    return {
      response: response,
      suggestions: [],
      confidence: 0.8,
      metadata: { processingType: 'cite' }
    };
  }
}

class ExpandActionProcessor extends ActionProcessor {
  async process(state: CanvasAgentState): Promise<ProcessorResult> {
    return {
      response: "Expand processor implementation",
      suggestions: [],
      confidence: 0.8,
      metadata: { processingType: 'expand' }
    };
  }

  protected async buildPrompt(state: CanvasAgentState): Promise<BaseMessage[]> {
    return [new HumanMessage("Expand placeholder")];
  }

  protected async parseResponse(response: string, state: CanvasAgentState): Promise<ProcessorResult> {
    return {
      response: response,
      suggestions: [],
      confidence: 0.8,
      metadata: { processingType: 'expand' }
    };
  }
}

class RewriteActionProcessor extends ActionProcessor {
  async process(state: CanvasAgentState): Promise<ProcessorResult> {
    return {
      response: "Rewrite processor implementation",
      suggestions: [],
      confidence: 0.8,
      metadata: { processingType: 'rewrite' }
    };
  }

  protected async buildPrompt(state: CanvasAgentState): Promise<BaseMessage[]> {
    return [new HumanMessage("Rewrite placeholder")];
  }

  protected async parseResponse(response: string, state: CanvasAgentState): Promise<ProcessorResult> {
    return {
      response: response,
      suggestions: [],
      confidence: 0.8,
      metadata: { processingType: 'rewrite' }
    };
  }
}