// src/app/api/projects/[id]/conversations/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withErrorHandler, withProjectAccess, ProjectContext } from '@/lib/api/middleware';
import {
  createApiResponse,
  createCreatedResponse,
  createNotFoundResponse,
  createForbiddenResponse,
} from '@/lib/api/response';
import { canUseAssociates } from '@/lib/subscription';

// Schema validation
const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  aiAssociateId: z.string().optional(),
});

// GET handler - List all conversations for a project
export const GET = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext) => {
    const { projectId } = context;

    // Get conversation (single conversation per project)
    const conversation = await prisma.conversation.findFirst({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            role: true,
            createdAt: true,
            userId: true,
            metadata: true,
            parentId: true,
            branchIndex: true,
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
        },
        aiAssociate: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // Handle case where no conversation exists
    if (!conversation) {
      return createApiResponse(null, 'No conversation found for this project');
    }

    // Format the conversation response
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title,
      projectId: conversation.projectId,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      isPinned: conversation.isPinned,
      aiAssociateId: conversation.aiAssociateId,
      aiAssociate: conversation.aiAssociate
        ? {
          id: conversation.aiAssociate.id,
          name: conversation.aiAssociate.name,
          description: conversation.aiAssociate.description,
        }
        : undefined,
      messages: conversation.messages.map((message: any) => {
        const metadata = message.metadata
          ? (typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata)
          : null;

        return {
          id: message.id,
          content: message.content,
          role: message.role,
          timestamp: message.createdAt.toISOString(),
          userId: message.userId,
          parentId: message.parentId ?? null,
          branchIndex: message.branchIndex ?? 0,
          ...(metadata?.document && { document: metadata.document }),
          ...(metadata?.report && { report: metadata.report }),
          ...(metadata?.webSearchSources && { webSearchSources: metadata.webSearchSources }),
          ...(metadata?.attachedDocuments && { attachedDocuments: metadata.attachedDocuments }),
          references: message.references?.map((ref: any) => ({
            id: ref.id,
            documentId: ref.documentId,
            text: ref.text,
            document: ref.document,
          })) || [],
        };
      }),
      pinnedMessageId: conversation.pinnedMessageId ?? null,
      last_message:
        conversation.messages[conversation.messages.length - 1]?.content || '',
      messages_count: conversation._count.messages,
    };

    return createApiResponse(formattedConversation, 'Conversation retrieved successfully');
  })
);

// POST handler - Create a new conversation
export const POST = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext) => {
    const { projectId } = context;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, organizationId: true },
    });

    if (!project) {
      return createNotFoundResponse('Project');
    }

    // Parse and validate request body
    const body = await request.json();
    const { title, aiAssociateId } = createConversationSchema.parse(body);

    // If an AI associate is being assigned, check if user has premium access
    if (aiAssociateId) {
      const associateCheck = await canUseAssociates(project.organizationId);
      if (!associateCheck.allowed) {
        return createForbiddenResponse(associateCheck.reason);
      }
    }

    // Create conversation with optional AI associate
    const conversation = await prisma.conversation.create({
      data: {
        title,
        project: {
          connect: { id: projectId },
        },
        ...(aiAssociateId && {
          aiAssociate: {
            connect: { id: aiAssociateId },
          },
        }),
      },
      include: {
        aiAssociate: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Format for response
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title,
      projectId: conversation.projectId,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      isPinned: conversation.isPinned,
      pinnedMessageId: null,
      aiAssociateId: conversation.aiAssociateId,
      aiAssociate: conversation.aiAssociate
        ? {
          id: conversation.aiAssociate.id,
          name: conversation.aiAssociate.name,
          description: conversation.aiAssociate.description,
        }
        : undefined,
      messages: [],
    };

    return createCreatedResponse(formattedConversation, 'Conversation created successfully');
  })
);
