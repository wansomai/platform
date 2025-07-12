// app/api/projects/[id]/instructions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest, checkProjectAccess } from '@/lib/auth/authorization';

// Get instructions for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;
    
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
        { message: 'Access denied to this project', error: true }, 
        { status: 403 }
      );
    }
    
    // Get project with knowledgeBase
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        knowledgeBase: {
          select: {
            instructions: true
          }
        }
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Get instructions from knowledgeBase, default to empty string
    const instructions = project.knowledgeBase?.instructions || '';
    
    return NextResponse.json({
      status: 200,
      message: 'Project instructions retrieved successfully',
      data: {
        instructions
      }
    });
  } catch (error) {
    console.error('Error fetching project instructions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch project instructions', error: true },
      { status: 500 }
    );
  }
}

// Update instructions for a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get instructions from request body
    const { instructions } = await request.json();
    
    if (typeof instructions !== 'string') {
      return NextResponse.json(
        { message: 'Instructions must be a string', error: true }, 
        { status: 400 }
      );
    }
    
    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied to this project', error: true }, 
        { status: 403 }
      );
    }
    
    // Get current project
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        knowledgeBase: true
      }
    });
    
    if (!currentProject) {
      return NextResponse.json(
        { message: 'Project not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Update or create knowledgeBase with instructions
    if (currentProject.knowledgeBase) {
      // Update existing knowledgeBase
      await prisma.knowledgeBase.update({
        where: { projectId },
        data: { instructions }
      });
    } else {
      // Create new knowledgeBase
      await prisma.knowledgeBase.create({
        data: {
          projectId,
          instructions
        }
      });
    }
    
    return NextResponse.json({
      status: 200,
      message: 'Instructions updated successfully',
      data: {
        instructions
      }
    });
  } catch (error) {
    console.error('Error updating project instructions:', error);
    return NextResponse.json(
      { message: 'Failed to update project instructions', error: true },
      { status: 500 }
    );
  }
}