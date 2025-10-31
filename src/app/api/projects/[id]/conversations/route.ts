// src/app/api/projects/[id]/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { checkProjectAccess } from '@/lib/auth/authorization'
import { withAuth, withErrorHandler } from '@/lib/api/middleware'

const prisma = new PrismaClient()

// Schema validation
const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required')
})

// GET handler - List all conversations for a project
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to access conversations for this project' },
      { status: 403 }
    );
  }

  // Get conversations
  const conversation = await prisma.conversation.findFirst({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
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
      },
      _count: {
        select: {
          messages: true
        }
      }
    }
  });

  // Handle case where no conversation exists
  if (!conversation) {
    return NextResponse.json({
      status: 200,
      message: 'No conversation found for this project',
      data: null
    });
  }

  // Format the single conversation response
  const formattedConversation = {
    id: conversation.id,
    title: conversation.title,
    projectId: conversation.projectId,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    isPinned: conversation.isPinned,
    messages: conversation.messages.map((message:any) => ({
      id: message.id,
      content: message.content,
      role: message.role,
      timestamp: message.createdAt.toISOString(),
      userId: message.userId,
    })),
    last_message: conversation.messages[conversation.messages.length - 1]?.content || "",
    messages_count: conversation._count.messages
  };

  return NextResponse.json({
    status: 200,
    message: 'Conversations retrieved successfully',
    data: formattedConversation
  });
}));

// POST handler - Create a new conversation
export const POST = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to create conversations in this project' },
      { status: 403 }
    );
  }

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Parse and validate request body
  const body = await request.json();
  const { title } = createConversationSchema.parse(body);

  // Create conversation
  const conversation = await prisma.conversation.create({
    data: {
      title,
      project: {
        connect: { id: projectId }
      }
    }
  });

  // Format for response
  const formattedConversation = {
    id: conversation.id,
    title: conversation.title,
    projectId: conversation.projectId,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    isPinned: conversation.isPinned,
    messages: []
  };

  return NextResponse.json({
    status: 201,
    message: 'Conversation created successfully',
    data: formattedConversation
  }, { status: 201 });
}));