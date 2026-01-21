import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { checkProjectAccess } from '@/lib/auth/authorization';

/**
 * DELETE /api/projects/[id]/invitations/[invitationId]
 * Cancel a pending invitation
 */
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) => {
  const { id: projectId, invitationId } = await params;

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have access to this project' },
      { status: 403 }
    );
  }

  // Verify the invitation exists and belongs to this project
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId }
  });

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invitation not found' },
      { status: 404 }
    );
  }

  if (invitation.projectId !== projectId) {
    return NextResponse.json(
      { error: 'Invitation does not belong to this project' },
      { status: 403 }
    );
  }

  // Delete the invitation
  await prisma.invitation.delete({
    where: { id: invitationId }
  });

  return NextResponse.json({
    success: true,
    message: 'Invitation cancelled successfully'
  });
}));
