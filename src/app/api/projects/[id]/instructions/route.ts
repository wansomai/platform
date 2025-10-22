// app/api/projects/[id]/instructions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkProjectAccess } from '@/lib/auth/authorization';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

// Get instructions for a project
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this project' },
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
      { error: 'Project not found' },
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
}));

// Update instructions for a project
export const PUT = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Get instructions from request body
  const { instructions } = await request.json();

  if (typeof instructions !== 'string') {
    return NextResponse.json(
      { error: 'Instructions must be a string' },
      { status: 400 }
    );
  }

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this project' },
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
      { error: 'Project not found' },
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
}));