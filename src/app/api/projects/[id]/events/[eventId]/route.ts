// src/app/api/projects/[id]/events/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const updateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  date: z.string().min(1, 'Date is required').optional(),
  type: z.enum(['meeting', 'deadline', 'court']).optional(),
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

// GET handler - Get event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, eventId: string } }
) {
  try {
    const { id: projectId, eventId } = params
    
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
    
    // Get event
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        projectId
      }
    })
    
    if (!event) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Event not found' 
        },
        { status: 404 }
      )
    }
    
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
      status: 200,
      message: 'Event retrieved successfully',
      data: formattedEvent
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// PUT handler - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, eventId: string } }
) {
  try {
    const { id: projectId, eventId } = params
    
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
    const { title, date, type, description } = updateEventSchema.parse(body)
    
    // Update event
    const updatedEvent = await prisma.event.update({
      where: {
        id: eventId,
        projectId
      },
      data: {
        ...(title && { title }),
        ...(date && { date: new Date(date) }),
        ...(type && { type }),
        ...(description !== undefined && { description })
      }
    })
    
    // Format response
    const formattedEvent = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      date: updatedEvent.date.toISOString(),
      type: updatedEvent.type,
      description: updatedEvent.description,
      created_at: updatedEvent.createdAt.toISOString()
    }
    
    return NextResponse.json({
      status: 200,
      message: 'Event updated successfully',
      data: formattedEvent
    })
  } catch (error) {
    console.error('Error updating event:', error)
    
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

// DELETE handler - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, eventId: string } }
) {
  try {
    const { id: projectId, eventId } = params
    
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
    
    // Delete event
    await prisma.event.delete({
      where: {
        id: eventId,
        projectId
      }
    })
    
    return NextResponse.json({
      status: 200,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}