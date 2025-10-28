import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import {
  canManageUser,
  canAssignRole,
  validateRoleChange
} from "@/lib/auth/permissions";
import { isValidOrganizationRole } from "@/lib/constants/roles";
import { sendRoleChangeEmail } from "@/lib/email-service";

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

  // Validate role format
  if (!isValidOrganizationRole(role)) {
    return NextResponse.json(
      { error: 'Invalid role. Must be owner, admin, or member' },
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

  const organizationId = currentUser.organizationId;

  // Check if current user can manage the target user (role hierarchy check)
  const { canManage, reason: manageReason } = await canManageUser(userId, memberId, organizationId);

  if (!canManage) {
    return NextResponse.json(
      { error: manageReason || 'Cannot manage this user' },
      { status: 403 }
    );
  }

  // Check if current user can assign the target role
  const { canAssign, reason: assignReason } = await canAssignRole(userId, role, organizationId);

  if (!canAssign) {
    return NextResponse.json(
      { error: assignReason || 'Cannot assign this role' },
      { status: 403 }
    );
  }

  // Get the member's current role
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

  // Validate the role change is safe
  const { isValid, reason: validationReason } = await validateRoleChange(
    memberId,
    memberOrganization.role,
    role,
    organizationId
  );

  if (!isValid) {
    return NextResponse.json(
      { error: validationReason || 'Role change is not valid' },
      { status: 400 }
    );
  }

  // Get member and organization details for email notification
  const [member, organization, currentUserDetails] = await Promise.all([
    prisma.user.findUnique({
      where: { id: memberId },
      select: { email: true, fullName: true }
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true }
    })
  ]);

  // Update the role in UserOrganization
  await prisma.userOrganization.update({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: organizationId
      }
    },
    data: {
      role
    }
  });

  // Send notification email (non-blocking)
  if (member && organization) {
    try {
      await sendRoleChangeEmail({
        memberEmail: member.email,
        memberName: member.fullName || member.email,
        organizationName: organization.name,
        oldRole: memberOrganization.role,
        newRole: role,
        changedByName: currentUserDetails?.fullName || currentUserDetails?.email || 'An administrator'
      });
    } catch (emailError) {
      console.error('Failed to send role change notification:', emailError);
      // Don't fail the request if email fails
    }
  }

  return NextResponse.json({
    success: true,
    message: `Role updated successfully from ${memberOrganization.role} to ${role}`,
    data: {
      userId: memberId,
      oldRole: memberOrganization.role,
      newRole: role
    }
  });
}));
