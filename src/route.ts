// app/api/projects/[id]/conversations/[conversationId]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/prisma/client";
import { z } from "zod";
import { checkProjectAccess, getUserIdFromRequest } from "@/lib/auth/authorization";
import { GoogleGenAI } from '@google/genai';
import { canSendMessage } from '@/lib/subscription';
import { legalDraftingTools } from '@/lib/geminiTools';
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
  jurisdiction: undefined // Added property for enhanced legal search
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
    const { content,previewDocument } = createMessageSchema.parse(body);

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

          // Check if project is in drafting modes
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
          const useGoogleSearch = settings.webSearch;
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

          const systemMessage = `You are wansom, a collaborating with other lawyer teamamtes working on a project titled "${
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
          const tools: any[] = [];

          // Add Google Search grounding if web search is enabled
          if (useGoogleSearch) {
            tools.push({
              googleSearch: {}
            });
            }

          // Add legal drafting function calling tools if in drafting mode
          if (isDraftingMode) {
            tools.push({
              functionDeclarations: legalDraftingTools.map(tool => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
              }))
            });
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

          // Stream the response from Gemini using new API
          const result = await genAI.models.generateContentStream({
            model: modelName,
            contents: fullContents,
            config: generateConfig
          });

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
                  }
                );

                return {
                  functionResponse: {
                    name: fc.name,
                    response: result
                  }
                };
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

            // Get final response from model with function results
            const finalResult = await genAI.models.generateContentStream({
              model: modelName,
              contents: fullContents,
              config: generateConfig
            });

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

            }

          // Format the final content
          const formattedContent = formatAIMessage(fullContent);
          
          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          }).catch(console.error);
          
          // Save the AI message to the database with web sources if available
          const assistantMessage = await prisma.message.create({
            data: {
              content: formattedContent,
              role: "assistant",
              conversationId,
              metadata: (useGoogleSearch || webSearchSources.length > 0) ?
                JSON.stringify({
                  googleSearchEnabled: useGoogleSearch,
                  webSearchSources: webSearchSources.length > 0 ? webSearchSources : undefined
                }) :
                undefined
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
          
          // Send the final message with references
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
  } catch (error) {
    console.error("Error processing message:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

