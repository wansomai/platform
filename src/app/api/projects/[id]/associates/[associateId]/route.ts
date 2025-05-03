// app/api/projects/[id]/associates/[associateId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

// PUT - Link an associate to a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, associateId: string }> }
) {
  try {
    const { id: projectId, associateId } = (await params);
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied', error: true }, 
        { status: 403 }
      );
    }
    
    // Check if the associate exists
    const associate = await prisma.aIAssociate.findUnique({
      where: { id: associateId }
    });
    
    if (!associate) {
      return NextResponse.json(
        { message: 'Associate not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Check if the project and associate belong to the same organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });
    
    if (!project || project.organizationId !== associate.organizationId) {
      return NextResponse.json(
        { message: 'Associate and project must belong to the same organization', error: true }, 
        { status: 400 }
      );
    }
    
    // Link associate to project (upsert to handle if already linked)
    await prisma.projectAssociate.upsert({
      where: {
        associateId_projectId: {
          associateId,
          projectId
        }
      },
      update: {}, // No updates needed if it exists
      create: {
        associateId,
        projectId,
        addedAt: new Date()
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Associate linked to project successfully'
    });
  } catch (error) {
    console.error('Error linking associate to project:', error);
    return NextResponse.json(
      { message: 'Failed to link associate to project', error: true },
      { status: 500 }
    );
  }
}

// DELETE - Unlink an associate from a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, associateId: string }> }
) {
  try {
    const { id: projectId, associateId } = (await params);
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied', error: true }, 
        { status: 403 }
      );
    }
    
    // Delete the project-associate link
    await prisma.projectAssociate.delete({
      where: {
        associateId_projectId: {
          associateId,
          projectId
        }
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Associate unlinked from project successfully'
    });
  } catch (error) {
    console.error('Error unlinking associate from project:', error);
    return NextResponse.json(
      { message: 'Failed to unlink associate from project', error: true },
      { status: 500 }
    );
  }
}

// Helper function to check project access (same as in previous file)
async function checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
    // First check if user is a project member
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });
    
    if (projectMember) return true;
    
    // If not a direct member, check if user belongs to the organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });
    
    if (!project) return false;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    return user?.organizationId === project.organizationId;
  }