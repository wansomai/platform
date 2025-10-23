import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/prisma/client';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { checkProjectAccess } from '@/lib/auth/authorization';

const prisma = new PrismaClient();

/**
 * GET /api/projects/[id]/invitations
 * Get all pending invitations for a specific project
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

  // Get pending invitations for this project
  const invitations = await prisma.invitation.findMany({
    where: {
      projectId,
      status: 'pending',
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      invitedBy: {
        select: {
          fullName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Format the response
  const formattedInvitations = invitations.map(inv => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    invitedBy: inv.invitedBy?.fullName || inv.invitedBy?.email || 'Unknown'
  }));

  return NextResponse.json({
    invitations: formattedInvitations,
    count: formattedInvitations.length
  });
}));
