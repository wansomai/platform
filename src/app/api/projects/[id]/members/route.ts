import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { checkProjectAccess } from '@/lib/auth/authorization';

const prisma = new PrismaClient();

/**
 * GET /api/projects/[id]/members
 * Get all members of a specific project
 */
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
      { error: 'You do not have access to this project' },
      { status: 403 }
    );
  }

  // Get project details to check creator
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true }
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Get project members
  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Format the response
  const members = projectMembers.map(member => ({
    id: `${member.userId}-${member.projectId}`,
    userId: member.userId,
    name: member.user.fullName || member.user.email || 'Unknown User',
    email: member.user.email,
    role: member.role,
    joinedAt: member.createdAt.toISOString(),
    isAdmin: member.role === 'admin',
    canRemove: member.role !== 'admin', // Cannot remove admin
  }));

  return NextResponse.json({
    members,
    count: members.length
  });
}));

/**
 * DELETE /api/projects/[id]/members/[memberId]
 * Remove a member from the project
 */
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Get memberId from URL path
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const memberId = pathParts[pathParts.length - 1];

  if (!memberId) {
    return NextResponse.json(
      { error: 'Member ID is required' },
      { status: 400 }
    );
  }

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have access to this project' },
      { status: 403 }
    );
  }

  // Check if the member to be removed is an admin
  const memberToRemove = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: memberId,
        projectId: projectId
      }
    }
  });

  if (!memberToRemove) {
    return NextResponse.json(
      { error: 'Member not found in this project' },
      { status: 404 }
    );
  }

  // Prevent removing admin
  if (memberToRemove.role === 'admin') {
    return NextResponse.json(
      { error: 'Cannot remove the workspace admin' },
      { status: 403 }
    );
  }

  // Remove the project member
  await prisma.projectMember.delete({
    where: {
      userId_projectId: {
        userId: memberId,
        projectId: projectId
      }
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Member removed successfully'
  });
}));
