// src/app/api/projects/[id]/client/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const clientInfoSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
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

// GET handler - Get client information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
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
    
    // Get project knowledge base
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { projectId }
    })
    
    if (!knowledgeBase) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Knowledge base not found' 
        },
        { status: 404 }
      )
    }
    
    // Extract client info
    const clientInfo = knowledgeBase.clientInfo as any || null
    
    return NextResponse.json({
      status: 200,
      message: 'Client information retrieved successfully',
      data: clientInfo
    })
  } catch (error) {
    console.error('Error fetching client information:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// PUT handler - Update client information
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
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
    const clientInfo = clientInfoSchema.parse(body)
    
    // Get knowledge base
    let knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { projectId }
    })
    
    // If knowledge base doesn't exist, create it
    if (!knowledgeBase) {
      knowledgeBase = await prisma.knowledgeBase.create({
        data: {
          project: {
            connect: { id: projectId }
          }
        }
      })
    }
    
    // Update client info
    const updatedKnowledgeBase = await prisma.knowledgeBase.update({
      where: { id: knowledgeBase.id },
      data: {
        clientInfo: clientInfo as any
      }
    })
    
    return NextResponse.json({
      status: 200,
      message: 'Client information updated successfully',
      data: clientInfo
    })
  } catch (error) {
    console.error('Error updating client information:', error)
    
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