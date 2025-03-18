// src/app/api/projects/[id]/conversations/[conversationId]/pin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const pinConversationSchema = z.object({
  isPinned: z.boolean()
})

// PUT handler - Pin or unpin a conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, conversationId: string }> }
) {
  try {
    const { id: projectId, conversationId } = (await params)
    
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
    const { isPinned } = pinConversationSchema.parse(body)
    
    // Update conversation pin status
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { isPinned }
    })
    
    return NextResponse.json({
      status: 200,
      message: 'Conversation pin status updated successfully',
      data: {
        id: updatedConversation.id,
        isPinned: updatedConversation.isPinned
      }
    })
  } catch (error) {
    console.error('Error updating conversation pin status:', error)
    
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