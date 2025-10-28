// src/app/api/projects/[id]/conversations/[conversationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { checkProjectAccess } from '@/lib/auth/authorization'
import { withAuth, withErrorHandler } from '@/lib/api/middleware'

const prisma = new PrismaClient()

// Schema validation
const updateConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  isPinned: z.boolean().optional()
})

// GET handler - Get conversation by ID
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string, conversationId: string }> }
) => {
  const { id: projectId, conversationId } = (await params);

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to access this conversation' },
      { status: 403 }
    );
  }

  // Check if conversation exists and belongs to the project
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      projectId
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
                  title: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }

  // Format messages
  const formattedMessages = conversation.messages.map((message) => ({
    id: message.id,
    content: message.content,
    role: message.role,
    timestamp: message.createdAt.toISOString(),
    references: message.references.map(ref => ({
      id: ref.id,
      documentId: ref.documentId,
      documentName: ref.document?.title || 'Unknown Document',
      text: ref.text,
      page: ref.page
    }))
  }));

  // Format conversation
  const formattedConversation = {
    id: conversation.id,
    title: conversation.title,
    projectId: conversation.projectId,
    messages: formattedMessages,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    isPinned: conversation.isPinned
  };

  return NextResponse.json({
    status: 200,
    message: 'Conversation retrieved successfully',
    data: formattedConversation
  });
}));

// PUT handler - Update conversation
export const PUT = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string, conversationId: string }> }
) => {
  const { id: projectId, conversationId } = (await params);

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to update this conversation' },
      { status: 403 }
    );
  }

  // Check if conversation exists and belongs to the project
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      projectId
    }
  });

  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }

  // Parse and validate request body
  const body = await request.json();
  const { title, isPinned } = updateConversationSchema.parse(body);

  // Update conversation
  const updatedConversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      ...(title && { title }),
      ...(isPinned !== undefined && { isPinned })
    }
  });

  // Format response
  const formattedConversation = {
    id: updatedConversation.id,
    title: updatedConversation.title,
    isPinned: updatedConversation.isPinned,
    updatedAt: updatedConversation.updatedAt.toISOString()
  };

  return NextResponse.json({
    status: 200,
    message: 'Conversation updated successfully',
    data: formattedConversation
  });
}));

// DELETE handler - Delete conversation
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string, conversationId: string }> }
) => {
  const { id: projectId, conversationId } = (await params);

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to delete this conversation' },
      { status: 403 }
    );
  }

  // Check if conversation exists and belongs to the project
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      projectId
    }
  });

  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }

  // Delete conversation (with cascading deletes for messages)
  await prisma.conversation.delete({
    where: { id: conversationId }
  });

  return NextResponse.json({
    status: 200,
    message: 'Conversation deleted successfully'
  });
}));