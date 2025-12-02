// app/api/projects/[id]/conversations/[conversationId]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/prisma/client";
import { z } from "zod";
import { checkProjectAccess, getUserIdFromRequest } from "@/lib/auth/authorization";
import { GoogleGenAI } from '@google/genai';

import { canSendMessage } from '@/lib/subscription';
import { legalDraftingTools, googleCalendarTools, gmailTools } from '@/lib/geminiTools';
import { executeFunctionCall } from '@/lib/functionExecutor';

// Set a reasonable timeout
export const maxDuration = 60;

// Initialize Prisma with connection pooling
const prisma = new PrismaClient();

// Initialize Gemini with the new API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Default settings if none exist
type JurisdictionType = {
  name: string;
  country: string;
  state?: string;
} | string | undefined;

const DEFAULT_SETTINGS: {
  citeSources: boolean;
  suggestActions: boolean;
  webSearch: boolean;
  model: string;
  googleCalendar?: boolean;
  gmail?: boolean;
  temperature: number;
  legalDrafting: boolean;
  jurisdiction?: JurisdictionType;
} = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  model: 'gemini-2.0-flash-exp',
  temperature: 0.7,
  legalDrafting: false,
  googleCalendar: false,
  gmail: false,
  jurisdiction: undefined 
};

// Schema validation
const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  previewDocument: z.any().optional(), // Document currently in preview mode
});

// Encoder for streaming response
const encoder = new TextEncoder();

// POST handler - Send a message to the conversation with streaming
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    // Manual auth check (required for streaming endpoints)
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: projectId, conversationId } = (await params);
    const body = await request.json();
    const { content, previewDocument } = createMessageSchema.parse(body);

    // Start parallel operations immediately
    const accessCheckPromise = checkProjectAccess(projectId, userId);

    // Get project's organization for subscription check (not user's primary org)
    const projectOrgPromise = prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });

    // Only fetch what we need based on query type
    const conversationPromise = prisma.conversation.findFirst({
      where: { id: conversationId, projectId },
      select: {
        id: true,
        meta: {
          select: { settings: true }
        }
      }
    });

    // Create the user message in parallel with other operations
    const userMessagePromise = prisma.message.create({
      data: {
        content,
        role: "user",
        conversationId,
        userId,
      }
    });

    // Always get message history and metadata for proper context
    const messageHistoryPromise = prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 6, // Reduced to 6 most recent messages to save tokens
      select: {
        role: true,
        content: true,
      }
    });

    const projectPromise = prisma.project.findUnique({
      where: { id: projectId },
      select: {
        title: true,
        description: true,
        knowledgeBase: {
          select: { instructions: true, settings: true }
        }
      }
    });

    // Check if project is in drafting mode - get canvas document if needed
    const canvasDocumentPromise = prisma.canvasDocument.findUnique({
      where: { projectId }
    });

    // Load all documents for context - Gemini handles large contexts efficiently
    const documentsPromise = prisma.projectDocument.findMany({
      where: { project_id: projectId },
      select: {
        document: {
          select: {
            id: true,
            title: true,
            content: {
              select: { content: true }
            }
          }
        }
      }
    });

    // Wait for essential checks first
    const [hasAccess, conversation, projectOrg] = await Promise.all([
      accessCheckPromise,
      conversationPromise,
      projectOrgPromise
    ]);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Check subscription limits before processing message
    // Use the project's organization (not user's primary org) for subscription limits
    if (projectOrg?.organizationId) {
      const messageLimitCheck = await canSendMessage(projectOrg.organizationId);
      if (!messageLimitCheck.allowed) {
        return NextResponse.json(
          {
            error: messageLimitCheck.reason,
            requiresUpgrade: true
          },
          { status: 403 }
        );
      }
    }

    // Now that we've validated access, wait for the remaining data in parallel
    const [
      userMessage,
      messageHistory,
      project,
      conversationDocuments,
      canvasDocument
    ] = await Promise.all([
      userMessagePromise,
      messageHistoryPromise,
      projectPromise,
      documentsPromise,
      canvasDocumentPromise
    ]);

    // Create a stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        let controllerClosed = false;
        
        const safeClose = () => {
          if (!controllerClosed) {
            controllerClosed = true;
            controller.close();
          }
        };
        
        try {
          // Send initial status to client immediately
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'status',
                status: 'started',
                statusMessage: 'Processing your request...',
                conversationId: conversation.id,
                content: '',
              }) + '\n'
            )
          );

          // Process settings
          let settings = DEFAULT_SETTINGS;
          if (project?.knowledgeBase?.settings) {
            try {
              settings = typeof project.knowledgeBase.settings === 'string' 
                ? JSON.parse(project.knowledgeBase.settings) 
                : project.knowledgeBase.settings as any;
            } catch (error) {
              console.error('Error parsing settings:', error);
            }
          }

          // Check if project is in drafting mode
          // With function calling enabled, the AI will decide when to draft documents vs ask questions
          const isDraftingMode = settings.legalDrafting === true;
          
          // Create the custom instructions
          const customInstructions = project?.knowledgeBase?.instructions || "";
          
          // Prepare document content for Gemini (full documents, no chunking)
                    let relevantContent = "";
          
                    // Perform intent analysis in drafting mode to decide whether to update canvas
                    let intentAnalysis: { shouldUpdateCanvas?: boolean } | undefined = undefined;
                    if (isDraftingMode) {
                      try {
                        const recentMsgs = (messageHistory || []).slice(-3).map((m: any) => m.content);
                        const analysis = await checkIfReadyToDraft(
                          content,
                          project,
                          conversationDocuments,
                          canvasDocument,
                          recentMsgs
                        );
                        intentAnalysis = { shouldUpdateCanvas: analysis.readyToDraft };
                      } catch (err) {
                        console.error('Error running intent analysis:', err);
                        intentAnalysis = { shouldUpdateCanvas: false };
                      }
                    }
          
                    // Include canvas document if in drafting mode and analysis intent indicates not updating canvas
                    if (isDraftingMode && canvasDocument && !intentAnalysis?.shouldUpdateCanvas) {
                      relevantContent = `### Current Canvas Document ###\n\n${canvasDocument.plainText || canvasDocument.htmlContent || ''}\n\n`;
                    }
          
          if (conversationDocuments.length > 0) {
            // Gemini can handle FULL documents (2M token context) - no truncation needed!
            const contentParts: string[] = [];

            for (const docRef of conversationDocuments) {
              if (!docRef.document.content?.content) continue;

              const documentContent = docRef.document.content.content;
              const docLength = documentContent.length;

              // Send ENTIRE document - Gemini can handle up to 2M tokens (~4000 pages)
              const docSection = `### Document: ${docRef.document.title} (${Math.round(docLength/1000)}k characters, ${Math.round(docLength/2000)} pages) ###\n\n` +
                `**FULL DOCUMENT CONTENT:**\n` +
                documentContent + '\n\n';

              contentParts.push(docSection);
            }

            relevantContent = contentParts.join("\n");
          }

          // Web search is now handled by Gemini's built-in Google Search grounding
          // No need for separate API calls - Gemini will search when needed
          const useGoogleSearch = settings.webSearch;

          // Check if Google Calendar integration is enabled
          const useGoogleCalendar = settings.googleCalendar === true;

          // Check if Gmail integration is enabled
          const useGmail = settings.gmail === true;

          // Format message history for Gemini
          // Filter out 'system' role messages as Gemini doesn't support them in history
          let conversationHistory = messageHistory
            .filter((msg) => msg.role !== 'system')
            .reverse()
            .map((msg:any) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            }));

          // Ensure first message is from 'user' - Gemini requirement
          // Remove leading 'model' messages if any
          while (conversationHistory.length > 0 && conversationHistory[0].role === 'model') {
            conversationHistory.shift();
          }

          // Ensure messages alternate properly (user, model, user, model, ...)
          // If consecutive messages have same role, keep only the last one
          conversationHistory = conversationHistory.filter((msg, index, array) => {
            if (index === 0) return true; // Keep first message
            return msg.role !== array[index - 1].role;
          });

          // Final safety check: ensure we start with 'user'
          if (conversationHistory.length > 0 && conversationHistory[0].role !== 'user') {
            conversationHistory = [];
          }
          
          // Create unified system message for all queries
          const fullProject = project;

          // Create context-aware system message for drafting mode
          let draftingContext = '';
          if (isDraftingMode && canvasDocument) {
            draftingContext = `

            CANVAS DOCUMENT CONTEXT: A legal document is currently open in the canvas editor.

            - For analysis questions ("what's missing?", "review this", "any issues?"), provide analysis and suggestions in your response
            - If the user requests changes ("add a clause", "update the terms", "modify section X"), use the editCanvasDocument tool

            The current canvas document content is included in the context below for your reference.
            `;
          }

          const systemMessage = `You are wansom, a senior lawyer(never mention this) collaborating with other lawyer teammates working on a project titled "${
            fullProject?.title
          }".
          ${fullProject?.description ? `Project description: ${fullProject.description}` : ""}
          ${settings.jurisdiction ? `
          **JURISDICTION**: ${
            typeof settings.jurisdiction === 'object' &&
            settings.jurisdiction !== null &&
            'name' in settings.jurisdiction &&
            'country' in settings.jurisdiction
              ? `${settings.jurisdiction.name} (${settings.jurisdiction.country}${
                  'state' in settings.jurisdiction && settings.jurisdiction.state
                    ? ', ' + settings.jurisdiction.state
                    : ''
                })`
              : settings.jurisdiction
          }
          - Apply laws and regulations specific to this jurisdiction
          - Use appropriate legal terminology and citation styles for this jurisdiction
          - Consider local legal precedents and practices
          ` : ""}
          Your goal is to answer the questions asked by your team mates to ensure that the project is completed successfully.
          Get as many details as possible about the project before providing responses. Once you have all the details, provide a comprehensive response to the question asked and make sure that the response is accurate.
          If you are unsure about something, ask for clarification and ask if they would want to research it first before you continue with the project.

          ${isDraftingMode ? `
          **DRAFTING MODE ACTIVE**: You have access to special tools for legal document creation and editing:

          🔧 **Available Tools**:
          1. **draftNewDocument** - Creates a new legal document in the canvas editor
             - ONLY call this when you have ALL required information (all parties, terms, conditions)
             - If ANY critical information is missing, ask questions in your response instead

          2. **editCanvasDocument** - Modifies the existing canvas document
             - Use when user requests changes to the current document

          3. **searchProjectDocuments** - Search through attached project documents
             - Use when you need to find specific information or precedents

          4. **reviewDocument** - Conducts comprehensive legal review of documents
             - Use when user wants to review, analyze, or assess documents
             - When user says "review this", they mean the PRIMARY document in focus

          **Important Guidelines**:
          - When a user requests a document (e.g., "create an NDA"), first assess what information you have
          - If you're missing critical details (parties, key terms, dates, etc.), respond with questions - DO NOT call draftNewDocument yet
          - Only call draftNewDocument once you have complete information for a professional legal document
          - Be conversational and helpful - ask for information naturally in your responses
          - After calling a function, explain what you've done in user-friendly language

          ${previewDocument ? `
          **🔍 PREVIEW MODE CONTEXT**:
          The user is currently viewing "${previewDocument.title}" in preview mode.
          This is the PRIMARY document they are focused on right now.

          When the user says:
          - "Review this" or "What are the risks here" → They mean "${previewDocument.title}"
          - "What are the terms?" or "Summarize this" → They mean "${previewDocument.title}"
          - Use documentIds: ['primary'] when calling reviewDocument for this document

          Other project documents provide reference context only.
          ` : canvasDocument && canvasDocument.htmlContent ? `
          **📝 CANVAS MODE CONTEXT**:
          The user is working on a document in the canvas editor.
          This canvas document is the PRIMARY document they are editing and focused on.

          When the user says:
          - "Review this" or "What's missing?" → They mean the canvas document
          - "Add a clause" or "Edit this" → They mean the canvas document
          - Use documentIds: ['primary'] when calling reviewDocument for the canvas document

          Other project documents provide reference context only.
          ` : `
          **💬 CHAT MODE CONTEXT**:
          No specific document is currently in primary focus.
          The user is in general workspace mode.

          When the user asks for reviews, they likely mean all project documents.
          After providing a review, you can offer to generate a formal report in the canvas by setting generateReport: true.
          `}
          ` : ''}

          ${customInstructions ? `Always use these instructions: ${customInstructions}` : ""}
          ${draftingContext}
            
            ${relevantContent ?
              `IMPORTANT: FULL document content is provided below for comprehensive analysis.
              All pages and sections are available - analyze thoroughly.

              Here are the complete documents for context:
              ${relevantContent}

              ${settings.citeSources ?
                "If you find information in the documents, tell the user which document it came from."
                :
                "Use the document information when relevant to the query."
              }`
              :
              isDraftingMode && canvasDocument
                ? `You are analyzing the current canvas document. The document content is available for your review and analysis.`
                : conversationDocuments.length > 0
                  ? `Note: There are ${conversationDocuments.length} documents attached to this conversation, but no content was found relevant to this specific query.`
                  : "No documents are currently attached to this conversation."
            }

            ${useGoogleSearch ?
              `You have access to Google Search. When you need current information, legal precedents, or external sources, search for them automatically. Always cite your sources when using search results.`
              :
              ""
            }
            
            ${settings.suggestActions ?
              "If appropriate, suggest relevant actions based on the query."
              :
              ""
            }`;

          // Initialize Gemini model with settings and optional Google Search grounding
          // Validate and fix model name - ensure it's a Gemini model
          let modelName = settings.model || 'gemini-2.0-flash-exp';

          // Check if someone accidentally set a non-Gemini model (e.g., gpt-4)
          if (!modelName.toLowerCase().startsWith('gemini')) {
            modelName = 'gemini-2.0-flash-exp';
          }

          // Configure tools based on mode
          // WORKAROUND: Since Gemini API doesn't support mixing googleSearch with functionDeclarations
          // in the standard API, we create separate "agent tools" for each capability and let a root
          // agent orchestrate them. This allows all tools to be enabled simultaneously.

          const tools: any[] = [];
          const agentTools: any[] = [];

          // Create agent for Google Search (Deep Research)
          if (useGoogleSearch) {
            agentTools.push({
              name: 'searchAgent',
              description: 'A specialist agent for conducting web searches using Google Search. Use this when you need current information, legal precedents, case law, recent regulations, or any external sources from the web.',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'The search query or research question to investigate'
                  }
                },
                required: ['query']
              }
            });
          }

          // Create agent for Legal Drafting
          if (isDraftingMode) {
            agentTools.push({
              name: 'legalDraftingAgent',
              description: 'A specialist agent for legal document creation and editing. Use this when you need to draft new documents, edit existing documents, review documents, or search through project documents.',
              parameters: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    description: 'The action to perform',
                    enum: ['draft', 'edit', 'review', 'search']
                  },
                  details: {
                    type: 'string',
                    description: 'Detailed instructions for the legal drafting agent'
                  }
                },
                required: ['action', 'details']
              }
            });
          }

          // Create agent for Google Calendar
          if (useGoogleCalendar) {
            agentTools.push({
              name: 'calendarAgent',
              description: 'A specialist agent for managing Google Calendar. Use this when you need to create events, check availability, list upcoming events, or manage calendar entries.',
              parameters: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    description: 'The calendar action to perform',
                    enum: ['create_event', 'list_events', 'check_availability']
                  },
                  details: {
                    type: 'string',
                    description: 'Detailed instructions for the calendar operation'
                  }
                },
                required: ['action', 'details']
              }
            });
          }

          // Create agent for Gmail
          if (useGmail) {
            agentTools.push({
              name: 'gmailAgent',
              description: 'A specialist agent for managing Gmail. Use this when you need to send emails, read emails, search inbox, or manage email communications.',
              parameters: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    description: 'The Gmail action to perform',
                    enum: ['send_email', 'read_email', 'search_inbox']
                  },
                  details: {
                    type: 'string',
                    description: 'Detailed instructions for the Gmail operation'
                  }
                },
                required: ['action', 'details']
              }
            });
          }

          // If we have multiple tool types, use the agent orchestration pattern
          // Otherwise, use direct tool access for better performance
          const hasMultipleToolTypes = [useGoogleSearch, isDraftingMode, useGoogleCalendar, useGmail].filter(Boolean).length > 1;

          if (hasMultipleToolTypes && agentTools.length > 0) {
            // Use agent orchestration pattern - root agent calls specialized agents
            tools.push({
              functionDeclarations: agentTools
            });
          } else {
            // Single tool type - use direct access for better performance
            if (useGoogleSearch) {
              tools.push({
                googleSearch: {}
              });
            } else {
              // Collect all function declarations into a single array
              const allFunctionDeclarations: any[] = [];

              if (isDraftingMode) {
                allFunctionDeclarations.push(...legalDraftingTools.map(tool => ({
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters
                })));
              }

              if (useGoogleCalendar) {
                allFunctionDeclarations.push(...googleCalendarTools.map(tool => ({
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters
                })));
              }

              if (useGmail) {
                allFunctionDeclarations.push(...gmailTools.map(tool => ({
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters
                })));
              }

              if (allFunctionDeclarations.length > 0) {
                tools.push({
                  functionDeclarations: allFunctionDeclarations
                });
              }
            }
          }

          // Build the full conversation history including system message
          const fullContents: any[] = [];

          // Add system message as first user message if we have history, or include with current message
          if (conversationHistory.length > 0) {
            fullContents.push(...conversationHistory);
          }

          // Prepare the config for the new API
          const generateConfig: any = {
            temperature: settings.temperature || 0.7,
            maxOutputTokens: 8192,
          };

          if (tools.length > 0) {
            generateConfig.tools = tools;
          }

          // Add system instruction
          generateConfig.systemInstruction = systemMessage;

          // Create a temporary assistant message to stream into
          const tempMessageId = `temp-${Date.now()}`;
          let fullContent = "";
          let documentReferences = new Set<string>();
          let webSearchSources: Array<{title: string, uri: string}> = [];
          let isSearching = false;

          // Send initial status if web search is enabled
          if (useGoogleSearch) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'status',
                  status: 'searching_web',
                }) + '\n'
              )
            );
          }

          // Add current user message to contents
          fullContents.push({
            role: 'user',
            parts: [{ text: content }]
          });

          // Stream the response from Gemini using new API with retry logic
          let result;
          let retryCount = 0;
          const MAX_RETRIES = 2; // 3 total attempts (1 initial + 2 retries)

          while (retryCount <= MAX_RETRIES) {
            try {
              result = await genAI.models.generateContentStream({
                model: modelName,
                contents: fullContents,
                config: generateConfig
              });
              break; // Success - exit retry loop
            } catch (genAIError: any) {
              retryCount++;
              const isLastRetry = retryCount > MAX_RETRIES;

              // Check if error is retryable (network, timeout, rate limit, server errors)
              const isRetryable =
                genAIError.code === 'ECONNREFUSED' ||
                genAIError.code === 'ETIMEDOUT' ||
                genAIError.code === 'ENOTFOUND' ||
                genAIError.code === 'ERR_NETWORK' ||
                genAIError.message?.includes('timeout') ||
                genAIError.message?.includes('network') ||
                genAIError.message?.includes('503') ||
                genAIError.message?.includes('429') ||
                genAIError.message?.includes('500') ||
                genAIError.message?.includes('502') ||
                genAIError.message?.includes('504');

              if (!isRetryable || isLastRetry) {
                // Non-retryable error or max retries reached - throw to outer catch
                throw genAIError;
              }

              // Send retry status to client
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'status',
                    status: 'retrying',
                    message: `Connection issue detected. Retrying... (${retryCount}/${MAX_RETRIES})`,
                  }) + '\n'
                )
              );

              // Exponential backoff: 1s, 2s
              const delay = 1000 * Math.pow(2, retryCount - 1);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          // Ensure result was successfully assigned
          if (!result) {
            throw new Error('Failed to get response from AI after retries');
          }

          // Check if the response contains function calls
          let functionCalls: any[] = [];
          let hasTextContent = false;

          for await (const chunk of result) {
            // Check for function calls in this chunk
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              functionCalls.push(...chunk.functionCalls);
            }

            // Check for text content
            const textContent = chunk.text || '';
            if (textContent) {
              hasTextContent = true;
              fullContent += textContent;
            }

            // Extract grounding metadata (Google Search sources)
            if (useGoogleSearch && chunk.candidates && chunk.candidates[0]) {
              const candidate = chunk.candidates[0];
              if (candidate.groundingMetadata) {
                const metadata = candidate.groundingMetadata;

                // Extract search results
                if (metadata.searchEntryPoint && !isSearching) {
                  isSearching = true;
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: 'status',
                        status: 'searching_web',
                        message: 'Searching Google...',
                      }) + '\n'
                    )
                  );
                }

                // Extract grounding supports (sources)
                                if (metadata.groundingSupports) {
                                  for (const support of metadata.groundingSupports) {
                                    if (support.groundingChunkIndices && metadata.groundingChunks) {
                                      for (const index of support.groundingChunkIndices) {
                                        const groundingChunk = metadata.groundingChunks[index];
                                        if (groundingChunk?.web) {
                                          const source = {
                                            title: groundingChunk.web.title || 'Source',
                                            uri: groundingChunk.web.uri || ''
                                          };
                                          // Avoid duplicates
                                          if (!webSearchSources.some(s => s.uri === source.uri)) {
                                            webSearchSources.push(source);
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
              }
            }

            // Send the text delta to the client (only if there's text)
            if (textContent) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'delta',
                    conversationId: conversation.id,
                    messageId: tempMessageId,
                    content: textContent,
                  }) + '\n'
                )
              );
            }

            // Check for document references during streaming
            if (settings.citeSources && relevantContent && conversationDocuments.length > 0) {
              for (const docRef of conversationDocuments) {
                if (fullContent.includes(docRef.document.title)) {
                  documentReferences.add(docRef.document.id);
                }
              }
            }
          }

          // Variable to store report metadata from function responses
          let reportMetadata: any = null;

          // Handle function calls if any
          if (functionCalls.length > 0) {
            // Send status update to client
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'status',
                  status: 'executing_functions',
                  message: 'Executing requested actions...',
                }) + '\n'
              )
            );

            // Execute all function calls and collect results
            const functionResponses = await Promise.all(
              functionCalls.map(async (fc) => {
                // Check if this is an agent call (orchestration pattern)
                if (hasMultipleToolTypes && (
                  fc.name === 'searchAgent' ||
                  fc.name === 'legalDraftingAgent' ||
                  fc.name === 'calendarAgent' ||
                  fc.name === 'gmailAgent'
                )) {
                  // Execute agent call by making a sub-request with the specific tool
                  const result = await executeAgentCall(
                    fc,
                    genAI,
                    modelName,
                    systemMessage,
                    content,
                    projectId,
                    project,
                    conversationDocuments,
                    canvasDocument,
                    previewDocument,
                    messageHistory.slice(-3).map((msg: any) => msg.content),
                    userId
                  );

                  // Extract search sources from searchAgent results
                  if (fc.name === 'searchAgent' && result.searchSources) {
                    // Merge search sources into the global webSearchSources array
                    for (const source of result.searchSources) {
                      if (!webSearchSources.some(s => s.uri === source.uri)) {
                        webSearchSources.push(source);
                      }
                    }
                  }

                  return {
                    functionResponse: {
                      name: fc.name,
                      response: result
                    }
                  };
                } else {
                  // Regular function call execution
                  const result = await executeFunctionCall(
                    fc,
                    projectId,
                    project,
                    conversationDocuments,
                    canvasDocument,
                    previewDocument,
                    messageHistory.slice(-3).map((msg: any) => msg.content),
                    // Stream canvas updates in real-time
                    (event) => {
                      controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
                    },
                    userId
                  );

                  return {
                    functionResponse: {
                      name: fc.name,
                      response: result
                    }
                  };
                }
              })
            );

            // Send function results back to the model for a final response
            // Add model response with function calls to history
            fullContents.push({
              role: 'model',
              parts: functionCalls.map(fc => ({ functionCall: fc }))
            });

            // Add function responses
            fullContents.push({
              role: 'user',
              parts: functionResponses.map(fr => ({ functionResponse: fr.functionResponse }))
            });

            // Get final response from model with function results (with retry logic)
            let finalResult;
            let finalRetryCount = 0;

            while (finalRetryCount <= MAX_RETRIES) {
              try {
                finalResult = await genAI.models.generateContentStream({
                  model: modelName,
                  contents: fullContents,
                  config: generateConfig
                });
                break; // Success
              } catch (genAIError: any) {
                finalRetryCount++;
                const isLastRetry = finalRetryCount > MAX_RETRIES;

                const isRetryable =
                  genAIError.code === 'ECONNREFUSED' ||
                  genAIError.code === 'ETIMEDOUT' ||
                  genAIError.code === 'ENOTFOUND' ||
                  genAIError.code === 'ERR_NETWORK' ||
                  genAIError.message?.includes('timeout') ||
                  genAIError.message?.includes('network') ||
                  genAIError.message?.includes('503') ||
                  genAIError.message?.includes('429') ||
                  genAIError.message?.includes('500') ||
                  genAIError.message?.includes('502') ||
                  genAIError.message?.includes('504');

                if (!isRetryable || isLastRetry) {
                  throw genAIError;
                }

                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: 'status',
                      status: 'retrying',
                      message: `Retrying... (${finalRetryCount}/${MAX_RETRIES})`,
                    }) + '\n'
                  )
                );

                const delay = 1000 * Math.pow(2, finalRetryCount - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }

            // Ensure finalResult was successfully assigned
            if (!finalResult) {
              throw new Error('Failed to get final response from AI after retries');
            }

            // Reset fullContent to capture the final response
            fullContent = "";

            // Stream the final response
            for await (const chunk of finalResult) {
              const textContent = chunk.text || '';
              if (textContent) {
                fullContent += textContent;

                // Send the text delta to the client
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: 'delta',
                      conversationId: conversation.id,
                      messageId: tempMessageId,
                      content: textContent,
                    }) + '\n'
                  )
                );
              }
            }

            // Check if any function response contains report metadata
            reportMetadata = functionResponses.find(
              (fr: any) => fr.functionResponse?.response?.reportReady === true
            )?.functionResponse?.response;
          }

          // Format the final content
          const formattedContent = formatAIMessage(fullContent);

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          }).catch(console.error);

          // Build metadata object
          const messageMetadata: any = {};

          if (useGoogleSearch || webSearchSources.length > 0) {
            messageMetadata.googleSearchEnabled = useGoogleSearch;
            if (webSearchSources.length > 0) {
              messageMetadata.webSearchSources = webSearchSources;
            }
          }

          // Add report metadata if present (including full content for downloads)
          if (reportMetadata) {
            messageMetadata.report = {
              reportId: reportMetadata.reportId,
              reportTitle: reportMetadata.reportTitle,
              documentName: reportMetadata.documentName,
              reviewFocus: reportMetadata.reviewFocus,
              briefSummary: reportMetadata.briefSummary,
              downloadUrls: reportMetadata.downloadUrls,
              htmlContent: reportMetadata.htmlContent,
              plainText: reportMetadata.plainText,
            };
          }

          // Save the AI message to the database with metadata
          const metadataToSave = Object.keys(messageMetadata).length > 0
            ? JSON.stringify(messageMetadata)
            : undefined;

          const assistantMessage = await prisma.message.create({
            data: {
              content: formattedContent,
              role: "assistant",
              conversationId,
              metadata: metadataToSave
            }
          });

          // Save references if needed
          if (settings.citeSources && documentReferences.size > 0) {
            const refPromises = Array.from(documentReferences).map((docId:any) => {
              const doc = conversationDocuments.find(d => d.document.id === docId);
              if (!doc) return null;
              
              return prisma.messageReference.create({
                data: {
                  messageId: assistantMessage.id,
                  documentId: docId,
                  text: doc.document.content?.content.substring(0, 200) + "..." || "",
                }
              });
            });
            
            await Promise.all(refPromises.filter(Boolean));
          }
          // Fetch the complete message with references
          const completeMessage = await prisma.message.findUnique({
            where: { id: assistantMessage.id },
            include: {
              references: {
                include: {
                  document: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          });
          
          // Send the final message with references and report metadata
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'final',
                conversationId: conversation.id,
                messageId: assistantMessage.id,
                tempMessageId,
                content: formattedContent,
                googleSearchEnabled: useGoogleSearch,
                webSearchSources: webSearchSources.length > 0 ? webSearchSources : undefined,
                references: completeMessage?.references.map((ref:any) => ({
                  id: ref.id,
                  documentId: ref.documentId,
                  documentName: ref.document?.title || "Unknown Document",
                  text: ref.text,
                  page: ref.page,
                })) || [],
                report: messageMetadata.report, // Include report metadata if present
              }) + '\n'
            )
          );
          
          // Signal completion
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'status',
                status: 'completed',
                conversationId: conversation.id,
              }) + '\n'
            )
          );
        } catch (error) {
          console.error('Error in stream processing:', error);

          // Simple user-friendly error message - log technical details only
          const userFriendlyError = 'Could not generate message. Please try again.';

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'error',
                error: userFriendlyError,
              }) + '\n'
            )
          );
        } finally {
          safeClose();
        }
      }
    });

    // Return the stream response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error("Error processing message:", error);

    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request. Please check your input.", details: error.errors },
        { status: 400 }
      );
    }

    // Network/API errors (e.g., when internet is down, Gemini API unavailable)
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      return NextResponse.json(
        { error: "Network connection failed. Please check your internet connection and try again." },
        { status: 503 }
      );
    }

    // Gemini API specific errors
    if (error.message?.includes('API key') || error.message?.includes('GEMINI')) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 504 }
      );
    }

    // Database errors
    if (error.code?.startsWith('P')) { // Prisma error codes start with P
      return NextResponse.json(
        { error: "Database error occurred. Please try again later." },
        { status: 500 }
      );
    }

    // Generic fallback
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Execute an agent call (orchestration pattern for multi-tool support)
 */
async function executeAgentCall(
  functionCall: any,
  genAI: any,
  modelName: string,
  systemMessage: string,
  userQuery: string,
  projectId: string,
  project?: any,
  conversationDocuments?: any[],
  canvasDocument?: any,
  previewDocument?: any,
  recentMessages?: string[],
  userId?: string
): Promise<any> {
  try {
    const agentName = functionCall.name;
    const args = functionCall.args || {};

    // Determine which tool this agent needs
    let agentTools: any[] = [];
    let agentInstruction = systemMessage;

    switch (agentName) {
      case 'searchAgent':
        agentTools.push({ googleSearch: {} });
        agentInstruction = `You are a search specialist. Conduct thorough web searches and provide comprehensive, well-sourced answers.\n\n${systemMessage}`;
        break;

      case 'legalDraftingAgent':
        agentTools.push({
          functionDeclarations: legalDraftingTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }))
        });
        agentInstruction = `You are a legal document specialist. ${systemMessage}`;
        break;

      case 'calendarAgent':
        agentTools.push({
          functionDeclarations: googleCalendarTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }))
        });
        agentInstruction = `You are a calendar management specialist. ${systemMessage}`;
        break;

      case 'gmailAgent':
        agentTools.push({
          functionDeclarations: gmailTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }))
        });
        agentInstruction = `You are an email management specialist. ${systemMessage}`;
        break;

      default:
        return { success: false, error: `Unknown agent: ${agentName}` };
    }

    // Build the query for the specialist agent
    const agentQuery = args.query || args.details || JSON.stringify(args);

    // Execute the agent with its specialized tool
    const agentResult = await genAI.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: agentQuery }]
        }
      ],
      config: {
        systemInstruction: agentInstruction,
        temperature: 0.7,
        maxOutputTokens: 8192,
        tools: agentTools
      }
    });

    // Check if the agent made function calls (for legal drafting, calendar, gmail agents)
    const candidate = agentResult.candidates?.[0];
    const agentFunctionCalls = candidate?.content?.parts?.filter((part: any) => part.functionCall).map((part: any) => part.functionCall) || [];
    let responseText = agentResult.text || '';

    // Extract grounding metadata for searchAgent (web search sources)
    let searchSources: Array<{title: string, uri: string}> = [];
    if (agentName === 'searchAgent' && candidate?.groundingMetadata) {
      const metadata = candidate.groundingMetadata;

      // Extract grounding supports (sources)
      if (metadata.groundingSupports) {
        for (const support of metadata.groundingSupports) {
          if (support.groundingChunkIndices && metadata.groundingChunks) {
            for (const index of support.groundingChunkIndices) {
              const groundingChunk = metadata.groundingChunks[index];
              if (groundingChunk?.web) {
                const source = {
                  title: groundingChunk.web.title || 'Source',
                  uri: groundingChunk.web.uri || ''
                };
                // Avoid duplicates
                if (!searchSources.some(s => s.uri === source.uri)) {
                  searchSources.push(source);
                }
              }
            }
          }
        }
      }
    }

    // If the specialist agent made function calls, execute them
    if (agentFunctionCalls.length > 0 && (agentName === 'legalDraftingAgent' || agentName === 'calendarAgent' || agentName === 'gmailAgent')) {
      // Execute the function calls made by the specialist agent
      const { executeFunctionCall } = await import('@/lib/functionExecutor');

      for (const fc of agentFunctionCalls) {
        const functionResult = await executeFunctionCall(
          fc,
          projectId,
          project,
          conversationDocuments || [],
          canvasDocument,
          previewDocument,
          recentMessages || [],
          () => {}, // No event streaming for sub-agents
          userId
        );

        // Append function result to response
        responseText += `\n\nFunction ${fc.name} executed: ${JSON.stringify(functionResult)}`;
      }
    }

    return {
      success: true,
      agent: agentName,
      result: responseText,
      query: agentQuery,
      searchSources: searchSources.length > 0 ? searchSources : undefined
    };
  } catch (error: any) {
    console.error(`Error executing ${functionCall.name}:`, error);
    return {
      success: false,
      agent: functionCall.name,
      error: error.message || 'Agent execution failed'
    };
  }
}

/**
 * Format AI message for better readability
 */
function formatAIMessage(content: string): string {
  // Remove "System:" prefix if it exists at the beginning
  let formattedContent = content.replace(/^System:\s*/i, '');
  
  // Ensure there's a language specified for code blocks
  formattedContent = formattedContent.replace(/```\s*\n/g, '```text\n');
  
  // Add proper spacing for readability
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
  
  return formattedContent;
}

/**
 * Pre-flight check to determine if AI has enough information to draft
 */
async function checkIfReadyToDraft(
  userRequest: string,
  project: any,
  conversationDocuments: any[],
  canvasDocument: any,
  recentMessages?: string[]
): Promise<{ readyToDraft: boolean; reasoning?: string }> {
  try {
    const conversationContext = recentMessages && recentMessages.length > 0
      ? `\n\nRECENT CONVERSATION CONTEXT:\n${recentMessages.map((msg, i) => `${i % 2 === 0 ? 'User' : 'Assistant'}: ${msg}`).join('\n')}`
      : '';

    const checkPrompt = `You are a legal document expert. Analyze if there's enough information to draft a complete, accurate legal document.

CURRENT USER MESSAGE: "${userRequest}"
${conversationContext}

AVAILABLE CONTEXT:
- Jurisdiction: ${project?.knowledgeBase?.settings?.jurisdiction ? JSON.stringify(project.knowledgeBase.settings.jurisdiction) : 'Not specified'}
- Project Instructions: ${project?.knowledgeBase?.instructions || 'None'}
- Available Documents: ${conversationDocuments.length > 0 ? conversationDocuments.map((d: any) => d.document.title).join(', ') : 'None'}
- Existing Canvas Document: ${canvasDocument ? 'Yes (editing mode)' : 'No (new document)'}

STRICT ANALYSIS CRITERIA:
You must be STRICT. For legal documents, you NEED:
1. Document type clearly specified (e.g., "NDA", "employment contract", "lease agreement")
2. ALL parties/entities with full legal names (not just "two parties" or partial info)
3. Critical terms:
   - For NDAs: parties, confidentiality scope, duration
   - For employment: employer, employee, role, salary, start date, benefits
   - For service agreements: parties, services, payment terms, duration
   - For amendments: specific clauses to modify and new language
4. Key dates, amounts, and conditions (if applicable to document type)
5. Any jurisdiction-specific requirements

IMPORTANT RULES:
- If user just said "ABC Corp and John Smith" but you don't know the document type → NEED_INFO
- If user said "draft an NDA" but didn't specify parties → NEED_INFO
- If user provided SOME but NOT ALL critical information → NEED_INFO
- If this is a short response (< 20 words) to a follow-up question, check if it answers ALL your previous questions → likely NEED_INFO
- Only say READY if you can draft a COMPLETE, professional legal document right now

Respond with ONLY one of these:
READY - ONLY if you have ALL information needed for a complete, professional legal document
NEED_INFO - if ANY critical information is missing

Then explain in 1 sentence what's missing or what you have.

Format: [READY|NEED_INFO]: <one sentence explanation>`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: checkPrompt }] }],
      config: {
        systemInstruction: 'You are a legal document expert analyzing whether sufficient information exists to draft legal documents. Be thorough and precise.',
        temperature: 0.3
      }
    });

    const response = result.text || '';

    const isReady = response.trim().toUpperCase().startsWith('READY');
    const reasoning = response.split(':')[1]?.trim() || '';

    return {
      readyToDraft: isReady,
      reasoning
    };
  } catch (error) {
    console.error('Pre-flight check error:', error);
    // On error, default to allowing drafting (fail open)
    return { readyToDraft: true };
  }
}

