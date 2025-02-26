// src/app/api/projects/[id]/conversations/[conversationId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import OpenAI from 'openai'

const prisma = new PrismaClient()

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Schema validation
const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required')
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

// GET handler - Get messages in a conversation
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
    
    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    })
    
    // Format messages
    const formattedMessages = messages.map((message: { id: string; content: string; role: string; createdAt: Date }) => ({
      id: message.id,
      content: message.content,
      role: message.role,
      timestamp: message.createdAt.toISOString(),
      references: [], // In a real app, you would include citation references
    }))
    
    return NextResponse.json({
      status: 200,
      message: 'Messages retrieved successfully',
      data: formattedMessages
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// POST handler - Send a message to the conversation
export async function POST(
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
    const { content } = createMessageSchema.parse(body)
    
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
    
    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        role: 'user',
        conversation: {
          connect: { id: conversationId }
        },
        user: {
          connect: { id: userId }
        }
      }
    })
    
    // Get project context for AI
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        title: true,
        description: true,
        knowledgeBase: {
          select: {
            clientInfo: true,
            instructions: true
          }
        }
      }
    })
    
    // Get conversation history
    const messageHistory = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10 // Limit to last 10 messages for context
    })
    // Format messages for AI
    const aiMessages = messageHistory.map((msg: { role: string; content: string; }) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));
    // Add system message with context
    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant for legal professionals. You are currently in a project titled "${project?.title || 'Legal Project'}". 
      ${project?.description ? `Project description: ${project.description}` : ''}
      ${project?.knowledgeBase?.clientInfo ? `Client information: ${JSON.stringify(project.knowledgeBase.clientInfo)}` : ''}
      ${project?.knowledgeBase?.instructions ? `Special instructions: ${project.knowledgeBase.instructions}` : ''}
      
      Provide helpful, accurate, and concise responses to legal queries. If uncertain about any information, acknowledge limitations and suggest where the user might find reliable information.`
    };
    
    // Add new user message
    aiMessages.push({
      role: 'user',
      content
    });
    
    // Call OpenAI API
    const aiResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [systemMessage, ...aiMessages],
      temperature: 0.7,
      max_tokens: 1000
    })
    
    // Extract AI response
    const aiContent = aiResponse.choices[0]?.message?.content || 'I apologize, but I am unable to respond at the moment.'
    
    // Create AI response message
    const assistantMessage = await prisma.message.create({
      data: {
        content: aiContent,
        role: 'assistant',
        conversation: {
          connect: { id: conversationId }
        }
      }
    })
    
    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })
    
    // Format response
    const responseMessage = {
      id: assistantMessage.id,
      content: assistantMessage.content,
      role: assistantMessage.role,
      timestamp: assistantMessage.createdAt.toISOString(),
      references: [] // In a real app, you would include citation references
    }
    
    return NextResponse.json({
      status: 201,
      message: 'Message sent successfully',
      data: responseMessage
    }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    
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