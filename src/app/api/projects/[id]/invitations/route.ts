import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler, withProjectAccess, ProjectContext } from '@/lib/api/middleware';
import { createApiResponse } from '@/lib/api/response';

/**
 * GET /api/projects/[id]/invitations
 * Get all pending invitations for a specific project
 */
export const GET = withErrorHandler(
  withProjectAccess(async (request: NextRequest, context: ProjectContext) => {
    const { projectId } = context;

    // Get pending invitations for this project
    const invitations = await prisma.invitation.findMany({
      where: {
        projectId,
        status: 'pending',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        invitedBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedInvitations = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      invitedBy: inv.invitedBy?.fullName || inv.invitedBy?.email || 'Unknown',
    }));

    return createApiResponse({
      invitations: formattedInvitations,
      count: formattedInvitations.length,
    });
  })
);
