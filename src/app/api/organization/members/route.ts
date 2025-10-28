import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import {
  hasOrganizationPermission,
  canManageUser,
  canRemoveFromPersonalOrg,
  getOrganizationDetails
} from "@/lib/auth/permissions";
import { OrganizationPermission } from "@/lib/constants/permissions";
import { sendMemberRemovedEmail } from "@/lib/email-service";

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

  // Check if user has permission to view members
  const hasPermission = await hasOrganizationPermission(
    userId,
    user.organizationId,
    OrganizationPermission.VIEW_MEMBERS
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions to view members' },
      { status: 403 }
    );
  }

  // Get organization details including owner info
  const orgDetails = await getOrganizationDetails(user.organizationId);

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
    joinedAt: member.joinedAt.toISOString(),
    isOwner: member.user.id === orgDetails?.ownerId
  }));

  return NextResponse.json({
    members: formattedMembers,
    organization: {
      id: orgDetails?.id,
      name: orgDetails?.name,
      accountType: orgDetails?.accountType,
      ownerId: orgDetails?.ownerId
    }
  });
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

  const organizationId = currentUser.organizationId;

  // Check if current user has permission to remove members
  const hasPermission = await hasOrganizationPermission(
    userId,
    organizationId,
    OrganizationPermission.REMOVE_MEMBERS
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions to remove members' },
      { status: 403 }
    );
  }

  // Check if current user can manage the target user (role hierarchy check)
  const { canManage, reason } = await canManageUser(userId, memberId, organizationId);

  if (!canManage) {
    return NextResponse.json(
      { error: reason || 'Cannot manage this user' },
      { status: 403 }
    );
  }

  // Check if member exists in this organization
  const memberOrganization = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: organizationId
      }
    }
  });

  if (!memberOrganization) {
    return NextResponse.json(
      { error: 'Member not found in this organization' },
      { status: 404 }
    );
  }

  // Check if this is a personal organization and prevent owner removal
  const canRemove = await canRemoveFromPersonalOrg(memberId, organizationId);

  if (!canRemove) {
    return NextResponse.json(
      { error: 'Cannot remove the owner from their personal organization' },
      { status: 400 }
    );
  }

  // Get the user being removed to handle active organization switching
  const memberUser = await prisma.user.findUnique({
    where: { id: memberId },
    select: {
      organizationId: true,
      activeOrganizationId: true,
      email: true,
      fullName: true
    }
  });

  if (!memberUser) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Get organization and current user details for email notification
  const [organization, currentUserDetails] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true }
    })
  ]);

  // Remove the user from the organization
  await prisma.userOrganization.delete({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: organizationId
      }
    }
  });

  // If this was the user's active organization, switch them back to their personal organization
  if (memberUser.activeOrganizationId === organizationId) {
    await prisma.user.update({
      where: { id: memberId },
      data: {
        activeOrganizationId: memberUser.organizationId // Fall back to personal org
      }
    });
  }

  // Send notification email (non-blocking)
  if (organization && memberUser.email) {
    try {
      await sendMemberRemovedEmail({
        memberEmail: memberUser.email,
        memberName: memberUser.fullName || memberUser.email,
        organizationName: organization.name,
        removedByName: currentUserDetails?.fullName || currentUserDetails?.email || 'An administrator'
      });
    } catch (emailError) {
      console.error('Failed to send member removal notification:', emailError);
      // Don't fail the request if email fails
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Member removed from organization. They have been switched back to their personal organization.'
  });
}));