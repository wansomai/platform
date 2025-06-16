// app/api/projects/[id]/canvas/[canvasId]/actions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getUserIdFromRequest, checkProjectAccess } from '@/lib/auth/authorization';
import { CanvasLangGraphAgent } from '@/lib/agents/CanvasLangGraphAgent';
import { DocumentContextManager } from '@/lib/canvas/DocumentContextManager';

const prisma = new PrismaClient();

// Validation schema for AI action requests
export const aiActionSchema = z.object({
  selectionId: z.string().optional(), // If updating existing selection
  selectedText: z.string().min(1, 'Selected text is required'),
  selectionRange: z.object({
    start: z.number().min(0),
    end: z.number().min(0),
    offset: z.number().min(0).optional()
  }),
  actionType: z.enum(['improve', 'explain', 'cite', 'expand', 'rewrite']),
  userInstructions: z.string().optional(),
  conversationId: z.string().optional(),
  streaming: z.boolean().default(false)
});

// POST /api/projects/[id]/canvas/[canvasId]/actions - Process AI action on canvas text
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; canvasId: string }> }
) {
  try {
    const { id: projectId, canvasId } = await params;
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { status: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { status: 403, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = aiActionSchema.parse(body);

    // Verify canvas exists and belongs to project
    const canvas = await prisma.canvasState.findFirst({
      where: { id: canvasId, projectId },
      include: {
        conversation: true,
        project: {
          include: {
            knowledgeBase: true
          }
        }
      }
    });

    if (!canvas) {
      return NextResponse.json(
        { status: 404, message: 'Canvas not found' },
        { status: 404 }
      );
    }

    // Create or update canvas selection record
    let selectionId = validatedData.selectionId;
    
    if (!selectionId) {
      // Create new selection
      const selection = await prisma.canvasSelection.create({
        data: {
          canvasId,
          selectionText: validatedData.selectedText,
          selectionRange: validatedData.selectionRange,
          actionType: validatedData.actionType,
          userInstructions: validatedData.userInstructions,
          status: 'processing',
          createdBy: userId
        }
      });
      selectionId = selection.id;
    } else {
      // Update existing selection
      await prisma.canvasSelection.update({
        where: { id: selectionId },
        data: {
          status: 'processing',
          updatedAt: new Date()
        }
      });
    }

    // Log the AI processing start
    const processingLog = await prisma.agentProcessingLog.create({
      data: {
        canvasId,
        conversationId: validatedData.conversationId || canvas.conversationId,
        projectId,
        agentType: 'canvas_agent',
        actionType: validatedData.actionType,
        inputData: {
          selectedText: validatedData.selectedText,
          selectionRange: validatedData.selectionRange,
          userInstructions: validatedData.userInstructions,
          canvasTitle: canvas.title
        },
        status: 'processing',
        createdBy: userId,
        processingTime: 0
      }
    });

    const startTime = Date.now();

    try {
      // Initialize document context manager
      const documentManager = new DocumentContextManager();
      
      // Get project and conversation documents
      const projectDocuments = await documentManager.getProjectContext(projectId);
      const conversationDocuments = validatedData.conversationId 
        ? await documentManager.getConversationContext(validatedData.conversationId)
        : [];

      // Get user preferences
      const userPreferences = await getUserCanvasPreferences(userId, projectId);

      // Initialize LangGraph agent
      const agent = new CanvasLangGraphAgent();

      // Prepare agent state
      const agentState = {
        projectId,
        canvasId,
        conversationId: validatedData.conversationId || canvas.conversationId || undefined,
        selectedText: {
          text: validatedData.selectedText,
          range: validatedData.selectionRange,
          context: extractSelectionContext(canvas.content, validatedData.selectionRange)
        },
        canvasContent: canvas.content,
        actionType: validatedData.actionType,
        userInstructions: validatedData.userInstructions,
        projectDocuments,
        conversationDocuments,
        userPreferences,
        customInstructions: canvas.project.knowledgeBase?.instructions,
        metadata: {
          canvasTitle: canvas.title,
          canvasVersion: canvas.version
        }
      };

      // Process with LangGraph agent
      const result = await agent.processAction(agentState);

      const processingTime = Date.now() - startTime;

      // Update canvas selection with AI results
      const updatedSelection = await prisma.canvasSelection.update({
        where: { id: selectionId },
        data: {
          aiSuggestions: result.suggestions,
          status: 'completed',
          confidence: result.confidence,
          processingTime,
          updatedAt: new Date()
        },
        include: {
          createdByUser: {
            select: { id: true, fullName: true, email: true }
          }
        }
      });

      // Update processing log with success
      await prisma.agentProcessingLog.update({
        where: { id: processingLog.id },
        data: {
          outputData: {
            suggestions: result.suggestions,
            citations: result.citations,
            confidence: result.confidence,
            metadata: result.metadata
          },
          status: 'completed',
          confidence: result.confidence,
          processingTime,
          tokenUsage: result.tokenUsage || null
        }
      });

      // Track document interactions for learning
      if (result.citations && result.citations.length > 0) {
        for (const citation of result.citations) {
          await trackDocumentInteraction(
            userId,
            citation.documentId,
            projectId,
            validatedData.actionType,
            validatedData.selectedText
          );
        }
      }

      return NextResponse.json({
        status: 200,
        message: 'AI action processed successfully',
        data: {
          selectionId: updatedSelection.id,
          response: result.response,
          suggestions: result.suggestions,
          citations: result.citations,
          confidence: result.confidence,
          processingTime,
          metadata: result.metadata,
          selection: {
            id: updatedSelection.id,
            canvasId: updatedSelection.canvasId,
            selectionText: updatedSelection.selectionText,
            selectionRange: updatedSelection.selectionRange,
            actionType: updatedSelection.actionType,
            userInstructions: updatedSelection.userInstructions,
            status: updatedSelection.status,
            createdBy: updatedSelection.createdByUser,
            createdAt: updatedSelection.createdAt,
            updatedAt: updatedSelection.updatedAt
          }
        }
      });

    } catch (agentError) {
      const processingTime = Date.now() - startTime;
      
      // Update selection with error status
      await prisma.canvasSelection.update({
        where: { id: selectionId },
        data: {
          status: 'rejected',
          processingTime,
          updatedAt: new Date()
        }
      });

      // Update processing log with error
      await prisma.agentProcessingLog.update({
        where: { id: processingLog.id },
        data: {
          status: 'failed',
          errorMessage: agentError instanceof Error ? agentError.message : String(agentError),
          processingTime
        }
      });

      throw agentError;
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { status: 400, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error processing AI action:', error);
    return NextResponse.json(
      {
        status: 500,
        message: 'AI processing failed',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get user canvas preferences
async function getUserCanvasPreferences(userId: string, projectId: string) {
  try {
    const preferences = await prisma.userCanvasPreferences.findFirst({
      where: {
        userId,
        OR: [
          { projectId }, // Project-specific preferences
          { projectId: null } // Global preferences
        ]
      },
      orderBy: [
        { projectId: 'desc' }, // Project-specific first
        { createdAt: 'desc' }
      ]
    });

    return preferences || {
      preferredCitationStyle: 'bluebook',
      writingStyle: 'formal',
      complexityLevel: 'intermediate',
      autoApplySuggestions: false,
      enableRealTimeHelp: true,
      preferredModel: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      preferredCitationStyle: 'bluebook',
      writingStyle: 'formal',
      complexityLevel: 'intermediate',
      autoApplySuggestions: false,
      enableRealTimeHelp: true,
      preferredModel: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000
    };
  }
}

// Helper function to extract context around selection
function extractSelectionContext(content: string, selectionRange: any, contextSize: number = 200): string {
  const start = Math.max(0, selectionRange.start - contextSize);
  const end = Math.min(content.length, selectionRange.end + contextSize);
  return content.substring(start, end);
}

// Helper function to track document interactions for learning
async function trackDocumentInteraction(
  userId: string,
  documentId: string,
  projectId: string,
  interactionType: string,
  context: string
) {
  try {
    await prisma.documentInteraction.upsert({
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
        context: context.substring(0, 1000) // Limit context size
      },
      create: {
        userId,
        documentId,
        projectId,
        interactionType,
        context: context.substring(0, 1000),
        frequency: 1
      }
    });
  } catch (error) {
    console.error('Error tracking document interaction:', error);
    // Don't fail the main request if this fails
  }
}

