// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const updateProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived', 'on hold']).optional()
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

// GET handler - Get project by ID
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
    const teamMembers = project.members.map((member: { 
      user: { id: string; fullName: string; email: string; };
      role: string;
    }) => ({
      id: member.user.id,
      name: member.user.fullName,
      email: member.user.email,
      role: member.role,
      avatar_url: null // In a real app, you would include the avatar URL
    }))
    
    // Format documents
    const documents = project.documents.map((doc: {
      id: string;
      name: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
      section: string;
      createdAt: Date;
    }) => ({
      id: doc.id,
      name: doc.name,
      file_url: doc.fileUrl,
      file_type: doc.fileType,
      file_size: doc.fileSize,
      category: doc.section,
      uploaded_at: doc.createdAt.toISOString(),
      uploaded_by: "User" // In a real app, you would track who uploaded each document
    }))
    
    // Get events related to the project
    const events = await prisma.event.findMany({
      where: { projectId },
      orderBy: { date: 'asc' }
    })
    
    // Format events
    const formattedEvents = events.map((event: {
      id: string;
      title: string;
      date: Date;
      type: string;
      description: string;
      createdAt: Date;
    }) => ({
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      type: event.type,
      description: event.description,
      created_at: event.createdAt.toISOString()
    }))
    
    // Get client info from knowledge base
    const clientInfo = project.knowledgeBase?.clientInfo || null
    
    // Format the full project details
    const formattedProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      created_at: project.createdAt.toISOString(),
      knowledge_base: {
        team: teamMembers,
        client: clientInfo,
        documents: documents,
        events: formattedEvents
      },
      team_count: project._count.members,
      documents_count: project._count.documents,
      messages_count: messageCount,
      last_activity: 'Recent' // In a real app, you would calculate this
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
      team_count: updatedProject._count.members,
      documents_count: updatedProject._count.documents,
      messages_count: messageCount,
      last_activity: 'Just now'
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
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      },
      select: { role: true }
    })
    
    // Only owners and admins can delete projects
    if (!projectMember || (projectMember.role !== 'owner' && projectMember.role !== 'admin')) {
      return NextResponse.json(
        { 
          status: 403,
          message: 'Forbidden' 
        },
        { status: 403 }
      )
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