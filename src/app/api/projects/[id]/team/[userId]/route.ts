// src/app/api/projects/[id]/team/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const updateTeamMemberSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer'])
})

// PUT handler - Update team member role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, userId: string }> }
) {
  try {
    const { id: projectId, userId: teamMemberId } = await params
    
    // Parse and validate request body
    const body = await request.json()
    const { role } = updateTeamMemberSchema.parse(body)
    
    // Check if team member exists
    const teamMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: teamMemberId,
          projectId
        }
      },
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
    
    if (!teamMember) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Team member not found' 
        },
        { status: 404 }
      )
    }
    
    // Check if trying to change owner role
    if (teamMember.role === 'admin' && role !== 'admin') {
      // Count other owners
      const ownersCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: 'owner'
        }
      })
      
      // Prevent removing the last owner
      if (ownersCount <= 1) {
        return NextResponse.json(
          { 
            status: 400,
            message: 'Cannot change the role of the last project owner' 
          },
          { status: 400 }
        )
      }
    }
    
    // Update team member role
    await prisma.projectMember.update({
      where: {
        userId_projectId: {
          userId: teamMemberId,
          projectId
        }
      },
      data: { role }
    })
    
    // Format response
    const updatedTeamMember = {
      id: teamMember.user.id,
      name: teamMember.user.fullName,
      email: teamMember.user.email,
      role,
      avatar_url: null // In a real app, you would include the avatar URL
    }
    
    return NextResponse.json({
      status: 200,
      message: 'Team member role updated successfully',
      data: updatedTeamMember
    })
  } catch (error) {
    console.error('Error updating team member:', error)
    
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

// DELETE handler - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, userId: string }> }
) {
  try {
    const { id: projectId, userId: teamMemberId } = await params
    
    // Check if team member exists
    const teamMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: teamMemberId,
          projectId
        }
      },
      select: { role: true }
    })
    
    if (!teamMember) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Team member not found' 
        },
        { status: 404 }
      )
    }
    
    // Check if trying to remove owner
    if (teamMember.role === 'owner') {
      // Count other owners
      const ownersCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: 'owner'
        }
      })
      
      // Prevent removing the last owner
      if (ownersCount <= 1) {
        return NextResponse.json(
          { 
            status: 400,
            message: 'Cannot remove the last project owner' 
          },
          { status: 400 }
        )
      }
    }
    
    // Remove team member
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: teamMemberId,
          projectId
        }
      }
    })
    
    return NextResponse.json({
      status: 200,
      message: 'Team member removed successfully'
    })
  } catch (error) {
    console.error('Error removing team member:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}