import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";

// Get pending invitations
export const GET = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true }
  });

  if (!user?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  const invitations = await prisma.invitation.findMany({
    where: {
      organizationId: user.organizationId,
      status: 'pending', // Only show pending invitations
      expiresAt: {
        gt: new Date()
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      expiresAt: true
    }
  });

  const formattedInvitations = invitations.map((invitation:any) => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    createdAt: invitation.createdAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString()
  }));

  return NextResponse.json({ invitations: formattedInvitations });
}));