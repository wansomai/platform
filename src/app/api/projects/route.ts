// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional()
})

// GET handler - List all projects
export async function GET(request: NextRequest) {
  try {
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
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || undefined
    
    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'User not found' 
        },
        { status: 404 }
      )
    }
    
    // Build query conditions
    const where = {
      organizationId: user.organizationId,
      ...(status ? { status } : {})
    }
    
    // Get projects
    const projects = await prisma.project.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
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
    
    // Get message counts (in a real app, this might be denormalized for performance)
    const projectIds = projects.map((project: { id: string }) => project.id)
    
    // Format projects for response
    const formattedProjects = await Promise.all(projects.map(async (project: { 
      id: string,
      title: string,
      description: string,
      status: string,
      createdAt: Date,
      updatedAt: Date,
      _count: {
        members: number,
        documents: number
      }
    }) => {
      // Count messages for this project
      const messageCount = await prisma.message.count({
        where: {
          conversation: {
            projectId: project.id
          }
        }
      })
      
      // Get last activity timestamp
      const lastActivity = await prisma.project.findUnique({
        where: { id: project.id },
        select: {
          updatedAt: true,
          documents: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: { updatedAt: true }
          },
          conversations: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: { updatedAt: true }
          }
        }
      })
      
      // Determine most recent activity timestamp
      const timestamps = [
        lastActivity?.updatedAt,
        lastActivity?.documents[0]?.updatedAt,
        lastActivity?.conversations[0]?.updatedAt
      ].filter(Boolean)
      
      const lastActivityDate = timestamps.length > 0
        ? new Date(Math.max(...timestamps.map(date => date!.getTime())))
        : project.updatedAt
      
      // Calculate elapsed time
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60))
      
      let lastActivityStr
      if (diffInHours < 1) {
        lastActivityStr = 'Just now'
      } else if (diffInHours < 24) {
        lastActivityStr = `${diffInHours}h ago`
      } else {
        const diffInDays = Math.floor(diffInHours / 24)
        lastActivityStr = `${diffInDays}d ago`
      }
      
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        created_at: project.createdAt.toISOString(),
        team_count: project._count.members,
        documents_count: project._count.documents,
        messages_count: messageCount,
        last_activity: lastActivityStr
      }
    }))
    
    // Get total count for pagination
    const totalCount = await prisma.project.count({ where })
    
    return NextResponse.json({
      status: 200,
      message: 'Projects retrieved successfully',
      data: formattedProjects,
      meta: {
        total: totalCount,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// POST handler - Create new project
export async function POST(request: NextRequest) {
  try {
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
    
    // Parse and validate request body
    const body = await request.json()
    const { title, description } = createProjectSchema.parse(body)
    
    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        organizationId: true 
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'User not found' 
        },
        { status: 404 }
      )
    }
    
    // Create project
    const project = await prisma.project.create({
      data: {
        title,
        description,
        status: 'active',
        organization: {
          connect: { id: user.organizationId }
        },
        members: {
          create: {
            role: 'owner',
            user: {
              connect: { id: user.id }
            }
          }
        },
        // Create empty knowledge base
        knowledgeBase: {
          create: {}
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true
      }
    })
    
    // Format for response
    const createdProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      created_at: project.createdAt.toISOString(),
      team_count: 1, // Owner is automatically added
      documents_count: 0,
      messages_count: 0,
      last_activity: 'Just now'
    }
    
    return NextResponse.json({
      status: 201,
      message: 'Project created successfully',
      data: createdProject
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    
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