import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { getActiveOrganizationId } from "@/lib/api/org-helpers";

// Get pending invitations
export const GET = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const organizationId = await getActiveOrganizationId(userId);

  const invitations = await prisma.invitation.findMany({
    where: {
      organizationId,
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