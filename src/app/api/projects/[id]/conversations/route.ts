// src/app/api/projects/[id]/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required')
})

// GET handler - List all conversations for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!project) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Project not found' 
        },
        { status: 404 }
      )
    }
    
    // Get conversations
    const conversations = await prisma.conversation.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })
    
    // Format for response
    const formattedConversations = conversations.map(conversation => {
      const lastMessage = conversation.messages[0]?.content || ""
      
      return {
        id: conversation.id,
        title: conversation.title,
        projectId: conversation.projectId,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        isPinned: conversation.isPinned,
        last_message: lastMessage,
        messages_count: conversation._count.messages
      }
    })
    
    return NextResponse.json({
      status: 200,
      message: 'Conversations retrieved successfully',
      data: formattedConversations
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// POST handler - Create a new conversation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!project) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Project not found' 
        },
        { status: 404 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const { title } = createConversationSchema.parse(body)
    
    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        title,
        project: {
          connect: { id: projectId }
        }
      }
    })
    
    // Format for response
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title,
      projectId: conversation.projectId,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      isPinned: conversation.isPinned,
      messages: []
    }
    
    return NextResponse.json({
      status: 201,
      message: 'Conversation created successfully',
      data: formattedConversation
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    
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