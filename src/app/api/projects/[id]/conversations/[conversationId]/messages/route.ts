// app/api/projects/[id]/conversations/[conversationId]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/prisma/client";
import { z } from "zod";
import { checkProjectAccess, getUserIdFromRequest } from "@/lib/auth/authorization";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIDocumentService, ProjectContext } from '@/services/aiDocumentService';
import { classifyWithContext } from '@/lib/intentClassification';
import { canSendMessage } from '@/lib/subscription';

// Set a reasonable timeout
export const maxDuration = 60;

// Initialize Prisma with connection pooling
const prisma = new PrismaClient();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
    const { content } = createMessageSchema.parse(body);

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
      select: { id: true } // Minimal select for faster query
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

          // Check if project is in drafting mode and analyze user intent
          const isDraftingMode = settings.legalDrafting === true;
          let intentAnalysis = null;
          
          if (isDraftingMode) {
            // Classify user intent to determine appropriate action
            const recentMessages = messageHistory.slice(-3).map(msg => msg.content);
            intentAnalysis = classifyWithContext(
              content, 
              !!canvasDocument,
              recentMessages
            );

            console.log('Intent Analysis:', intentAnalysis);

            // Only update canvas if user intends to make changes
            if (intentAnalysis.shouldUpdateCanvas) {
              const canvasResult = await handleCanvasDraftingRequestWithStreaming(
                content,
                projectId,
                project,
                conversationDocuments,
                canvasDocument,
                controller,
                encoder,
                conversation.id,
                safeClose
              );
              
              if (canvasResult) {
                return; // Canvas operation handled, exit stream
              }
            }
            // If analysis/question intent, continue to normal chat response below
          }
          
          // Create the custom instructions
          const customInstructions = project?.knowledgeBase?.instructions || "";
          
          // Prepare document content for Gemini (full documents, no chunking)
          let relevantContent = "";

          // Include canvas document if in drafting mode and analysis intent
          if (isDraftingMode && canvasDocument && !intentAnalysis?.shouldUpdateCanvas) {
            relevantContent = `### Current Canvas Document ###\n\n${canvasDocument.plainText || canvasDocument.htmlContent || ''}\n\n`;
          }
          
          if (conversationDocuments.length > 0) {
            // Gemini can handle FULL documents (2M token context) - no truncation needed!
            console.log('Processing documents with Gemini (full document support)');
            const contentParts: string[] = [];

            for (const docRef of conversationDocuments) {
              console.log('Document:', docRef.document.title, 'has content:', !!docRef.document.content?.content);
              if (!docRef.document.content?.content) continue;

              const documentContent = docRef.document.content.content;
              const docLength = documentContent.length;

              console.log('Document length:', docLength, 'characters - sending FULL document to Gemini');

              // Send ENTIRE document - Gemini can handle up to 2M tokens (~4000 pages)
              const docSection = `### Document: ${docRef.document.title} (${Math.round(docLength/1000)}k characters, ${Math.round(docLength/2000)} pages) ###\n\n` +
                `**FULL DOCUMENT CONTENT:**\n` +
                documentContent + '\n\n';

              contentParts.push(docSection);
            }

            relevantContent = contentParts.join("\n");
            console.log('Document processing complete, total content length:', relevantContent.length, 'characters');
            console.log('Estimated tokens:', Math.round(relevantContent.length / 4), '(Gemini supports up to 2M tokens)');
          }

          // Web search is now handled by Gemini's built-in Google Search grounding
          // No need for separate API calls - Gemini will search when needed
          const useGoogleSearch = settings.webSearch;
          console.log('Google Search grounding enabled:', useGoogleSearch);
          
          // Format message history for Gemini
          // Filter out 'system' role messages as Gemini doesn't support them in history
          const conversationHistory = messageHistory
            .filter((msg) => msg.role !== 'system')
            .reverse()
            .map((msg) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            }));
          
          // Create unified system message for all queries
          const fullProject = project;

          // Create context-aware system message for drafting mode
          let draftingContext = '';
          if (isDraftingMode && canvasDocument) {
            draftingContext = `

            CANVAS DOCUMENT CONTEXT: You are working with a legal document currently open in the canvas editor. The document content has been included below for your analysis.

            CURRENT DOCUMENT TITLE: "Current Canvas Document"

            IMPORTANT: Based on the user's message, you should ONLY provide analysis, suggestions, and recommendations in this chat response.
            Do NOT make actual changes to the document unless the user explicitly requests edits with action words like "add", "update", "change", "modify", etc.

            For analysis questions about the document (like "what clauses are missing?", "any issues?", "review this"), provide detailed analysis of the current canvas document and offer specific suggestions,
            then ask if the user would like you to apply any changes to the document.

            The canvas document content is included in the context below as "Current Canvas Document".
            `;
          }

          const systemMessage = `You are wansom, a senior lawyer collaborating with other lawyers working on a project titled "${
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

          // No need to truncate - Gemini supports 2M token context!
          console.log('Final relevantContent length:', relevantContent.length);
          console.log('System message includes documents:', systemMessage.includes('Here are the documents'));
          if (relevantContent.length > 0) {
            console.log('Sample of relevant content:', relevantContent.substring(0, 200) + '...');
          }

          // Initialize Gemini model with settings and optional Google Search grounding
          // Validate and fix model name - ensure it's a Gemini model
          let modelName = settings.model || 'gemini-2.0-flash-exp';

          // Check if someone accidentally set a non-Gemini model (e.g., gpt-4)
          if (!modelName.toLowerCase().startsWith('gemini')) {
            console.warn(`Invalid model "${modelName}" - falling back to gemini-2.0-flash-exp`);
            modelName = 'gemini-2.0-flash-exp';
          }

          const modelConfig: any = {
            model: modelName,
            generationConfig: {
              temperature: settings.temperature || 0.7,
              maxOutputTokens: 8192,
            },
            systemInstruction: systemMessage,
          };

          // Enable Google Search grounding if web search is enabled
          if (useGoogleSearch) {
            modelConfig.tools = [{
              googleSearch: {}
            }];
            console.log('✓ Google Search grounding enabled - Gemini will search when needed');
          }

          const model = genAI.getGenerativeModel(modelConfig);

          // Create chat session with history
          const chat = model.startChat({
            history: conversationHistory,
          });

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

          // Stream the response from Gemini
          const result = await chat.sendMessageStream(content);

          for await (const chunk of result.stream) {
            const textContent = chunk.text();
            fullContent += textContent;

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
                    if (support.groundingChunckIndices && metadata.groundingChunks) {
                      for (const index of support.groundingChunckIndices) {
                        const chunk = metadata.groundingChunks[index];
                        if (chunk?.web) {
                          const source = {
                            title: chunk.web.title || 'Source',
                            uri: chunk.web.uri || ''
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

            // Check for document references during streaming
            if (settings.citeSources && relevantContent && conversationDocuments.length > 0) {
              for (const docRef of conversationDocuments) {
                if (fullContent.includes(docRef.document.title)) {
                  documentReferences.add(docRef.document.id);
                }
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
            const refPromises = Array.from(documentReferences).map(docId => {
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
                references: completeMessage?.references.map((ref) => ({
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
 * Handle canvas drafting requests when in drafting mode
 */
async function handleCanvasDraftingRequest(
  content: string,
  projectId: string,
  project: any,
  conversationDocuments: any[],
  canvasDocument: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  conversationId: string,
  safeClose: () => void
): Promise<boolean> {
  try {
    // Build project context for AI
    const projectContext: ProjectContext = {
      jurisdiction: project?.knowledgeBase?.settings?.jurisdiction,
      instructions: project?.knowledgeBase?.instructions || '',
      documents: conversationDocuments.map(doc => ({
        title: doc.document.title,
        content: doc.document.content?.content || ''
      }))
    };

    let result;
    let responseMessage;

    if (!canvasDocument) {
      // No canvas document exists, generate new document
      result = await AIDocumentService.generateDocument(content, projectContext);
      responseMessage = "I've generated the document and loaded it to your canvas.";
    } else {
      // Edit existing document
      result = await AIDocumentService.editDocument(
        content,
        canvasDocument.htmlContent,
        projectContext
      );
      responseMessage = "I've updated your document in the canvas.";
    }

    // Save to canvas document
    await prisma.canvasDocument.upsert({
      where: { projectId },
      create: {
        projectId,
        content: result.delta,
        htmlContent: result.content,
        plainText: AIDocumentService.stripHtml(result.content)
      },
      update: {
        content: result.delta,
        htmlContent: result.content,
        plainText: AIDocumentService.stripHtml(result.content),
        updatedAt: new Date()
      }
    });

    // Save AI response as message
    await prisma.message.create({
      data: {
        content: responseMessage,
        role: "assistant",
        conversationId,
        metadata: JSON.stringify({ canvasUpdated: true })
      }
    });

    // Send canvas update response
    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'canvas_update',
          conversationId: conversationId,
          content: responseMessage,
          canvasContent: result.content,
          canvasUpdated: true
        }) + '\n'
      )
    );

    // Send completion status
    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'status',
          status: 'completed',
          conversationId: conversationId,
        }) + '\n'
      )
    );

    safeClose();
    return true; // Handled as canvas operation

  } catch (error) {
    console.error('Canvas drafting error:', error);
    
    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'error',
          error: 'Failed to process document request'
        }) + '\n'
      )
    );
    
    safeClose();
    return true; // Still handled, even with error
  }
}

/**
 * Handle canvas drafting requests with streaming updates
 */
async function handleCanvasDraftingRequestWithStreaming(
  content: string,
  projectId: string,
  project: any,
  conversationDocuments: any[],
  canvasDocument: any,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  conversationId: string,
  safeClose: () => void
): Promise<boolean> {
  try {
    // Send initial status
    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'canvas_status',
          status: 'analyzing_request',
          message: 'Analyzing your request...',
          conversationId: conversationId,
        }) + '\n'
      )
    );

    // Build project context for AI
    const projectContext: ProjectContext = {
      jurisdiction: project?.knowledgeBase?.settings?.jurisdiction,
      instructions: project?.knowledgeBase?.instructions || '',
      documents: conversationDocuments.map(doc => ({
        title: doc.document.title,
        content: doc.document.content?.content || ''
      }))
    };

    // Send context processing status
    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'canvas_status',
          status: 'processing_context',
          message: 'Processing project context and documents...',
          conversationId: conversationId,
        }) + '\n'
      )
    );

    let result;
    let responseMessage;
    let actionType;

    if (!canvasDocument) {
      actionType = 'generating';
      responseMessage = "I've generated the document and loaded it to your canvas.";
      
      // Send generation status
      controller.enqueue(
        encoder.encode(
          JSON.stringify({
            type: 'canvas_status',
            status: 'generating_document',
            message: 'Generating new legal document...',
            conversationId: conversationId,
          }) + '\n'
        )
      );

      // Generate new document with streaming updates
      result = await AIDocumentService.generateDocumentStreaming(content, projectContext, (partialContent, section) => {
        // Send streaming canvas content updates
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'canvas_content_update',
              conversationId: conversationId,
              partialContent: partialContent,
              currentSection: section,
              actionType: 'generating'
            }) + '\n'
          )
        );
      });
    } else {
      actionType = 'editing';
      responseMessage = "I've updated your document in the canvas.";
      
      // Send editing status
      controller.enqueue(
        encoder.encode(
          JSON.stringify({
            type: 'canvas_status',
            status: 'editing_document',
            message: 'Updating existing document with your changes...',
            conversationId: conversationId,
          }) + '\n'
        )
      );

      // Edit existing document with streaming updates
      result = await AIDocumentService.editDocumentStreaming(
        content,
        canvasDocument.htmlContent,
        projectContext,
        (partialContent, section) => {
          // Send streaming canvas content updates
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'canvas_content_update',
                conversationId: conversationId,
                partialContent: partialContent,
                currentSection: section,
                actionType: 'editing'
              }) + '\n'
            )
          );
        }
      );
    }

    // Send saving status
    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'canvas_status',
          status: 'saving_document',
          message: 'Saving changes to canvas...',
          conversationId: conversationId,
        }) + '\n'
      )
    );

    // Save to canvas document
    await prisma.canvasDocument.upsert({
      where: { projectId },
      create: {
        projectId,
        content: result.delta,
        htmlContent: result.content,
        plainText: AIDocumentService.stripHtml(result.content)
      },
      update: {
        content: result.delta,
        htmlContent: result.content,
        plainText: AIDocumentService.stripHtml(result.content),
        updatedAt: new Date()
      }
    });

    // Save AI response as message
    await prisma.message.create({
      data: {
        content: responseMessage,
        role: "assistant",
        conversationId,
        metadata: JSON.stringify({ canvasUpdated: true, actionType })
      }
    });

    // Send final completion status
    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'canvas_status',
          status: 'completed',
          message: `Document ${actionType === 'generating' ? 'generated' : 'updated'} successfully!`,
          conversationId: conversationId,
        }) + '\n'
      )
    );

    // Send canvas update response with streaming flag
    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'canvas_update',
          conversationId: conversationId,
          content: responseMessage,
          canvasContent: result.content,
          canvasUpdated: true,
          actionType: actionType,
          streaming: false // Indicate streaming is complete
        }) + '\n'
      )
    );

    // Send completion status
    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'status',
          status: 'completed',
          conversationId: conversationId,
        }) + '\n'
      )
    );

    safeClose();
    return true; // Handled as canvas operation

  } catch (error) {
    console.error('Canvas drafting error:', error);

    // Simple user-friendly error message
    const errorMessage = 'Something went wrong creating your document. Please try again.';

    // Send error status
    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'canvas_status',
          status: 'error',
          message: errorMessage,
          conversationId: conversationId,
        }) + '\n'
      )
    );

    controller.enqueue(
      encoder.encode(
        JSON.stringify({
          type: 'error',
          error: errorMessage
        }) + '\n'
      )
    );

    safeClose();
    return true; // Still handled, even with error
  }
}


