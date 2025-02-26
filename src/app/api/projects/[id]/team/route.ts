// src/app/api/projects/[id]/team/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const addTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer'])
})

// Helper function to check project access
async function checkProjectAccess(projectId: string, userId: string) {
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    },
    select: { role: true }
  })
  
  // Only admins and owners can manage team
  if (!projectMember || (projectMember.role !== 'owner' && projectMember.role !== 'admin')) {
    return false
  }
  
  return true
}

// GET handler - List team members
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
    
    // For team listing, we don't need admin rights, just project access
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    })
    
    if (!projectMember) {
      // Check if user belongs to the organization
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true }
      })
      
      if (!user) {
        return NextResponse.json(
          { 
            status: 403,
            message: 'Forbidden' 
          },
          { status: 403 }
        )
      }
      
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true }
      })
      
      if (!project || project.organizationId !== user.organizationId) {
        return NextResponse.json(
          { 
            status: 403,
            message: 'Forbidden' 
          },
          { status: 403 }
        )
      }
    }
    
    // Get team members
    const teamMembers = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    })
    
    // Format team members
    const formattedTeamMembers = teamMembers.map((member: { user: { id: string; fullName: string; email: string; }; role: string; }) => ({
      id: member.user.id,
      name: member.user.fullName, 
      email: member.user.email,
      role: member.role,
      avatar_url: null // In a real app, you would include the avatar URL
    }))
    
    return NextResponse.json({
      status: 200,
      message: 'Team members retrieved successfully',
      data: formattedTeamMembers
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// POST handler - Add team member
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
    
    // Check if user has admin access to this project
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
    const { email, role } = addTeamMemberSchema.parse(body)
    
    // Get project to check organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
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
    
    // Find user by email within the same organization
    const user = await prisma.user.findFirst({
      where: {
        email,
        organizationId: project.organizationId
      }
    })
    
    if (!user) {
      // In a real app, you would send an invitation email
      return NextResponse.json(
        { 
          status: 404,
          message: 'User not found in your organization' 
        },
        { status: 404 }
      )
    }
    
    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId
        }
      }
    })
    
    if (existingMember) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'User is already a member of this project' 
        },
        { status: 400 }
      )
    }
    
    // Add user to project
    await prisma.projectMember.create({
      data: {
        role,
        user: {
          connect: { id: user.id }
        },
        project: {
          connect: { id: projectId }
        }
      }
    })
    
    // Format response
    const teamMember = {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role,
      avatar_url: null // In a real app, you would include the avatar URL
    }
    
    return NextResponse.json({
      status: 201,
      message: 'Team member added successfully',
      data: teamMember
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding team member:', error)
    
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