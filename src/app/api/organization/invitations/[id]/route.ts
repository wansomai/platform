import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";

const prisma = new PrismaClient();

// Cancel an invitation
export const DELETE = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: { id: string } }
) => {
  const invitationId = params.id;

  if (!invitationId) {
    return NextResponse.json(
      { error: 'Invitation ID is required' },
      { status: 400 }
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true }
  });

  if (!currentUser?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  // Check if current user has permission to cancel invitations
  if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Find and delete the invitation
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      organizationId: currentUser.organizationId
    }
  });

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invitation not found' },
      { status: 404 }
    );
  }

  await prisma.invitation.delete({
    where: { id: invitationId }
  });

  return NextResponse.json({ success: true });
}));