import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserIdFromRequest } from "@/lib/auth/authorization";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";

const prisma = new PrismaClient();

// Get organization members
export const GET = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });

  if (!user?.organizationId) {
    return NextResponse.json(
      { error: 'User organization not found' },
      { status: 404 }
    );
  }

  // Get user's role from UserOrganization
  const userOrganization = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: userId,
        organizationId: user.organizationId
      }
    },
    select: { role: true }
  });

  // Check if user has permission to view members (must be admin or owner)
  if (userOrganization?.role !== 'admin' && userOrganization?.role !== 'owner') {
    return NextResponse.json(
      { error: 'Insufficient permissions to view members' },
      { status: 403 }
    );
  }

  const members = await prisma.userOrganization.findMany({
    where: {
      organizationId: user.organizationId
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      joinedAt: 'desc'
    }
  });

  const formattedMembers = members.map(member => ({
    id: member.user.id,
    name: member.user.fullName || member.user.email,
    email: member.user.email,
    role: member.role,
    joinedAt: member.joinedAt.toISOString()
  }));

  return NextResponse.json({ members: formattedMembers });
}));

// Remove a member from organization
export const DELETE = withErrorHandler(withAuth(async (request: NextRequest, userId: string) => {
  const { memberId } = await request.json();

  if (!memberId) {
    return NextResponse.json(
      { error: 'Member ID is required' },
      { status: 400 }
    );
  }

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

  // Check if current user has permission to remove members
  if (currentUserOrganization?.role !== 'admin' && currentUserOrganization?.role !== 'owner') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Prevent removing yourself
  if (memberId === userId) {
    return NextResponse.json(
      { error: 'Cannot remove yourself from the organization' },
      { status: 400 }
    );
  }

  // Check if member exists in this organization
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

  // Get the user being removed
  const memberUser = await prisma.user.findUnique({
    where: { id: memberId },
    select: {
      organizationId: true,
      activeOrganizationId: true,
      organizationMemberships: {
        select: {
          organizationId: true
        }
      }
    }
  });

  if (!memberUser) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Prevent removing from user's personal organization
  // Personal organization is where the user is admin and organizationId matches
  const personalOrgMembership = await prisma.userOrganization.findFirst({
    where: {
      userId: memberId,
      organizationId: memberUser.organizationId,
      role: 'admin'
    }
  });

  if (personalOrgMembership && currentUser.organizationId === memberUser.organizationId) {
    return NextResponse.json(
      { error: 'Cannot remove a user from their personal organization' },
      { status: 400 }
    );
  }

  // Remove the user from the organization
  await prisma.userOrganization.delete({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: currentUser.organizationId
      }
    }
  });

  // If this was the user's active organization, switch them back to their personal organization
  if (memberUser.activeOrganizationId === currentUser.organizationId) {
    await prisma.user.update({
      where: { id: memberId },
      data: {
        activeOrganizationId: memberUser.organizationId // Fall back to personal org
      }
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Member removed from organization. They have been switched back to their personal organization.'
  });
}));