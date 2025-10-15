import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";

const prisma = new PrismaClient();

// Update member role
export const PATCH = withErrorHandler(withAuth(async (request: NextRequest, userId: string,{ params }: { params: Promise<{ id: string }> }) => {
  const memberId = (await params).id
  const { role } = await request.json();

  if (!role) {
    return NextResponse.json(
      { error: 'Role is required' },
      { status: 400 }
    );
  }

  // Validate role
  const validRoles = ['admin', 'member', 'owner'];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: 'Invalid role. Must be admin, member, or owner' },
      { status: 400 }
    );
  }

  // Get current user's organization
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });

  if (!currentUser?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  // Get current user's role from UserOrganization
  const currentUserOrganization = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: userId,
        organizationId: currentUser.organizationId
      }
    },
    select: { role: true }
  });

  // Check if current user has permission to change roles (must be admin or owner)
  if (currentUserOrganization?.role !== 'admin' && currentUserOrganization?.role !== 'owner') {
    return NextResponse.json(
      { error: 'Insufficient permissions to change roles' },
      { status: 403 }
    );
  }

  // Prevent changing your own role
  if (memberId === userId) {
    return NextResponse.json(
      { error: 'Cannot change your own role' },
      { status: 400 }
    );
  }

  // Check if the member exists in the organization
  const memberOrganization = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: currentUser.organizationId
      }
    }
  });

  if (!memberOrganization) {
    return NextResponse.json(
      { error: 'Member not found in this organization' },
      { status: 404 }
    );
  }

  // Update the role in UserOrganization
  await prisma.userOrganization.update({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: currentUser.organizationId
      }
    },
    data: {
      role
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Role updated successfully'
  });
}));
