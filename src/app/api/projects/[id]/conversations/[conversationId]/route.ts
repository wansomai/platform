// src/app/api/projects/[id]/conversations/[conversationId]/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { withErrorHandler, withProjectAccess, ProjectContext } from '@/lib/api/middleware';
import {
  createApiResponse,
  createNotFoundResponse,
  createForbiddenResponse,
} from '@/lib/api/response';
import { canUseAssociates } from '@/lib/subscription';

// Schema validation
const updateConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  isPinned: z.boolean().optional(),
  aiAssociateId: z.string().nullable().optional(),
});

// Helper to extract conversationId from params
async function getConversationId(
  params: any
): Promise<string> {
  const resolved = await params;
  return resolved.conversationId;
}

// GET handler - Get conversation by ID
export const GET = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext, params: any) => {
    const { projectId } = context;
    const conversationId = await getConversationId(params);

    // Check if conversation exists and belongs to the project
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        projectId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
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
        },
        aiAssociate: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!conversation) {
      return createNotFoundResponse('Conversation');
    }

    // Format messages
    const formattedMessages = conversation.messages.map((message: any) => ({
      id: message.id,
      content: message.content,
      role: message.role,
      timestamp: message.createdAt.toISOString(),
      references: message.references.map((ref: any) => ({
        id: ref.id,
        documentId: ref.documentId,
        documentName: ref.document?.title || 'Unknown Document',
        text: ref.text,
        page: ref.page,
      })),
    }));

    // Format conversation
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title,
      projectId: conversation.projectId,
      messages: formattedMessages,
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
    };

    return createApiResponse(formattedConversation, 'Conversation retrieved successfully');
  })
);

// PUT handler - Update conversation
export const PUT = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext, params: any) => {
    const { projectId } = context;
    const conversationId = await getConversationId(params);

    // Check if conversation exists and belongs to the project
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        projectId,
      },
    });

    if (!conversation) {
      return createNotFoundResponse('Conversation');
    }

    // Parse and validate request body
    const body = await request.json();
    const { title, isPinned, aiAssociateId } = updateConversationSchema.parse(body);

    // If an AI associate is being assigned (not removed), check if user has premium access
    if ('aiAssociateId' in body && aiAssociateId !== null && aiAssociateId) {
      // Get the project to find organization
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true },
      });

      if (!project) {
        return createNotFoundResponse('Project');
      }

      const associateCheck = await canUseAssociates(project.organizationId);
      if (!associateCheck.allowed) {
        return createForbiddenResponse(associateCheck.reason);
      }
    }

    // Build update data
    const updateData: any = {};

    if (title) {
      updateData.title = title;
    }

    if (isPinned !== undefined) {
      updateData.isPinned = isPinned;
    }

    // Handle aiAssociateId (can be set to null to remove associate)
    if ('aiAssociateId' in body) {
      if (aiAssociateId === null) {
        updateData.aiAssociateId = null;
      } else if (aiAssociateId) {
        updateData.aiAssociate = {
          connect: { id: aiAssociateId },
        };
      }
    }

    // Update conversation
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
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

    // Format response
    const formattedConversation = {
      id: updatedConversation.id,
      title: updatedConversation.title,
      isPinned: updatedConversation.isPinned,
      aiAssociateId: updatedConversation.aiAssociateId,
      aiAssociate: updatedConversation.aiAssociate
        ? {
            id: updatedConversation.aiAssociate.id,
            name: updatedConversation.aiAssociate.name,
            description: updatedConversation.aiAssociate.description,
          }
        : undefined,
      updatedAt: updatedConversation.updatedAt.toISOString(),
    };

    return createApiResponse(formattedConversation, 'Conversation updated successfully');
  })
);

// PATCH handler - Partial update conversation (same as PUT)
export const PATCH = PUT;

// DELETE handler - Delete conversation
export const DELETE = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext, params: any) => {
    const { projectId } = context;
    const conversationId = await getConversationId(params);

    // Check if conversation exists and belongs to the project
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        projectId,
      },
    });

    if (!conversation) {
      return createNotFoundResponse('Conversation');
    }

    // Delete conversation (with cascading deletes for messages)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return createApiResponse({ deleted: true }, 'Conversation deleted successfully');
  })
);
