import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler, withProjectAccess, ProjectContext } from '@/lib/api/middleware';
import {
  createApiResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  createForbiddenResponse,
} from '@/lib/api/response';

/**
 * GET /api/projects/[id]/members
 * Get all members of a specific project
 */
export const GET = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext) => {
    const { projectId, userId } = context;

    // Get project details to check it exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return createNotFoundResponse('Project');
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
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get current user's role in the project
    const currentUserMember = projectMembers.find((member) => member.userId === userId);
    const currentUserRole = currentUserMember?.role || null;

    // Format the response
    const members = projectMembers.map((member) => ({
      id: `${member.userId}-${member.projectId}`,
      userId: member.userId,
      name: member.user.fullName || member.user.email || 'Unknown User',
      email: member.user.email,
      role: member.role,
      joinedAt: member.createdAt.toISOString(),
      isAdmin: member.role === 'admin',
      canRemove: member.role !== 'admin', // Cannot remove admin
    }));

    return createApiResponse({
      members,
      count: members.length,
      currentUserRole,
    });
  })
);

/**
 * DELETE /api/projects/[id]/members
 * Remove a member from the project (memberId in request body)
 */
export const DELETE = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext) => {
    const { projectId } = context;

    // Get memberId from request body or URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    let memberId = pathParts[pathParts.length - 1];

    // If memberId is 'members', try to get it from the request body
    if (memberId === 'members') {
      try {
        const body = await request.json();
        memberId = body.memberId;
      } catch {
        return createBadRequestResponse('Member ID is required');
      }
    }

    if (!memberId) {
      return createBadRequestResponse('Member ID is required');
    }

    // Check if the member to be removed exists and their role
    const memberToRemove = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: memberId,
          projectId: projectId,
        },
      },
    });

    if (!memberToRemove) {
      return createNotFoundResponse('Member in this project');
    }

    // Prevent removing admin
    if (memberToRemove.role === 'admin') {
      return createForbiddenResponse('Cannot remove the workspace admin');
    }

    // Remove the project member
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: memberId,
          projectId: projectId,
        },
      },
    });

    return createApiResponse({ removed: true }, 'Member removed successfully');
  })
);
