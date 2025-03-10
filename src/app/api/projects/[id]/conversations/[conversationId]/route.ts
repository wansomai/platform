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

// GET handler - Get conversation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, conversationId: string } }
) {
  try {
    const { id: projectId, conversationId } = params
    
    // Check if conversation exists and belongs to the project
    const conversation = await prisma.conversation.findFirst({
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
    const formattedMessages = conversation.messages.map((message) => ({
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
    
    // Check if conversation exists and belongs to the project
    const conversation = await prisma.conversation.findFirst({
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
    
    // Parse and validate request body
    const body = await request.json()
    const { title, isPinned } = updateConversationSchema.parse(body)
    
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
    
    // Check if conversation exists and belongs to the project
    const conversation = await prisma.conversation.findFirst({
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