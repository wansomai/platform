// src/app/api/projects/[id]/conversations/[conversationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const updateConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  isPinned: z.boolean().optional()
})

// Helper function to check project access
async function checkProjectAccess(projectId: string, userId: string) {
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  })
  
  if (!projectMember) {
    // Check if user belongs to the organization that owns the project
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    })
    
    if (!user) {
      return false
    }
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    })
    
    if (!project || project.organizationId !== user.organizationId) {
      return false
    }
  }
  
  return true
}

// GET handler - Get conversation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, conversationId: string } }
) {
  try {
    const { id: projectId, conversationId } = params
    
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Unauthorized' 
        },
        { status: 401 }
      )
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId)
    
    if (!hasAccess) {
      return NextResponse.json(
        { 
          status: 403,
          message: 'Forbidden' 
        },
        { status: 403 }
      )
    }
    
    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        projectId
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    
    if (!conversation) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Conversation not found' 
        },
        { status: 404 }
      )
    }
    
    // Format messages
    const formattedMessages = conversation.messages.map((message: any) => ({
      id: message.id,
      content: message.content,
      role: message.role,
      timestamp: message.createdAt.toISOString(),
      references: [], // In a real app, you would include citation references
    }))
    
    // Format conversation
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title,
      projectId: conversation.projectId,
      messages: formattedMessages,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      isPinned: conversation.isPinned
    }
    
    return NextResponse.json({
      status: 200,
      message: 'Conversation retrieved successfully',
      data: formattedConversation
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// PUT handler - Update conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, conversationId: string } }
) {
  try {
    const { id: projectId, conversationId } = params
    
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Unauthorized' 
        },
        { status: 401 }
      )
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId)
    
    if (!hasAccess) {
      return NextResponse.json(
        { 
          status: 403,
          message: 'Forbidden' 
        },
        { status: 403 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const { title, isPinned } = updateConversationSchema.parse(body)
    
    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        projectId
      }
    })
    
    if (!conversation) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Conversation not found' 
        },
        { status: 404 }
      )
    }
    
    // Update conversation
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(title && { title }),
        ...(isPinned !== undefined && { isPinned })
      }
    })
    
    // Format response
    const formattedConversation = {
      id: updatedConversation.id,
      title: updatedConversation.title,
      isPinned: updatedConversation.isPinned,
      updatedAt: updatedConversation.updatedAt.toISOString()
    }
    
    return NextResponse.json({
      status: 200,
      message: 'Conversation updated successfully',
      data: formattedConversation
    })
  } catch (error) {
    console.error('Error updating conversation:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'Validation failed', 
          errors: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// DELETE handler - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, conversationId: string } }
) {
  try {
    const { id: projectId, conversationId } = params
    
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Unauthorized' 
        },
        { status: 401 }
      )
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId)
    
    if (!hasAccess) {
      return NextResponse.json(
        { 
          status: 403,
          message: 'Forbidden' 
        },
        { status: 403 }
      )
    }
    
    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        projectId
      }
    })
    
    if (!conversation) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Conversation not found' 
        },
        { status: 404 }
      )
    }
    
    // Delete conversation (with cascading deletes for messages)
    await prisma.conversation.delete({
      where: { id: conversationId }
    })
    
    return NextResponse.json({
      status: 200,
      message: 'Conversation deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}