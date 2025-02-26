// src/app/api/projects/[id]/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['meeting', 'deadline', 'court']),
  description: z.string().optional()
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

// GET handler - List events
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
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || undefined
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    
    // Build query conditions
    const where: any = { projectId }
    
    if (type) {
      where.type = type
    }
    
    if (from || to) {
      where.date = {}
      
      if (from) {
        where.date.gte = new Date(from)
      }
      
      if (to) {
        where.date.lte = new Date(to)
      }
    }
    
    // Get events
    const events = await prisma.event.findMany({
      where,
      orderBy: { date: 'asc' }
    })
    
    // Format events
    const formattedEvents = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      type: event.type,
      description: event.description,
      created_at: event.createdAt.toISOString()
    }))
    
    return NextResponse.json({
      status: 200,
      message: 'Events retrieved successfully',
      data: formattedEvents
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// POST handler - Create event
export async function POST(
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
    const { title, date, type, description } = createEventSchema.parse(body)
    
    // Create event
    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        type,
        description,
        project: {
          connect: { id: projectId }
        }
      }
    })
    
    // Format response
    const formattedEvent = {
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      type: event.type,
      description: event.description,
      created_at: event.createdAt.toISOString()
    }
    
    return NextResponse.json({
      status: 201,
      message: 'Event created successfully',
      data: formattedEvent
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    
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