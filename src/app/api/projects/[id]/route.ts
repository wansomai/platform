// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getUserIdFromRequest, checkProjectAccess } from '@/lib/auth/authorization'

const prisma = new PrismaClient()

// Schema validation
const updateProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived', 'on hold']).optional()
})

// GET handler - Get project by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Make sure to await params if needed, but in this case we just need to use it directly
    const { id } = await context.params
    const projectId = id
    
    // Get user ID from request headers
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Authentication required' 
        },
        { status: 401 }
      );
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { 
          status: 403,
          message: 'You do not have permission to access this project' 
        },
        { status: 403 }
      );
    }
    
    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true
              }
            }
          }
        },
        documents: true,
        knowledgeBase: true,
        _count: {
          select: {
            documents: true,
            members: true
          }
        }
      }
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
    
    // Get message count
    const messageCount = await prisma.message.count({
      where: {
        conversation: {
          projectId
        }
      }
    })
    
    // Format team members
    const teamMembers = project.members?.map((member: any) => ({
      id: member.user?.id || 'unknown',
      name: member.user?.fullName || 'Unknown User',
      email: member.user?.email || 'unknown@example.com',
      role: member.role || 'member',
      avatar_url: null // In a real app, you would include the avatar URL
    })) || []
    
    // Format documents
    const documents = project.documents?.map((doc: any) => ({
      id: doc.id || 'unknown',
      name: doc.title || 'Untitled Document',
      file_url: doc.fileUrl || '',
      file_type: doc.fileType || 'unknown',
      file_size: doc.fileSize || 0,
      category: doc.section || 'uncategorized',
      uploaded_at: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      uploaded_by: "User" // In a real app, you would track who uploaded each document
    })) || []
    
    // Get events related to the project
    const events = await prisma.event.findMany({
      where: { projectId },
      orderBy: { date: 'asc' }
    })
    
    // Format events
    const formattedEvents = events?.map((event: any) => ({
      id: event.id || 'unknown',
      title: event.title || 'Untitled Event',
      date: event.date?.toISOString() || new Date().toISOString(),
      type: event.type || 'other',
      description: event.description || '',
      created_at: event.createdAt?.toISOString() || new Date().toISOString()
    })) || []
    
    // Get client info from knowledge base or initialize empty object
    const clientInfo = project.knowledgeBase?.clientInfo || {}
    
    // Format the full project details
    const formattedProject = {
      id: project.id,
      title: project.title || "Untitled Project",
      description: project.description || "",
      status: project.status || "active",
      created_at: project.createdAt.toISOString(),
      knowledge_base: {
        team: teamMembers,
        client: clientInfo,
        documents: documents,
        events: formattedEvents
      },
      team_count: project._count?.members || 0,
      documents_count: project._count?.documents || 0,
      messages_count: messageCount || 0,
      last_activity: project.updatedAt?.toISOString() || new Date().toISOString()
    }
    
    return NextResponse.json({
      status: 200,
      message: 'Project retrieved successfully',
      data: formattedProject
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// PUT handler - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Get user ID from request headers
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Authentication required' 
        },
        { status: 401 }
      );
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { 
          status: 403,
          message: 'You do not have permission to update this project' 
        },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json()
    const { title, description, status } = updateProjectSchema.parse(body)
    
    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status })
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
            documents: true
          }
        }
      }
    })
    
    // Get message count
    const messageCount = await prisma.message.count({
      where: {
        conversation: {
          projectId
        }
      }
    })
    
    // Format for response
    const formattedProject = {
      id: updatedProject.id,
      title: updatedProject.title,
      description: updatedProject.description,
      status: updatedProject.status,
      created_at: updatedProject.createdAt.toISOString(),
      team_count: updatedProject._count?.members || 0,
      documents_count: updatedProject._count?.documents || 0,
      messages_count: messageCount || 0,
      last_activity: updatedProject.updatedAt.toISOString()
    }
    
    return NextResponse.json({
      status: 200,
      message: 'Project updated successfully',
      data: formattedProject
    })
  } catch (error) {
    console.error('Error updating project:', error)
    
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

// DELETE handler - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Get user ID from request headers
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { 
          status: 401,
          message: 'Authentication required' 
        },
        { status: 401 }
      );
    }
    
    // For deletion, we need to check if the user has admin rights
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });
    
    // Only allow deletion if user is an admin
    if (!projectMember || projectMember.role !== 'admin') {
      return NextResponse.json(
        { 
          status: 403,
          message: 'You do not have permission to delete this project' 
        },
        { status: 403 }
      );
    }
    
    // Delete project (with cascading deletes for related entities)
    await prisma.project.delete({
      where: { id: projectId }
    })
    
    return NextResponse.json({
      status: 200,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}