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

// GET handler - Get event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, eventId: string } }
) {
  try {
    const { id: projectId, eventId } = params
    
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
    
    // Check if event exists
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